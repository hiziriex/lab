# 開発環境

## 1. 基本方針

開発環境は WSL 側へ完結させる。
Windows 側は主に Browser と、必要に応じて VS Code に使用する。

Node / pnpm / Git / GitHub CLI / Codex の実行は WSL 側を基本とする。

## 2. 作業ディレクトリ

推奨:

```text
~/work/lab/
```

WSL の Linux filesystem 上へ repository を置く。
`/mnt/c/...` を開発 repository の配置先にしない。

## 3. 必要 Tool

WSL 側:

- Git
- GitHub CLI (`gh`)
- nvm
- Node.js 24 LTS
- pnpm
- build-essential
- fonts-noto-cjk（Linux browser 検証用の日本語 system font）
- Codex

GitHub CLI は WSL 側で認証済みとする。
未認証の場合は人間が `gh auth login` を行う。

## 4. Node / pnpm

- `.nvmrc` で Node 24 を指定。
- `package.json` の `packageManager` に具体的な pnpm version を指定。
- `pnpm-lock.yaml` を正本として commit。
- Stable release のみ使用。

## 5. VS Code

必要に応じて VS Code + WSL 拡張で `~/work/lab/` を WSL context から開く。
日常操作を VS Code 必須にはしない。

## 6. Dev server

Astro の dev server は WSL 側で起動する。

```bash
pnpm dev
```

Windows 側 browser から `localhost` へアクセスして確認する。

## 7. Setup script

`scripts/setup-dev.sh` を用意する。

目的:

- 必要 tool の存在確認
- version 確認
- dependency install 支援
- 開発開始手順の案内

GitHub login 等の人間操作を無理に自動化しない。
セットアップ手順はこの節を入口とする。repository を WSL の Linux filesystem 上に配置してから実行する。

```bash
source ~/.nvm/nvm.sh
nvm install
npm install --global pnpm@12.10.1
gh auth login --hostname github.com --git-protocol https --web
bash scripts/setup-dev.sh
pnpm exec playwright install --with-deps
sudo apt-get update
sudo apt-get install -y fonts-noto-cjk
bash scripts/check-japanese-fonts.sh
pnpm dev
```

GitHub CLI が認証済みの場合は `gh auth login` を省略する。
Windows 側の browser から `http://localhost:4321/lab/` にアクセスする。
検証項目と実行方針は [Testing Strategy](testing-strategy.md) を参照する。

## 8. 日本語フォント

Ubuntu / WSL は `sudo apt-get update` と `sudo apt-get install -y fonts-noto-cjk` で導入し、`bash scripts/check-japanese-fonts.sh` で確認する。
sudo を使えない環境では、同じ OS package の NotoSansCJK-Regular / Bold をユーザー用 system font 領域へ導入して fontconfig に登録してもよい。
フォントは repository / build /公開サイトへコピーしない。OS のフォントとしてのみ使用する。

## 9. Codex project-local設定

Git管理する [`.codex/config.toml`](../../.codex/config.toml) は、信頼済みの本repositoryで開始するCodex sessionへ適用する。グローバルの `~/.codex/config.toml` は変更しない。承認判断の正本は [Approval Policy](../automation/approval-policy.md) と、その時点の人間によるタスク承認である。

`approval_policy = "on-request"`、`approvals_reviewer = "auto_review"`、`sandbox_mode = "workspace-write"` を使用する。Hiziriex Lab固有の判断条件は `auto_review.extra_policy` へ追記し、既定reviewer policyを置換する `auto_review.policy` は設定しない。managed設定や起動時のoverrideが優先するため、ファイル追加だけで実行中のsessionへ反映されたとは扱わず、新規sessionの実効設定を確認する。

Auto-reviewはsandbox外の権限を要求する操作など、承認要求が生じた場合に動作する。sandbox内で許可された操作や既存allow ruleで通る操作の成功は、自動承認の証拠ではない。baseline変更などをsandboxが許可していても、WorkerはApproval PolicyのASK / DENYを守る。設定は全操作への強制gateやbranch protectionの代わりにはならない。

reviewerが拒否した場合、Workerは別経路で迂回せず、安全な代替がなければ停止して人間へ確認する。人間確認は必ずしもpermission dialogで直接表示されるものではなく、Workerの確認質問となる場合がある。危険操作を実行してescalationを試さない。

2026-10-15、Codex CLI 0.162.1の新規app-server threadで以下を検証した。

| 確認対象                                                                                         | 結果                                                                                                              |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| strict config / 実効設定                                                                         | `on-request` / `auto_review` / `workspaceWrite`、network access無効                                               |
| `git status --short --branch`                                                                    | sandbox内で成功。reviewerの承認を伴う操作ではない                                                                 |
| `env GH_PAGER=cat gh run list --repo hiziriex/lab --limit 1 --json databaseId,status,conclusion` | sandbox内の接続失敗後、同一コマンドの昇格要求をAuto-reviewが承認し成功                                            |
| 判定イベント                                                                                     | `item/autoApprovalReview/completed`、`decisionSource=agent`、`status=approved`、risk `low` / authorization `high` |
| 既存metadata test                                                                                | Node.js 24で `pnpm exec vitest run tests/unit/release-metadata.test.ts`、9件成功                                  |
| baseline変更の仮想提案                                                                           | WorkerがASKと判断し、対象画像の差分確認・明示承認を求める質問を出力。baseline変更・権限要求は未実行               |
| main直接commit / pushの仮想提案                                                                  | WorkerがDENYと判断し、承認質問の対象にもせず未実行                                                                |

危険操作のreviewerへの実申請や、拒否からpermission dialogへ移る経路は検証していない。仮想提案の結果をreviewer自身の拒否イベントとして扱わない。

設定仕様と挙動の参照先: [公式設定リファレンス](https://learn.chatgpt.com/docs/config-file/config-reference)、[Auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review)。
