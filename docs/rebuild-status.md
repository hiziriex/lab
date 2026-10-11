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
| `pnpm test:visual` | 2件成功。人間承認済み Desktop Chromium / Pixel 7 の画像と比較 |
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
| CSS | 715685 | 87919 |

CSS gzip は再開時の172701 bytesから約49%削減。
PR の比較元 build は CI の compare-bundle で計測する。ローカルでは main との差分計測は未実施。

## 承認済みと PR / 公開前の確認

- Desktop / Pixel 7 の日本語フォント修正後 review 画像は人間承認済み。記録した hash と一致する2枚をそのまま snapshot へ登録し、画像比較は両方成功した。
- [依存監査の限定例外](security/dependency-audit.md) は承認済み。High 3件だけを2026-11-10の日本時間当日末まで許可し、新規 High / Critical、期限切れ、修正版公開、依存条件の変化は失敗させる。
- ローカル品質チェックは全て成功。GitHub 上の CI / Release workflow は未実行で、CI green は未確認。
- PR 作成前は、この再構築の変更範囲・docs / ADR / CHANGELOG・監査例外の残存リスクを人間が確認し、PR 作成への別途承認を得る。
- Windows / macOS の実ブラウザと実機端末は必要に応じて人間が最終確認する。Desktop / Pixel 7 の今回の画像は Linux の自動検証に基づく。
- GitHub の [repository settings](architecture/repository-setup.md)、正式 version、PR / merge / tag / Release / deploy は未実施で、各操作への承認が必要。
- package version は開発値の0.1.0、CHANGELOG は Unreleased のまま。X/Twitter URL は未確定で非表示。正式公開前に人間と確定する。

## 次回の再開手順

1. `git status`、`git log -3 --oneline` とこの記録、AGENTS.md、関連仕様書を確認する。
2. `source ~/.nvm/nvm.sh && nvm use` を実行する。
3. 登録済み baseline と本記録の hash を確認する。以後の新しい baseline 更新には改めて人間確認を取る。
4. 必要な検証を実行し、失敗が残っていないことを確認する。
5. 正式 version・CHANGELOG・GitHub settings は人間と確定する。PR を作成する場合は別途承認を得る。

## 今回の保存点

- `851824c` (`fix: enforce approved dependency audit exceptions`) に承認済み監査 gate を保存。
- `d0f9f2d` に mobile nav の配置修正、前回の Desktop baseline、仕様・検証記録を保存済み。
- 修正後 Pixel 7 review 画像の SHA-256: `c14c1fd08d2a2bdbf13e2ea25edfe38a54b0c1288f756d860cb05c4501a09029`。
- 承認済み Desktop baseline の SHA-256: `281eb2674dda61e86763cc8bc4f343f81644e7cf35951bc852c1e3464d607179`。
- 最新 Lighthouse の9件は reports/manifest.json から参照する。過去 report も残るため全 JSON の集計とは区別する。
- `pnpm check` / build / browser / audit / workflow lint は成功。Visual Regression も両方の承認済み画像で成功。
- PR / merge / tag / Release / deploy / repository settings の変更は行っていない。

## 日本語フォントの見直し

- `lang="ja"` は BaseLayout に既存指定されており、review 撮影でも検証済み。
- 以前の WSL は日本語 Noto 不在で WenQuanYi 等の CJK font が存在。日本語 family を明示した共通 stack に変更し、Radix の default font と input へ適用した。
- Noto OS package `1:20230817+repack1-3` の Regular / Bold をユーザー用 system font として導入。Web font の追加はなし。
- CI は browsers / metrics job で `fonts-noto-cjk` を導入し、Playwright / Lighthouse は fontconfig の事前検査を行う。
- Linux Chromium / Pixel 7 の heading / label は CDP で local `Noto Sans CJK JP` の描画を確認。review の font JSON に証跡を保存する。
- PC / mobile の Windows / macOS 実機確認は未実施。OS別の日本語 family fallback は CSS に明示する。
- `pnpm check`、site / Storybook build、E2E 45件、a11y 10件、Storybook 5件は成功。
- 新しい review SHA-256: Desktop `18130cd6d469df287f7877d6b30f9db1708d244ce6f69b33224a1e504d1a6685`、Pixel 7 `cee42646a07c7a3b808a89b8eb486d077f66783d7786d8eb3f656d7830e044de`。
- 前節の画像 hash は旧画像の記録。上記2枚は今回人間承認され、Desktop snapshot の更新と Pixel 7 snapshot の初回登録を行った。

日本語フォント変更後の Lighthouse 9回も全閾値を満たした。分圧ツール Performance 95–96、他3項目100。ホーム / About は全項目100。CI workflow は actionlint、font 確認 script は ShellCheck で指摘なし。GitHub 上の workflow 実行は未実施。

## baseline 登録の最終確認

承認済み2枚の hash を照合してコピーし、`pnpm test:visual` は2件成功。
review は device pixel、元の比較は CSS pixel だったため scale を device に明示して統一した。
比較テストの二重 page load で Pixel 7 の全体高さに2px差が出たため、review と同じ初回読み込み前の reduced-motion 設定へ統一した。
承認済み画像の変換・再生成、比較閾値の緩和、retry 増加は行っていない。
`scripts/audit-exceptions.json` の既知3件は最新監査でも修正版なし。`pnpm audit:check` は成功し、High 3 / Moderate 2 / Low 1 / Critical 0 の生データを表示した。
今回の変更は baseline と撮影条件・記録のみ。production build は `7a09561` で検証したものを使用している。
PR / merge / tag / Release / deploy / repository settings は未実施。


## mobile section navigation の overlay 修正（2026-10-11）

- mobile / tablet の section navigation を viewport 固定に変更。header 直下 8px、右端 16px に表示し、document flow の縦スペースをなくした。collapsed / expanded の切り替えで page title / 本文を押し下げない。
- 幅と最大高さを viewport に制限し、高さ不足時は menu 内を scroll 可能にした。native details / summary、anchor / hash、reduced motion を維持。Escape で閉じて summary へ focus を戻し、focus outline は mobile overlay 内に表示する。
- overlay の高さは anchor / focus 移動用の scroll-padding にのみ反映。Desktop の配置・sidebar collapse は維持した。
- E2E に 320 / 412 / 768px 幅で本文位置不変、viewport 内への収まり、scroll 追従、Enter / Tab / Escape / focus を追加。5 browser で E2E 50件成功。font / 回路画像を待ってから座標を比較する。
- accessibility は10件成功。既存の初期結果 fade 中に測定した contrast 失敗を確認し、test は animation.finished を待つようにした。production の色・animation、retry / 検証閾値は変更していない。Pixel 7 の expanded review でも axe violation は0。
- unit / component は59件成功。`pnpm check` 成功（型検査 error / warning / hint 0）、`pnpm build` 成功（4ページ）。
- Desktop Chromium の review は baseline と hash が一致。Pixel 7 は collapsed / expanded / 500px scroll 後の viewport 画像を確認した。Linux browser のエミュレーションであり、実機確認は未実施。
- `pnpm test:visual` は Desktop 成功、Pixel 7 は想定した差分で失敗。比較結果は baseline 1082×5114px → actual 1082×4964px、差分250128 pixels（約5%）。baseline は更新していない。
- review 画像: `review-artifacts/divider-chromium.png`、`review-artifacts/divider-android.png`（初期 full page）、`review-artifacts/divider-android-collapsed.png`、`review-artifacts/divider-android-expanded.png`、`review-artifacts/divider-android-scrolled.png`。
- Pixel 7 差分: `test-results/e2e/divider--visual-初期状態-android/divider-diff.png`。baseline の hash は前節の承認済み2枚から変更なし。
- UI仕様、Testing Strategy、CHANGELOG を更新。architecture の判断は変わらず、新規 ADR は不要。
- dependency / audit 例外・正式 version・X/Twitter・GitHub settings・Release / deploy設定は変更なし。PR / merge / tag / Release / deploy は未実施。baseline 更新は人間による画像確認と別途承認を待つ。


## overlay 修正後の Pixel 7 baseline 承認・登録（2026-10-11）

- 人間が Desktop / Pixel 7 の review 画像、Pixel 7 の collapsed / expanded / scroll 後の挙動、および `pnpm dev` での操作を確認し、Pixel 7 baseline 更新を承認した。
- 前回 Visual Regression が保存した安定した actual（1082×4964px）を Pixel 7 baseline に登録。初回 full page review（1082×4961px）との3 device pxの高さ差は全体撮影時の安定化によるもの。画像の加工、比較閾値の緩和、retry 増加は行っていない。
- Pixel 7 baseline SHA-256: `99e3183b21fe712b793efd122d1a793dd55ba301d7cd9f778f7d5bbc52b9dcee`。Desktop は変更せず `18130cd6d469df287f7877d6b30f9db1708d244ce6f69b33224a1e504d1a6685` を保持。
- `pnpm test:visual --config=/tmp/lab-visual-baseline.config.ts` は2件成功。起動中の dev server を既存の Playwright 設定が再利用した最初の比較は両方に差分が出たため、dev server を保持したまま専用の production preview（4322）へ一時設定で接続して検証した。repository の Playwright 設定は変更していない。
- `pnpm check` 成功。lint / CSS lint / formatting / 型検査（error・warning・hint 0）/ unit・component・metadata・audit gate の59件が成功。計算関数 coverage は lines 97.67%、branches 94.11%。`pnpm build` は4ページ成功。
- `pnpm audit:check` は sandbox 外で最新 registry 監査を取得して成功。High 3 / Moderate 2 / Low 1 / Critical 0。既知3件の patched_versions は null、承認済み version / 開発依存経路と一致し、例外期限は2026-11-10の日本時間当日末までのまま。
- 今回の変更は Pixel 7 baseline と本記録のみ。E2E 50件 / accessibility 10件は直前の overlay 修正で成功済み。Storybook build / browser 5件、workflow lint、Lighthouse 9回は前節までの検証結果を引き継ぎ、今回は再実行していない。
- UI仕様 / Testing Strategy / CHANGELOG は overlay 修正 commit で更新済み。新規 ADR は不要。実装の未解決 error と未承認 baseline 差分はなくなった。
- GitHub CI / Release workflow は未実行。Windows / macOS 実ブラウザ・実機端末は未確認。正式 version、X/Twitter URL、GitHub settings / 公開判断は引き続き別途確定する。
- PR / merge / tag / Release / deploy / GitHub settings 変更は行っていない。PR の作成には別途承認が必要。
