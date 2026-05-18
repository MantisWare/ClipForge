#!/usr/bin/env bash
# Shared setup helpers for start.sh and start-docker.sh

set -euo pipefail

clipforge_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "${script_dir}/.." && pwd
}

log() {
  printf '\033[1;36m[clipforge]\033[0m %s\n' "$*"
}

warn() {
  printf '\033[1;33m[clipforge]\033[0m %s\n' "$*" >&2
}

err() {
  printf '\033[1;31m[clipforge]\033[0m %s\n' "$*" >&2
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Missing required command: $1"
    exit 1
  fi
}

require_node() {
  require_cmd node
  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "${major}" -lt 20 ]]; then
    err "Node.js 20+ required (found $(node -v))"
    exit 1
  fi
}

require_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return 0
  fi
  if command -v corepack >/dev/null 2>&1; then
    log "Enabling pnpm via corepack..."
    corepack enable
    corepack prepare pnpm@9.15.0 --activate
    return 0
  fi
  err "pnpm not found. Install with: npm install -g pnpm  OR  corepack enable"
  exit 1
}

load_env() {
  local root="$1"
  if [[ -f "${root}/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${root}/.env"
    set +a
  fi
}

ensure_env_files() {
  local root="$1"
  if [[ ! -f "${root}/.env" ]]; then
    log "Creating ${root}/.env from .env.example"
    cp "${root}/.env.example" "${root}/.env"
  fi
  if [[ ! -f "${root}/apps/web/.env" ]]; then
    log "Creating apps/web/.env from .env.example"
    cp "${root}/.env.example" "${root}/apps/web/.env"
  fi
}

ensure_auth_secret() {
  local root="$1"
  local env_file="${root}/.env"
  local web_env="${root}/apps/web/.env"
  local secret

  if grep -qE '^AUTH_SECRET="?generate-with-openssl' "${env_file}" 2>/dev/null; then
    require_cmd openssl
    secret="$(openssl rand -base64 32)"
    log "Generating AUTH_SECRET..."
    if [[ "$(uname -s)" == "Darwin" ]]; then
      sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${secret}\"|" "${env_file}"
      sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${secret}\"|" "${web_env}"
    else
      sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${secret}\"|" "${env_file}"
      sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${secret}\"|" "${web_env}"
    fi
  fi
}

install_deps() {
  local root="$1"
  log "Installing dependencies (pnpm install)..."
  pnpm --dir "${root}" install
}

setup_database() {
  local root="$1"
  load_env "${root}"
  export DATABASE_URL="${DATABASE_URL:-postgresql://clipforge:clipforge@localhost:5432/clipforge?schema=public}"

  log "Generating Prisma client..."
  pnpm --dir "${root}/packages/database" db:generate

  log "Applying database migrations..."
  pnpm --dir "${root}/packages/database" exec prisma migrate deploy

  if [[ "${CLIPFORGE_SEED:-0}" == "1" ]]; then
    log "Seeding database..."
    pnpm --dir "${root}/packages/database" db:seed
  fi
}

port_open() {
  local host="$1"
  local port="$2"
  if command -v nc >/dev/null 2>&1; then
    nc -z "${host}" "${port}" >/dev/null 2>&1
    return $?
  fi
  (echo >/dev/tcp/"${host}"/"${port}") >/dev/null 2>&1
}

check_postgres() {
  local url="${DATABASE_URL:-postgresql://clipforge:clipforge@localhost:5432/clipforge?schema=public}"
  local host port
  host="$(echo "${url}" | sed -n 's|.*@\([^:/]*\).*|\1|p')"
  port="$(echo "${url}" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')"
  host="${host:-localhost}"
  port="${port:-5432}"

  if port_open "${host}" "${port}"; then
    log "PostgreSQL reachable at ${host}:${port}"
    return 0
  fi
  warn "PostgreSQL not reachable at ${host}:${port}"
  return 1
}

check_redis() {
  local redis_url="${REDIS_URL:-redis://localhost:6379}"
  local host port
  host="$(echo "${redis_url}" | sed -n 's|redis://\([^:/]*\).*|\1|p')"
  port="$(echo "${redis_url}" | sed -n 's|.*:\([0-9]*\)$|\1|p')"
  host="${host:-localhost}"
  port="${port:-6379}"

  if port_open "${host}" "${port}"; then
    log "Redis reachable at ${host}:${port}"
    return 0
  fi
  warn "Redis not reachable at ${host}:${port} (jobs will queue in DB only)"
  return 1
}

start_app() {
  local root="$1"
  load_env "${root}"
  log "Starting Next.js dev server at http://localhost:3000"
  log "Sign in with demo@clipforge.local (credentials provider)"
  exec pnpm --dir "${root}" dev
}
