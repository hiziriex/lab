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

mobile section navigation は 320 / 412 / 768px 幅で、開閉前後の page title / 各 section の位置、viewport 内への収まり、scroll 追従、keyboard 開閉、Escape の focus 復帰を E2E で確認する。font / 回路画像の読み込み完了後に比較し、browser の座標丸め差は 0.01px 単位で扱う。
Desktop section navigation は sidebar 表示・非表示、overlay の有無、scroll 後、短い viewport、keyboard focus で fixed と本文座標の不変を E2E で確認する。
短い viewport への resize 後は、`setViewportSize` の完了だけでは `dvh` の再計算完了を保証しないため、navigation の computed `max-height` が現在の viewport / header 高さに対応する値になるまで待つ。header との非重複・viewport 内への収まりの閾値は維持し、180 / 160 / 180px の高さ変更、内部 scroll、keyboard による末尾 link への到達、overlay 座標の不変を確認して screenshot を添付する。

Pixel 7 の review は初期 full page に加え、collapsed / expanded / scrolled の viewport 画像を保存し、expanded 状態でも axe を確認する。

人間確認用の画像・Visual比較結果・最終review report・検証結果の要約は、原則として`review-artifacts/`以下の1つのZIPへまとめる。不要な重複画像や巨大な一時ログは含めず、ZIPとreview成果物はcommitしない。

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
WSL で Windows Chrome を探索せず、ブラウザの追加 download / ZIP 展開も行わない。ホーム / 分圧抵抗計算 / About / E系列標準値一覧の4 URLを各3回測定し、結果は `.lighthouseci/reports/` に保存する。

## 11. Bundle

PR ごとに size と差分を report。
初期は CI failure threshold を設定しない。
