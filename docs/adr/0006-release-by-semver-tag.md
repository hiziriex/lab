# SemVerタグでGitHub Pagesへ公開する

- Status: Accepted

## Context

main mergeごとに即公開すると、小変更でも外部公開される。Local devとCIで確認した後、人間が明示的にrelease判断したい。

## Decision

`vX.Y.Z` SemVer tagをrelease triggerとする。tag後にrelease checkを実行し、GitHub Releaseを作成してからGitHub Pagesへdeployする。

## Alternatives Considered

- main mergeごとにPages deploy
- 手動deployのみ

## Consequences

公開version、CHANGELOG、GitHub Release、package versionを同期しやすい。release判断を人間側に残せる。
