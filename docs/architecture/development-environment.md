# 開発環境

## 1. 基本方針

開発環境は WSL 側へ完結させる。
Windows 側は主に Browser と、必要に応じて VS Code に使用する。

Node / pnpm / Git / GitHub CLI / Codex の実行は WSL 側を基本とする。

## 2. 作業ディレクトリ

推奨:

```text
~/work/lab/
```

WSL の Linux filesystem 上へ repository を置く。
`/mnt/c/...` を開発 repository の配置先にしない。

## 3. 必要 Tool

WSL 側:

- Git
- GitHub CLI (`gh`)
- nvm
- Node.js 24 LTS
- pnpm
- build-essential
- fonts-noto-cjk（Linux browser 検証用の日本語 system font）
- Codex

GitHub CLI は WSL 側で認証済みとする。
未認証の場合は人間が `gh auth login` を行う。

## 4. Node / pnpm

- `.nvmrc` で Node 24 を指定。
- `package.json` の `packageManager` に具体的な pnpm version を指定。
- `pnpm-lock.yaml` を正本として commit。
- Stable release のみ使用。

## 5. VS Code

必要に応じて VS Code + WSL 拡張で `~/work/lab/` を WSL context から開く。
日常操作を VS Code 必須にはしない。

## 6. Dev server

Astro の dev server は WSL 側で起動する。

```bash
pnpm dev
```

Windows 側 browser から `localhost` へアクセスして確認する。

## 7. Setup script

`scripts/setup-dev.sh` を用意する。

目的:

- 必要 tool の存在確認
- version 確認
- dependency install 支援
- 開発開始手順の案内

GitHub login 等の人間操作を無理に自動化しない。
README に setup 手順を記載する。

## 8. 日本語フォント

Ubuntu / WSL は `sudo apt-get update` と `sudo apt-get install -y fonts-noto-cjk` で導入し、`bash scripts/check-japanese-fonts.sh` で確認する。
sudo を使えない環境では、同じ OS package の NotoSansCJK-Regular / Bold をユーザー用 system font 領域へ導入して fontconfig に登録してもよい。
フォントは repository / build /公開サイトへコピーしない。OS のフォントとしてのみ使用する。
