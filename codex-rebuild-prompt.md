# Codex 実行指示: Hiziriex Lab 初期再構築

`hiziriex/lab` を WSL 上で再構築してください。

## 作業場所

推奨 repository path:

```text
~/work/lab/
```

WSL の Linux filesystem 上で作業し、`/mnt/c/...` を repository の配置先として使用しないでください。

## まず読むもの

以下を読み、今回の作業の正本として扱ってください。

1. `AGENTS.md`
2. `docs/requirements/`
3. `docs/architecture/`
4. `docs/ui/`
5. `docs/components/`
6. `docs/tools/voltage-divider/`
7. `docs/adr/`

README-SPEC.md が存在する場合は、仕様書セットの位置づけ確認用として読んでください。

## 今回の目的

既存実装との互換性は不要です。
現在の Git 履歴は保持しつつ、旧実装を安全に退避したうえで、仕様書に従って開発環境から再構築してください。
今回の対象は、基盤構築および分圧抵抗ツール初版までです。

## 作業開始時

最初に以下を確認してください。

- 現在の directory / repository
- Git status
- 未コミット変更
- current branch
- remote
- `gh` 利用可否 / 認証状態
- nvm
- Node.js
- pnpm
- build-essential

未コミット変更が存在する場合は、AGENTS.md の規則に従い、勝手に処理せず人間へ確認してください。

旧実装は復元可能な形で退避してください。
退避方法は branch を基本とし、必要なら適切な名称を提案してください。
その後、再構築用の `chore/...` 作業ブランチを作成して作業してください。
`main`へ直接変更しないでください。

## 実装対象

仕様に従って最低限以下を完成させてください。

1. Astro / React / TypeScript 開発基盤
2. Radix Themes / CSS Modules / common theme
3. ESLint / Prettier / Stylelint
4. Vitest / React Testing Library
5. Playwright / axe / Visual Regression
6. Storybook
7. Lighthouse CI / bundle size report
8. Husky / lint-staged / commitlint
9. GitHub Actions CI
10. release workflow
11. GitHub Pages deploy configuration
12. Dependabot
13. `.nvmrc`
14. `.env.example`
15. `scripts/setup-dev.sh`
16. `scripts/release-check.sh`
17. README
18. AGENTS.md と docs の整合
19. Top page
20. About page
21. 404 page
22. shared layout / navigation / breadcrumb
23. `EngineeringValueInput`
24. 分圧抵抗ツール初版
25. 必要な tests / stories
26. favicon / manifest / robots / sitemap / canonical / basic OGP
27. MIT License / content license note
28. CHANGELOG.md with `Unreleased`

## 分圧抵抗ツール

詳細は必ず以下を正本として実装してください。

```text
docs/tools/voltage-divider/
```

初版に入れない機能を勝手に追加しないでください。

特に以下は後続機能です。

- 公差解析
- TCR
- graph
- ADC sensing mode
- threshold mode
- URL parameter share
- localStorage
- result copy
- Web Worker

## GitHub 設定

branch protection、Pages source、merge settings、auto-delete branch 等、repository settings の変更が必要な場合は、AGENTS.md の通り実行前に人間へ内容を報告して確認してください。

## 判断ルール

実装詳細で内部設計上の小さな判断が必要な場合は、仕様の範囲内で合理的に決めて構いません。

ただし以下の場合は止めて人間へ確認してください。

- 外部仕様が変わる
- 仕様同士が矛盾する
- 既存の未コミット変更を触る必要がある
- Visual Regression baseline を更新する
- Issue / PR / merge / tag / Release / deployを実行する
- repository settingsを変更する
- ユーザーが決めたUI/計算仕様を変更する必要がある

## 完了条件

AGENTS.md の Definition of Done を満たしてください。
最低限、可能な範囲で以下を実行してください。

```text
pnpm check
pnpm build
```

その他、実装したCI相当の確認も行ってください。

## 最終報告

日本語で以下を報告してください。

- 実施内容
- 主要な作成/変更 file
- 開発環境 version
- test 結果
- `pnpm check` 結果
- build 結果
- Lighthouse / bundle report の概要
- 未解決事項
- 仕様上の判断点
- 人間側で必要な GitHub 設定
- 次に推奨する作業

PR は勝手に作成しないでください。
PR 作成可能な状態まで準備できたら、人間へ確認してください。
