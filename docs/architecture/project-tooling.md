# Project Tooling / Quality

## 1. Package / Runtime

- Node.js 24 LTS
- pnpm
- `.nvmrc` で Node 24 を指定
- `package.json#packageManager` で pnpm の具体的 version を固定
- `package.json#engines` で対応 Node range を明示
- `pnpm-lock.yaml` を commit
- dependency は公式互換性のある最新 Stable を使用。単独の最新版よりツールチェーン全体の公式互換性を優先する。
- TypeScript は互換性上の例外として最新 6.0.x を採用する。Astro と typescript-eslint が 7.x を正式サポートした時点で再検討する（[ADR 0007](../adr/0007-prioritize-toolchain-compatibility.md)）。
- Beta / RC / Canary / Experimental は使用しない

## 2. TypeScript

- `strict: true`
- modern browser target
- IE / legacy polyfill を前提にしない
- path alias: `@/` → `src/`

## 3. ESLint

- type-aware configuration
- strict 寄り
- React / Astro / TypeScript に必要な rule を適切に設定
- 不要に stylistic rule を重複させず、format は Prettier を正とする

## 4. Prettier

以下を基本設定とする。

```text
semi: true
singleQuote: true
trailingComma: all
printWidth: 100
tabWidth: 2
endOfLine: lf
```

## 5. Stylelint

- `stylelint-config-standard` を base
- CSS Modules 対応
- invalid property / duplicate declaration は error
- class naming rule を初期から過剰に制限しない

## 6. EditorConfig

`.editorconfig` を用意する。

最低限:

- UTF-8
- LF
- final newline
- 2 spaces

## 7. Husky / lint-staged / commitlint

導入する。

- staged file へ必要な lint / format
- Conventional Commits の commit message validation
- local hook で重すぎる full E2E は実行しない

## 8. Storybook

初期から導入。

対象は共通 component 中心。

`pnpm build-storybook` が CI で成功すること。

## 9. MDX / Content Collections / Mermaid

初期から利用可能な状態にする。

- MDX: 技術記事・説明ページ
- Astro Content Collections: typed metadata
- Mermaid: architecture / flow / sequence 等

## 10. KaTeX / ECharts / Lucide

- KaTeX: 数式
- Apache ECharts: graph
- Lucide: icon

ECharts は初版分圧ツールでは graph を表示しないが、基盤として採用する。

## 11. Circuit asset

- draw.io: source
- SVG: published asset
- SVGO: published SVG の最適化
- source `.drawio` は変更しない

## 12. Production build

- production source map を有効化
- Astro image optimization を利用できる構成にする
- static output

## 13. Standard pnpm scripts

最低限以下を用意する。

```text
pnpm dev
pnpm build
pnpm preview

pnpm lint
pnpm lint:css
pnpm format
pnpm format:check
pnpm typecheck

pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm test:visual
pnpm test:a11y

pnpm storybook
pnpm build-storybook

pnpm check
```

`pnpm check` はローカル CI 相当の主要 check をまとめて実行する。

## 14. Audit

`pnpm audit` を CI に組み込む。

High / Critical を優先する。
Low severity の noise で開発全体を不必要に停止させない。
