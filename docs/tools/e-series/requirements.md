# E系列標準値一覧

## 目的・範囲

`/tools/e-series/` でIEC 60063:2015のE3 / E6 / E12 / E24 / E48 / E96 / E192を参照する。ホームの技術資料と共通navigationからリンクする。

## 数列・表示

- 表1のE24と表2のE192を明示的な整数配列として保持する。単なる等比数列の丸めで代用しない。
- E24を2項ごとに間引きE12、E6、E3を得る。E192を同様に間引きE96、E48を得る。
- E3〜E24は10〜91の2桁、E48〜E192は100〜988の3桁の整数。末端の次decade開始値は重複表示しない。
- 表は1 decade分。値に10の整数乗を掛けて使用できること、2桁と3桁の表示scaleが異なることを表付近で説明する。
- E3 ⊂ E6 ⊂ E12 ⊂ E24、およびE48 ⊂ E96 ⊂ E192。E24はE48以降の部分集合ではないことを明示する。

## 主表

- Desktopの横方向はE3 | E6 | E12 | E24 | E48 | E96。
- E24の24値を基準行とする。E3は8行ずつrowspanで3セル、E6は4行ずつで6セル、E12は2行ずつで12セル。結合セルの値は上下中央に配置し、境界を明示する。
- E24は各行1値。E48は固定2列、E96は固定4列で、それぞれ昇順配列を2値・4値ずつ行優先で割り当てる。近さによる再グループ化や自動列数決定は行わない。
- 系列ヘッダはE3 / E6 / E12 / E24各1列、E48はcolspan=2、E96はcolspan=4。各ヘッダは系列名・公差・copy buttonを1行で表示する。E48 / E96はグループheaderにbuttonを1個置く。
- 数列間の個数比に基づく配置であり、E24とE48以降の同じ行の値の一致は意味しない。既存の包含関係・表示scaleの説明を維持する。
- すべての値セルのgrid、系列境界、4行ごとの罫線とrowspanセルの面で対応を追えるようにする。
- 強い系列色は使わず既存のlight / darkのtokenで構成する。
- 表を本文幅いっぱいへ引き伸ばさず、内容に必要な幅で表示する。固定の960px最小幅と先頭4系列の120px指定を撤去。header左右paddingは6px、セル左右paddingは約6.4px。数値14.4pxを保ち、行高28pxへ圧縮。Desktop主表は800px未満を検証する。

## E192

主表の下に独立した24行×8列の専用表を表示。昇順配列を各行8値ずつ割り当て、左から右、上から下へ読む。便宜的な列番号headerは設けない。E96にも属する値を太字とし、説明を付ける。192値すべて常時展開する。

## 公差

各系列ヘッダは「±40% / ±20% / ±10% / ±5% / ±2% / ±1%」、E192は「±0.5%」。headerに「例」「代表」を付けない。ページ内1か所だけ「公差は各E系列で一般的に対応づけられる代表例です。実際の公差は部品の仕様を確認してください。」と注記する。

IEC 60063:2015 表3は対称公差と系列の推奨対応であり、E3は±20%より広い公差、E192は±1%より狭い公差。±40%や±0.5%への固定を規格要求として説明しない。

## コピー

各系列ヘッダ付近のLucide Copy icon buttonで、その系列だけをカンマ＋スペース区切りでコピーする。1以上10未満、E3〜E24は小数1桁、E48〜E192は小数2桁（末尾0を保持）。見出し・公差・単位・改行・末尾カンマは含めない。

Copy / Check iconは14px、可視buttonは30×30px、左右paddingなし。疑似要素で各辺5px広げ40×40pxの操作領域を確保する。keyboard操作とvisible focusを維持し、淡いborderと既存muted色で表示する。

accessible nameは`E24をカンマ区切りでコピー`等。成功は2秒間Check表示とlive status、失敗は権限確認・再試行を促す表示。実行中はbutton無効。JavaScript無効でも表はSSRにより参照可能。

## Mobile・操作性

表wrapperのみ横スクロール可能。読みやすい文字サイズと固定列幅・24行構造を保ち、セルを折り返さない。左右矢印と説明を表示。wrapperはfocus可能な名前付きregionとし、keyboardで操作可能。主表・E192とも高さ制限や表内縦スクロールを設けず、縦方向はページスクロールを使用。sticky headerのための縦scroll containerは作らない。ページ全体の横overflowは禁止。

## 検証・Visual

数列の件数・順序・包含・既知値・コピー精度をunitで検証。browserで24基準行、各系列の値数・固定列数、rowspan=8/4/2、結合セルの実際の境界、全値の昇順配置を確認。公差表記・注記1か所、1行header、30px button・14px icon・40px操作領域、focusとkeyboard、E192の列番号なし、Desktop幅800px未満を確認。全系列のclipboard、失敗・再試行、横scrollとkeyboard、320 / 412 / 768 / 1440pxで縦scroll領域なし・ページ横overflowなしとaxeを確認。

Desktop / Pixel 7、light / darkのfull page、主表全体、Mobile左右scroll、E192、copy成功時の確認素材と結果を1つのZIPへまとめる。実機ではなくLinux上のエミュレーションであることを記載。baselineは人間承認前に追加・更新しない。既存architectureで実装できるため新規ADRは不要。

## 出典

- [IEC 60063:2015 公開プレビュー](https://cdn.standards.iteh.ai/samples/21131/0b431abe83d64551accdfaebc210796e/IEC-60063-2015.pdf) §4、§5、表1〜3。
- [ROHM List of Nominal Resistance Values](https://fscdn.rohm.com/en/products/databook/applinote/passive/resistor/common/list_of_nominal_resistance_values_an-e.pdf) E24 / E96、decadeの利用方法の照合。

## Visual承認記録（2026-10-18）

人間がcompact版のDesktop / Pixel 7、light / dark、主表・E192・copy配置・公差注記・Mobile横scrollを確認し、現在の表示と既存Desktop Visual差分を承認した。

既存分圧ページのDesktop baselineのみ、承認済みreview ZIP内のactual画像を無加工で登録する。差分はsidebarへのE系列リンク追加とAbout移動。Pixel 7 baselineは一致しているため変更しない。

- Desktop SHA-256: `dc5771244a6731a4ce2f3fe1cce8a5ec7fb913c2def3225f99f7dce1ffcee36d`
- Pixel 7 SHA-256: `ab02d35a087d60e37376dab8868b5d68d196da42ba493d4fccbc2d7727d5f6e4`

新しいVisual差分はこの承認に含まれない。Lighthouseの標準計測対象にE系列ページを加える。
