#!/usr/bin/env bash
set -euo pipefail
if [[ "${IS_PR:-false}" == true && -f .bundle-base/package.json ]]; then
  report_script="$PWD/scripts/bundle-report.mjs"
  if (
    cd .bundle-base
    if [[ -f pnpm-lock.yaml ]]; then
      pnpm install --frozen-lockfile
      pnpm build
    else
      npm ci
      npm run build
    fi
    node "$report_script" dist --json > /tmp/lab-base-bundle.json
  ) > /tmp/lab-base-build.log 2>&1; then
    BUNDLE_BASE=/tmp/lab-base-bundle.json node scripts/bundle-report.mjs
  else
    echo '比較元 build が失敗したため、差分は算出できません。'
    cat /tmp/lab-base-build.log
    node scripts/bundle-report.mjs
  fi
else
  node scripts/bundle-report.mjs
fi
