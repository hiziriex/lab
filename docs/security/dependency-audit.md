# 依存監査の確認記録

確認日: 2026-10-11。Status: 記録済み High 3件の期限付き例外は人間承認済み。

再開時の `pnpm audit --audit-level high` は終了コード 1。High 3 / Moderate 2 / Low 1。
High は以下の3件で、registry の監査結果に修正版は記載されていない。CI の High / Critical gate は維持する。

## 修正済み

- tmp: 0.2.7 に override。0.2.6 の型混同による迂回も修正する。
- basic-ftp: 6.2.1 に override。
- Lighthouse は導入済み Chromium を使う runner で3ページ各3回の計測が成功した。上流が修正版を解決するようになれば override を除去する。

## 修正版のない High と承認済み限定例外

| Advisory | 依存経路 | 発火条件と今回の扱い |
| --- | --- | --- |
| [GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv) | LHCI → Lighthouse → Puppeteer → extract-zip | 悪意ある ZIP 内の symlink。LHCI にブラウザの download / ZIP 展開をさせず、Playwright が導入した Chromium を CHROME_PATH で明示する。 |
| [GHSA-7pqw-9j4j-h8q3](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3) | 同上 | 同上。ユーザーが指定する ZIP の取り込み機能はない。 |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Stylelint 等 → micromatch → braces | 外部由来の深くネストした glob の解析。glob は repository 内の短い固定パターンとし、サイト入力を渡さない。 |

いずれも公開サイトの JavaScript bundle に含めない開発依存で、上表のリスク評価はこの repository の構成に基づく。
ライブラリ自体の脆弱性が解消したという意味ではない。

承認範囲: 上記3件だけを期限付きの監査例外とし、新規 High / Critical は引き続き CI failure にする。
例外の有効期限は 2026-11-10（日本時間の当日末まで）。毎週の Dependabot 確認時と公開前に、修正版・依存経路・到達可能性を再評価する。
期限切れは CI で失敗させ、更新の承認を取り直す。Issue は自動作成しない。

## その他

Low / Moderate の検出も監査出力へ残す。現在は uuid / sprintf-js / Mermaid 内 KaTeX が該当する。
KaTeX の公開数式には直接依存の修正版 0.19.0 を使い、Mermaid は初版サイトで読み込まない。

## Gate の実装

CI と release-check は `pnpm audit:check` を実行する。生の `pnpm audit --audit-level high` は依然として3件で失敗する。
`scripts/audit-exceptions.json` は承認時点の Advisory ID、module、version、依存経路を記録する。
許可は High かつ既知の開発依存経路だけに限定し、Critical、未知の High、依存条件の変化、期限切れは失敗する。
監査取得失敗・形式不正・件数不一致も失敗する。Low / Moderate の監査出力を残す。
registry に修正版が記載された場合も失敗させ、修正版へ移行して該当例外を解除する。
例外が残っていれば、監査結果が改善しても期限切れを許容しない。その他の security gate は変更しない。

## baseline 登録後の再確認

2026-10-11 に `pnpm audit:check` を再実行し終了コード0。High 3 / Moderate 2 / Low 1 / Critical 0。High は既知3件と同じ ID・version・依存経路で、監査結果の patched_versions は null。例外の範囲・期限・再評価条件は変更していない。
