import type { AgeBand, Gender, Region } from "../personas/types";
import { AGE_LABEL, GENDER_LABEL, REGION_LABEL } from "../personas/demographics";
import type { Question, RunResult } from "../survey/types";

export type OptionShare = {
  id: string;
  label: string;
  count: number;
  pct: number;
};

export type QuestionAgg = {
  question: Question;
  n: number;
  shares: OptionShare[];
  mean?: number;
  topBox?: number;
};

export type Crosstab = {
  rowKey: string;
  rowLabel: string;
  cols: { key: string; label: string; count: number; pct: number }[];
  total: number;
};

export type Theme = {
  id: string;
  label: string;
  count: number;
  share: number;
  samples: string[];
};

const THEME_RULES: { id: string; label: string; keys: string[] }[] = [
  { id: "price", label: "価格", keys: ["値段", "価格", "安い", "高い", "出費", "円"] },
  { id: "health", label: "健康・栄養", keys: ["たんぱく", "糖質", "健康", "塩分", "表示"] },
  { id: "convenience", label: "利便", keys: ["帰り", "楽", "時間", "駅前", "寄"] },
  { id: "cooking", label: "自炊習慣", keys: ["作る", "自炊", "家で", "日常には"] },
  { id: "taste", label: "味", keys: ["味", "おい", "薄い"] },
  { id: "volume", label: "量", keys: ["量", "腹", "物足り"] },
  { id: "novelty", label: "新奇", keys: ["新商品", "話題", "試し"] },
  { id: "habit", label: "非購買習慣", keys: ["買わない", "寄らない", "習慣"] },
];

function optionList(q: Question) {
  if (q.type === "scale" && q.scale) {
    const out = [];
    for (let i = q.scale.min; i <= q.scale.max; i++) {
      out.push({ id: String(i), label: String(i) });
    }
    return out;
  }
  return q.options ?? [];
}

export function aggregateQuestion(result: RunResult, question: Question): QuestionAgg {
  const rows = result.answers.filter((a) => a.questionId === question.id);
  const opts = optionList(question);
  const counts = new Map<string, number>();
  for (const o of opts) counts.set(o.id, 0);
  let numericSum = 0;
  let numericN = 0;
  let top = 0;
  for (const row of rows) {
    const key = String(row.selected);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (typeof row.selected === "number") {
      numericSum += row.selected;
      numericN += 1;
      if (question.scale && row.selected >= question.scale.max - 1) top += 1;
    }
  }
  const n = rows.length || 1;
  return {
    question,
    n: rows.length,
    shares: opts.map((o) => ({
      id: o.id,
      label: o.label,
      count: counts.get(o.id) ?? 0,
      pct: ((counts.get(o.id) ?? 0) / n) * 100,
    })),
    mean: numericN ? numericSum / numericN : undefined,
    topBox: numericN ? (top / numericN) * 100 : undefined,
  };
}

export function crosstab(
  result: RunResult,
  questionId: string,
  dim: "ageBand" | "gender" | "region",
): Crosstab[] {
  const q = result.survey.questions.find((x) => x.id === questionId);
  if (!q) return [];
  const opts = optionList(q);
  const personaMap = new Map(result.personas.map((p) => [p.id, p]));

  const dimKeys =
    dim === "ageBand"
      ? (["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as AgeBand[])
      : dim === "gender"
        ? (["female", "male"] as Gender[])
        : (["hokkaido", "tohoku", "kanto", "chubu", "kinki", "chugoku", "shikoku", "kyushu"] as Region[]);

  const labelOf = (k: string) => {
    if (dim === "ageBand") return AGE_LABEL[k as AgeBand];
    if (dim === "gender") return GENDER_LABEL[k as Gender];
    return REGION_LABEL[k as Region];
  };

  return opts.map((opt) => {
    const cols = dimKeys.map((key) => {
      const subset = result.answers.filter((a) => {
        if (a.questionId !== questionId) return false;
        const p = personaMap.get(a.personaId);
        return p && p[dim] === key;
      });
      const hit = subset.filter((a) => String(a.selected) === opt.id).length;
      const total = subset.length || 1;
      return { key, label: labelOf(key), count: hit, pct: (hit / total) * 100 };
    });
    const total = result.answers.filter(
      (a) => a.questionId === questionId && String(a.selected) === opt.id,
    ).length;
    return { rowKey: opt.id, rowLabel: opt.label, cols, total };
  });
}

export function reasonThemes(result: RunResult, questionId?: string): Theme[] {
  const rows = result.answers.filter((a) => (questionId ? a.questionId === questionId : true));
  const buckets = THEME_RULES.map((rule) => ({
    ...rule,
    count: 0,
    samples: [] as string[],
  }));
  for (const row of rows) {
    for (const b of buckets) {
      if (b.keys.some((k) => row.reason.includes(k))) {
        b.count += 1;
        if (b.samples.length < 4 && !b.samples.includes(row.reason)) b.samples.push(row.reason);
      }
    }
  }
  const n = rows.length || 1;
  return buckets
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((b) => ({
      id: b.id,
      label: b.label,
      count: b.count,
      share: b.count / n,
      samples: b.samples,
    }));
}

export function kpis(result: RunResult) {
  const intent = result.survey.questions.find((q) => q.id === "q_intent_498");
  const intent2 = result.survey.questions.find((q) => q.id === "q_intent_598");
  const a1 = intent ? aggregateQuestion(result, intent) : undefined;
  const a2 = intent2 ? aggregateQuestion(result, intent2) : undefined;
  const avgConf =
    result.answers.reduce((s, a) => s + a.confidence, 0) / (result.answers.length || 1);
  return {
    n: result.sampleSize,
    mean498: a1?.mean,
    mean598: a2?.mean,
    top498: a1?.topBox,
    drop: a1?.mean != null && a2?.mean != null ? a1.mean - a2.mean : undefined,
    avgConfidence: avgConf,
  };
}
