#!/usr/bin/env bash
# ClipForge — stop Docker infrastructure (Postgres, Redis, MinIO)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${ROOT}/infra/docker-compose.yml"
# shellcheck source=scripts/dev-common.sh
source "${ROOT}/scripts/dev-common.sh"

REMOVE_VOLUMES=0

usage() {
  cat <<EOF
Usage: ./stop-docker.sh [OPTIONS]

Stop ClipForge Docker infrastructure (Postgres, Redis, MinIO).

Options:
  -v, --volumes   Remove named volumes (deletes local DB, Redis, and MinIO data)
  -h, --help      Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -v | --volumes)
      REMOVE_VOLUMES=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      err "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

log "ClipForge Docker stop"

require_cmd docker

if ! docker compose version >/dev/null 2>&1; then
  err "docker compose (v2) is required"
  exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  err "Missing ${COMPOSE_FILE}"
  exit 1
fi

RUNNING="$(docker compose -f "${COMPOSE_FILE}" ps -q 2>/dev/null || true)"
if [[ -z "${RUNNING}" ]]; then
  log "No ClipForge Docker containers are running"
  exit 0
fi

if [[ "${REMOVE_VOLUMES}" == "1" ]]; then
  log "Stopping infrastructure and removing volumes..."
  docker compose -f "${COMPOSE_FILE}" down -v
  log "Stopped Postgres, Redis, and MinIO (data volumes removed)"
else
  log "Stopping infrastructure (Postgres, Redis, MinIO)..."
  docker compose -f "${COMPOSE_FILE}" down
  log "Stopped. Data volumes preserved — use ./stop-docker.sh --volumes to wipe local data"
fi
