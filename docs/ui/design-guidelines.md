# UI Design Guidelines

## 1. 基本思想

Hiziriex Lab は SaaS marketing dashboard ではなく、engineering workbench / IDE / instrument software に近い高密度 UI を目指す。

避ける:

- 大きな Hero image
- 不要な marketing copy
- popular tools block
- account / notification UI
- 画面を埋める decoration
- 過剰な tab

優先:

- 計算・設計情報
- compact
- high information density
- readable hierarchy
- engineering-oriented controls

## 2. Common UI

Radix Themes を優先。

例:

- Button
- TextField
- Select
- Switch / Checkbox
- Table
- Callout
- Tooltip

Layout は CSS Modules。

## 3. Theme

OS `prefers-color-scheme` に追従。
初期版では manual theme switch / persistence なし。
System font。

## 4. Page heading

Tool page:

- breadcrumb
- concise page title
- short sub description

大きな導入文は避ける。

## 5. Navigation

Desktop:

- left sidebar visible
- collapsible

Mobile:

- sidebar hidden
- hamburger drawer

Sidebar mode 将来想定:

- Navigation
- Favorites
- Parameter
- Settings

## 6. Section navigation

Tool page は vertical scroll。
small floating section navigation。

Mobile:

- current section name
- tap to expand
- ヘッダー直下の専用領域に配置し、入力操作を妨げない

Section link click:

- smooth scroll
- hash update

Manual scroll:

- current section display update
- URL hash は自動更新しない

`prefers-reduced-motion` 対応。

## 7. Breadcrumb

page title の直上。

例:

```text
Home / Tools / Voltage Divider
```

## 8. Feedback

計算成功時、結果 area を軽く highlight / fade。
派手な animation は避ける。

入力 error:

- danger style
- icon
- text
- color only に依存しない

## 9. External link

- new tab
- external-link icon
- appropriate `rel`

## 10. Result formatting

- unit 付き
- engineering notation
- 約 4 significant digits を基本
- 内部値は丸めない
