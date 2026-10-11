#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use
fi
for tool in git gh node pnpm gcc make; do
  command -v "$tool" >/dev/null || { echo "必要なツールがありません: $tool"; exit 1; }
done
git --version
gh --version
node --version
pnpm --version
dpkg-query -W build-essential
if ! gh auth status; then
  echo 'WSL のターミナルで gh auth login --hostname github.com --git-protocol https --web を実行してください。'
  exit 1
fi
pnpm install --frozen-lockfile
printf '%s\n' '準備完了: pnpm dev → http://localhost:4321/lab/'
