# Testing Strategy

## 1. Tool

- Vitest
- React Testing Library
- Playwright
- axe integration
- `@vitest/coverage-v8`
- Lighthouse CI
- Storybook
- Playwright screenshot comparison

## 2. Unit test

配置:

```text
tests/unit/
```

`src/` をある程度 mirror する。

例:

```text
src/lib/calculations/voltage-divider.ts
tests/unit/calculations/voltage-divider.test.ts
```

## 3. Fixture

```text
tests/fixtures/
```

共通 fixture:

- representative case
- boundary
- invalid input
- SI prefix
- tool specific cases

Vitest / Playwright で必要に応じて共有する。

## 4. E2E Browser

- Chromium
- Firefox
- WebKit
- representative iPhone
- representative Android

## 5. Visual Regression

baseline:

- Desktop Chromium
- Pixel 7 相当

baseline image は Git 管理。
baseline update は人間確認必須。

Linux の E2E / Storybook / Lighthouse は OS の `fonts-noto-cjk` を導入し、`scripts/check-japanese-fonts.sh` で `Noto Sans CJK JP` を確認する。
Playwright は global setup で確認し、不在ならテスト開始前に失敗する。CI の browsers / metrics job は browser dependencies 導入後に OS フォントを明示的に導入する。
review 撮影は `document.fonts.ready` を待ち、HTML の `lang="ja"` と heading / input の共通 stack を検証する。
Linux Chromium / Pixel 7 は CDP から heading / label の実描画フォントを取得し、日本語向け Noto が local font として使用されたことを確認する。
フォント検証結果は Playwright attachment と `review-artifacts/*-fonts.json` に保存し、CI の browser-results artifact に確認画像と共に含める。Pixel 7 は Linux 上のエミュレーションで、Android 実機のフォントではない。
review / 画像比較とも device pixel のスケールを明示し、reduced motion は初回ページ読み込み前に設定する。新しい画像は人間確認まで baseline に追加・更新しない。

## 6. Retry

- Playwright CI: 1 retry
- Vitest 等: retry なし

flaky test を retry 増加で隠さない。

## 7. Accessibility

axe 自動チェック。

主要 UI 変更時に以下を手動確認:

- keyboard operation
- focus order
- color only dependency
- contrast
- touch target
- mobile reflow

## 8. Coverage

coverage report を有効化。
初期段階では global threshold を厳格設定しない。
`src/lib/calculations/` は高い coverage を維持する。

`ResizeObserver` / `matchMedia` は jsdom の test setup で補完する。production code へテスト環境用の代替実装を入れない。

## 9. Storybook

共通 UI component を中心に story 化。

対象例:

- `EngineeringValueInput`
- Button
- error message
- result display
- Sidebar
- ParameterPanel
- section navigation

`pnpm build-storybook` 後に `pnpm test:storybook` で共通入力の normal / focus / error / disabled / current の表示・操作・axe を確認する。
site と Storybook の browser artifact は `test-results/e2e/` / `test-results/storybook/` へ分離する。

state 例:

- normal
- focus
- error
- disabled
- unit variants

## 10. Lighthouse

初期目安:

- Performance >= 90
- Accessibility >= 95
- Best Practices >= 95
- SEO >= 95

初期は warning。

`pnpm lighthouse` は Playwright Chromium を専用の一時 profile で起動し、LHCI をその検証ポートへ接続する。
WSL で Windows Chrome を探索せず、ブラウザの追加 download / ZIP 展開も行わない。3 URL を各 3 回測定し、結果は `.lighthouseci/reports/` に保存する。

## 11. Bundle

PR ごとに size と差分を report。
初期は CI failure threshold を設定しない。
