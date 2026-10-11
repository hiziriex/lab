# Interaction Guidelines

## 1. Calculation

入力変更だけでは自動再計算しない。

計算 trigger:

- `計算` button
- Parameter Panel の `再計算`
- Enter

ただし validation error がある場合は実行しない。

## 2. Reset

`リセット` は空欄化ではなく tool の default 値へ戻す。

## 3. Dirty / stale result

入力値・unit を変更して未再計算の場合:

- 直前の結果は残す
- `未更新`
- `入力値が変更されています。再計算してください`

等を表示する。

## 4. Validation timing

内部 validation は随時行う。

error message 表示:

- blur
- focus が別 field へ移動
- Enter
- 計算操作を試みた時

入力途中に過度な error を出さない。

error が 1 件でもある場合:

- calculate button disabled
- Enter calculation disabled
- calculate area に NG 状態を明示

error 発生時に自動 focus 移動はしない。

## 5. Loading

計算中:

- calculate button disabled
- spinner
- double submit 防止

軽い計算では stop button 不要。
将来 long running calculation では stop 対応を tool ごとに追加可能にする。

## 6. Selection color

候補を選択した場合:

- checkbox
- candidate number / rank
- color swatch
- pale background

を併用する。
背景は淡くし、文字可読性を優先する。

将来 chart を追加した際:

```text
candidate table color = chart series color = chart legend color
```

となるよう color mapping を共通化する。
