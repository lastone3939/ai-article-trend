# 仮想日本人 — Synthetic Survey MVP

人口統計で加重した **仮想日本人パネル（1,000人）** にアンケートを投げ、選択と短い日本語理由を瞬時に集計する L1 Synthetic Survey です。

これは合成パネルです。実在の日本人回答者ではありません。実査との差分学習・補正は次フェーズ（補正画面は受け口のみ）です。

## 起動（1コマンド）

```bash
npm install && npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## デモ

1. トップの「コンビニ弁当のデモを見る」
2. 1,000人の仮想回答が走り、結果ダッシュボードへ
3. 構成比・クロス集計・理由テーマ・CSV/JSON 書き出し

そのほか：調査ビルダー、実行パネル、パネル一覧、補正スタブ。

## 技術

- Next.js App Router / TypeScript / Tailwind CSS
- 決定エンジン：TypeSafe `Choice` / `Score`（一貫性は stub）
- ブラウザ自動操作（L3）は対象外

## スクリプト

```bash
npm run dev      # 開発
npm run build    # 本番ビルド
npm run start    # 本番起動
```
