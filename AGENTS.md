# AGENTS.md

このファイルは Hiziriex Lab を開発する Codex / AI Agent 向けの開発ルール正本である。
承認ルールの正本は、正式有効化後の [Approval Policy](docs/automation/approval-policy.md) とする。

> この参照変更は正式有効化に向けた変更案であり、作業branch上では承認ルールを切り替えない。Approval Policy §6の人間レビュー・承認・mainへのmergeが完了するまでは、変更前の正式policy・main上の既存承認ルールを使用する。この文書の編集やStatus変更だけで自己権限を拡大しない。

## 1. 仕様の読み方

実装前に以下を確認すること。

1. `AGENTS.md`
2. `docs/requirements/`
3. `docs/architecture/`
4. `docs/ui/`
5. `docs/components/`
6. 対象機能の `docs/tools/<tool-name>/`
7. 関連する `docs/adr/`

仕様と実装が矛盾する場合は仕様を優先する。
仕様自体に矛盾・不足があり、外部仕様を変える設計判断が必要な場合は勝手に確定せず、人間へ確認する。

## 2. 基本方針

- サイト名: `Hiziriex Lab`
- GitHub repository: `hiziriex/lab`
- 開発環境: WSL
- 推奨作業ディレクトリ: `~/work/lab/`
- Node.js: 24 LTS
- package manager: pnpm
- Astro static site
- React Islands
- TypeScript `strict: true`
- Radix Themes
- CSS Modules
- CSS Custom Properties
- Lucide
- Apache ECharts
- KaTeX
- MDX
- Astro Content Collections
- Mermaid

## 3. 禁止事項

- Tailwind CSS を導入しない。
- サイト全体を React SPA にしない。
- 計算ロジックを UI コンポーネントへ埋め込まない。
- `main` へ直接 commit / push しない。
- `main` へ force push しない。
- 通常の `git push --force` を使用しない。
- Visual Regression の基準画像を人間確認なしに更新しない。
- 外部操作の承認条件は、正式有効化後の [Approval Policy §2–5・9](docs/automation/approval-policy.md) に従う。個別制限、ASK / DENY、安全境界、baseline承認を包括承認で上書きしない。
- 未コミット変更を勝手に破棄・stash・上書きしない。
- Beta / RC / Canary / Experimental 版を通常依存へ採用しない。
- Secret / token / API key を repository へ直書きしない。

## 4. タスク承認

正式有効化後の操作区分と包括承認は [Approval Policy §2–3](docs/automation/approval-policy.md) を正本とする。

- 実装依頼は原則として作業branch作成、実装、検証、commit、PR作成、PR CI確認までを包括する。
- mergeは対象を明示した人間承認が必要。実装依頼やCI成功だけではmergeしない。
- `vX.Y.Zを公開して` という明示承認は、そのversionのRelease Transactionを包括する。
- 「文書のみ」「commit禁止」「PR禁止」等の個別制限を常に優先する。

有効化前は冒頭の適用条件に従い、今回の作業にこの変更案を使用しない。

## 5. 人間判断・安全境界

人間確認を必要とする操作と禁止操作は [Approval Policy §4–7](docs/automation/approval-policy.md) を参照する。
ASK / DENYはALLOW / ALLOW_IF・包括承認より優先する。baseline追加・変更は人間確認必須。
安全境界変更は通常の実装・merge・release承認に含まれない。

待機・中断・再開、既存credentialの通常利用、tagの公開状態は、それぞれApproval Policy §2・3・9の定義に従う。task approvalはsandbox / tool permissionを解除しない。

## 6. Git

### ブランチ

使用する prefix:

- `feature/`
- `fix/`
- `docs/`
- `refactor/`
- `chore/`

`main` が進んだ場合、原則 merge ではなく rebase で追従する。

### Commit

Conventional Commits を使用する。

例:

- `feat: add voltage divider calculator`
- `fix: correct divider candidate ranking`
- `docs: update WSL setup guide`

### Pull Request

PR title も Conventional Commits 形式とする。
`main` への merge は Squash merge を基本とする。

正式有効化後は Approval Policy §3の条件を満たしてPRを作成し、以下をPR本文と結果報告に記載する。有効化前のPR作成は従来どおり人間確認後とする。

- 変更内容
- テスト結果
- `pnpm check` 結果
- build 結果
- 未解決事項
- docs / ADR / CHANGELOG 更新状況

## 7. ドキュメント

人間が読む本文は基本日本語で記述する。

英語を使うもの:

- code identifier
- filename
- URL slug
- technical identifier
- library / API の正式名称

コードコメント・JSDoc / TSDoc は基本日本語。
仕様変更を伴う実装では、同じ PR で関連 docs を更新する。

## 8. UI 実装

- Radix Themes を共通 UI に優先して使用する。
- 特殊 behavior が必要な場合のみ Radix Primitives を検討する。
- layout は通常 HTML + CSS Modules を基本とする。
- system font を使用する。
- OS の `prefers-color-scheme` に追従する。
- `prefers-reduced-motion` を尊重する。
- 色だけに意味を依存させない。
- WCAG 2.2 AA を目標とする。

## 9. 計算ロジック

- `src/lib/calculations/` に UI から分離して実装する。
- 純粋 TypeScript 関数を基本とする。
- SI 基本単位の `number` を受け取る。
- 計算関数はオブジェクト引数を使用する。
- 主計算関数は `calculateXxx` とする。
- 成功結果は名前付き object。
- 想定内エラーは throw せず discriminated union で返す。
- 想定外エラーのみ例外として扱う。
- UI 側では Error Boundary を用意する。

## 10. Testing

必要な変更には必要なテストを追加する。

- Vitest
- React Testing Library
- Playwright
- axe
- Visual Regression
- Lighthouse CI
- Storybook build

Visual Regression baseline の変更は必ず人間確認を取る。

Flaky test を retry 増加で隠さない。

- Playwright CI retry: 1 回
- その他: 原則 retry なし

## 11. Definition of Done

以下を満たすまで完了扱いにしない。

- 実装完了
- 必要な test 追加・更新
- `pnpm check` 成功
- build 成功
- PC / mobile 確認
- 必要な仕様書更新
- 必要な ADR 更新
- 必要な CHANGELOG 更新
- 未解決 error なし

## 12. TODO

`TODO:` コメントは一時利用可能。
長期課題は Issue 化を検討する。実際のIssue作成の承認は [Approval Policy §4](docs/automation/approval-policy.md) に従う。
