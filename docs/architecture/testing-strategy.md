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

## 11. Bundle

PR ごとに size と差分を report。
初期は CI failure threshold を設定しない。
