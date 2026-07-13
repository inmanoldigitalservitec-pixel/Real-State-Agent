#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_ENV_FILE="${ROOT_DIR}/apps/web-chat/.env.local"

# Cargar las variables necesarias para Agent Core y las tools.
set -a

[[ -f "${ROOT_DIR}/.env" ]] &&
  source "${ROOT_DIR}/.env"

[[ -f "${ROOT_DIR}/.env.local" ]] &&
  source "${ROOT_DIR}/.env.local"

set +a

AGENT_CORE_PORT="${AGENT_CORE_PORT:-8787}"
WEB_CHAT_PORT="${WEB_CHAT_PORT:-5173}"
OPENCLAW_PORT="${OPENCLAW_PORT:-18789}"

LOCAL_BACKEND_URL="http://127.0.0.1:${AGENT_CORE_PORT}"
LOCAL_FRONTEND_URL="http://127.0.0.1:${WEB_CHAT_PORT}"

RUN_DIR="$(
  mktemp -d \
    "${TMPDIR:-/tmp}/real-estate-public-chat.XXXXXX"
)"

GATEWAY_LOG="${RUN_DIR}/openclaw-gateway.log"
AGENT_CORE_LOG="${RUN_DIR}/agent-core.log"
WEB_CHAT_LOG="${RUN_DIR}/web-chat.log"
TUNNEL_LOG="${RUN_DIR}/frontend-tunnel.log"

GATEWAY_PID=""
AGENT_CORE_PID=""
WEB_CHAT_PID=""
TUNNEL_PID=""

GATEWAY_STARTED_BY_SCRIPT=false
PUBLIC_URL=""

info() {
  printf '\n\033[1;34m%s\033[0m\n' "$*"
}

success() {
  printf '\033[1;32m%s\033[0m\n' "$*"
}

warn() {
  printf '\033[1;33m%s\033[0m\n' "$*" >&2
}

fail() {
  printf '\033[1;31mERROR: %s\033[0m\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 ||
    fail "No se encontró el comando requerido: $1"
}

process_is_alive() {
  local pid="${1:-}"

  [[ -n "${pid}" ]] &&
    kill -0 "${pid}" 2>/dev/null
}

stop_process() {
  local pid="${1:-}"
  local label="${2:-proceso}"

  if ! process_is_alive "${pid}"; then
    return
  fi

  warn "Deteniendo ${label}..."
  kill "${pid}" 2>/dev/null || true

  for _ in {1..20}; do
    if ! process_is_alive "${pid}"; then
      return
    fi

    sleep 0.25
  done

  kill -9 "${pid}" 2>/dev/null || true
}

cleanup() {
  local exit_code=$?

  trap - EXIT INT TERM

  printf '\n'
  warn "Cerrando entorno público..."

  stop_process "${TUNNEL_PID}" "túnel público"
  stop_process "${WEB_CHAT_PID}" "frontend Vite"
  stop_process "${AGENT_CORE_PID}" "Agent Core"

  if [[ "${GATEWAY_STARTED_BY_SCRIPT}" == "true" ]]; then
    stop_process \
      "${GATEWAY_PID}" \
      "OpenClaw Gateway"
  fi

  rm -rf "${RUN_DIR}"

  if [[ "${exit_code}" -eq 0 ||
        "${exit_code}" -eq 130 ]]; then
    success "Procesos cerrados."
  else
    warn "El entorno terminó con código ${exit_code}."
  fi

  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

wait_for_http() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"

  for ((attempt = 1;
        attempt <= attempts;
        attempt += 1)); do

    if curl \
      --fail \
      --silent \
      --connect-timeout 2 \
      --max-time 4 \
      "${url}" \
      >/dev/null 2>&1
    then
      success "${label}: disponible"
      return
    fi

    sleep 1
  done

  return 1
}

wait_for_tunnel_url() {
  local attempts="${1:-60}"
  local url=""

  for ((attempt = 1;
        attempt <= attempts;
        attempt += 1)); do

    if ! process_is_alive "${TUNNEL_PID}"; then
      cat "${TUNNEL_LOG}" >&2 || true
      fail "El túnel terminó inesperadamente."
    fi

    url="$(
      grep -Eo \
        'https://[A-Za-z0-9-]+\.trycloudflare\.com' \
        "${TUNNEL_LOG}" 2>/dev/null |
        head -n 1 ||
        true
    )"

    if [[ -n "${url}" ]]; then
      PUBLIC_URL="${url}"
      return
    fi

    sleep 1
  done

  cat "${TUNNEL_LOG}" >&2 || true
  fail "No fue posible obtener la URL pública."
}

start_gateway() {
  info "1/5 — OpenClaw Gateway"

  if openclaw health >/dev/null 2>&1; then
    success "OpenClaw Gateway ya estaba activo."
    return
  fi

  openclaw gateway --port "${OPENCLAW_PORT}" \
    >"${GATEWAY_LOG}" 2>&1 &

  GATEWAY_PID=$!
  GATEWAY_STARTED_BY_SCRIPT=true

  for _ in {1..40}; do
    if openclaw health >/dev/null 2>&1; then
      success "OpenClaw Gateway iniciado."
      return
    fi

    if ! process_is_alive "${GATEWAY_PID}"; then
      cat "${GATEWAY_LOG}" >&2 || true
      fail "OpenClaw Gateway terminó inesperadamente."
    fi

    sleep 1
  done

  cat "${GATEWAY_LOG}" >&2 || true
  fail "OpenClaw Gateway no respondió."
}

start_agent_core() {
  info "2/5 — Agent Core"

  [[ -n "${AGENT_INTERNAL_API_KEY:-}" ]] ||
    fail "Falta AGENT_INTERNAL_API_KEY"

  [[ -n "${OPENCLAW_AGENT_CORE_API_KEY:-}" ]] ||
    fail "Falta OPENCLAW_AGENT_CORE_API_KEY"

  [[ "${AGENT_INTERNAL_API_KEY}" == "${OPENCLAW_AGENT_CORE_API_KEY}" ]] ||
    fail "Las claves internas no coinciden"

  PUBLIC_CHAT_ALLOWED_ORIGINS="http://localhost:${WEB_CHAT_PORT},http://127.0.0.1:${WEB_CHAT_PORT}" \
  PUBLIC_CHAT_TRUST_PROXY=false \
  pnpm --filter \
    @real-estate-agent/agent-core \
    dev \
    >"${AGENT_CORE_LOG}" 2>&1 &

  AGENT_CORE_PID=$!

  if ! wait_for_http \
    "${LOCAL_BACKEND_URL}/public/health" \
    "Agent Core" \
    60
  then
    cat "${AGENT_CORE_LOG}" >&2 || true
    fail "Agent Core no respondió."
  fi
}

configure_frontend() {
  info "3/5 — Configuración same-origin"

  # Vacío significa que React usará:
  # /public/health
  # /public/chat
  cat >"${WEB_ENV_FILE}" <<'EOF'
VITE_AGENT_CORE_URL=
EOF

  success "Frontend configurado para usar el proxy de Vite."
}

start_frontend() {
  info "4/5 — Frontend Vite"

  pnpm --filter \
    @real-estate-agent/web-chat \
    dev \
    -- \
    --host 127.0.0.1 \
    --port "${WEB_CHAT_PORT}" \
    >"${WEB_CHAT_LOG}" 2>&1 &

  WEB_CHAT_PID=$!

  if ! wait_for_http \
    "${LOCAL_FRONTEND_URL}" \
    "Frontend local" \
    60
  then
    cat "${WEB_CHAT_LOG}" >&2 || true
    fail "Vite no respondió."
  fi

  if ! wait_for_http \
    "${LOCAL_FRONTEND_URL}/public/health" \
    "Proxy Vite hacia Agent Core" \
    30
  then
    cat "${WEB_CHAT_LOG}" >&2 || true
    cat "${AGENT_CORE_LOG}" >&2 || true
    fail "El proxy de Vite no alcanza Agent Core."
  fi
}

start_tunnel() {
  info "5/5 — Túnel público de la interfaz"

  cloudflared tunnel \
    --url "${LOCAL_FRONTEND_URL}" \
    --no-autoupdate \
    >"${TUNNEL_LOG}" 2>&1 &

  TUNNEL_PID=$!

  wait_for_tunnel_url 60

  success "URL pública creada: ${PUBLIC_URL}"

  if wait_for_http \
    "${PUBLIC_URL}" \
    "Interfaz pública" \
    20
  then
    if wait_for_http \
      "${PUBLIC_URL}/public/health" \
      "API pública mediante proxy" \
      20
    then
      success "Interfaz y agente validados."
    else
      warn "La interfaz responde, pero la API aún se propaga."
    fi
  else
    warn "La URL aún no resuelve desde esta Mac."
    warn "Espera unos segundos y ábrela desde el celular."
  fi
}

print_summary() {
  printf '\n'
  printf '\033[1;32m'
  printf '============================================================\n'
  printf ' CHAT PÚBLICO LISTO\n'
  printf '============================================================\n'
  printf '\033[0m'
  printf '\n'

  printf 'Abrir desde cualquier celular:\n\n'
  printf '  \033[1;36m%s\033[0m\n' "${PUBLIC_URL}"

  printf '\n'
  printf 'Abrir localmente:\n'
  printf '  %s\n' "${LOCAL_FRONTEND_URL}"

  printf '\n'
  printf 'La URL pública muestra la interfaz gráfica y usa las tools.\n'
  printf 'Presiona Ctrl + C para cerrar todo.\n'
  printf '\n'
}

monitor_processes() {
  while true; do
    if ! process_is_alive "${AGENT_CORE_PID}"; then
      cat "${AGENT_CORE_LOG}" >&2 || true
      fail "Agent Core terminó inesperadamente."
    fi

    if ! process_is_alive "${WEB_CHAT_PID}"; then
      cat "${WEB_CHAT_LOG}" >&2 || true
      fail "El frontend terminó inesperadamente."
    fi

    if ! process_is_alive "${TUNNEL_PID}"; then
      cat "${TUNNEL_LOG}" >&2 || true
      fail "El túnel terminó inesperadamente."
    fi

    if (
      [[ "${GATEWAY_STARTED_BY_SCRIPT}" == "true" ]] &&
      ! process_is_alive "${GATEWAY_PID}"
    ); then
      cat "${GATEWAY_LOG}" >&2 || true
      fail "OpenClaw Gateway terminó inesperadamente."
    fi

    sleep 3
  done
}

main() {
  cd "${ROOT_DIR}"

  require_command pnpm
  require_command openclaw
  require_command cloudflared
  require_command curl
  require_command grep

  info "Preparando contratos compartidos"
  pnpm --filter \
    @real-estate-agent/shared \
    build

  start_gateway
  start_agent_core
  configure_frontend
  start_frontend
  start_tunnel
  print_summary
  monitor_processes
}

main "$@"
