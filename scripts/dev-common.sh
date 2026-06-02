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

# apps/web/.env overrides root (e.g. YOUTUBE_API_KEY may be empty in root .env.example copy).
load_web_env() {
  local root="$1"
  local web_env="${root}/apps/web/.env"
  if [[ -f "${web_env}" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${web_env}"
    set +a
  fi
}

# Override DATABASE_URL / REDIS_URL for ./start-docker.sh (non-default host ports).
load_docker_env() {
  local root="$1"
  local docker_env="${root}/infra/docker.env"
  if [[ ! -f "${docker_env}" ]]; then
    err "Missing ${docker_env}"
    return 1
  fi
  set -a
  # shellcheck disable=SC1091
  source "${docker_env}"
  set +a
  export CLIPFORGE_DOCKER=1
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
  if [[ "${CLIPFORGE_DOCKER:-0}" == "1" ]]; then
    load_docker_env "${root}"
  fi
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

# Ports Next.js refuses (https://nextjs.org/docs/messages/reserved-port).
port_is_next_reserved() {
  case "${1}" in
    1|7|9|11|13|15|17|19|20|21|22|23|25|37|42|43|53|69|77|79|87|95|101|102|103|104|109|110|111|113|115|117|119|123|135|137|139|143|161|179|389|427|465|512|513|514|515|526|530|531|532|540|548|554|556|563|587|601|636|989|990|993|995|1719|1720|1723|2049|3659|4045|5060|5061|6000|6566|6665|6666|6667|6668|6669|6697|10080)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

port_is_clipforge_blocked() {
  # Keep ClipForge off the usual local dev port (CRA, Next defaults, etc.).
  case "${1}" in
    3000) return 0 ;;
    *) return 1 ;;
  esac
}

port_unavailable() {
  local host="$1"
  local port="$2"
  if port_open "${host}" "${port}"; then
    return 0
  fi
  if port_is_next_reserved "${port}"; then
    return 0
  fi
  if port_is_clipforge_blocked "${port}"; then
    return 0
  fi
  return 1
}

# First TCP port on host that is not in use and allowed by Next.js.
find_free_port() {
  local host="${1:-localhost}"
  local start_port="${2:-4000}"
  local max_port="${3:-4999}"
  local port="${start_port}"

  while port_unavailable "${host}" "${port}"; do
    port=$((port + 1))
    if [[ "${port}" -gt "${max_port}" ]]; then
      err "No free port on ${host} between ${start_port} and ${max_port}"
      return 1
    fi
  done
  echo "${port}"
}

find_ytdlp_bin() {
  if [[ -n "${YTDLP_PATH:-}" && -x "${YTDLP_PATH}" ]]; then
    echo "${YTDLP_PATH}"
    return 0
  fi
  if command -v yt-dlp >/dev/null 2>&1; then
    command -v yt-dlp
    return 0
  fi
  local candidate
  for candidate in /opt/homebrew/bin/yt-dlp /usr/local/bin/yt-dlp; do
    if [[ -x "${candidate}" ]]; then
      echo "${candidate}"
      return 0
    fi
  done
  return 1
}

ensure_minio_bucket() {
  local bucket="${S3_BUCKET:-clipforge-media}"
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx clipforge-minio; then
    return 0
  fi
  if docker exec clipforge-minio mc alias set local http://127.0.0.1:9000 \
    "${S3_ACCESS_KEY:-clipforge}" "${S3_SECRET_KEY:-clipforge_secret}" >/dev/null 2>&1; then
    docker exec clipforge-minio mc mb "local/${bucket}" --ignore-existing >/dev/null 2>&1 || true
    log "MinIO bucket ready: ${bucket}"
  else
    warn "Could not configure MinIO CLI — create bucket '${bucket}' at http://localhost:9003"
  fi
}

ensure_ytdlp() {
  local bin
  if bin="$(find_ytdlp_bin)"; then
    export YTDLP_PATH="${bin}"
    return 0
  fi
  warn "yt-dlp not found — YouTube imports will fail until installed."
  warn "  macOS: brew install yt-dlp"
  warn "  Or set YTDLP_PATH in .env to the full path of the yt-dlp binary."
  return 1
}

# Sets PORT, AUTH_URL, and YOUTUBE_OAUTH_REDIRECT_URI for the web dev server.
prepare_web_dev_env() {
  local root="$1"
  local host="localhost"
  local start_port="${CLIPFORGE_WEB_PORT:-4000}"
  local max_port="${CLIPFORGE_WEB_PORT_MAX:-4999}"

  load_env "${root}"
  # Docker infra must load after root and win over apps/web/.env (MinIO 9002, keys).
  if [[ "${CLIPFORGE_DOCKER:-0}" == "1" ]]; then
    load_docker_env "${root}"
    load_web_env "${root}"
    load_docker_env "${root}"
  else
    load_web_env "${root}"
  fi

  ensure_ytdlp || true

  if [[ "${CLIPFORGE_DOCKER:-0}" == "1" ]]; then
    log "Docker mode — S3_ENDPOINT=${S3_ENDPOINT:-unset} DATABASE_URL (host)=$(echo "${DATABASE_URL:-}" | sed 's/clipforge:clipforge@/…@/')"
  fi

  if [[ -z "${PORT:-}" ]]; then
    PORT="$(find_free_port "${host}" "${start_port}" "${max_port}")"
    export PORT
  fi

  export AUTH_URL="http://localhost:${PORT}"
  export YOUTUBE_OAUTH_REDIRECT_URI="http://localhost:${PORT}/api/accounts/callback/youtube"
  echo "${PORT}" > "${root}/.clipforge-dev-port"
}

find_psql() {
  if command -v psql >/dev/null 2>&1; then
    command -v psql
    return 0
  fi
  local brew_prefix
  for brew_prefix in \
    "$(brew --prefix postgresql@16 2>/dev/null)" \
    "$(brew --prefix postgresql@15 2>/dev/null)" \
    "$(brew --prefix postgresql 2>/dev/null)" \
    "/opt/homebrew/opt/postgresql@16" \
    "/opt/homebrew/opt/postgresql@15" \
    "/usr/local/opt/postgresql@16" \
    "/usr/local/opt/postgresql@15"; do
    if [[ -n "${brew_prefix}" && -x "${brew_prefix}/bin/psql" ]]; then
      echo "${brew_prefix}/bin/psql"
      return 0
    fi
  done
  return 1
}

postgres_url_host() {
  local url="$1"
  echo "${url}" | sed -n 's|.*@\([^:/]*\).*|\1|p'
}

postgres_url_port() {
  local url="$1"
  local host_port port
  host_port="$(echo "${url}" | sed -n 's|.*@\([^/]*\).*|\1|p')"
  port="$(echo "${host_port}" | sed -n 's|.*:\([0-9]*\)$|\1|p')"
  if [[ -n "${port}" ]]; then
    echo "${port}"
  else
    echo "5432"
  fi
}

postgres_can_connect() {
  local url="$1"
  local psql_bin
  psql_bin="$(find_psql)" || return 1
  "${psql_bin}" "${url%%\?*}" -c "SELECT 1" >/dev/null 2>&1
}

ensure_local_postgres() {
  local url="${DATABASE_URL:-postgresql://clipforge:clipforge@localhost:5432/clipforge?schema=public}"
  local host db_user db_name psql_bin

  host="$(postgres_url_host "${url}")"
  host="${host:-localhost}"
  if [[ "${host}" != "localhost" && "${host}" != "127.0.0.1" ]]; then
    return 0
  fi

  if postgres_can_connect "${url}"; then
    return 0
  fi

  psql_bin="$(find_psql)" || {
    warn "Cannot verify Postgres credentials (psql not found)."
    warn "Create role/database manually — see developer.md (macOS Homebrew section)."
    return 0
  }

  db_user="$(echo "${url}" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')"
  db_name="$(echo "${url}" | sed -n 's|.*/\([^?]*\).*|\1|p')"
  db_user="${db_user:-clipforge}"
  db_name="${db_name:-clipforge}"

  local port
  port="$(echo "${url}" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')"
  port="${port:-5432}"

  log "Provisioning local Postgres role '${db_user}' and database '${db_name}'..."
  "${psql_bin}" -h "${host}" -p "${port}" \
    -U "${USER}" -d postgres -v ON_ERROR_STOP=0 <<SQL
CREATE USER ${db_user} WITH PASSWORD 'clipforge' CREATEDB;
ALTER USER ${db_user} WITH PASSWORD 'clipforge';
CREATE DATABASE ${db_name} OWNER ${db_user};
SQL

  if postgres_can_connect "${url}"; then
    log "PostgreSQL ready (${db_user}@${host}/${db_name})"
    return 0
  fi

  err "Could not connect with DATABASE_URL after provisioning attempt."
  err "Set DATABASE_URL in .env to match your local Postgres user, e.g.:"
  err "  postgresql://${USER}@localhost:5432/${db_name}?schema=public"
  return 1
}

ensure_homebrew_in_path() {
  local dir
  for dir in /opt/homebrew/bin /usr/local/bin; do
    if [[ -d "${dir}" && ":${PATH}:" != *":${dir}:"* ]]; then
      export PATH="${dir}:${PATH}"
    fi
  done
}

find_brew_postgresql_formula() {
  ensure_homebrew_in_path

  local formula prefix base
  if command -v brew >/dev/null 2>&1; then
    for formula in postgresql@17 postgresql@16 postgresql@15 postgresql@14 postgresql; do
      prefix="$(brew --prefix "${formula}" 2>/dev/null)" || continue
      if [[ -n "${prefix}" && -d "${prefix}" ]]; then
        echo "${formula}"
        return 0
      fi
    done
  fi

  for formula in postgresql@17 postgresql@16 postgresql@15 postgresql@14 postgresql; do
    for base in /opt/homebrew/opt /usr/local/opt; do
      if [[ -d "${base}/${formula}" ]]; then
        echo "${formula}"
        return 0
      fi
    done
  done
  return 1
}

# On macOS, start Homebrew PostgreSQL when DATABASE_URL points at localhost and the port is down.
ensure_brew_postgres_service() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    return 0
  fi

  ensure_homebrew_in_path

  local url="${DATABASE_URL:-postgresql://clipforge:clipforge@localhost:5432/clipforge?schema=public}"
  local host port formula tries
  host="$(postgres_url_host "${url}")"
  port="$(postgres_url_port "${url}")"
  host="${host:-localhost}"

  if [[ "${host}" != "localhost" && "${host}" != "127.0.0.1" ]]; then
    return 0
  fi

  if port_open "${host}" "${port}"; then
    return 0
  fi

  formula="$(find_brew_postgresql_formula)" || {
    warn "No Homebrew PostgreSQL install found (postgresql@15, @16, etc.)"
    return 1
  }

  if ! command -v brew >/dev/null 2>&1; then
    warn "Homebrew is not available; install from https://brew.sh"
    return 1
  fi

  log "PostgreSQL not running — starting Homebrew service (${formula})..."
  if ! brew services start "${formula}" 2>&1; then
    warn "brew services start ${formula} failed"
    return 1
  fi

  tries=0
  while [[ "${tries}" -lt 30 ]]; do
    if port_open "${host}" "${port}"; then
      log "PostgreSQL is ready at ${host}:${port} (${formula})"
      return 0
    fi
    sleep 1
    tries=$((tries + 1))
  done

  warn "Homebrew started ${formula} but ${host}:${port} is still not reachable"
  return 1
}

# Docker uses alternate host ports so local Homebrew Postgres/Redis can stay on 5432/6379.
verify_docker_host_ports() {
  local blocked=()
  if port_open "localhost" "5433"; then
    blocked+=("5433 (Docker Postgres — local Postgres may use 5432)")
  fi
  if port_open "localhost" "6380"; then
    blocked+=("6380 (Docker Redis — local Redis may use 6379)")
  fi
  if port_open "localhost" "9002"; then
    blocked+=("9002 (Docker MinIO API)")
  fi
  if port_open "localhost" "9003"; then
    blocked+=("9003 (Docker MinIO console)")
  fi

  if [[ ${#blocked[@]} -gt 0 ]]; then
    err "Docker cannot bind — port(s) already in use: ${blocked[*]}"
    err "Change mappings in infra/docker-compose.yml or stop the process using the port."
    exit 1
  fi

  log "Docker host ports: Postgres 5433, Redis 6380, MinIO 9002 (API) / 9003 (console)"
  log "Local Postgres/Redis/MinIO can keep 5432, 6379, 9000, 9001"
}

check_postgres() {
  local url="${DATABASE_URL:-postgresql://clipforge:clipforge@localhost:5432/clipforge?schema=public}"
  local host port
  host="$(postgres_url_host "${url}")"
  port="$(postgres_url_port "${url}")"
  host="${host:-localhost}"

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

ensure_worker_ai() {
  local root="$1"
  local script="${root}/scripts/worker-ai-dev.sh"
  if [[ ! -f "${script}" ]]; then
    warn "Missing ${script}"
    return 1
  fi
  chmod +x "${script}" 2>/dev/null || true
  if bash "${script}"; then
    return 0
  fi
  warn "worker-ai not running — set AUTO_TRANSCRIBE=false or start manually:"
  warn "  cd services/worker-ai && python3 -m venv .venv && source .venv/bin/activate"
  warn "  pip install -r requirements.txt && uvicorn app.main:app --reload --port 8002"
  return 1
}

start_app() {
  local root="$1"
  prepare_web_dev_env "${root}"
  if [[ "${CLIPFORGE_SKIP_WORKER_AI:-0}" != "1" && "${AUTO_TRANSCRIBE:-true}" != "false" ]]; then
    ensure_worker_ai "${root}" || true
  fi
  if [[ "${CLIPFORGE_WEB_ONLY:-0}" == "1" ]]; then
    log "Starting Next.js dev server at http://localhost:${PORT} (browser)"
  else
    log "Starting ClipForge desktop (API at http://localhost:${PORT})"
  fi
  log "Sign in with demo@clipforge.local (credentials provider)"
  exec pnpm --dir "${root}" dev
}
