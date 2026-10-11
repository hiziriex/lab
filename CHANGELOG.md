# Changelog

変更履歴は Keep a Changelog 形式と SemVer に従います。

## [Unreleased]

### Added

- WSL / Node.js 24 / pnpm による開発基盤と品質チェック。
- Astro 静的ページ、React Islands、共通入力と分圧抵抗計算。
- E12 / E24 の比率探索、候補比較、レスポンシブ表示。
- 単体・コンポーネント・E2E・アクセシビリティ・画像比較の検証基盤。
- 人間承認済みの Desktop Chromium / Pixel 7 の初回画像比較 baseline。
- CI、Storybook、Lighthouse、bundle 計測、明示的な tag による公開フロー。

### Removed

- 旧実装のページ・デザイン試作。旧 HEAD は chore/backup-before-rebuild に保持。

### Fixed

- 日本語向け system font stack をページ・Radix 入力で共通化し、Linux browser / CI で Noto の存在と実描画フォントを検証。

- mobile のページ内ナビゲーションをヘッダー直下へ移し、分圧電流の単位入力との重なりを解消。
- 承認済み High 3件に限定した期限付き監査 gate と、その期限・依存条件・修正版の検証。

- TypeScript 6.0.x の互換構成と、test environment の ResizeObserver 補完。
- WSL で導入済み Chromium を使用する Lighthouse runner。
- 404 の canonical / OGP URL と Release の CHANGELOG section 検証。
- commit hook の自動 stash を無効化し、検証結果の保存先を分離。
- Radix / KaTeX の CSS 二重読み込みと Island の不要な画面高さの余白を解消。
