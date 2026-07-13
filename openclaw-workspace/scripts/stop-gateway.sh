#!/usr/bin/env bash
set -euo pipefail

if ! openclaw health >/dev/null 2>&1; then
  echo "Gateway ya esta detenido o no responde."
  exit 0
fi

echo "Deteniendo OpenClaw Gateway..."
openclaw gateway stop >/dev/null

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if ! openclaw health >/dev/null 2>&1; then
    echo "Gateway detenido."
    exit 0
  fi
  sleep 1
done

echo "No fue posible confirmar la detencion del Gateway." >&2
openclaw gateway status || true
exit 1
