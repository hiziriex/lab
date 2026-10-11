# Hiziriex Lab 仕様書セット

このディレクトリは、`hiziriex/lab` の再構築と今後の機能追加で使用する仕様書セットです。

## 使い方

1. WSL の Linux ファイルシステム上に `hiziriex/lab` を clone する。
   - 推奨作業ディレクトリ: `~/work/lab/`
   - `/mnt/c/...` は開発ディレクトリとして使用しない。
2. この仕様書セットの内容をリポジトリ直下へ配置する。
3. Codex へ `codex-rebuild-prompt.md` の内容を渡す。
4. Codex は `AGENTS.md` と `docs/` 以下を正本として実装する。

## 仕様の優先順位

実装時は次の順で確認する。

1. `AGENTS.md`
2. `docs/requirements/`
3. `docs/architecture/`
4. `docs/ui/`
5. `docs/components/`
6. 対象ツールの `docs/tools/<tool-name>/`
7. `docs/adr/`

より具体的な仕様が、より一般的な仕様を補足する。

## 仕様変更

外部仕様を変更する実装では、コードだけを変更せず、同じ PR で関連する仕様書も更新する。

新しい計算ツールを追加する場合は、原則として以下を作成する。

```text
docs/tools/<tool-name>/
├─ requirements.md
├─ calculation-spec.md
├─ ui-spec.md
└─ test-cases.md
```

巨大な実装プロンプトへ仕様を追記し続けるのではなく、リポジトリ内の仕様書を正本として育てる。
