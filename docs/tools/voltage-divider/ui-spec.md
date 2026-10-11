# 分圧抵抗ツール UI仕様

## 1. Page

縦スクロール型。
大きな SaaS Hero は置かない。

Title: `分圧抵抗計算`

短い sub description を必要に応じて置く。
Breadcrumb を title 直上へ表示。

## 2. Initial section order

初版の目安:

1. Header / breadcrumb / title / short description
2. Circuit + input
3. Candidate result
4. Formula / candidate selection explanation

将来 section 追加:

- tolerance
- temperature
- graph
- advanced mode

## 3. Input

Main input:

- Vin
- target Vout
- `分圧電流を指定` checkbox
- Idiv
- E12 / E24

Current specification:

```text
☑ 分圧電流を指定 [ 1 ] [mA]
```

のような配置を基本とする。

OFF:

- current input disabled
- candidate scale は auto

## 4. Calculate / Reset

- Calculate
- Reset

Reset は default input へ戻す。
Enter でも calculate。
Validation error 中は Calculate / Enter とも無効。

## 5. Error

Field 近くへ具体的 error。
Calculate area にも NG 状態を表示。

例:

- danger border
- warning icon
- `入力エラーがあります`

色のみへ依存しない。
自動 focus 移動なし。

## 6. Stale result

Input / unit 変更後:

- previous result は残す
- `未更新`
- `入力値が変更されています。再計算してください`

## 7. Candidate table

Columns:

- comparison checkbox
- color swatch
- rank
- R1
- R2
- actual Vout
- Vout error
  - absolute
  - %
- actual Idiv
- R1 power
- R2 power

Absolute / % error は横並び。
Mobile でも 2 段化しない。

## 8. Mobile table

horizontal swipe。

暫定 sticky:

- rank
- R1
- R2

実機確認後に調整可能。

## 9. Candidate selection

Multiple selection。

初期:

- rank 1 のみ checked

将来 graph の default series とする。

Checked candidate:

- pale background
- readable text
- visible color swatch

Color mapping:

```text
candidate table color
= future graph series color
= future legend color
```

候補を複数選択した場合、青 / 赤 / 緑 ... のように順次識別色を割り当てる。
色は theme / accessibility を考慮する。

色だけに依存せず checkbox / rank / swatch も使う。

## 10. Result update feedback

Calculate success 時、result area に軽い highlight / fade。
`prefers-reduced-motion` 対応。

## 11. Formula

KaTeX で:

```text
Vout = Vin × R2 / (R1 + R2)
```

初版では式を増やしすぎない。

## 12. Section navigation

主要 section に anchor。

例:

- `#input`
- `#results`
- `#formula`

Floating navigation から移動可能。
Mobile は current section + tap expand。
