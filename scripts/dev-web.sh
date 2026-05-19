#!/usr/bin/env bash
# Next.js dev with auto-selected port (default scan from 4000, skips 3000).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/dev-common.sh
source "${ROOT}/scripts/dev-common.sh"

prepare_web_dev_env "${ROOT}"
if [[ "${CLIPFORGE_WEB_ONLY:-0}" == "1" ]]; then
  log "Next.js dev → http://localhost:${PORT}"
else
  log "Next.js API/UI backend → http://localhost:${PORT} (Electron shell loads this)"
fi
cd "${ROOT}/apps/web"
exec pnpm exec next dev --port "${PORT}"
