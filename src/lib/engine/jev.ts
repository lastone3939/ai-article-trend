import type { Question } from "../survey/types";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

export type JevChoiceAnswer = {
  type?: string;
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
};

export type JevScoreAnswer = {
  type?: string;
  score?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  legend?: Record<string, string>;
};

export type JevAnswer = JevChoiceAnswer & JevScoreAnswer;
export type JevAnswerMap = Record<string, JevAnswer>;

export function jevKey() {
  return process.env.TYPESAFE_API_KEY?.trim() || "";
}

export function hasJev() {
  return jevKey().length > 0;
}

export function toJevQuestions(questions: Question[]) {
  const out: Record<string, unknown> = {};
  for (const q of questions) {
    if (q.type === "scale" && q.scale) {
      const criteria: string[] = [];
      for (let i = q.scale.min; i <= q.scale.max; i++) {
        if (i === q.scale.min) criteria.push(`${i}：${q.scale.minLabel}`);
        else if (i === q.scale.max) criteria.push(`${i}：${q.scale.maxLabel}`);
        else criteria.push(`${i}`);
      }
      out[q.id] = {
        type: "score",
        instructions: `${q.text} この人の購買・生活から、尺度で答えてください。`,
        criteria,
      };
    } else {
      const criteria: Record<string, string> = {};
      for (const opt of q.options ?? []) {
        criteria[opt.id] = opt.label;
      }
      out[q.id] = {
        type: "choice",
        instructions: `${q.text} この人ならどれを選ぶか。`,
        criteria,
      };
    }
  }
  return out;
}

export async function jevDecide(
  state: unknown,
  questions: Question[],
): Promise<JevAnswerMap | null> {
  const key = jevKey();
  if (!key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jev-latest",
        state,
        questions: toJevQuestions(questions),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { answers?: JevAnswerMap } & JevAnswerMap;
    return data.answers ?? data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function pickFromJev(
  question: Question,
  answer: JevAnswer | undefined,
): { selected: string | number; confidence: number; probs: Record<string, number> } | null {
  if (!answer) return null;
  if (question.type === "scale" && question.scale) {
    const span = question.scale.max - question.scale.min;
    const raw = typeof answer.score === "number" ? answer.score : 0;
    const value = Math.round(question.scale.min + Math.min(span, Math.max(0, raw)));
    const clamped = Math.min(question.scale.max, Math.max(question.scale.min, value));
    return {
      selected: clamped,
      confidence: clamp01(answer.confidence ?? 0.6),
      probs: answer.probabilities ?? {},
    };
  }
  const choice = answer.choice;
  const ids = new Set((question.options ?? []).map((o) => o.id));
  if (choice && ids.has(choice)) {
    return {
      selected: choice,
      confidence: clamp01(answer.confidence ?? answer.probabilities?.[choice] ?? 0.55),
      probs: answer.probabilities ?? {},
    };
  }
  const probs = answer.probabilities ?? {};
  const best = Object.entries(probs).sort((a, b) => b[1] - a[1])[0];
  if (best && ids.has(best[0])) {
    return { selected: best[0], confidence: clamp01(best[1]), probs };
  }
  return null;
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}
