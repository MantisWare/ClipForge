#!/usr/bin/env bash
# Start turbo dev with web port/env prepared before Electron starts.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/dev-common.sh
source "${ROOT}/scripts/dev-common.sh"

prepare_web_dev_env "${ROOT}"

FILTERS=(--filter=@clipforge/web --filter=@clipforge/worker)

if [[ "${CLIPFORGE_WEB_ONLY:-0}" != "1" && "${CLIPFORGE_DEV_WEB_ONLY:-0}" != "1" ]]; then
  FILTERS+=(--filter=@clipforge/desktop)
fi

exec pnpm exec turbo dev "${FILTERS[@]}"
