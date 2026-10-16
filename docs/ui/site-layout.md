# Site Layout / Navigation

## 1. Top page

初期トップは主要 link のみを中心とした簡易構成。

- 各 tool
- About
- GitHub repository
- 更新履歴
- 問題を報告

大きな Hero、marketing block、popular tools、検索 box は不要。

## 2. Desktop sidebar

PC では左 sidebar を通常表示し、collapse 可能にする。

将来 mode:

- Navigation
- Favorites
- Parameter / Property
- Settings

Icon rail 等で mode を切り替えられる構造を想定する。

## 3. Mobile sidebar

通常 hidden。
Hamburger から drawer として表示。

## 4. Parameter Panel

Tool 固有 parameter を page 上部へ戻らず変更するための panel。

- main input と同じ state を扱う
- `再計算` button を持てる
- graph / result を見ながら parameter を変更できる

初版分圧ツールでは将来拡張しやすい構造を用意する。

## 5. Vertical scroll

Tool page は 1 URL の縦スクロール page。

複数 section を virtual page のように扱うが、実際には通常 scroll 可能。

Calculate 後に result section へ scroll 可能。
User は通常 scroll で戻れる。

## 6. Floating section navigation

Desktop:

- viewport 基準の fixed overlay。sidebar 開閉や navigation の有無で本文に縦余白を作らない
- viewport 左下の固定位置を sidebar 開閉・main content 幅によらず維持する
- viewport 内へ収め、短い画面では内部 scroll を可能にする。keyboard focus時は文字領域だけでなくlink全体をscroll領域内に収める
- 小型 floating nav
- main content を邪魔しない

Mobile:

- current section name を小さく表示
- tap で section list 展開
- ヘッダー直下付近へ viewport 基準の floating overlay として固定する
- collapsed / expanded とも document flow に縦スペースを確保せず、本文を押し下げない
- 320px 幅でも viewport 内に収め、縦方向の不足時は menu 内を scroll 可能にする
- 展開時の高さは anchor / focus 移動のスクロール余白に反映し、入力操作を妨げない
- native details / summary の keyboard 操作を維持し、Escape で閉じた後は summary へ focus を戻す。link 選択時は native anchor 移動を維持する

## 7. Anchor

主要 section は anchor ID を持つ。

例:

```text
#input
#results
#graph
#formula
```

Nav click 時だけ URL hash を更新。
Manual scroll では URL hash は更新しない。

## 8. Smooth scroll

当面有効。
`prefers-reduced-motion` では animation を抑える。
