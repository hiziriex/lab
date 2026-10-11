#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -z "$(git status --porcelain)" ]] || { echo '未コミット変更があります'; exit 1; }
node scripts/release-metadata.mjs "${1:-}"
pnpm check
pnpm build
pnpm build-storybook
pnpm test:storybook
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
pnpm audit:check
pnpm lighthouse
pnpm bundle
[[ -z "$(git status --porcelain)" ]] || { echo '検証後に未コミット変更があります'; exit 1; }
