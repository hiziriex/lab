# 分圧抵抗ツール 要件

## 1. Tool

名称: `分圧抵抗計算`

URL: `/tools/voltage-divider/`

初版は単純な分圧抵抗設計のみ。

後続機能:

- 抵抗公差解析
- 温度係数 / TCR
- graph
- ADC sensing mode
- comparator / EN / UVLO 等 threshold mode

機能拡張していく開発プロセス自体を検証するため、初版へ詰め込みすぎない。

## 2. Circuit

標準構成:

```text
Vin
 │
 R1
 │
 ├── Vout
 │
 R2
 │
GND
```

- R1 = upper resistor
- R2 = lower resistor
- `Idiv` arrow = Vin から GND 方向

回路図 source は draw.io。
必要に応じて人間側で回路図を微調整する。
複雑な回路では、電流方向を AI が推測で勝手に断定しない。

## 3. Input

- Vin
- target Vout
- `分圧電流 Idiv を指定` checkbox
- Idiv
- resistor series

Resistor series:

- E12
- E24

Default:

- Vin = 5 V
- target Vout = 3.3 V
- current specification = ON
- Idiv = 1 mA
- resistor series = E12

Current specification OFF の場合 Idiv input を disabled にする。

## 4. Validation

- `Vin > 0`
- `0 < targetVout < Vin`
- current specification ON の場合 `Idiv > 0`

## 5. Output

Candidate ごとに:

- R1
- R2
- actual Vout
- absolute Vout error
- relative Vout error (%)
- actual divider current
- R1 power
- R2 power

Top 5 candidates。

## 6. Formula section

初版では基本式のみ。

```text
Vout = Vin × R2 / (R1 + R2)
```

KaTeX で表示。

## 7. Candidate method description

短い説明を表示。

> 指定した抵抗系列から、目標Voutとの誤差が小さい組み合わせを探索します。分圧電流指定時は、その値を目安に抵抗値の桁を調整します。

## 8. Initial non-goals

初版では実装しない:

- tolerance analysis
- TCR
- chart
- input URL sharing
- localStorage
- result copy
