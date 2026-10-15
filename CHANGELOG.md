# Changelog

変更履歴は Keep a Changelog 形式と SemVer に従います。

## [Unreleased]

## [0.1.1] - 2026-10-15

### Fixed

- 短い viewport の section navigation E2E で `dvh` 再計算前の座標を取得する競合を解消。header 非重複の閾値を維持し、連続 resize・内部 scroll・keyboard 操作の検証を追加。
- 人間確認済みの Desktop Chromium / Pixel 7 の画像比較 baseline を UI 修正に合わせて更新。
- Desktop section navigation を sidebar 開閉後も同じ viewport 固定位置にし、横移動と本文上部の余白を解消。
- 分圧誤差の scale に応じて IEEE-754 noise を表示・順位評価で zero と判定し、実在する微小誤差には目標電圧に応じた表示分解能を適用。
- 候補表の順位・色列を削除し、共通 series color を比較 checkbox と淡い行背景へ反映。先頭headerは読み上げ情報だけ残し、32pxの操作領域を確保して列幅を縮小。
- 抵抗列・Mobile sticky 列、header 中央揃え、共通 control 高さを調整。
- 分圧電流指定を checkbox と option名、その直下の値入力という2行に整理し、共通 wrapper と明示的な accessible name を用意。

## [0.1.0] - 2026-10-11

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

- Release job の Node.js setup で不要な package manager cache を無効化し、pnpm 未導入による公開処理の失敗を解消。
- fresh checkout の lint 前に Astro の型を生成し、GitHub CI での型解決エラーを解消。
- mobile section navigation を viewport 固定の overlay に変更し、開閉による本文の上下移動を解消。
- 日本語向け system font stack をページ・Radix 入力で共通化し、Linux browser / CI で Noto の存在と実描画フォントを検証。
- 承認済み High 3件に限定した期限付き監査 gate と、その期限・依存条件・修正版の検証。
- TypeScript 6.0.x の互換構成と、test environment の ResizeObserver 補完。
- WSL で導入済み Chromium を使用する Lighthouse runner。
- 404 の canonical / OGP URL と Release の CHANGELOG section 検証。
- commit hook の自動 stash を無効化し、検証結果の保存先を分離。
- Radix / KaTeX の CSS 二重読み込みと Island の不要な画面高さの余白を解消。
