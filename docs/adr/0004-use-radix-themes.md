# Radix Themesを採用する

- Status: Accepted

## Context

Button、input、select等の基本UIを毎回独自実装すると一貫性とaccessibility維持コストが高い。

## Decision

共通UIはRadix Themesを優先して利用する。Themesで不足するbehaviorのみRadix Primitivesを検討する。

## Alternatives Considered

- 完全自作UI
- Material UI
- Tailwind系component library

## Consequences

共通UIの一貫性を得つつ、layoutはCSS Modulesで自由に設計できる。
