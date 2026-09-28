#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Keep dependency setup deterministic and safe to rerun after every task merge.
npm ci --no-audit --no-fund

# Catch integration/build failures before the merged app is served.
npm run build