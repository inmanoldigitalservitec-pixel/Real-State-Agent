#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OPENCLAW_CONFIG="${HOME}/.openclaw/openclaw.json"
EXPECTED_AGENT="real-estate-agent"
EXPECTED_WORKSPACE="${WORKSPACE_DIR}"
EXPECTED_MODEL="openai/gpt-5.5"
EXPECTED_PORT="18789"
FORBIDDEN_IDENTITY_PATTERN='inteligencia artificial|openclaw|supabase|agent-core|plugin|tools|workspace|fase 4|backend|infraestructura|otros proyectos'

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

warn() {
  echo "WARNING: $*" >&2
}

require_file() {
  [[ -f "$1" ]] || fail "No existe $1"
}

require_file "${OPENCLAW_CONFIG}"
require_file "${WORKSPACE_DIR}/IDENTITY.md"
require_file "${WORKSPACE_DIR}/SOUL.md"
require_file "${WORKSPACE_DIR}/AGENTS.md"
require_file "${WORKSPACE_DIR}/TOOLS.md"

command -v openclaw >/dev/null 2>&1 || fail "El binario openclaw no esta disponible"

VERSION_OUTPUT="$(openclaw --version)"
echo "Version: ${VERSION_OUTPUT}"

python3 - <<'PY' "${OPENCLAW_CONFIG}" "${EXPECTED_AGENT}" "${EXPECTED_WORKSPACE}" "${EXPECTED_MODEL}" "${EXPECTED_PORT}"
import json
import pathlib
import sys

config_path = pathlib.Path(sys.argv[1])
expected_agent = sys.argv[2]
expected_workspace = sys.argv[3]
expected_model = sys.argv[4]
expected_port = int(sys.argv[5])
obj = json.loads(config_path.read_text())

gateway = obj.get("gateway", {})
if gateway.get("mode") != "local":
    raise SystemExit("Gateway mode no es local")
if gateway.get("bind") != "loopback":
    raise SystemExit("Gateway bind no es loopback")
if gateway.get("port") != expected_port:
    raise SystemExit("Gateway port no coincide")

agents = obj.get("agents", {})
found = None
for entry in agents.get("list", []):
    if entry.get("id") == expected_agent:
        found = entry
        break
if not found:
    raise SystemExit("No existe el agente real-estate-agent en openclaw.json")
if found.get("workspace") != expected_workspace:
    raise SystemExit("El workspace del agente no coincide")
if found.get("model") != expected_model:
    raise SystemExit("El modelo del agente no coincide")

print("Agente y config base: OK")
PY

[[ ! -e "${WORKSPACE_DIR}/BOOTSTRAP.md" ]] || fail "BOOTSTRAP.md todavia existe"
[[ ! -e "${WORKSPACE_DIR}/.git" ]] || fail "Existe .git interno en el workspace"

grep -qi 'Nombre: Carlos' "${WORKSPACE_DIR}/IDENTITY.md" || fail "IDENTITY.md no define a Carlos"
grep -qi 'Rol: asesor inmobiliario' "${WORKSPACE_DIR}/IDENTITY.md" || fail "IDENTITY.md no define el rol correcto"
grep -qi 'Hola, soy Carlos' "${WORKSPACE_DIR}/IDENTITY.md" || fail "IDENTITY.md no contiene una presentacion natural"

if rg -qi "${FORBIDDEN_IDENTITY_PATTERN}" "${WORKSPACE_DIR}/IDENTITY.md"; then
  fail "IDENTITY.md contiene referencias tecnicas impropias"
fi

if rg -qi 'openclaw|supabase|agent-core|plugin|workspace|backend|infraestructura|otros proyectos' "${WORKSPACE_DIR}/SOUL.md"; then
  fail "SOUL.md contiene referencias tecnicas impropias"
fi

HEARTBEAT_NON_COMMENT_LINES="$(grep -v '^[[:space:]]*#' "${WORKSPACE_DIR}/HEARTBEAT.md" | grep -v '^[[:space:]]*$' || true)"
[[ -z "${HEARTBEAT_NON_COMMENT_LINES}" ]] || fail "HEARTBEAT.md no esta en estado seguro"

GATEWAY_STATUS="$(openclaw gateway status || true)"
echo "${GATEWAY_STATUS}"
grep -q 'port=18789' <<<"${GATEWAY_STATUS}" || fail "Gateway status no muestra el puerto esperado"
grep -q 'bind=loopback' <<<"${GATEWAY_STATUS}" || fail "Gateway status no muestra bind loopback"

if openclaw health >/dev/null 2>&1; then
  echo "Health: OK"
else
  fail "openclaw health no responde correctamente"
fi

MODELS_JSON="$(openclaw models status --json)"
python3 - <<'PY' "${MODELS_JSON}" "${EXPECTED_MODEL}"
import json
import sys

payload = json.loads(sys.argv[1])
expected_model = sys.argv[2]
allowed = payload.get("allowed", [])
if expected_model not in allowed:
    raise SystemExit("El modelo esperado no aparece en allowed")
print("Modelos: OK")
PY

if openclaw agents list >/dev/null 2>&1; then
  echo "Agents list: OK"
else
  warn "No se pudo inspeccionar agents list desde el CLI"
fi

if openclaw plugins list >/dev/null 2>&1; then
  echo "Plugins list: OK"
else
  warn "No se pudo inspeccionar plugins list desde el CLI"
fi

if openclaw sandbox explain --agent "${EXPECTED_AGENT}" >/dev/null 2>&1; then
  echo "Sandbox explain: OK"
else
  warn "No se pudo inspeccionar sandbox explain desde el CLI"
fi

echo "Check OpenClaw: OK"
