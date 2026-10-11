#!/usr/bin/env bash
set -euo pipefail
# フォント不在を別の CJK フォントへの暗黙 fallback で隠さない。
family=$(fc-match --format '%{family}' 'Noto Sans CJK JP:lang=ja')
if [[ "$family" != 'Noto Sans CJK JP' ]]; then
  printf '日本語 system font がありません（検出: %s）。fonts-noto-cjk を導入してください。\n' "$family" >&2
  exit 1
fi
fc-match --format '%{family}: %{file}\n' 'Noto Sans CJK JP:lang=ja'
