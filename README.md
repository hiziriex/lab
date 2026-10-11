# Hiziriex Lab

電子回路・電源設計向けの静的サイトと計算ツールです。正本は [README-SPEC.md](README-SPEC.md)、[AGENTS.md](AGENTS.md)、[docs/](docs/index.md) です。

## WSL での開発

repository は Linux filesystem の `~/work/lab` に配置します。Node.js 24 LTS を nvm で導入し、`package.json` の `packageManager` に指定された pnpm を利用してください。

```bash
source ~/.nvm/nvm.sh
nvm install
npm install --global pnpm@12.10.1
gh auth login --hostname github.com --git-protocol https --web
bash scripts/setup-dev.sh
pnpm exec playwright install --with-deps
pnpm dev
```

Windows のブラウザから `http://localhost:4321/lab/` にアクセスします。

## 検証

```bash
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
```

画像比較の基準画像は人間のレビュー・承認後に限り追加・更新します。`test:visual` は基準がない場合に失敗し、自動作成しません。

`pnpm check` は lint / CSS lint / format / 型検査 / coverage 付き unit・component test を実行します。ブラウザ検証は本番 build に対して別途実行します。

`pnpm lighthouse` は導入済みの Playwright Chromium を起動して計測するため、WSL 側で完結します。`pnpm exec playwright install chromium` を先に実行してください。測定結果は `.lighthouseci/reports/` に保存し、外部へ upload しません。

再構築の検証結果と再開手順は [作業記録](docs/rebuild-status.md) を参照してください。

## 構成

- Astro: ページ・SEO・MDX・Content Collections
- React / Radix Themes: 対話ツール
- `src/lib/calculations`: SI 単位の純粋計算関数
- `src/lib/units`, `src/lib/formatters`: 入力解釈・表示
- `src/assets/circuits/*.drawio`: 回路図正本
- `public/circuits/*.svg`: 公開用 SVG

ECharts と Mermaid は基盤依存として導入し、初版ツールのクライアント bundle へは読み込みません。X/Twitter URL は `src/lib/site.ts` の未確定設定です。

## GitHub と公開

[GitHub 運用仕様](docs/architecture/github-workflow.md) と [Release 仕様](docs/architecture/release-deployment.md) に従います。main merge では公開しません。人間が version と CHANGELOG を確定して `scripts/release-check.sh` を実行し、承認済みの `vX.Y.Z` tag を push した時だけ Release → Pages へ進みます。

再公開は既存の公開済み tag を指定した workflow_dispatch で行います。PR / merge / tag / Release / 正式公開 / 設定変更は人間確認必須です。

必要な repository 設定は [運用セットアップ](docs/architecture/repository-setup.md) を参照してください。

## 復元

旧実装は `chore/backup-before-rebuild`（`7d98425`）に保持しています。別ディレクトリの worktree で参照できます。再構築側の作業を破棄する必要はありません。

## License

ソースコードは MIT。記事・説明文・図・回路図・画像等の無断転載・再配布は禁止します（法律上認められる引用を除く）。
