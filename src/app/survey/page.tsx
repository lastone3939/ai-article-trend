"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageIntro } from "@/components/layout/Chrome";
import { DEMO_SURVEY, emptySurvey } from "@/lib/survey/demo";
import type { Question, QuestionType, Survey } from "@/lib/survey/types";
import { saveRun, useDraftSurvey } from "@/lib/store";
import { AGE_BANDS, GENDERS, REGIONS, type AgeBand, type Gender, type Region } from "@/lib/personas/types";
import { AGE_LABEL, GENDER_LABEL, REGION_LABEL } from "@/lib/personas/demographics";

const TYPES: { id: QuestionType; label: string }[] = [
  { id: "single", label: "単一選択" },
  { id: "scale", label: "尺度" },
  { id: "multi", label: "複数（試作）" },
];

export default function SurveyBuilderPage() {
  const router = useRouter();
  const [survey, setSurvey] = useDraftSurvey();

  const valid = useMemo(
    () => survey.title.trim() && survey.questions.every((q) => q.text.trim()),
    [survey],
  );

  function updateQ(id: string, patch: Partial<Question>) {
    setSurvey((s) => ({
      ...s,
      questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  }

  function addQuestion() {
    const id = `q${Date.now()}`;
    setSurvey((s) => ({
      ...s,
      questions: [
        ...s.questions,
        {
          id,
          type: "single",
          text: "",
          options: [
            { id: `${id}a`, label: "選択肢 A" },
            { id: `${id}b`, label: "選択肢 B" },
          ],
        },
      ],
    }));
  }

  async function runNow() {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ survey }),
    });
    const data = await res.json();
    saveRun(data);
    router.push("/results");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageIntro
        kicker="Survey builder"
        title="質問を置く。"
        lede="設問とサンプルサイズ、任意のセグメント。保存はブラウザ内です。まずはデモ調査を崩さず、走らせてください。"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="border border-line bg-surface px-4 py-2 text-sm"
              onClick={() => setSurvey(DEMO_SURVEY)}
            >
              デモを読み込む
            </button>
            <button
              type="button"
              className="border border-line bg-surface px-4 py-2 text-sm"
              onClick={() => setSurvey(emptySurvey())}
            >
              白紙
            </button>
          </div>
        }
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="paper-card p-5">
            <label className="text-xs text-muted">調査名</label>
            <input
              className="mt-1 w-full border-b border-line bg-transparent py-2 font-serif text-2xl outline-none"
              value={survey.title}
              onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
            />
            <label className="mt-5 block text-xs text-muted">趣旨</label>
            <textarea
              className="mt-1 w-full resize-none bg-transparent text-sm leading-7 outline-none"
              rows={3}
              value={survey.description}
              onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
            />
          </div>

          {survey.questions.map((q, i) => (
            <article key={q.id} className="paper-card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] text-vermillion">Q{i + 1}</p>
                <div className="flex items-center gap-2">
                  <select
                    className="border border-line bg-surface px-2 py-1 text-xs"
                    value={q.type}
                    onChange={(e) => {
                      const type = e.target.value as QuestionType;
                      updateQ(q.id, {
                        type,
                        scale:
                          type === "scale"
                            ? { min: 1, max: 5, minLabel: "低い", maxLabel: "高い" }
                            : undefined,
                        options:
                          type === "scale"
                            ? undefined
                            : q.options ?? [
                                { id: `${q.id}a`, label: "はい" },
                                { id: `${q.id}b`, label: "いいえ" },
                              ],
                      });
                    }}
                  >
                    {TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {survey.questions.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-vermillion"
                      onClick={() =>
                        setSurvey((s) => ({
                          ...s,
                          questions: s.questions.filter((x) => x.id !== q.id),
                        }))
                      }
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
              <textarea
                className="mt-3 w-full resize-none bg-transparent font-serif text-lg leading-relaxed outline-none"
                rows={2}
                placeholder="設問文"
                value={q.text}
                onChange={(e) => updateQ(q.id, { text: e.target.value })}
              />
              {q.type === "scale" && q.scale && (
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                  <span>{q.scale.minLabel}</span>
                  <span className="font-mono">
                    {q.scale.min} — {q.scale.max}
                  </span>
                  <span>{q.scale.maxLabel}</span>
                </div>
              )}
              {q.options && (
                <ul className="mt-4 space-y-2">
                  {q.options.map((opt, oi) => (
                    <li key={opt.id} className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted">{oi + 1}</span>
                      <input
                        className="w-full border-b border-line bg-transparent py-1 text-sm outline-none"
                        value={opt.label}
                        onChange={(e) =>
                          updateQ(q.id, {
                            options: q.options?.map((o) =>
                              o.id === opt.id ? { ...o, label: e.target.value } : o,
                            ),
                          })
                        }
                      />
                      {(q.options?.length ?? 0) > 2 && (
                        <button
                          type="button"
                          className="text-[11px] text-muted"
                          onClick={() =>
                            updateQ(q.id, {
                              options: q.options?.filter((o) => o.id !== opt.id),
                            })
                          }
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      className="text-xs text-vermillion"
                      onClick={() =>
                        updateQ(q.id, {
                          options: [
                            ...(q.options ?? []),
                            { id: `${q.id}${Date.now()}`, label: "新しい選択肢" },
                          ],
                        })
                      }
                    >
                      選択肢を足す
                    </button>
                  </li>
                </ul>
              )}
            </article>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full border border-dashed border-line-strong py-3 text-sm text-muted hover:border-ink hover:text-ink"
          >
            設問を追加
          </button>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="paper-card p-5">
            <p className="text-xs text-muted">サンプルサイズ</p>
            <p className="mt-1 font-serif text-3xl">{survey.sampleSize}</p>
            <input
              type="range"
              min={50}
              max={1000}
              step={50}
              value={survey.sampleSize}
              onChange={(e) => setSurvey({ ...survey, sampleSize: Number(e.target.value) })}
              className="mt-3 w-full accent-vermillion"
            />
            <p className="mt-2 text-[11px] leading-5 text-muted">
              上限 1,000。人口加重パネルからの先頭抽出です。
            </p>
          </div>

          <FilterCard
            survey={survey}
            onChange={(filters) => setSurvey({ ...survey, filters })}
          />

          <button
            type="button"
            disabled={!valid}
            onClick={() => router.push("/run")}
            className="w-full bg-ink py-3 text-sm text-paper disabled:opacity-40"
          >
            実行パネルへ
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={runNow}
            className="w-full border border-ink py-3 text-sm disabled:opacity-40"
          >
            いま集計する
          </button>
        </aside>
      </div>
    </div>
  );
}

function FilterCard({
  survey,
  onChange,
}: {
  survey: Survey;
  onChange: (f: Survey["filters"]) => void;
}) {
  const f = survey.filters ?? {};
  function toggle<T extends string>(key: "ageBands" | "genders" | "regions", value: T) {
    const cur = (f[key] as T[] | undefined) ?? [];
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    onChange({ ...f, [key]: next.length ? next : undefined });
  }
  return (
    <div className="paper-card p-5">
      <p className="text-xs text-muted">セグメント（任意）</p>
      <p className="mt-3 text-[11px] text-muted">年齢</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {AGE_BANDS.map((b) => (
          <Chip key={b} on={f.ageBands?.includes(b)} onClick={() => toggle<AgeBand>("ageBands", b)}>
            {AGE_LABEL[b]}
          </Chip>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">性別</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {GENDERS.map((b) => (
          <Chip key={b} on={f.genders?.includes(b)} onClick={() => toggle<Gender>("genders", b)}>
            {GENDER_LABEL[b]}
          </Chip>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">地域</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {REGIONS.map((b) => (
          <Chip key={b} on={f.regions?.includes(b)} onClick={() => toggle<Region>("regions", b)}>
            {REGION_LABEL[b]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-[11px] ${on ? "bg-ink text-paper" : "bg-chip text-ink-soft"}`}
    >
      {children}
    </button>
  );
}
