# 再構築の作業記録

確認日: 2026-10-11。作業ディレクトリ: `/home/hiziriex/work/lab`。
作業ブランチ: `chore/rebuild-lab`。

## 引き継ぎと保存

前回の未コミット変更を引き継ぎ、仕様書と実装を確認した。
型検査・40件の unit/component test・build・20件の E2E を確認した時点で、
`108ad9a` (`feat: rebuild lab foundation and voltage divider`) に途中成果を保存した。
旧実装は `chore/backup-before-rebuild` の `7d98425` に保持する。

最初の commit では lint-staged が一時バックアップ用 stash を自動作成した。
hook は正常終了してバックアップを削除済みで、途中成果は全て commit に保持されている。
以後の hook は `--no-stash` を使用し、自動 stash を作成しない。

## 環境

| 項目 | version |
| --- | --- |
| nvm | 0.40.8 |
| Node.js | 24.21.0 |
| pnpm | 12.10.1 |
| TypeScript | 6.0.3 |
| GitHub CLI | 2.45.0 |
| build-essential | 12.10ubuntu1 |

TypeScript 6.0.x の採用は承認済み。7.x は Astro / astro check / typescript-eslint の正式対応まで採用しない。
GitHub CLI は sandbox 外の read-only 確認で hiziriex の認証成功を確認した。remote は `https://github.com/hiziriex/lab.git`。

## 実施した補完

- test setup の ResizeObserver 補完が有効であることを確認。production code に代替実装は追加しない。
- 静的ページ、404 の canonical / OGP、公開 asset、tablet drawer、keyboard focus 復帰、候補表の sticky column を検証。
- Release metadata の厳密な version section 検証と、不一致 tag / prerelease / 空 section の拒否テスト。
- WSL で Playwright Chromium を使う Lighthouse runner、`.env.example`、Storybook の browser 検証。
- CI に Storybook browser 検証を追加し、site / Storybook の artifact 保存先を分離。
- release-check に Storybook browser / audit / Lighthouse / bundle と検証後の clean tree 確認を追加。
- Radix / KaTeX の CSS 二重読み込みを除去し、Theme の既定 min-height による不要な余白を修正。
- README / Testing Strategy / ADR 0007 / docs index / CHANGELOG を実装と同期。

## 検証結果

| 検証 | 結果 |
| --- | --- |
| `pnpm check` | 成功。型検査の error / warning / hint は 0 |
| unit / component / Release metadata | 59件成功（監査 gate の10件を追加） |
| 計算関数 coverage | lines 97.67%、branches 94.11% |
| `pnpm build` | 成功。静的4ページ |
| `pnpm test:e2e` | 45件成功。nav 開閉時の入力操作を追加。Chromium / Firefox / WebKit / iPhone / Pixel 7 |
| `pnpm test:a11y` | 10件成功。ツールの light / dark / error、ホーム / About / 404 |
| `pnpm build-storybook` | 成功 |
| `pnpm test:storybook` | 5件成功。normal / focus / error / disabled / current の操作と axe |
| actionlint 1.7.12 / ShellCheck | CI / Release workflow、shell script は指摘なし |
| `pnpm test:visual` | Desktop Chromium は承認済み baseline で成功。Pixel 7 は未登録のため1件失敗 |
| `pnpm audit:check` | 承認済み High 3件のみを期限付き例外として成功。生の audit は3件検出 |

Storybook build には依存の `use client` directive / chunk size の警告と、sandbox 内で global settings を保存できないメッセージがある。
build 自体は成功し、5つの story の表示・操作・axe も成功した。

全 browser はエミュレーションを含む自動確認。Windows の実ブラウザや実機端末での人間確認は別途行う。
GitHub 上で CI / Release workflow はまだ実行していない。

## 計測

Lighthouse はホーム / 分圧ツール / About を各3回測定する。初期閾値は warning。
report は `.lighthouseci/reports/` に保存し、外部 upload は行わない。

最終 build の各3回は、ホーム / About が全項目100、分圧ツールが Performance 95–96、Accessibility / Best Practices / SEO 100。
全9回で初期閾値を満たした。測定値はローカル Chromium の mobile simulation であり、実利用環境の保証ではない。

bundle は build 出力全体の合計（source map / font / SVG は対象外）。

| 種類 | raw bytes | gzip bytes |
| --- | ---: | ---: |
| JS | 281446 | 90367 |
| CSS | 715501 | 87823 |

CSS gzip は再開時の172701 bytesから約49%削減。
PR の比較元 build は CI の compare-bundle で計測する。ローカルでは main との差分計測は未実施。

## 承認待ち

1. Pixel 7 の修正後画像 `review-artifacts/divider-android.png` の人間確認と初回 baseline 登録。
   旧画像は入力を遮るため不承認。ヘッダー直下の専用領域へ nav を移し、開閉時の入力操作を5 browserで検証済み。
   Desktop Chromium は今回承認された旧 review 画像をそのまま snapshot にコピーし、画像比較成功。
   mobile snapshot は未作成。review フォルダは Git 管理対象外で、再取得は `pnpm test:e2e --grep @review`。
2. [依存監査の限定例外](security/dependency-audit.md) は承認済みで gate を実装。
   記録済み High 3件だけを2026-11-10の日本時間当日末まで許可し、新規 High / Critical、期限切れ、修正版公開、依存条件の変化は失敗させる。
3. GitHub の [repository settings](architecture/repository-setup.md)、正式 version、PR / merge / tag / Release / deploy。
   いずれも未実施で、個別の人間承認が必要。

mobile baseline が承認・登録されるまでは CI green / PR 準備完了 / Definition of Done 達成とは扱わない。
package version は開発値の0.1.0、CHANGELOG は Unreleased のまま。

## 次回の再開手順

1. `git status`、`git log -3 --oneline` とこの記録、AGENTS.md、関連仕様書を確認する。
2. `source ~/.nvm/nvm.sh && nvm use` を実行する。
3. Pixel 7 の修正後画像への承認の有無を確認し、承認後にだけ mobile baseline を登録する。
4. 必要な検証を実行し、失敗が残っていないことを確認する。
5. 正式 version・CHANGELOG・GitHub settings は人間と確定する。PR を作成する場合は別途承認を得る。

## 今回の保存点

- `851824c` (`fix: enforce approved dependency audit exceptions`) に承認済み監査 gate を保存。
- mobile nav の配置修正、Desktop baseline、仕様・検証記録を次の commit に保存する。
- 修正後 Pixel 7 review 画像の SHA-256: `c14c1fd08d2a2bdbf13e2ea25edfe38a54b0c1288f756d860cb05c4501a09029`。
- 承認済み Desktop baseline の SHA-256: `281eb2674dda61e86763cc8bc4f343f81644e7cf35951bc852c1e3464d607179`。
- 最新 Lighthouse の9件は reports/manifest.json から参照する。過去 report も残るため全 JSON の集計とは区別する。
- `pnpm check` / build / browser / audit / workflow lint は成功。Visual Regression だけは mobile の人間確認待ち。
- PR / merge / tag / Release / deploy / repository settings の変更は行っていない。
