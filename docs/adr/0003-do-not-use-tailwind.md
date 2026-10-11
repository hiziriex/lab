# Tailwind CSSを採用しない

- Status: Accepted

## Context

プロジェクトではutility class中心のstylingを避け、CSSとして構造を読みやすく保ちたい。

## Decision

Tailwind CSSは使用しない。Custom layoutはCSS Modules + CSS Custom Propertiesを使う。

## Alternatives Considered

- Tailwind CSS
- CSS-in-JS
- global CSS中心

## Consequences

classNameがutilityで肥大化しにくく、layoutとstyleをCSSとして管理できる。
