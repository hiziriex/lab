# ツールチェーンの公式互換性を最新 major より優先する

- Status: Accepted
- Decision date: 2026-10-10
- 人間承認: 再構築作業中に明示承認

## Context

構築時点の TypeScript 最新安定版 7.0.2 は、Astro の `astro check`
（@astrojs/check 0.9.10）と typescript-eslint 8.71.1 の対応範囲外だった。
実際に `astro check` は TypeScript 7 非対応を理由に停止した。

## Decision

「構築時点の最新 Stable」の互換性上の例外として、公式に互換性がある
最新 TypeScript 6.0.x を採用する。package.json は `~6.0.3`、実際の解決版は
pnpm-lock.yaml で固定する。通常依存へ Experimental な型検査を導入しない。
他の依存についても、個別の最新版よりツールチェーン全体の公式互換性を優先する。

## Consequences

Astro と typescript-eslint の両方が TypeScript 7.x を正式サポートした時点で
再検討する。更新時は peer dependency、`pnpm check`、build、Storybook、
ブラウザ検証を確認する。自動 major 更新・自動 merge は行わない。
