#!/usr/bin/env bash
# Next.js dev with auto-selected port (default scan from 6000).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/dev-common.sh
source "${ROOT}/scripts/dev-common.sh"

prepare_web_dev_env "${ROOT}"
log "Next.js dev → http://localhost:${PORT}"
cd "${ROOT}/apps/web"
exec pnpm exec next dev --port "${PORT}"
