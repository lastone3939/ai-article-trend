# 仮想日本人 — Synthetic Survey

仮想日本人パネル（合成・1,000人）にアンケートを投げ、その場で集計します。実在の回答者ではありません。

## 動かす

```bash
npm install && npm run dev
```

http://localhost:3000 を開く → 右上の **デモを実行** を押す。

## 任意：TypeSafe Jev

`.env.local` に書くと、Choice / Score を本番 Jev に投げます（同じ人の設問は一括）。キーが無い・失敗したときは、ローカルの一貫した Choice/Score に落ちます。デモはオフラインでも動きます。

```bash
TYPESAFE_API_KEY=your_key
```

Vercel なら同じ変数を設定。無くても起動できます。
