#!/usr/bin/env bash
# ClipForge — development with Docker (Postgres, Redis, MinIO)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${ROOT}/infra/docker-compose.yml"
# shellcheck source=scripts/dev-common.sh
source "${ROOT}/scripts/dev-common.sh"

log "ClipForge Docker start"
log "See developer.md for details."

require_node
require_pnpm
require_cmd docker

if ! docker compose version >/dev/null 2>&1; then
  err "docker compose (v2) is required"
  exit 1
fi

ensure_env_files "${ROOT}"
ensure_auth_secret "${ROOT}"

log "Starting infrastructure (Postgres, Redis, MinIO)..."
docker compose -f "${COMPOSE_FILE}" up -d

log "Waiting for Postgres..."
TRIES=0
until docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_isready -U clipforge -d clipforge >/dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [[ ${TRIES} -gt 60 ]]; then
    err "Postgres did not become ready in time"
    exit 1
  fi
  sleep 1
done
log "Postgres is ready"

warn "Create MinIO bucket 'clipforge-media' at http://localhost:9001 if not already done"
warn "  Login: clipforge / clipforge_secret"

install_deps "${ROOT}"
setup_database "${ROOT}"

start_app "${ROOT}"
