# GitHub 側の設定（人間が実施）

この文書は必要な設定の一覧です。再構築時に repository settings は変更していません。

- main の Ruleset / branch protection: PR 必須、force push 禁止、必須 CI。
- 必須チェック: CI の quality / unit / build / browsers / metrics。初回 CI の実際の check 名を確認して選択する。
- 個人開発のため、他者 review 1 件を必須にしない。
- Squash merge を有効化し、PR title を squash commit message に使用する。
- merge 後の source branch 自動削除を有効化する。
- Pages の Source: GitHub Actions。既存の branch publish があれば無効にする。
- github-pages environment から正式 version tag の deploy を許可する。
- Actions の既定権限は read。Release / Pages job の必要権限だけ workflow で付与する。
- label: bug / feature / improvement / documentation / ui / tool / infra。
- Dependabot の自動 merge は有効化しない。
- 初回正式 version は人間承認済みの `0.1.0`。package version / CHANGELOG / tag / GitHub Release を同期する。

## 公開前の確認

Unreleased の変更を確定 version の CHANGELOG section へ移し、package version と同期する。
人間が承認した後、作業ブランチから PR → Squash merge → release-check → tag の順で進める。
Release workflow は tag が main に含まれることと package / CHANGELOG の一致を検証する。
workflow_dispatch は公開済み Release の再 deploy 専用で、新規公開を迂回しない。

## 初回の画像比較

Desktop Chromium と Pixel 7 の候補画像を人間が確認し、承認後に tests/e2e の snapshot に登録する。
未承認の間は test:visual が失敗するため、CI green / PR 準備完了とは扱わない。


## 初回公開準備で確認した既存設定（2026-10-11）

- Pages Source は GitHub Actions（build_type: workflow）、URL は https://hiziriex.github.io/lab/ 、HTTPS enforced。
- Actions の既定 workflow 権限は read。Release / Pages job の write 権限は既存 workflow に明示する。
- github-pages environment は custom deployment policy で main branch のみ許可。release workflow は tag を対象に deploy するため、初回公開前に tag の許可が必要。
- 最小限の追加候補は type: tag / name: v0.1.0。既存 main の許可を保持する。repository settings 変更は別途人間承認を得てから行う。
