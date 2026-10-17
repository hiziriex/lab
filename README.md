# Hiziriex Lab

電子回路・電源設計に役立つ計算ツールを公開する、回路設計者向けのサイトです。

**[公開サイトを開く](https://hiziriex.github.io/lab/)**

## 利用できるツール

### [分圧抵抗計算](https://hiziriex.github.io/lab/tools/voltage-divider/)

入力電圧 Vin と目標出力電圧 Vout から、分圧抵抗 R1 / R2 の組み合わせを探して比較できます。

- E系列（E12 / E24）の抵抗値から、目標電圧との誤差が小さい候補を上位5件表示。
- 候補ごとに、抵抗値、計算上の実際の Vout、絶対誤差・相対誤差（%）、分圧電流、各抵抗の消費電力を表示。
- 分圧電流の目安を指定して探索でき、比較したい候補をチェックして確認可能。
- Vin sweepグラフで、注目候補の出力特性と比較候補の正負付きVout誤差を切り替えて確認可能。
- A/Bカーソルをclick / tap・drag・Vinの直接入力で配置し、2点間の差分と傾きを測定可能。A/Bの間隔を保った連動移動にも対応。
- Desktop / Mobile、light / darkに対応。スマートフォンでは候補表を横にスクロールできます。

## 使い方

1. [分圧抵抗計算を開く](https://hiziriex.github.io/lab/tools/voltage-divider/)。
2. 入力電圧 Vin、目標電圧 Vout、抵抗系列を設定します。必要に応じて「分圧電流 Idiv を指定」を有効にし、電流の目安を入力します。
3. 「計算」を押し、候補の出力電圧・誤差・電流・消費電力を比較します。入力を変更したら再計算してください。

グラフを開き、Vin範囲と表示候補を選ぶと、入力電圧による出力の変化を確認できます。候補表のcheckboxは比較対象、行のclickとグラフの「表示候補」は注目候補の選択に使います。

計算式と候補の選び方は、[ツールページ内の説明](https://hiziriex.github.io/lab/tools/voltage-divider/#formula)で確認できます。
負荷電流・抵抗公差・温度変化は計算に含みません。計算結果を設計の補助として利用し、実回路で確認してください。

## 現在のバージョン

**[v0.2.0](https://github.com/hiziriex/lab/releases/tag/v0.2.0)**。更新内容は[リリース一覧](https://github.com/hiziriex/lab/releases)で確認できます。

## License

ソースコードは [MIT License](LICENSE) です。記事・説明文・図・回路図・画像等の無断転載・再配布は禁止します（法律上認められる引用を除く）。

## Development

開発手順・設計の詳細は `docs/`、AI / 開発運用の入口は `AGENTS.md` を参照してください。

- [開発・AI運用ルール](AGENTS.md)：仕様の読み方、実装方針、開発時の遵守事項。
- [開発環境](docs/architecture/development-environment.md)：WSL / Node.js / pnpm の準備と開発開始手順。
- [Git / PR運用](docs/architecture/github-workflow.md)：branch、commit、PRの運用。
- [Release / Deploy](docs/architecture/release-deployment.md)：version管理と公開手順。
- [Testing](docs/architecture/testing-strategy.md)：テスト構成とブラウザ・アクセシビリティ・画像比較の検証方針。
- [AI承認ルール](docs/automation/approval-policy.md)：自動実行できる範囲と人間の承認が必要な操作。
