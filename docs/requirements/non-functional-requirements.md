# 非機能要件

## 1. 対応 Browser

主要 browser の current + previous generation を対象とする。

- Chrome
- Edge
- Firefox
- Safari
- iOS Safari
- Android Chrome

IE / legacy browser は対象外。

## 2. Accessibility

目標: WCAG 2.2 AA。

- keyboard 操作可能
- focus 順が自然
- 色だけに意味を依存しない
- sufficient contrast
- touch target を確保
- axe 自動チェック
- 主要 UI 変更時に簡易手動チェック

## 3. Responsive

breakpoint:

- Mobile: `<768px`
- Tablet: `768–1023px`
- Desktop: `>=1024px`

代表確認:

- Mobile: Pixel 7 相当
- Tablet: 768px
- Desktop: 1440px

## 4. Performance

Lighthouse CI 初期目安:

- Performance: 90 以上
- Accessibility: 95 以上
- Best Practices: 95 以上
- SEO: 95 以上

初期段階では threshold 未達を warning とし、CI failure にはしない。

Bundle size は PR ごとに計測・差分表示するが、初期版では固定上限で CI failure にしない。

## 5. Security

- CSP を設定する。
- Secret は repository へ保存しない。
- GitHub Actions は最小権限。
- 外部 GitHub Actions は可能な限り commit SHA 固定。
- Dependabot で dependency update を提案する。
- `pnpm audit` を CI で実行する。
- High / Critical を優先し、低 severity の noise で全体を止めすぎない。

## 6. CSP

GitHub Pages のため初期は meta CSP。

開始案:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
```

実際の Astro / React / Radix / ECharts build で動作確認し、壊れたまま厳格化しない。
将来 header 設定可能な hosting へ移行した場合は header CSP を検討する。

## 7. Logging / Analytics

初期版:

- Analytics なし
- Sentry 等の error monitoring なし

必要になった場合に再検討する。

## 8. Local persistence

初期版では計算入力値を `localStorage` 等へ保存しない。
URL query による入力条件共有も初期版では実装しない。
