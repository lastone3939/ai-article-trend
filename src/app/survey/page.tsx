"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Gift, Mail, Plus } from "lucide-react";
import { PageHead } from "@/components/layout/Chrome";
import { Field, Panel, Stepper, Tabs } from "@/components/ui/saas";
import { DEMO_SURVEY } from "@/lib/survey/demo";
import type { Question, QuestionType, Survey } from "@/lib/survey/types";
import { saveDraft, saveRun, useDraftSurvey } from "@/lib/store";
import {
  AGE_BANDS,
  GENDERS,
  REGIONS,
  type AgeBand,
  type Gender,
  type Region,
} from "@/lib/personas/types";
import {
  AGE_LABEL,
  GENDER_LABEL,
  REGION_LABEL,
} from "@/lib/personas/demographics";
import { fmtN } from "@/lib/format";

const STEPS = ["基本情報", "設問作成", "対象条件", "配信設定", "確認・完了"];
const TYPE_LABEL: Record<QuestionType, string> = {
  single: "単一回答",
  multi: "複数回答",
  scale: "数値尺度",
};

export default function SurveyBuilderPage() {
  const router = useRouter();
  const [survey, setSurvey] = useDraftSurvey();
  const [step, setStep] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);

  const valid = useMemo(
    () => survey.title.trim() && survey.questions.every((q) => q.text.trim()),
    [survey],
  );

  function patch(p: Partial<Survey>) {
    setSurvey({ ...survey, ...p });
  }

  function updateQ(id: string, next: Partial<Question>) {
    setSurvey((s) => ({
      ...s,
      questions: s.questions.map((q) => (q.id === id ? { ...q, ...next } : q)),
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
          required: true,
          text: "",
          options: [
            { id: `${id}a`, label: "選択肢A" },
            { id: `${id}b`, label: "選択肢B" },
          ],
        },
      ],
    }));
    setEditId(id);
    setStep(1);
  }

  function saveTemp() {
    saveDraft(survey);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  async function runNow() {
    setRunning(true);
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
    <div className="p-4 sm:p-5">
      <PageHead
        crumbs={["調査管理", "調査管理", "新規調査作成"]}
        title="新規調査作成"
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setSurvey(DEMO_SURVEY)}>
              デモ読込
            </button>
            <button type="button" className="btn btn-ghost" onClick={saveTemp}>
              {saved ? "保存しました" : "一時保存"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => router.push("/run")}>
              プレビュー
            </button>
            {step < 4 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
                次へ
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!valid || running}
                onClick={() => void runNow()}
              >
                {running ? "集計中…" : "仮想パネルに聞く"}
              </button>
            )}
          </>
        }
      />

      <div className="card overflow-hidden">
        <Stepper steps={STEPS} current={step} onSelect={setStep} />
        <Tabs items={STEPS} current={step} onSelect={setStep} />

        <div className="grid gap-4 bg-page p-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {step === 0 && <Basics survey={survey} patch={patch} />}
            {step === 1 && (
              <Questions
                survey={survey}
                setSurvey={setSurvey}
                updateQ={updateQ}
                addQuestion={addQuestion}
                editId={editId}
                setEditId={setEditId}
              />
            )}
            {step === 2 && (
              <Targets survey={survey} onChange={(filters) => patch({ filters })} />
            )}
            {step === 3 && <Delivery survey={survey} patch={patch} />}
            {step === 4 && <Confirm survey={survey} />}
            {(step === 0 || step === 4) && (
              <QuestionTable
                survey={survey}
                onAdd={addQuestion}
                onEdit={(id) => {
                  setEditId(id);
                  setStep(1);
                }}
                onDelete={(id) =>
                  setSurvey((s) => ({
                    ...s,
                    questions: s.questions.filter((q) => q.id !== id),
                  }))
                }
              />
            )}
            <div className="flex justify-between">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={step === 0}
                onClick={() => setStep(Math.max(0, step - 1))}
              >
                戻る
              </button>
              {step < 4 ? (
                <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
                  次へ
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!valid || running}
                  onClick={() => void runNow()}
                >
                  {running ? "集計中…" : "仮想パネルに聞く"}
                </button>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <Panel
              icon={<Filter size={14} className="text-brand" />}
              title="対象条件"
              action={
                <button type="button" className="text-[12px] text-brand" onClick={() => setStep(2)}>
                  対象条件詳細設定
                </button>
              }
            >
              <dl className="space-y-2 text-[12px]">
                <Row k="性別" v={labelList(survey.filters?.genders?.map((g) => GENDER_LABEL[g]), "指定なし")} />
                <Row k="年齢" v={labelList(survey.filters?.ageBands?.map((a) => AGE_LABEL[a]), "指定なし")} />
                <Row k="居住地域" v={labelList(survey.filters?.regions?.map((r) => REGION_LABEL[r]), "全国")} />
                <Row k="パネル種別" v="仮想日本人（合成）" />
              </dl>
              <div className="mt-3 rounded bg-slate-50 p-3 text-[12px] leading-6 text-ink-soft">
                <p className="font-medium text-ink">対象条件の概要</p>
                人口加重の仮想パネルから {fmtN(survey.sampleSize)} 人を抽出します。実在モニターではありません。
                <p className="mt-2 text-right text-[18px] font-semibold text-ink">
                  想定モニター
                  <span className="ml-2 text-brand">{fmtN(survey.sampleSize)}人</span>
                </p>
              </div>
            </Panel>

            <Panel
              icon={<Mail size={14} className="text-brand" />}
              title="配信設定"
              action={
                <button type="button" className="text-[12px] text-brand" onClick={() => setStep(3)}>
                  配信設定を編集
                </button>
              }
            >
              <dl className="space-y-2 text-[12px]">
                <Row k="配信期間" v={`${survey.periodStart ?? "—"} 〜 ${survey.periodEnd ?? "—"}`} />
                <Row k="配信対象" v="上記条件に合致する仮想パネル" />
                <Row k="回答方法" v="即時合成（ブラウザ内）" />
                <Row k="サンプル" v={`${fmtN(survey.sampleSize)}サンプル`} />
              </dl>
            </Panel>

            <Panel icon={<Gift size={14} className="text-brand" />} title="謝礼設定">
              <dl className="space-y-2 text-[12px]">
                <Row k="謝礼の種類" v="なし（合成回答）" />
                <Row k="付与ポイント" v="0ポイント" />
                <Row k="注意事項" v="仮想回答のため謝礼は発生しません" />
              </dl>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Basics({
  survey,
  patch,
}: {
  survey: Survey;
  patch: (p: Partial<Survey>) => void;
}) {
  return (
    <Panel title="調査の基本情報">
      <Field label="調査名" required count={`${survey.title.length}/80`}>
        <input
          className="input"
          maxLength={80}
          value={survey.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </Field>
      <Field label="調査の目的" required count={`${survey.description.length}/500`}>
        <textarea
          className="textarea"
          maxLength={500}
          value={survey.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </Field>
      <Field label="調査カテゴリ">
        <div className="flex gap-2">
          <select
            className="select"
            value={survey.category}
            onChange={(e) => patch({ category: e.target.value })}
          >
            {["食品・飲料", "食品・小売", "日用品", "その他"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="select"
            value={survey.subcategory ?? "コンビニ"}
            onChange={(e) => patch({ subcategory: e.target.value })}
          >
            {["コンビニ", "外食・レストラン", "その他"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </Field>
      <Field label="調査手法">
        <div className="flex flex-wrap gap-4 pt-1.5 text-[13px]">
          {(
            [
              ["virtual", "仮想パネル調査"],
              ["internet", "インターネット調査"],
              ["mail", "メール調査"],
              ["venue", "会場調査"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={(survey.method ?? "virtual") === id}
                onChange={() => patch({ method: id })}
              />
              {label}
            </label>
          ))}
        </div>
      </Field>
      <Field label="実施時期">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="input max-w-[160px]"
            value={survey.periodStart ?? ""}
            onChange={(e) => patch({ periodStart: e.target.value })}
          />
          <span className="text-muted">〜</span>
          <input
            type="date"
            className="input max-w-[160px]"
            value={survey.periodEnd ?? ""}
            onChange={(e) => patch({ periodEnd: e.target.value })}
          />
        </div>
      </Field>
      <Field label="想定サンプル数">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={50}
            max={1000}
            className="input max-w-[120px]"
            value={survey.sampleSize}
            onChange={(e) => patch({ sampleSize: Number(e.target.value) })}
          />
          <span>サンプル</span>
          <span className="text-[11px] text-muted">※50〜1,000（仮想パネル上限）</span>
        </div>
      </Field>
      <Field label="調査ステータス">
        <select
          className="select max-w-[200px]"
          value={survey.status ?? "draft"}
          onChange={(e) => patch({ status: e.target.value as Survey["status"] })}
        >
          <option value="draft">下書き</option>
          <option value="ready">実行可能</option>
        </select>
      </Field>
      <Field label="メモ" optional count={`${(survey.memo ?? "").length}/500`}>
        <textarea
          className="textarea"
          maxLength={500}
          value={survey.memo ?? ""}
          onChange={(e) => patch({ memo: e.target.value })}
        />
      </Field>
    </Panel>
  );
}

function Questions({
  survey,
  setSurvey,
  updateQ,
  addQuestion,
  editId,
  setEditId,
}: {
  survey: Survey;
  setSurvey: (s: Survey | ((p: Survey) => Survey)) => void;
  updateQ: (id: string, next: Partial<Question>) => void;
  addQuestion: () => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
}) {
  return (
    <Panel
      title="設問作成"
      action={
        <button type="button" className="btn btn-ghost h-8" onClick={addQuestion}>
          <Plus size={14} /> 設問追加
        </button>
      }
    >
      <QuestionTable
        survey={survey}
        onAdd={addQuestion}
        onEdit={setEditId}
        onDelete={(id) =>
          setSurvey((s) => ({ ...s, questions: s.questions.filter((q) => q.id !== id) }))
        }
      />
      {survey.questions
        .filter((q) => q.id === editId)
        .map((q) => (
          <div key={q.id} className="mt-4 rounded border border-brand/30 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between text-[12px] text-muted">
              <span>設問を編集</span>
              <button type="button" onClick={() => setEditId(null)}>
                閉じる
              </button>
            </div>
            <select
              className="select mb-2 max-w-[160px]"
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
              {Object.entries(TYPE_LABEL).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              className="textarea"
              value={q.text}
              onChange={(e) => updateQ(q.id, { text: e.target.value })}
            />
            {q.options && (
              <ul className="mt-3 space-y-2">
                {q.options.map((opt) => (
                  <li key={opt.id}>
                    <input
                      className="input"
                      value={opt.label}
                      onChange={(e) =>
                        updateQ(q.id, {
                          options: q.options?.map((o) =>
                            o.id === opt.id ? { ...o, label: e.target.value } : o,
                          ),
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
    </Panel>
  );
}

function Targets({
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
    <Panel title="対象条件">
      <Field label="性別">
        <div className="flex flex-wrap gap-4 pt-1.5">
          {GENDERS.map((b) => (
            <label key={b} className="flex items-center gap-1.5 text-[13px]">
              <input
                type="checkbox"
                checked={!!f.genders?.includes(b)}
                onChange={() => toggle<Gender>("genders", b)}
              />
              {GENDER_LABEL[b]}
            </label>
          ))}
        </div>
      </Field>
      <Field label="年齢">
        <div className="flex flex-wrap gap-2 pt-1">
          {AGE_BANDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => toggle<AgeBand>("ageBands", b)}
              className={`rounded border px-2 py-1 text-[12px] ${
                f.ageBands?.includes(b) ? "border-brand bg-blue-50 text-brand" : "border-line bg-white"
              }`}
            >
              {AGE_LABEL[b]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="居住地域">
        <div className="flex flex-wrap gap-2 pt-1">
          {REGIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => toggle<Region>("regions", b)}
              className={`rounded border px-2 py-1 text-[12px] ${
                f.regions?.includes(b) ? "border-brand bg-blue-50 text-brand" : "border-line bg-white"
              }`}
            >
              {REGION_LABEL[b]}
            </button>
          ))}
        </div>
      </Field>
    </Panel>
  );
}

function Delivery({
  survey,
  patch,
}: {
  survey: Survey;
  patch: (p: Partial<Survey>) => void;
}) {
  return (
    <Panel title="配信設定">
      <p className="mb-3 rounded bg-blue-50 px-3 py-2 text-[12px] text-brand">
        実在モニターへの配信ではありません。仮想パネルへ即時に合成回答を取ります。
      </p>
      <Field label="配信期間">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="input max-w-[160px]"
            value={survey.periodStart ?? ""}
            onChange={(e) => patch({ periodStart: e.target.value })}
          />
          <span>〜</span>
          <input
            type="date"
            className="input max-w-[160px]"
            value={survey.periodEnd ?? ""}
            onChange={(e) => patch({ periodEnd: e.target.value })}
          />
        </div>
      </Field>
      <Field label="回答方法">即時合成（PC・スマートフォン表示は模擬）</Field>
      <Field label="サンプル">
        <input
          type="number"
          className="input max-w-[120px]"
          min={50}
          max={1000}
          value={survey.sampleSize}
          onChange={(e) => patch({ sampleSize: Number(e.target.value) })}
        />
      </Field>
    </Panel>
  );
}

function Confirm({ survey }: { survey: Survey }) {
  return (
    <Panel title="確認・完了">
      <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
        <Row k="調査名" v={survey.title} />
        <Row k="手法" v="仮想パネル調査" />
        <Row k="カテゴリ" v={`${survey.category} / ${survey.subcategory ?? "—"}`} />
        <Row k="サンプル" v={`${fmtN(survey.sampleSize)}人`} />
        <Row k="設問数" v={`${survey.questions.length}問`} />
        <Row k="ステータス" v={survey.status === "ready" ? "実行可能" : "下書き"} />
      </dl>
      <p className="mt-4 text-[12px] leading-6 text-ink-soft">{survey.description}</p>
      <p className="mt-3 badge-synth">この実行は仮想パネル／合成回答です</p>
    </Panel>
  );
}

function QuestionTable({
  survey,
  onAdd,
  onEdit,
  onDelete,
}: {
  survey: Survey;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="text-[13px] font-semibold">設問一覧</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={onAdd}>
            + 設問追加
          </button>
          <button type="button" className="btn btn-ghost" disabled>
            設問の並び替え
          </button>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead className="bg-slate-50 text-muted">
            <tr>
              {["No.", "設問タイプ", "設問内容", "必須", "設定"].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {survey.questions.map((q, i) => (
              <tr key={q.id} className="border-t border-line">
                <td className="px-3 py-2 text-muted">Q{i + 1}</td>
                <td className="px-3 py-2">{TYPE_LABEL[q.type]}</td>
                <td className="max-w-[360px] truncate px-3 py-2">{q.text}</td>
                <td className="px-3 py-2">
                  {q.required !== false ? (
                    <span className="req">必須</span>
                  ) : (
                    <span className="opt">任意</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button type="button" className="text-brand" onClick={() => onEdit(q.id)}>
                    編集
                  </button>
                  {survey.questions.length > 1 && (
                    <button
                      type="button"
                      className="ml-3 text-muted"
                      onClick={() => onDelete(q.id)}
                    >
                      削除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function labelList(xs: string[] | undefined, fallback: string) {
  return xs?.length ? xs.join("・") : fallback;
}
