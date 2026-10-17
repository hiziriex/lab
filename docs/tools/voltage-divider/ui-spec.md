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

候補比較の初期seriesとする。注目候補は独立してrank 1で初期化する。

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

Panel見出しは「グラフ」。header全体の開閉と右端の表示／閉じる表示、`aria-expanded` / `aria-controls`を維持する。開閉ではモード・範囲・カーソルを保持する。冒頭の長い説明、別行の現在Vin / 目標Vout表示、出力特性のlegend、端点数値一覧「グラフの数値」は設けない。

Radix SegmentedControlで出力特性 / 候補比較を切り替える。出力特性は注目1候補の実線、表示候補selectを表示。候補比較はcheckbox選択候補の符号付きVout誤差 [mV]、0 mV基準線と比較legendを表示し、表示候補selectを非表示とする。候補の色・比較用線種は従来のpaletteを共有する。理想比は主計算済みの設計条件を使用し、比較モードに短く表示する。

行click / selectは注目候補だけを変更し、checkboxは比較対象だけを変更する。checkbox cellはclickを行へ伝播させない。候補表内にradioは追加しない。現在Vinには「5 V」、目標Voutには「Target 3.3 V」等のラベルをグラフ内に直接表示する。不正な主入力の該当線は非表示とし、範囲外Vin・未更新候補は短いstatusで通知する。

条件をPanel上端に横並び・折返しでまとめ、Vin min / maxは既存EngineeringValueInputの数値・単位機能を保って小さい可視ラベルを添える。Desktop（1024px以上）は左graph / 右cursor・結果の2列。graphは幅に応じた7:5のaspect ratio（最小高さ15rem）とし、不自然に横長にしない。Mobileはgraph、compact cursor操作、1つの測定領域の順。A/Bカードは並べずtableに集約する。全候補時もページ横overflowを生まない。

cursor toolbarは `[A] [Vin入力 V] [×]` / `[B] [Vin入力 V] [×]`。A/Bは独立toggleで`aria-pressed`を持ち、初期はAのみ選択。選択したcursorをgraphのclick / tapで移動する。未配置Aの初回graph配置だけAをOFF、BをONへ切り替える。既存Aの移動、B配置、両選択、drag、数値入力では切り替えない。個別削除やClearでは初回フラグを戻さず、範囲編集・再計算・Resetで戻す。両選択はAを指定位置へ移す共通移動量を適用し、両方が範囲内に残るよう制限する。両cursorが存在しない／片方が欠けているときは選択cursorを指定位置へ初期化する。未選択ではgraph操作で移動しない。Aはamber、Bはorange。背景に合わせたlight / dark色、A/Bラベルと異なる線種を併用する。

graphはkeyboard focus可能。← / →は範囲幅の1%、Shift併用は0.1%の相対移動。任意の連続値へ加算しgrid snapはしない。数値入力はその行だけを変更し、Enter / blurで確定、Escapeで取消。通常は小数4桁、極小・極大値は指数表記。任意精度の入力値を内部保持し、未編集のfocus / blurでは表示丸め値を再取り込みしない。不正・範囲外入力は計測値へ反映せずfield errorとする。各×は当該cursorのみ削除、小さいClearは両方削除。touch targetは24px以上を保つ。

出力結果はA/BのVin / Vout、ΔVin、ΔVout、ΔVout / ΔVinをtableで表示。比較結果は共通ΔVinと候補ごとのA/B誤差、ΔError、ΔError / ΔVinをmatrix tableで表示する。差分はB − A、左右順に並べ替えない。同一Vinの傾きは「—」。A/BのVinはモード・注目候補変更で保持し再評価、範囲編集・主再計算・Resetで解除する。

hoverは連続Vinから再計算し、X / Y axisPointerと小さいgraph内overlayで表示する。Y pointerは先頭表示候補の曲線上の値を指し、比較overlayには全選択候補の誤差を表示する。別の大きなhover cardは作らない。sampleや表示値から再計算しない。EChartsは初回Panel表示まで遅延読み込み、core / Line / Grid / MarkLine / AxisPointer / Tooltip / SVGを登録。theme・resize・dispose・ToolBoundary・animation無効を維持する。hoverなしでもtapとdirect inputで計測可能。

nominal構造と既存の候補・理想出力・誤差定義は維持する。公差 / min-max band / TCR / 温度 / 負荷 / snapは今回実装しない。


### Cursor dragと測定背景

mouse / touch共通のPointer Eventsとpointer captureでcursor線を直接dragする。drag開始時の値とpointer位置を保持し、連続Vinの移動量を開始値へ加算するため、掴んだoffsetで線が跳ねない。単独dragは掴んだcursorだけを選択・移動。両toggle ONではどちらを掴んでも同量を加算し、B − Aを保持して両方が範囲内に残るよう移動量を制限する。drag中も結果を更新し、hoverを隠す。cancelでは最後の有効位置を保持する。

細いamber / orange線の周囲に透明な48px幅のtouch領域を置く。近接時は中間点で領域を分割し、同位置ではAを左側24px、Bを右側24pxから掴める。線上はdragを優先し、空いたplotのclick / tapとkeyboard移動・direct inputは維持する。説明はsr-onlyへ移し、常時表示の移動対象・keyboard説明を削除する。

chart背景はlightで白、darkで専用の暗色`#101214`、境界はthemeのgray-6。Panelとの区別とaxis / grid / series / 基準線 / crosshair / A/Bのcontrastを確保する。Desktop / Pixel 7のlight / dark、live drag、連動端、負のB − A、近接hit area、個別削除、数値入力、keyboard、axeを検証し、画像差分を人間確認へ渡し、baselineは人間承認後のみ更新する。
