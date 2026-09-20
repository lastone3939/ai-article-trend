"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageIntro } from "@/components/layout/Chrome";
import {
  aggregateQuestion,
  crosstab,
  kpis,
  reasonThemes,
  type Crosstab,
} from "@/lib/aggregation/aggregate";
import { downloadText, toCsv } from "@/lib/aggregation/export";
import { useLastRun } from "@/lib/store";
import { fmtN, pct } from "@/lib/format";

export default function ResultsPage() {
  const result = useLastRun();
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
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <PageIntro kicker="Results" title="まだ、結果がない。" />
        <div className="paper-card mt-10 max-w-xl p-8">
          <p className="font-serif text-xl">空の机。</p>
          <p className="mt-3 text-sm leading-7 text-ink-soft">
            合成パネルに一度聞いてください。デモなら、コンビニ弁当の意向がすぐに並びます。
          </p>
          <Link
            href="/run?demo=1"
            className="mt-6 inline-block bg-vermillion px-5 py-2.5 text-sm text-surface"
          >
            デモを実行
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageIntro
        kicker="Results dashboard"
        title={result.survey.title}
        lede={`${fmtN(result.sampleSize)} 人の仮想回答。所要 ${result.elapsedMs}ms。実在の声ではありません。`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="border border-line bg-surface px-3 py-2 text-xs"
              onClick={() =>
                downloadText(
                  `${result.survey.id}.csv`,
                  toCsv(result),
                  "text/csv;charset=utf-8",
                )
              }
            >
              CSV
            </button>
            <button
              type="button"
              className="border border-line bg-surface px-3 py-2 text-xs"
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
            <Link href="/run" className="bg-ink px-3 py-2 text-xs text-paper">
              再実行
            </Link>
          </div>
        }
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="N（合成）" value={fmtN(stats?.n ?? 0)} note="加重パネルからの抽出" />
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
          note="TypeSafe Score"
        />
      </div>

      <div className="mt-10 space-y-4">
        {aggs.map((agg) => (
          <article key={agg.question.id} className="paper-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <p className="font-mono text-[11px] text-vermillion">{agg.question.id}</p>
                <h3 className="mt-1 font-serif text-xl leading-snug">{agg.question.text}</h3>
              </div>
              {agg.mean != null && (
                <p className="text-sm text-muted">
                  平均 <span className="font-serif text-lg text-ink">{agg.mean.toFixed(2)}</span>
                  {agg.topBox != null && (
                    <span className="ml-3">Top2 {pct(agg.topBox)}</span>
                  )}
                </p>
              )}
            </div>
            <div className="mt-5 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={agg.shares}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="#E8E0D0" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={108}
                    tick={{ fill: "#4A433A", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(196,60,36,0.06)" }}
                    formatter={(v) => [`${Number(v).toFixed(1)}%`, "構成比"]}
                    contentStyle={{
                      background: "#FFFBF4",
                      border: "1px solid #D6CCB8",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="pct" fill="#C43C24" radius={[0, 2, 2, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Crosstab</p>
            <h2 className="mt-1 font-serif text-2xl">セグメントで割る。</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="border border-line bg-surface px-2 py-1.5 text-xs"
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
                className={`px-3 py-1.5 text-xs ${dim === d ? "bg-ink text-paper" : "bg-chip"}`}
              >
                {d === "ageBand" ? "年齢" : d === "gender" ? "性別" : "地域"}
              </button>
            ))}
          </div>
        </div>
        <HeatTable rows={crosses} />
      </section>

      <section className="mt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Reason themes
        </p>
        <h2 className="mt-1 font-serif text-2xl">理由の地層。</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {themes.map((t) => (
            <article key={t.id} className="paper-card p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-lg">{t.label}</h3>
                <p className="font-mono text-xs text-muted">{t.count}</p>
              </div>
              <div className="mt-2 h-1 bg-chip">
                <div className="h-1 bg-indigo" style={{ width: `${t.share * 100}%` }} />
              </div>
              <ul className="mt-4 space-y-2">
                {t.samples.map((s) => (
                  <li key={s} className="text-sm leading-6 text-ink-soft">
                    「{s}」
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {themes.length === 0 && (
            <p className="text-sm text-muted">この設問ではテーマが抽出できませんでした。</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="paper-card p-5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{note}</p>
    </div>
  );
}

function HeatTable({ rows }: { rows: Crosstab[] }) {
  if (!rows.length) return null;
  const cols = rows[0]!.cols;
  return (
    <div className="paper-card mt-5 overflow-x-auto scrollbar-thin">
      <table className="min-w-[640px] w-full text-left text-xs">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-3 py-3 font-normal">選択肢</th>
            {cols.map((c) => (
              <th key={c.key} className="px-2 py-3 text-center font-normal">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rowKey} className="border-b border-line/70">
              <td className="px-3 py-2.5 text-ink-soft">{r.rowLabel}</td>
              {r.cols.map((c) => (
                <td key={c.key} className="px-1 py-1.5 text-center">
                  <span
                    className="inline-block min-w-[3.2rem] px-1 py-1"
                    style={{
                      background: `rgba(196,60,36,${Math.min(0.45, c.pct / 140)})`,
                    }}
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
