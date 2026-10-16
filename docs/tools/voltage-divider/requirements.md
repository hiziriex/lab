# 分圧抵抗ツール 要件

## 1. Tool

名称: `分圧抵抗計算`

URL: `/tools/voltage-divider/`

初版は単純な分圧抵抗設計のみ。

後続機能:

- 抵抗公差解析
- 温度係数 / TCR
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
- input URL sharing
- localStorage
- result copy

## 9. Vin sweepグラフ

無負荷・公称抵抗の Vin–Vout 特性を候補表の後に表示する。初期は閉じ、「グラフを表示」で必要時に開く。候補表の複数選択・固定色を共有し、未選択時は選択を促す。抵抗公差、TCR、温度、負荷、derating、対数軸、export、URL共有は含まない。

横軸 Vin / 縦軸 Vout、単位 V。主入力の現在の有効な Vin を縦の破線、目標 Vout を横の破線で示し、値をテキストでも表示する。主入力変更後の抵抗は前回計算の候補であることを明示する。主入力が不正なら該当基準線を非表示とし、再入力を案内する。Vin がsweep範囲外なら数値と範囲外である旨を表示する。

範囲は計算済み Vin の80～120%で初期化し、再計算・Resetで初期化する。初期範囲の入力表示は12有効数字に整え、点列の計算結果は丸めない。開閉だけでは範囲を失わない。min / max編集で有効ならグラフを即時更新する。非数値・非有限値、min < 0、max <= minは拒否し、不正な範囲のグラフは表示しない。blur / Enterでfield errorを表示し、入力中は範囲確認の案内を表示する。範囲エラーは主計算を妨げない。
