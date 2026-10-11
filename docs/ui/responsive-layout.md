# Responsive Layout

## 1. Breakpoint

- Mobile: `<768px`
- Tablet: `768–1023px`
- Desktop: `>=1024px`

## 2. Representative viewport

- Mobile: Pixel 7 相当
- Tablet: 768px
- Desktop: 1440px

## 3. Sidebar

Desktop:

- left sidebar
- collapsible

Mobile:

- hidden by default
- hamburger で open

## 4. Tool content

縦スクロール型。
1 画面へ無理に全情報を詰め込まない。
ページ内 section を連続した「virtual page」のように扱う。

## 5. Candidate table

分圧抵抗ツールの候補表は mobile でも table のまま維持する。

Mobile:

- horizontal swipe
- absolute error / % error は横並び
- row height を不必要に倍増させない
- 暫定 sticky column:
  - 順位
  - R1
  - R2

実機確認で必要なら変更する。

## 6. Touch

tap target を十分確保する。
hover は補助に限定し、主要操作は tap / click で完結させる。
