# 分圧抵抗ツール Test Cases

この文書は実装時に fixture / unit / E2Eへ具体化する。

## 1. Default case

Input:

- Vin = 5 V
- target Vout = 3.3 V
- current spec = ON
- Idiv = 1 mA
- E12

確認:

- 5 candidate
- rank order が Vout error 基準
- rank 1 checkbox checked
- R1 / R2 / actual Vout / error / current / power が有限値
- unit 表示あり

## 2. E24

E12 → E24 変更。

確認:

- auto calculate しない
- stale state 表示
- Calculate 後 E24 candidate へ更新

## 3. Current specification OFF

確認:

- Idiv input disabled
- auto calculate しない
- Calculate 後 candidate の smaller resistor が概ね 1 kΩ～10 kΩ 未満の scale
- actual divider current は result に表示

## 4. Validation

### Vin = 0

- invalid
- error message
- Calculate disabled
- Enter disabled

### Vout = 0

invalid。

### Vout = Vin

invalid。

### Vout > Vin

invalid。

### Idiv = 0 with current spec ON

invalid。

### Idiv invalid with current spec OFF

Idiv field disabled のため calculation を block しない。

## 5. Input format

対応:

- decimal
- exponential notation

例:

- `5`
- `5e0`
- `1e-3`

拒否:

- comma decimal
- comma thousands

## 6. Unit behavior

例: `1 mA` で numeric = `1`。
prefix を `A` へ変更しても numeric string `1` は維持。
物理量は `1 A` へ変わる。
自動 calculate しない。

## 7. Reset

変更後に Reset。

Default:

- 5 V
- 3.3 V
- current spec ON
- 1 mA
- E12

へ戻る。

## 8. Candidate duplicate

同じ ratio の 10x / 100x scale candidate が Top 5 を不自然に占有しない。

## 9. Sorting

Vout error の小さい順。
Tie 相当では current spec ON 時、target Idiv に自然に近い候補を優先してよい。
結果は deterministic。

## 10. Selection

Initial:

- rank 1 checked

Multiple check possible。

Checked rows:

- pale background
- candidate series color の checkbox
- checkbox

Color only で状態を表現しない。

## 11. Responsive

Pixel 7:

- table horizontal swipe
- checkbox / R1 / R2 sticky
- Vout absolute / % error は横並び
- row height が不要に倍増しない

Desktop 1440px:

- table readable
- no unnecessary horizontal overflow

## 12. Accessibility

- keyboard で input / select / checkbox / buttons 操作可能
- label association
- disabled state
- error association
- axe critical violation なし

## 13. UI / 数値表示の回帰

- Vin 6 V / target 3.3 V / R1 1.8 kΩ / R2 2.2 kΩ の noise は `0 V` / `0 %`。
- 小さい・大きい電圧 scale でも数値的 zero を区別し、5 µV 相当の実誤差を保持する。
- 目標 3.3 V で実誤差 5 / 33 / 87 µV は `<10 µV` / `30 µV` / `90 µV`。
- Desktop sidebar 表示・非表示・scroll・短い viewport で fixed、同一 viewport では横位置も変えない。本文の縦位置を変えない。
- Desktop / Mobile で control 40px、header 中央、比較色の安定性、9列を確認する。

- オプション名と値入力は2行。label click / Space で ON / OFF、値と単位の enabled / disabled、値保持、accessible name と group を確認する。
- review は Desktop sidebar 表示／非表示、Mobile input／candidate area を保存し、baseline は人間確認まで更新しない。
