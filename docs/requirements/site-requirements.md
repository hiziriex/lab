# サイト要件

## 1. 目的

Hiziriex Lab は、電子回路・電源設計に役立つ計算ツールと技術資料を提供するエンジニア向けサイトとする。

初期 description は仮で以下とする。

> 電子回路・電源設計に役立つ計算ツールと技術資料をまとめたエンジニア向けサイト。

正式な目的文は後で変更可能とする。

## 2. サイト基本情報

- サイト名: `Hiziriex Lab`
- repository: `hiziriex/lab`
- 作者表示: `ひじり`
- 作者付近から X/Twitter アカウントへリンクする
- 問い合わせ窓口: GitHub Issues
- 初期言語: 日本語
- サイト内検索: 導入しない

X/Twitter URL が確定していない場合は推測せず、設定値として未確定にする。

## 3. ページ

初期ページ:

- `/`
- `/about/`
- 404 page
- `/tools/voltage-divider/`

トップページは大きな Hero を持たず、各ツール・About・GitHub 等へのリンクを中心とする。

## 4. About

以下を掲載する。

- サイトの目的
- 作者: ひじり
- X/Twitter
- 現在のバージョン
- GitHub repository
- 更新履歴 → GitHub Releases
- License
- 簡単なプライバシー説明
- 計算結果に関する免責

専用のプライバシーポリシー / 利用規約ページは初期版では作らない。

### プライバシー

初期版では以下を前提とする。

- Login なし
- Analytics なし
- 個人情報収集なし
- Cookie を積極的に利用しない

将来これらが変わる場合は専用ページを検討する。

### 免責

計算結果は設計判断を補助するものであり、最終的な設計・安全性・適合性は利用者が確認する旨を記載する。
ツール固有の重要な注意事項がある場合のみ、そのツール側へ個別表示する。

## 5. GitHub 導線

フッターまたは About に以下を置く。

- GitHub icon + `hiziriex/lab`
- `更新履歴` → GitHub Releases
- `問題を報告` → Bug report 用 Issue 作成画面

外部リンクは原則、新規タブ + 外部リンク icon + 適切な `rel` を使用する。

## 6. License

### Source code

MIT License。

### Content

記事・説明文・図・回路図・画像等は、無断転載・再配布を禁止する。
法律上認められる引用まで禁止する表現にはしない。

## 7. URL

公開 URL は「種類 + 英語 slug」。

例:

- `/tools/voltage-divider/`
- `/articles/buck-loop-compensation/`
- `/about/`

カテゴリ・日付は URL に含めず metadata として管理する。
trailing slash ありで統一する。

## 8. HTML title

- Top: `Hiziriex Lab`
- その他: `ページ名 | Hiziriex Lab`

## 9. 検索エンジン

正式 GitHub Pages 公開版は検索エンジンの crawl / index を許可する。

- `robots.txt`
- sitemap
- canonical URL
- title / description
- 最小限の OGP metadata

専用 OGP image は初期版では不要。

## 10. Favicon / Manifest

初期は `HL` 等の簡単な仮 favicon を使用する。

Web App Manifest:

- `name`: `Hiziriex Lab`
- `short_name`: `Hiziriex Lab`

PWA 機能自体は初期版では実装しない。

## 11. Version 表示

公開サイト上に現在の version を表示する。
目立たせすぎず、フッターや About から確認できるようにする。
