# EngineeringValueInput

## 1. 目的

電圧・電流・抵抗等の engineering value を共通 UI で入力する。

初期 UI:

```text
[ numeric input ] [ unit / SI prefix select ]
```

## 2. Internal value

UI input を SI 基本単位へ正規化して calculation layer へ渡す。

例:

```text
4.7 kΩ -> 4700 Ω
1 mA -> 0.001 A
```

## 3. SI prefix

内部対応:

- `a`
- `f`
- `p`
- `n`
- `µ`
- `m`
- none
- `k`
- `M`
- `G`
- `T`
- `P`

UI select は用途ごとに現実的な候補だけ表示する。

## 4. Parsing

初期対応:

- `4.7`
- `1e3`
- `2.2e-6`

将来拡張:

- `4.7k`
- `4.7kΩ`
- `100u`
- `100µ`

parser は `src/lib/units/` へ分離する。
入力中に即 normalization しない。

## 5. Decimal

`.` のみ。
カンマ小数、桁区切りカンマは非対応。

## 6. Unit change

Unit / prefix を変更しても numeric text は変更しない。

例:

```text
4.7 kΩ
-> Ω を選択
-> 4.7 Ω
```

物理量自体が変わる。
Unit 変更では自動再計算しない。

## 7. Constraints

Field ごとに指定可能:

- required
- min
- max
- allowZero
- allowNegative
- step

step は原則なし。
必要な field のみ個別指定。

## 8. Validation message

曖昧な文言を避ける。

例:

```text
0 Ωより大きい値を入力してください
0～100 Vの範囲で入力してください
数値として解釈できません
```

## 9. Error UI

- field 近くに message
- invalid state
- calculate area と連携

色だけに依存しない。

## 10. Storybook

最低限:

- normal
- focus
- error
- disabled
- unit variants

共通 UI token `--control-height: 40px` で Radix TextField の外枠・単位 select・通常 select の高さを揃える。select の縦 padding による高さ差を避ける。

## 11. Checkbox付きオプション入力

`OptionalEngineeringValueInput` は option名と checkbox を一行にまとめ、その直下へ `EngineeringValueInput` を配置する。enabled state に応じて数値と単位の双方を無効化する。計算 state や validation は呼び出し元で管理する。

`EngineeringValueInput.labelledBy` に外部 option名のIDを渡す場合、重複する可視labelを作らず、その要素を値inputの accessible name として参照する。単位の accessible name は従来どおり `label + の単位` とする。
