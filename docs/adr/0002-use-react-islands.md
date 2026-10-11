# React Islandsを採用する

- Status: Accepted

## Context

計算ツール内では入力、結果、Parameter Panel、将来のgraph等で状態共有が必要になる。一方、サイト全体をReact化する必要はない。

## Decision

対話部分のみReact Islandsとして実装する。1つのcalculatorは状態共有のため比較的大きな1 islandとしてもよい。

## Alternatives Considered

- Vanilla JS
- 全体React SPA
- 複数の細切れIsland

## Consequences

Astroの静的性を保ちつつ、tool内部のstate管理をReactで扱える。
