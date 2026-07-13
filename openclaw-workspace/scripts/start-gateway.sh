#!/usr/bin/env bash
set -euo pipefail

if openclaw health >/dev/null 2>&1; then
  echo "Gateway ya esta activo."
  exit 0
fi

echo "Iniciando OpenClaw Gateway..."
openclaw gateway start >/dev/null

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if openclaw health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

openclaw health >/dev/null 2>&1 || {
  openclaw gateway status || true
  echo "No fue posible validar el health del Gateway." >&2
  exit 1
}

STATUS_OUTPUT="$(openclaw gateway status || true)"
grep -q 'port=18789' <<<"${STATUS_OUTPUT}" || {
  echo "El Gateway no reporta el puerto 18789." >&2
  exit 1
}
grep -q 'bind=loopback' <<<"${STATUS_OUTPUT}" || {
  echo "El Gateway no reporta bind loopback." >&2
  exit 1
}

echo "Gateway activo y validado."
