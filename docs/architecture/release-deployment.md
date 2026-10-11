# Release / Deployment

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

Codex は作業 branch を確認なしで作成してよい。

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

version 候補は Codex が提案してよいが、最終決定は人間。

## 5. Tag

format:

```text
v0.1.0
```

release tag は以下の場合のみ作成。

- 人間が手動
- 人間が Codex へ明示指示

Codex が自主判断で tag を作らない。
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

人間または人間指示を受けた Codex が実行可能。

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

正式公開前に workflow が失敗した場合、未公開 tag は削除して同じ version を再利用可能。
一度正式公開した tag は移動・削除・再利用しない。
修正は patch version を上げる。

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

## 12. Repository operation requiring approval

人間確認必須:

- Issue 作成
- PR 作成
- PR merge
- release tag
- GitHub Release
- 正式公開
- repository settings change
