"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHead } from "@/components/layout/Chrome";
import {
  aggregateQuestion,
  crosstab,
  kpis,
  reasonThemes,
  type Crosstab,
} from "@/lib/aggregation/aggregate";
import { downloadText, toCsv } from "@/lib/aggregation/export";
import { saveRun, useLastRun } from "@/lib/store";
import type { RunResult } from "@/lib/survey/types";
import { fmtN, pct } from "@/lib/format";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">読み込み中…</div>}>
      <ResultsInner />
    </Suspense>
  );
}

function ResultsInner() {
  const stored = useLastRun();
  const params = useSearchParams();
  const demo = params.get("demo") === "1";
  const [fetched, setFetched] = useState<RunResult | null>(null);
  const result = stored ?? fetched;
  const loading = demo && !result;

  useEffect(() => {
    if (stored || !demo) return;
    let cancelled = false;
    fetch("/api/run")
      .then((r) => r.json())
      .then((data: RunResult) => {
        if (cancelled) return;
        try {
          saveRun(data);
        } catch {
          /* session full */
        }
        setFetched(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [demo, stored]);
  const [dim, setDim] = useState<"ageBand" | "gender" | "region">("ageBand");
  const [qIndex, setQIndex] = useState(0);
  const aggs = useMemo(
    () => (result ? result.survey.questions.map((q) => aggregateQuestion(result, q)) : []),
    [result],
  );
  const stats = useMemo(() => (result ? kpis(result) : null), [result]);
  const focus = result?.survey.questions[qIndex];
  const crosses = useMemo(
    () => (result && focus ? crosstab(result, focus.id, dim) : []),
    [result, focus, dim],
  );
  const themes = useMemo(
    () => (result && focus ? reasonThemes(result, focus.id) : []),
    [result, focus],
  );

  if (!result) {
    return (
      <div className="p-4 sm:p-5">
        <PageHead crumbs={["集計・分析", "リアルタイム集計"]} title="集計結果" />
        <div className="card max-w-xl p-6">
          <p className="text-[15px] font-semibold">
            {loading ? "仮想パネルを集計しています…" : "まだ結果がありません"}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-ink-soft">
            デモ調査を実行すると、仮想パネルの合成回答がここに並びます。
          </p>
          <Link href="/run?demo=1" className="btn btn-primary mt-4">
            デモを実行
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <PageHead
        crumbs={["集計・分析", "リアルタイム集計"]}
        title={result.survey.title}
        actions={
          <>
            <span className="badge-synth">仮想パネル／合成回答 · N={fmtN(result.sampleSize)}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                downloadText(`${result.survey.id}.csv`, toCsv(result), "text/csv;charset=utf-8")
              }
            >
              CSV
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                downloadText(
                  `${result.survey.id}.json`,
                  JSON.stringify(result, null, 2),
                  "application/json",
                )
              }
            >
              JSON
            </button>
            <Link href="/run" className="btn btn-primary">
              再実行
            </Link>
          </>
        }
      />

      <p className="mb-3 text-[12px] text-muted">
        {fmtN(result.sampleSize)} 人の合成回答 · {result.elapsedMs}ms · 実在の声ではありません
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="N（合成）" value={fmtN(stats?.n ?? 0)} note="仮想パネルからの抽出" />
        <Kpi
          label="意向平均 498円"
          value={stats?.mean498 != null ? stats.mean498.toFixed(2) : "—"}
          note="5件法"
        />
        <Kpi
          label="598円との差"
          value={stats?.drop != null ? `−${stats.drop.toFixed(2)}` : "—"}
          note="価格感度"
        />
        <Kpi
          label="平均確信度"
          value={stats ? pct(stats.avgConfidence * 100, 0) : "—"}
          note="Choice / Score"
        />
      </div>

      <div className="mt-4 space-y-3">
        {aggs.map((agg) => (
          <article key={agg.question.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="max-w-2xl">
                <p className="text-[11px] text-muted">{agg.question.id}</p>
                <h3 className="mt-1 text-[14px] font-semibold leading-snug">{agg.question.text}</h3>
              </div>
              {agg.mean != null && (
                <p className="text-[12px] text-muted">
                  平均 <span className="text-[16px] font-semibold text-ink">{agg.mean.toFixed(2)}</span>
                  {agg.topBox != null && <span className="ml-3">Top2 {pct(agg.topBox)}</span>}
                </p>
              )}
            </div>
            <div className="mt-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={agg.shares}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={108}
                    tick={{ fill: "#4A5568", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(43,108,176,0.06)" }}
                    formatter={(v) => [`${Number(v).toFixed(1)}%`, "構成比"]}
                    contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                  <Bar dataKey="pct" fill="#2B6CB0" radius={[0, 2, 2, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">クロス集計</h2>
          <div className="flex flex-wrap gap-2">
            <select
              className="select w-auto"
              value={qIndex}
              onChange={(e) => setQIndex(Number(e.target.value))}
            >
              {result.survey.questions.map((q, i) => (
                <option key={q.id} value={i}>
                  Q{i + 1}
                </option>
              ))}
            </select>
            {(["ageBand", "gender", "region"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDim(d)}
                className={`btn ${dim === d ? "btn-primary" : "btn-ghost"}`}
              >
                {d === "ageBand" ? "年齢" : d === "gender" ? "性別" : "地域"}
              </button>
            ))}
          </div>
        </div>
        <HeatTable rows={crosses} />
      </section>

      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">理由テーマ</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {themes.map((t) => (
            <article key={t.id} className="card p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">{t.label}</h3>
                <p className="text-[12px] text-muted">{t.count}</p>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100">
                <div className="h-1.5 bg-brand" style={{ width: `${t.share * 100}%` }} />
              </div>
              <ul className="mt-3 space-y-1.5 text-[13px] text-ink-soft">
                {t.samples.map((s) => (
                  <li key={s}>「{s}」</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{note}</p>
    </div>
  );
}

function HeatTable({ rows }: { rows: Crosstab[] }) {
  if (!rows.length) return null;
  const cols = rows[0]!.cols;
  return (
    <div className="card overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[640px] text-left text-[12px]">
        <thead>
          <tr className="border-b border-line bg-slate-50 text-muted">
            <th className="px-3 py-2.5 font-medium">選択肢</th>
            {cols.map((c) => (
              <th key={c.key} className="px-2 py-2.5 text-center font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rowKey} className="border-b border-line">
              <td className="px-3 py-2 text-ink-soft">{r.rowLabel}</td>
              {r.cols.map((c) => (
                <td key={c.key} className="px-1 py-1.5 text-center">
                  <span
                    className="inline-block min-w-[3rem] px-1 py-1"
                    style={{ background: `rgba(43,108,176,${Math.min(0.4, c.pct / 140)})` }}
                  >
                    {pct(c.pct, 0)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
