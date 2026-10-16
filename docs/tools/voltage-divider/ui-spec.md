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
4. Vin–Vout graph（初期は閉じる）
5. Formula / candidate selection explanation

将来 section 追加:

- tolerance
- temperature
- advanced mode

## 3. Input

Main input:

- Vin
- target Vout
- `分圧電流 Idiv を指定` checkbox
- Idiv
- E12 / E24

Current specification:

```text
☑ 分圧電流 Idiv を指定
[ 1 ] [mA ▼]
```

Desktop / Mobile とも2行構成を基本とする。
checkbox付きオプション入力は、option名をcheckbox行に表示し、その直下に値入力を配置する。独立した値入力のfield labelを重ねて表示しない。
小さな共通 `OptionalEngineeringValueInput` wrapper で option 行と既存値入力を組み合わせる。
checkbox 行は native label 内の checkbox とテキストを inline-flex でまとめ、label click と keyboard 操作を維持する。
値 input は option名の span を `aria-labelledby` で参照する。unit select は「分圧電流 Idiv の単位」という accessible name を持ち、両 control を同じ名前の group にまとめる。
value + unit は狭い画面でも同じ行へ配置する。

OFF:

- current input / unit select disabled（ON では双方 enabled）
- candidate scale は auto

numeric input / unit selector / normal select は共通 `--control-height: 40px` を使用する。`分圧電流 Idiv を指定` は checkbox と label を同一行で中央に配置する。

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

- comparison checkbox（選択時は candidate series color を反映）
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

候補表の順位列・専用色列は設けず、比較 checkbox を先頭に置く。先頭headerは視覚的には空欄とし、screen-reader-only の「候補を比較」で読み上げ情報を保持する。比較列とcheckboxの操作領域は共通の2rem（標準32px）とし、左右のcell paddingを省いてR1以降へ幅を回す。header は中央、数値は右、checkbox は中央揃え。数値は tabular numerals を使用する。R1 / R2 は nowrap の 6rem を基本とし、値を clip しない。Mobile も同じ列順で横スクロールを維持する。

## 8. Mobile table

horizontal swipe。

暫定 sticky:

- comparison checkbox
- R1
- R2

実機確認後に調整可能。

## 9. Candidate selection

Multiple selection。

初期:

- rank 1 のみ checked

graph の default series とする。

Checked candidate:

- pale background
- readable text
- candidate series color の checkbox

Color mapping:

```text
candidate table color
= graph series color
= legend color
```

候補の識別子に青 / 赤 / 緑 / 紫 / 橙の共通 palette を固定対応させる。選択順で色を変えない。
light / darkで同じ候補識別色の系統を維持する。darkの青・赤・紫はグラフ背景に対する3:1と白いcheck markの4.5:1を両立する明度へ補正し、候補表・legend・graphへ共通適用する。

色だけに依存せず checkbox の check 状態も使う。

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
- `#graph`
- `#formula`

Floating navigation から移動可能。
Mobile は current section + tap expand。
Desktop は viewport 左下の同じ固定位置を使い、sidebar ON / OFF、main content 幅、scroll で横位置を変えない。

## 13. Graph UI

03 Vin–Voutグラフ、04 計算式の順に配置。表示buttonは `aria-expanded` / `aria-controls` を持つ。min / maxは既存 `EngineeringValueInput` を再利用しV単位、Desktopは2列、Mobileは1列。候補識別は番号・R1/R2・線種・既存paletteで示し、legendによる独立した選択は追加しない（候補表を正本とする）。現在Vin・目標Voutと、前回計算候補を使用中の未更新状態をテキスト表示する。

EChartsは表示操作時だけdynamic importし、core / LineChart / Grid / MarkLine / SVGRendererのみ登録する。初期ロードと他ページへEChartsを含めない。SVG、ResizeObserver、OS theme変更、animation無効、unmount時disposeを扱う。ロード失敗はグラフ内で隔離し、主計算は維持する。グラフと同じ端点の数値表を開閉式で提供する。描画領域はMobileでもページ横overflowを発生させない。
