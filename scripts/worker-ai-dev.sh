#!/usr/bin/env bash
# Start services/worker-ai (Faster-Whisper) for local transcription.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WA_DIR="${ROOT}/services/worker-ai"
VENV="${WA_DIR}/.venv"
PORT="${WORKER_AI_PORT:-8002}"
HOST="${WORKER_AI_HOST:-127.0.0.1}"
LOG_FILE="${ROOT}/.worker-ai.log"
PID_FILE="${ROOT}/.worker-ai.pid"

# shellcheck source=scripts/dev-common.sh
source "${ROOT}/scripts/dev-common.sh"

load_env "${ROOT}"
load_web_env "${ROOT}"

require_cmd python3

if [[ ! -d "${VENV}" ]]; then
  log "Creating worker-ai virtualenv..."
  python3 -m venv "${VENV}"
  # shellcheck disable=SC1091
  source "${VENV}/bin/activate"
  pip install -q --upgrade pip
  pip install -q -r "${WA_DIR}/requirements.txt"
else
  # shellcheck disable=SC1091
  source "${VENV}/bin/activate"
fi

health_url="http://${HOST}:${PORT}/health"
if curl -sf "${health_url}" >/dev/null 2>&1; then
  log "worker-ai already healthy at ${health_url}"
  exit 0
fi

if [[ -f "${PID_FILE}" ]]; then
  old_pid="$(cat "${PID_FILE}")"
  if kill -0 "${old_pid}" 2>/dev/null; then
    log "worker-ai process ${old_pid} still starting — see ${LOG_FILE}"
    exit 0
  fi
  rm -f "${PID_FILE}"
fi

log "Starting worker-ai on http://${HOST}:${PORT} (logs: ${LOG_FILE})"
cd "${WA_DIR}"
nohup uvicorn app.main:app --host "${HOST}" --port "${PORT}" >>"${LOG_FILE}" 2>&1 &
echo $! >"${PID_FILE}"

for _ in $(seq 1 30); do
  if curl -sf "${health_url}" >/dev/null 2>&1; then
    log "worker-ai ready at ${health_url}"
    exit 0
  fi
  sleep 1
done

warn "worker-ai did not become healthy within 30s — check ${LOG_FILE}"
exit 1
