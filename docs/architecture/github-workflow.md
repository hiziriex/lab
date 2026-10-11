# GitHub Workflow / Repository Rules

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

Codex は作業 branch を自動作成してよい。

`main` 更新時は原則 rebase で追従。

Codex 自身が作成した未 merge branch に限り、必要なら `--force-with-lease` 可。
通常の `--force` は禁止。

## 5. Existing working tree

Codex が未コミット変更を発見した場合:

- discard しない
- stash しない
- overwrite しない
- 勝手に commit しない

人間へ確認する。

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
実際の Issue 作成は必ず人間確認後。

## 10. PR operation

Codex は PR title / body 案を作成してよい。
実際の PR 作成は必ず人間確認後。

CI pass 後でも Codex が勝手に merge しない。
PR merge は人間の明示承認がある場合のみ。

## 11. CODEOWNERS / Discussions / Projects

初期は使用しない。

- CODEOWNERS: なし
- GitHub Discussions: なし
- GitHub Projects: なし

必要になった時点で再検討する。

## 12. Release control

Codex が release が妥当と考えた場合、version candidate は提案してよい。
最終 version と release 実行は人間判断。

Tag / Release / Pages publish は確認必須。
