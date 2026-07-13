#!/usr/bin/env bash
set -Eeuo pipefail

RUN_DIR="$(
  find "${TMPDIR:-/tmp}" \
    -maxdepth 1 \
    -type d \
    -name 'real-estate-public-chat.*' \
    -print 2>/dev/null |
    xargs ls -td 2>/dev/null |
    head -n 1
)"

if [[ -z "${RUN_DIR}" ]]; then
  echo "ERROR: No hay una sesión activa de pnpm dev:public-chat."
  exit 1
fi

LOG_FILE="${RUN_DIR}/openclaw-gateway.log"

if [[ ! -f "${LOG_FILE}" ]]; then
  echo "ERROR: No existe el log del Gateway:"
  echo "${LOG_FILE}"
  exit 1
fi

echo
echo "============================================================"
echo " OPENCLAW GATEWAY — LOGS EN VIVO"
echo "============================================================"
echo
echo "Archivo: ${LOG_FILE}"
echo "Presiona Ctrl + C para salir."
echo

tail -n 100 -f "${LOG_FILE}"
