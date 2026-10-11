# Apache EChartsを採用する

- Status: Accepted

## Context

将来、電子回路計算結果、公差、温度、frequency response等のgraph表示が必要になる。

## Decision

Chart libraryとしてApache EChartsを採用する。

## Alternatives Considered

- Chart.js
- Recharts
- D3を直接利用

## Consequences

多様なengineering graphへ拡張しやすい。bundle sizeは継続監視する。
