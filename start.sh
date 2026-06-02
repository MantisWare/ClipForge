#!/usr/bin/env bash
# ClipForge — local development (no Docker)
# Requires PostgreSQL (and optionally Redis) running on your machine.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/dev-common.sh
source "${ROOT}/scripts/dev-common.sh"

log "ClipForge local start (without Docker)"
log "See developer.md for Postgres/Redis setup options."

require_node
require_pnpm

ensure_env_files "${ROOT}"
ensure_auth_secret "${ROOT}"
load_env "${ROOT}"

if ! ensure_brew_postgres_service; then
  warn "Could not auto-start PostgreSQL via Homebrew"
fi

if ! check_postgres; then
  err "PostgreSQL is required. Options:"
  err "  • macOS: brew install postgresql@16 && brew services start postgresql@16"
  err "  • Or use a hosted DB — set DATABASE_URL in .env"
  err "  • Or run: ./start-docker.sh"
  exit 1
fi

load_env "${ROOT}"
ensure_local_postgres || exit 1

check_redis || true

install_deps "${ROOT}"
setup_database "${ROOT}"

start_app "${ROOT}"
