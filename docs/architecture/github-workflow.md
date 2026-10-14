# GitHub Workflow / Repository Rules

承認ルールの正本は正式有効化後の [Approval Policy](../automation/approval-policy.md) とする。
この参照変更は有効化準備の変更案であり、作業branch上では適用しない。Approval Policy §6の人間レビュー・承認・mainへのmerge完了までは変更前の正式policy・main上の既存承認ルールを使用する。

## 1. Repository

- repository: `hiziriex/lab`
- Public repository
- source code license: MIT

既存 repository を継続利用し、別 repository へ作り直さない。
旧実装は Git 履歴を残したまま安全に退避してから再構築する。

## 2. Main protection

`main`:

- direct push 禁止
- PR 必須
- required CI pass
- force push 禁止
- review approval 1 件必須にはしない

個人開発のため、自己承認不能な review rule は導入しない。

## 3. Merge

- Squash merge を基本
- PR title を squash commit message として利用
- PR title は Conventional Commits
- merge 後 source branch auto-delete ON

## 4. Branch

prefix:

- `feature/`
- `fix/`
- `docs/`
- `refactor/`
- `chore/`

作業branch作成・切替の承認条件は [Approval Policy §3](../automation/approval-policy.md) を参照する。

`main` 更新時は原則 rebase で追従。

force-with-leaseとbranch削除の承認条件は [Approval Policy §3](../automation/approval-policy.md) を参照する。通常の `--force` は禁止。

## 5. Existing working tree

人間または別作業による既存の未コミット変更の保護は [Approval Policy §3–4](../automation/approval-policy.md) に従う。勝手なdiscard / stash / overwrite / commitを行わない。

## 6. PR template

最初から PR template を用意する。

確認項目:

- 変更内容
- 変更理由
- test 結果
- UI 変更の有無
- spec / ADR 更新の有無
- CHANGELOG 更新の要否

## 7. Issue templates

初期 template:

- Bug
- Feature
- Improvement / Refactor

## 8. Labels

初期 label:

- `bug`
- `feature`
- `improvement`
- `documentation`
- `ui`
- `tool`
- `infra`

増やしすぎず必要に応じて追加する。

## 9. Issue operation

Codex は Issue 案を提案してよい。
実際のIssue作成は [Approval Policy §4](../automation/approval-policy.md) のASKに従う。

## 10. PR operation

Codex は PR title / body 案を作成してよい。
正式有効化後は、実装依頼が原則PR作成・PR CI確認までを包括し、[Approval Policy §3](../automation/approval-policy.md) の条件を満たせばPRを作成する。
mergeは対象を明示した人間承認が必要。CI成功だけではmergeしない。承認範囲と停止条件はApproval Policy §2–5に従う。

## 11. CODEOWNERS / Discussions / Projects

初期は使用しない。

- CODEOWNERS: なし
- GitHub Discussions: なし
- GitHub Projects: なし

必要になった時点で再検討する。

## 12. Release control

Codex が release が妥当と考えた場合、version candidate は提案してよい。
最終versionとrelease実行は人間判断。`vX.Y.Zを公開して` という明示承認で当該versionのRelease Transactionを実行する。工程・停止条件・再試行・tag公開状態は [Approval Policy §9](../automation/approval-policy.md) を正本とする。
