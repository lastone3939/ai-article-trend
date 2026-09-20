"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHead } from "@/components/layout/Chrome";
import { DEMO_SURVEY } from "@/lib/survey/demo";
import { saveRun, useDraftSurvey } from "@/lib/store";
import type { RunResult } from "@/lib/survey/types";
import { fmtN } from "@/lib/format";

const PHASES = ["サンプリング", "意思決定", "理由生成", "集計"] as const;

function RunInner() {
  const router = useRouter();
  const params = useSearchParams();
  const demo = params.get("demo") === "1";
  const [draft] = useDraftSurvey();
  const survey = demo ? DEMO_SURVEY : draft;
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<(typeof PHASES)[number]>("サンプリング");
  const [ticker, setTicker] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<RunResult | null>(null);
  const startedRef = useRef(false);
  const preview = useMemo(() => survey.questions.slice(0, 6), [survey]);

  useEffect(() => {
    if (!demo) return;
    const t = window.setTimeout(() => void start(), 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  async function start() {
    if (startedRef.current) return;
    startedRef.current = true;
    setRunning(true);
    setError(null);
    setProgress(4);
    setTicker([]);
    const started = Date.now();
    const anim = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(92, p + Math.random() * 7 + 2);
        if (next < 28) setPhase("サンプリング");
        else if (next < 58) setPhase("意思決定");
        else if (next < 82) setPhase("理由生成");
        else setPhase("集計");
        return next;
      });
    }, 90);
    try {
      const res = demo
        ? await fetch("/api/run")
        : await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ survey }),
          });
      if (!res.ok) throw new Error("実行に失敗しました");
      const data = (await res.json()) as RunResult;
      resultRef.current = data;
      try {
        saveRun(data);
      } catch {
        sessionStorage.setItem("kasou:has-run", "1");
      }
      const lines = data.answers
        .filter((_, i) => i % Math.ceil(data.answers.length / 8) === 0)
        .slice(0, 8)
        .map((a) => {
          const p = data.personas.find((x) => x.id === a.personaId);
          return `${p?.displayName ?? a.personaId}（${p?.age}・${p?.prefecture}）— ${a.selectedLabel}`;
        });
      setTicker(lines);
      await new Promise((r) => setTimeout(r, Math.max(0, 1400 - (Date.now() - started))));
      setProgress(100);
      setPhase("集計");
      await new Promise((r) => setTimeout(r, 280));
      router.push(demo ? "/results?demo=1" : "/results");
    } catch (e) {
      startedRef.current = false;
      setError(e instanceof Error ? e.message : "エラー");
      setRunning(false);
    } finally {
      window.clearInterval(anim);
    }
  }

  return (
    <div className="p-4 sm:p-5">
      <PageHead
        crumbs={["配信管理", "配信スケジュール"]}
        title="調査の実行"
        actions={<span className="badge-synth">仮想パネル／合成回答</span>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted">{survey.id}</p>
              <h2 className="mt-1 text-[16px] font-semibold">{survey.title}</h2>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-[13px]">
            <div>
              <dt className="text-[11px] text-muted">N</dt>
              <dd className="text-xl font-semibold">{fmtN(survey.sampleSize)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted">設問</dt>
              <dd className="text-xl font-semibold">{survey.questions.length}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted">カテゴリ</dt>
              <dd className="pt-1">{survey.category}</dd>
            </div>
          </dl>
          <ol className="mt-4 space-y-2 text-[13px] text-ink-soft">
            {preview.map((q, i) => (
              <li key={q.id}>
                <span className="mr-2 text-muted">Q{i + 1}</span>
                {q.text}
              </li>
            ))}
          </ol>
          {!running && (
            <button type="button" className="btn btn-primary mt-6" onClick={() => void start()}>
              {fmtN(survey.sampleSize)}人の仮想パネルに聞く
            </button>
          )}
          {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
        </section>
        <section className="card p-5">
          <div className="flex items-center justify-between text-[12px] text-muted">
            <span>配信状況</span>
            <span>{phase}</span>
          </div>
          <div className="relative mx-auto mt-6 grid h-36 w-36 place-items-center">
            <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#2B6CB0"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl font-semibold">{Math.round(progress)}</p>
              <p className="text-[10px] text-muted">%</p>
            </div>
          </div>
          <div className="mt-4 flex gap-1">
            {PHASES.map((p) => (
              <div
                key={p}
                className={`h-1.5 flex-1 ${phase === p || progress === 100 ? "bg-brand" : "bg-slate-200"}`}
              />
            ))}
          </div>
          <div className="mt-4 min-h-[8rem] space-y-2 text-[12px] leading-6 text-ink-soft">
            {ticker.length === 0 && (
              <p className="text-muted">
                {running ? "合成回答が流れます。" : "実行すると回答の抜粋が並びます。"}
              </p>
            )}
            {ticker.map((line) => (
              <p key={line} className="border-b border-line pb-2">
                {line}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function RunPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">読み込み中…</div>}>
      <RunInner />
    </Suspense>
  );
}
