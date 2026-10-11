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
| unit / component / Release metadata | 49件成功 |
| 計算関数 coverage | lines 97.67%、branches 94.11% |
| `pnpm build` | 成功。静的4ページ |
| `pnpm test:e2e` | 40件成功。Chromium / Firefox / WebKit / iPhone / Pixel 7 |
| `pnpm test:a11y` | 10件成功。ツールの light / dark / error、ホーム / About / 404 |
| `pnpm build-storybook` | 成功 |
| `pnpm test:storybook` | 5件成功。normal / focus / error / disabled / current の操作と axe |
| actionlint 1.7.12 / ShellCheck | CI / Release workflow、shell script は指摘なし |
| `pnpm test:visual` | baseline 不在で2件失敗。自動作成・更新なし |
| `pnpm audit --audit-level high` | High 3件で失敗。例外は未承認・未設定 |

Storybook build には依存の `use client` directive / chunk size の警告と、sandbox 内で global settings を保存できないメッセージがある。
build 自体は成功し、5つの story の表示・操作・axe も成功した。

全 browser はエミュレーションを含む自動確認。Windows の実ブラウザや実機端末での人間確認は別途行う。
GitHub 上で CI / Release workflow はまだ実行していない。

## 計測

Lighthouse はホーム / 分圧ツール / About を各3回測定する。初期閾値は warning。
report は `.lighthouseci/reports/` に保存し、外部 upload は行わない。

最終 build の各3回は、ホーム / About が全項目100、分圧ツールが Performance 95、Accessibility / Best Practices / SEO 100。
全9回で初期閾値を満たした。測定値はローカル Chromium の mobile simulation であり、実利用環境の保証ではない。

bundle は build 出力全体の合計（source map / font / SVG は対象外）。

| 種類 | raw bytes | gzip bytes |
| --- | ---: | ---: |
| JS | 281216 | 90276 |
| CSS | 715346 | 87767 |

CSS gzip は再開時の172701 bytesから約49%削減。
PR の比較元 build は CI の compare-bundle で計測する。ローカルでは main との差分計測は未実施。

## 承認待ち

1. 初回の Visual Regression baseline 登録。
   `review-artifacts/divider-chromium.png` と `review-artifacts/divider-android.png` は承認用画像で、baseline ではない。
   フォルダは Git 管理対象外だが、通常の Playwright 実行では消去されない。
   再取得は `pnpm test:e2e --grep @review`。承認後にのみ snapshot を登録する。
2. [依存監査の限定例外案](security/dependency-audit.md)。High 3件だけを2026-11-10まで例外とする案。
   新規 High / Critical と期限切れは失敗させる。承認前に監査 gate を緩めない。
3. GitHub の [repository settings](architecture/repository-setup.md)、正式 version、PR / merge / tag / Release / deploy。
   いずれも未実施で、個別の人間承認が必要。

baseline と監査 gate が解決するまでは CI green / PR 準備完了 / Definition of Done 達成とは扱わない。
package version は開発値の0.1.0、CHANGELOG は Unreleased のまま。

## 次回の再開手順

1. `git status`、`git log -3 --oneline` とこの記録、AGENTS.md、関連仕様書を確認する。
2. `source ~/.nvm/nvm.sh && nvm use` を実行する。
3. 承認の有無を確認して baseline 登録と依存監査方針を進める。
4. 必要な検証を実行し、失敗が残っていないことを確認する。
5. 正式 version・CHANGELOG・GitHub settings は人間と確定する。PR を作成する場合は別途承認を得る。
