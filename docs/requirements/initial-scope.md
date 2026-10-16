# Initial Scope

## v0.x 初期構築の目的

最初から多数の tool を作らず、代表的な 1 tool を publishable quality まで完成させ、その過程で共通 architecture / UI / testing / release 運用を確立する。

代表 tool:

`分圧抵抗計算`

## 初回再構築で含める

- WSL 開発基盤
- Astro / React / TypeScript project
- common layout
- Sidebar / navigation の基盤
- Top
- About
- 404
- favicon / manifest
- SEO baseline
- EngineeringValueInput
- 分圧抵抗ツール初版
- docs / ADR / AGENTS
- Storybook
- test infrastructure
- CI
- release workflow
- Pages deploy
- setup / release scripts

## 初版分圧ツールで含めない

- graph
- 公差解析
- TCR
- ADC sensing mode
- comparator / EN / UVLO threshold mode
- URL input sharing
- localStorage
- result copy
- Web Worker

## 拡張方針

分圧ツールへ機能を段階追加し、「既存 tool へ仕様追加する流れ」自体を検証する。

その後、他 tool を追加する。

新規 tool は `docs/tools/<slug>/` の仕様書を追加してから実装する。

## 初回再構築後の拡張

分圧抵抗ツールへ無負荷・公称値のVin sweepグラフを追加する。現行の詳細は `docs/tools/voltage-divider/` を正本とし、上記の初回再構築scopeとは区別する。
