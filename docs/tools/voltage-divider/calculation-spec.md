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

## 12. 数値的 zero と表示分解能

誤差の生値は保持する。`abs(error_abs) <= 4 × Number.EPSILON × max(abs(actualVout), abs(targetVout))` を数値的 zero とし、順位評価・表示の両方で zero として扱う。候補間の絶対誤差差分も同じ相対 epsilon 内なら tie とし、電流・抵抗値の tie-break へ進む。固定電圧閾値は使わない。zero は `0 V` / `0 %` と表示する。

実在する非zero誤差の相対値が `0.001 %` 未満なら `<0.001 %` と表示する。
絶対誤差は `targetVout × 0.00001` の最上位 decade を表示分解能とし、非zero誤差の絶対値が分解能未満なら `<分解能 V>`、それ以上なら分解能単位へ表示だけ丸める。通常の値は符号を保持し、下限表示は絶対値を示す。
目標 1 / 3.3 / 12 V の分解能はそれぞれ 10 / 10 / 100 µV。未更新の結果には直前に計算した目標を使用する。

## 13. Vin sweep

`calculateVoltageDividerSweep({ candidates, vinMin, vinMax })` は選択済み公称抵抗を受け取り、候補ごとに両端の `{ vin, vout }` 点を返す純粋関数とする。無負荷では一次関数なので端点間を直線で結ぶ。candidate識別子・抵抗値・点列を持つseriesとし、将来の帯データは別フィールドとして追加できる。

`Vout = Vin × R2 / (R1 + R2)`。抵抗和のoverflowを避けるため、抵抗値を最大値で正規化して分圧比を求める。単位は V / Ω、内部は丸めない。範囲は有限かつ `0 <= vinMin < vinMax`、抵抗は有限かつ正。想定内エラーは既存の `CalculationResult` で返す。空選択は空seriesの成功結果とし、UIで案内する。

## 14. モード・連続座標・A/B計測

- `k_candidate = R2 / (R1 + R2)`（overflow回避の正規化を使用）
- `k_target = Vout_target / Vin_nominal`（主計算済みの設計条件）
- `Vout_candidate(Vin) = Vin × k_candidate`
- `Vout_ideal(Vin) = Vin × k_target`。設計Vinでは目標Voutに一致する。
- `Vout_error(Vin) = Vout_candidate(Vin) - Vout_ideal(Vin)`。内部V、UIはmV。正は理想より高く、負は低い。絶対値にはしない。

`calculateCandidateRatio` / `calculateTargetRatio` / `calculateSweepReading` / `calculateSweepDelta` は純粋関数とし、検証済みの候補・設計値・Vinを受け取る。readingは `{ vin, nominal: { vout, ideal, error } }`、差分も `nominal` 内へ値・傾きをまとめ、将来のmin / maxを別フィールドで追加可能とする。

`ΔVin = Vin_B - Vin_A`、`ΔVout = Vout_B - Vout_A`、`ΔError = Error_B - Error_A`。傾きはそれぞれ `ΔVout / ΔVin`、`ΔError / ΔVin`。A/Bを左右順に並べ替えない。`ΔVin === 0` では除算せず傾きをnullで返しUIで「—」とする。JavaScript numberの内部精度を維持し、最後だけformatterを通す。click / tap / hoverはpixelから連続Vinへ変換し、sample点へ丸めない。

## 15. Cursorの連動移動

`calculateSweepCursorMove`は純粋関数としてcursor位置・独立toggle・連続位置指定または相対移動量・有効範囲を受け取る。両選択でA/Bが存在する場合、共通移動量を次の範囲へ制限して両方に加える。

```text
desired_shift = target_Vin - Vin_A
min_shift = Vin_min - min(Vin_A, Vin_B)
max_shift = Vin_max - max(Vin_A, Vin_B)
shift = clamp(desired_shift, min_shift, max_shift)
Vin_A_new = Vin_A + shift
Vin_B_new = Vin_B + shift
```

差分の意味はB − Aのまま、移動前後でΔVinを保持する（numberの浮動小数点精度内）。単独選択はそのcursorだけを範囲内へ移動し、未選択は移動しない。欠けた選択cursorは指定位置へ初期化する。keyboardの相対量は範囲幅の1% / Shiftで0.1%であり、gridへの丸めはしない。direct inputはtoggleに関係なく当該cursorだけを更新する。


### Cursor dragの移動量

純粋関数`calculateSweepCursorDrag`はdrag開始時のcursor位置・選択状態・掴んだcursor・連続Vinの移動量を受け取る。pixel座標からのVin移動量は`(現在clientX − 開始clientX) / plot幅 × (Vin_max − Vin_min)`。掴んだoffsetを保持し、丸め・snapは行わない。

両選択時は§15の共通移動量制限を適用し、それ以外は掴んだcursorだけへ加算する。毎回開始値から再計算し、累積加算によるずれを避ける。Bを掴んだ場合もA基準の絶対指定へ置き換えず、同じ相対移動量を両方へ加算する。左右の順序・差分の符号・ΔVin=0の未定義処理を維持する。
