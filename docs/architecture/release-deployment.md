# Release / Deployment

承認ルールの正本は正式有効化後の [Approval Policy](../automation/approval-policy.md) とする。
この参照変更は有効化準備の変更案であり、作業branch上では適用しない。Approval Policy §6の人間レビュー・承認・mainへのmerge完了までは変更前の正式policy・main上の既存承認ルールを使用する。

## 1. Branch strategy

- `main` は常に release 可能
- direct push 禁止
- PR 必須
- required CI pass
- force push 禁止
- approval 1 件必須にはしない

Merge: Squash merge。
Merge 後 branch 自動削除。

## 2. Branch prefix

- `feature/`
- `fix/`
- `docs/`
- `refactor/`
- `chore/`

作業branch操作の承認条件は [Approval Policy §3](../automation/approval-policy.md) に従う。

## 3. Conventional Commits

commit / PR title ともに Conventional Commits。

## 4. Release policy

SemVer。

- 初期: `0.x.y`
- stable: `1.0.0`

同期対象:

- `package.json` version
- Git tag
- GitHub Release

version候補はCodexが提案してよいが、最終決定は人間。明示されたversionの公開承認とRelease Transactionは [Approval Policy §2・9](../automation/approval-policy.md) に従う。

## 5. Tag

format:

```text
v0.1.0
```

tag作成・pushの承認とtagの公開状態は [Approval Policy §3–5・9](../automation/approval-policy.md) を正本とする。承認されたRelease Transactionにはtag作成・pushと後続のRelease作成・deployを含む。

Pre-release (`-rc`) は当面使用しない。

## 6. CHANGELOG

Keep a Changelog 風 + SemVer。

先頭に:

```md
## [Unreleased]
```

section 例:

- Added
- Changed
- Fixed
- Removed

Release 時に Unreleased を version section へ移す。
GitHub Release 本文は CHANGELOG 該当 version を使用する。
Release 添付 artifact は初期版では不要。

## 7. Release check

`scripts/release-check.sh`

最低限:

- `pnpm check`
- `pnpm build`
- working tree clean
- CHANGELOG
- package version

release check自体は通常の検証として実行できる。公開操作の承認・停止・再開条件はApproval Policy §9に従う。

## 8. Pages deploy

`main` merge だけでは公開しない。

Flow:

```text
feature branch
→ PR
→ main
→ vX.Y.Z tag
→ release checks
→ GitHub Release
→ GitHub Pages
```

`v*.*.*` tag push で release workflow。
tag commit が `main` に含まれていることを確認する。
含まれていなければ deploy しない。

Actions でも release check 相当を再実行する。

全 check pass 後:

1. GitHub Release 作成
2. GitHub Pages deploy

`workflow_dispatch` による手動 redeploy も可能にする。

## 9. Failed release

失敗時の承認判断は [Approval Policy §9](../automation/approval-policy.md) のtag公開状態・停止条件・安全な再試行に従う。

- Local-only tag: remoteへ未push。公開前の同一transaction内で安全に削除・再作成可能。
- Remote-pushed / not formally published: remoteへpush済みで、Release未公開かつproduction Pages deploy未成功。削除・移動・再作成はASK。
- Formally published tag: GitHub Release公開またはproduction deploy成功のいずれかで正式公開済み。削除・移動・別commitへの再利用はDENY。

tag、Releaseの公開 / draft状態、deploy対象・結果、smoke testを報告する。Release作成がdeployより先のため、失敗時の原子的rollbackは保証しない。
正式公開後に内容を修正する場合はpatch versionを上げる。同じtag・commitでの失敗工程の安全な再試行とは区別する。
workflow_dispatchは正式公開済みReleaseの再deploy用であり、新規公開を迂回しない。

## 10. GitHub Actions

Runner:

```text
ubuntu-latest
```

権限は最小限。
通常 CI は原則 `contents: read`。
Release / Pages など必要な workflow のみ write permission。

外部 Action は可能な限り commit SHA 固定。
Dependabot で更新する。

Cache:

- pnpm store
- Playwright browser 等

`node_modules` 丸ごと cache は避ける。

同一 PR / branch の古い CI は新 push で cancel。

Job 分割:

- lint / format / typecheck
- unit / component
- e2e / visual / a11y
- build / Storybook
- Lighthouse / bundle

PR / main push / release tag の 3 段階で CI。

Timeout 目安:

- light job: 10 min
- E2E: 20 min

failure artifact は原則 14 日保存。

## 11. Dependabot

週 1。

- patch / minor: 適度に group
- major: 個別 PR
- auto merge 禁止

## 12. Approval Policyとの関係

外部操作の包括承認、ASK / DENY、安全境界、baseline確認は [Approval Policy §2–6・9](../automation/approval-policy.md) を正本とする。
実装依頼は原則PR作成・CI確認までを包括し、mergeには対象を明示した人間承認が必要。
release包括承認でもsecurity例外・権限変更・未承認baseline変更・DENY操作は許可されない。
SemVer、metadata、main ancestry、CI、artifact、workflow permissions等の技術ルールはこの文書・workflow・関連scriptに残す。
