"use client";

import { useState } from "react";
import { PageHead } from "@/components/layout/Chrome";

export default function CalibratePage() {
  const [name, setName] = useState<string | null>(null);
  const [rows, setRows] = useState(0);

  return (
    <div className="p-4 sm:p-5">
      <PageHead crumbs={["各種設定", "補正設定"]} title="実査との補正" />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="card block cursor-pointer p-5">
          <p className="text-[12px] text-muted">実人票アップロード（スタブ）</p>
          <h2 className="mt-1 text-[15px] font-semibold">CSV / JSON を置く</h2>
          <p className="mt-2 text-[13px] leading-6 text-ink-soft">
            件数だけ数えます。学習も補正も行いません。
          </p>
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="mt-4 block text-[13px]"
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
            <p className="mt-3 text-[13px]">
              {name} <span className="text-muted">· {rows} 行 · 未学習</span>
            </p>
          )}
        </label>
        <aside className="card p-5">
          <p className="badge-synth">対象外</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-6 text-ink-soft">
            <li>実人と合成の誤差モデル</li>
            <li>セル補正・傾向スコア</li>
            <li>ブラウザ操作つき実験</li>
            <li>「日本人に聞きました」という言い換え</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
