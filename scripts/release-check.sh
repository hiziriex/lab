#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -z "$(git status --porcelain)" ]] || { echo '未コミット変更があります'; exit 1; }
node scripts/release-metadata.mjs "${1:-}"
pnpm check
pnpm build
pnpm build-storybook
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
