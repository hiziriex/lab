# Astroを採用する

- Status: Accepted

## Context

Hiziriex Lab は静的な技術サイトと対話的計算ツールを両方持つ。サイト全体をSPA化する必要はない。

## Decision

Astroをサイト基盤として採用し、static outputを基本とする。

## Alternatives Considered

- Next.js等のReact中心framework
- 全体をReact SPA
- 手書き静的HTML

## Consequences

静的コンテンツを軽量に保ちつつ、必要な箇所だけIslandとして対話化できる。GitHub Pagesとの相性がよい。
