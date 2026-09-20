"use client";

import { useState } from "react";
import { PageIntro } from "@/components/layout/Chrome";

export default function CalibratePage() {
  const [name, setName] = useState<string | null>(null);
  const [rows, setRows] = useState(0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageIntro
        kicker="Calibration stub"
        title="実査との差分を、後で学ぶ。"
        lede="品質の本丸はここです。いまは受け口だけ。ファイルは読み込みません。モデルは更新しません。"
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <label className="paper-card block cursor-pointer p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Upload real survey
          </p>
          <h2 className="mt-2 font-serif text-2xl">実人票を置く。</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-ink-soft">
            CSV / JSON を選択すると、件数だけ数えます。差分学習・ウェイト補正・セル補正は次フェーズです。
          </p>
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="mt-6 block text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setName(file.name);
              const text = await file.text();
              if (file.name.endsWith(".json")) {
                try {
                  const parsed = JSON.parse(text) as unknown;
                  setRows(Array.isArray(parsed) ? parsed.length : 1);
                } catch {
                  setRows(0);
                }
              } else {
                setRows(Math.max(0, text.split(/\r?\n/).filter((l) => l.trim()).length - 1));
              }
            }}
          />
          {name && (
            <p className="mt-4 text-sm">
              {name}{" "}
              <span className="text-muted">
                · {rows} 行を確認 · 学習は行っていません
              </span>
            </p>
          )}
        </label>

        <aside className="paper-card p-8">
          <p className="font-mono text-[11px] text-vermillion">OUT OF SCOPE</p>
          <h3 className="mt-2 font-serif text-xl">まだ、やらないこと</h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
            <li>実人と合成の誤差モデル</li>
            <li>セル補正・傾向スコア</li>
            <li>ブラウザ操作つき社会実験（L3）</li>
            <li>「日本人に聞きました」という言い換え</li>
          </ul>
          <p className="mt-6 text-xs leading-6 text-muted">
            TypeSafe Choice / Score は一貫性判定の口です。補正が載ったとき、同じインターフェイスで再スコアします。
          </p>
        </aside>
      </div>
    </div>
  );
}
