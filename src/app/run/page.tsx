"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro } from "@/components/layout/Chrome";
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

  const preview = useMemo(() => survey.questions.slice(0, 4), [survey]);

  useEffect(() => {
    if (demo && !running && !resultRef.current) {
      const t = setTimeout(() => void start(), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  async function start() {
    if (running) return;
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
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ survey }),
      });
      if (!res.ok) throw new Error("実行に失敗しました");
      const data = (await res.json()) as RunResult;
      resultRef.current = data;
      saveRun(data);

      const lines = data.answers
        .filter((_, i) => i % Math.ceil(data.answers.length / 8) === 0)
        .slice(0, 8)
        .map((a) => {
          const p = data.personas.find((x) => x.id === a.personaId);
          return `${p?.displayName ?? a.personaId}（${p?.age}・${p?.prefecture}）— ${a.selectedLabel}`;
        });
      setTicker(lines);
      const remain = Math.max(0, 1600 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, remain));
      setProgress(100);
      setPhase("集計");
      await new Promise((r) => setTimeout(r, 350));
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
      setRunning(false);
    } finally {
      window.clearInterval(anim);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageIntro
        kicker="Run panel"
        title={running ? "パネルが、答えている。" : "いま、聞く。"}
        lede={survey.description}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="paper-card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] text-muted">{survey.id}</p>
              <h2 className="mt-1 font-serif text-2xl">{survey.title}</h2>
            </div>
            <span className="bg-vermillion px-2 py-1 text-[10px] tracking-wider text-surface">
              SYNTHETIC
            </span>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">N</dt>
              <dd className="font-serif text-2xl">{fmtN(survey.sampleSize)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">設問</dt>
              <dd className="font-serif text-2xl">{survey.questions.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">カテゴリ</dt>
              <dd className="mt-1 text-sm">{survey.category}</dd>
            </div>
          </dl>
          <ol className="mt-6 space-y-3">
            {preview.map((q, i) => (
              <li key={q.id} className="flex gap-3 text-sm leading-6 text-ink-soft">
                <span className="font-mono text-[11px] text-vermillion">Q{i + 1}</span>
                <span>{q.text}</span>
              </li>
            ))}
            {survey.questions.length > preview.length && (
              <li className="text-xs text-muted">ほか {survey.questions.length - preview.length} 問</li>
            )}
          </ol>
          {!running && (
            <button
              type="button"
              onClick={() => void start()}
              className="mt-8 bg-vermillion px-6 py-3 text-sm text-surface hover:bg-vermillion-deep"
            >
              {fmtN(survey.sampleSize)} 人に聞く
            </button>
          )}
          {error && <p className="mt-4 text-sm text-vermillion">{error}</p>}
        </div>

        <div className="paper-card flex flex-col p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Live
            </p>
            <p className="text-xs text-muted">{phase}</p>
          </div>
          <div className="relative mx-auto mt-8 grid h-40 w-40 place-items-center">
            <svg viewBox="0 0 100 100" className="-rotate-90 h-40 w-40">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E8E0D0" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#C43C24"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-serif text-3xl">{Math.round(progress)}</p>
              <p className="font-mono text-[10px] text-muted">PERCENT</p>
            </div>
          </div>
          <div className="mt-6 flex gap-1">
            {PHASES.map((p) => (
              <div
                key={p}
                className={`h-1 flex-1 ${phase === p || progress === 100 ? "bg-vermillion" : "bg-chip"}`}
              />
            ))}
          </div>
          <div className="ticker mt-6 min-h-[9rem] space-y-2 overflow-hidden text-xs leading-6 text-ink-soft">
            {ticker.length === 0 && (
              <p className="text-muted">
                {running ? "仮想回答が流れ始めます。" : "実行すると、回答の抜粋がここに並びます。"}
              </p>
            )}
            {ticker.map((line) => (
              <p key={line} className="rise border-b border-line/70 pb-2">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RunPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-muted">読み込み中…</div>}>
      <RunInner />
    </Suspense>
  );
}
