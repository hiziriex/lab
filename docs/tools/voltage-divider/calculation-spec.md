# 分圧抵抗ツール 計算仕様

## 1. Basic formula

```text
Vout = Vin × R2 / (R1 + R2)
```

Actual divider current:

```text
Idiv_actual = Vin / (R1 + R2)
```

Power:

```text
P_R1 = Idiv_actual² × R1
P_R2 = Idiv_actual² × R2
```

## 2. Error

Absolute error:

```text
error_abs = Vout_actual - Vout_target
```

Relative error:

```text
error_pct = error_abs / Vout_target × 100
```

Ranking では原則、絶対値 `abs(error_abs)` を使用する。

## 3. E-series

初版:

- E12
- E24

初期選択: E12。

公差と E-series は別概念。
初版では nominal value のみ扱う。

## 4. Candidate search

理想値近傍だけではなく、実用的な抵抗値範囲を広く探索する。

基本思想:

1. E-series coefficient と R1/R2 間の relative decade を組み合わせ、分圧比候補を生成する。
2. 各比率について actual Vout を評価する。
3. target Vout error を主評価とする。
4. 同じ分圧比を単に 10 倍 / 100 倍した重複 candidate は大量に上位表示しない。
5. 分圧電流指定は主 ranking constraint ではなく resistor decade / scale を決める目安として扱う。

## 5. Current specification ON

指定 Idiv から目安となる total resistance を得る。

```text
R_total_target = Vin / Idiv_target
```

候補の ratio を決めた後、同じ ratio を保つ decade のうち、実際の divider current が指定桁へ自然に近づく scale を選択する。
Idiv への厳密一致は要求しない。
Vout error の優先度を Idiv error より高くする。

同程度の Vout error の tie-break として、Idiv が target に自然に近い候補を優先してよい。

## 6. Current specification OFF

Idiv を拘束しない。

Ratio 決定後、R1/R2 の小さい方が概ね:

```text
1 kΩ <= min(R1, R2) < 10 kΩ
```

となる decade を選ぶ。

これは初期基準であり、将来変更可能。

## 7. Ranking

基本:

1. `abs(Vout_actual - Vout_target)` が小さい
2. 同程度なら current specification ON 時に Idiv が target に自然に近い
3. deterministic な tie-break を設ける

Top 5 を返す。

## 8. Duplicate control

同一 ratio の decade 違いだけで Top 5 を占有しない。
表示 candidate は設計判断として意味のある ratio variation を優先する。

## 9. Numeric

内部計算は JavaScript / TypeScript `number`。
内部値は丸めない。
Display formatter のみ engineering notation / significant digits を適用する。

## 10. SI units

Calculation layer:

- Vin / Vout: V
- I: A
- R: Ω
- P: W

UI の prefix は unit layer で SI 基本単位へ変換してから calculation layer へ渡す。

## 11. Result type

概念例:

```ts
type VoltageDividerCandidate = {
  rank: number;
  r1: number;
  r2: number;
  actualVout: number;
  absoluteError: number;
  relativeErrorPercent: number;
  actualDividerCurrent: number;
  r1Power: number;
  r2Power: number;
};
```

Calculator は `CalculationResult<T>` パターンに従う。
