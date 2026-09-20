import type { Persona } from "../personas/types";
import { clamp01, gauss, mulberry32 } from "../rng";
import type { Question } from "../survey/types";
import type { Prior } from "./memory";
import { applyCoherence } from "./memory";
import { reasonFor } from "./reasons";
import type { Choice, Score } from "./typesafe";
import { pickFromJev, type JevAnswer } from "./jev";

function softmaxPick(rng: () => number, scores: Score[]): Score {
  const max = Math.max(...scores.map((s) => s.utility));
  const exps = scores.map((s) => Math.exp((s.utility - max) * 4.2));
  const sum = exps.reduce((a, b) => a + b, 0);
  let roll = rng() * sum;
  for (let i = 0; i < scores.length; i++) {
    roll -= exps[i]!;
    if (roll <= 0) return scores[i]!;
  }
  return scores[scores.length - 1]!;
}

function confidenceOf(scores: Score[], picked: Score) {
  const sorted = [...scores].sort((a, b) => b.utility - a.utility);
  const gap = (sorted[0]?.utility ?? 0) - (sorted[1]?.utility ?? 0);
  return clamp01(0.42 + gap * 1.4 + (picked.utility - 0.4) * 0.2);
}

function optionUtility(persona: Persona, questionId: string, optionId: string, priors: Prior[]) {
  const t = persona.traits;
  const urban = persona.region === "kanto" || persona.region === "kinki" ? 0.08 : 0;
  const young = persona.age < 35 ? 0.08 : persona.age >= 65 ? -0.1 : 0;
  const factors: Record<string, number> = {};
  let u = 0.15;

  if (questionId === "q_freq") {
    const conv =
      t.convenienceSeeking * 0.35 +
      t.timePoverty * 0.25 -
      t.cookingHabit * 0.32 +
      urban +
      young +
      (persona.household === "single" ? 0.08 : 0) -
      (persona.currentState.lastConvenienceVisitDays > 10 ? 0.08 : 0);
    const map: Record<string, number> = {
      f_high: conv + 0.05,
      f_mid: conv + 0.12,
      f_week: 0.18 + (0.5 - Math.abs(conv - 0.35)),
      f_month: 0.22 - conv * 0.3 + t.cookingHabit * 0.15,
      f_rare: 0.08 + t.cookingHabit * 0.4 - conv * 0.45 + (persona.age >= 65 ? 0.18 : 0),
    };
    u += map[optionId] ?? 0;
    factors.convenience = conv;
  }

  if (questionId === "q_priority") {
    const map: Record<string, number> = {
      p_price: t.priceSensitivity * 0.7 + t.frugalityPride * 0.2 + persona.currentState.budgetPressure * 0.15,
      p_taste: t.qualityOrientation * 0.35 + t.saltFatPreference * 0.2 + 0.18,
      p_health: t.healthOrientation * 0.7 + t.trustInClaims * 0.15 + (persona.gender === "female" ? 0.05 : 0),
      p_volume: t.portionHunger * 0.65 + (persona.gender === "male" ? 0.08 : 0),
      p_new: t.noveltySeeking * 0.7 + t.impulseBuying * 0.15,
      p_brand: t.brandLoyalty * 0.55 + t.socialConformity * 0.15,
    };
    u += map[optionId] ?? 0;
    factors.priority = map[optionId] ?? 0;
  }

  if (questionId === "q_store") {
    const map: Record<string, number> = {
      s_seven: t.sevenAffinity * 0.7 + (persona.region === "kanto" ? 0.1 : 0) + 0.12,
      s_famima: t.famimaAffinity * 0.7 + (persona.region === "kinki" ? 0.06 : 0) + 0.1,
      s_lawson: t.lawsonAffinity * 0.7 + (persona.region === "kyushu" ? 0.05 : 0) + 0.1,
      s_any: 0.22 + (1 - t.brandLoyalty) * 0.25,
      s_none: t.cookingHabit * 0.35 - t.convenienceSeeking * 0.25 + (persona.age >= 65 ? 0.12 : 0),
    };
    u += map[optionId] ?? 0;
    factors.store = map[optionId] ?? 0;
  }

  if (questionId === "q_barrier") {
    const map: Record<string, number> = {
      b_price: t.priceSensitivity * 0.65 + persona.currentState.budgetPressure * 0.2,
      b_taste: (1 - t.trustInClaims) * 0.25 + t.qualityOrientation * 0.2 + 0.12,
      b_volume: t.portionHunger * 0.55,
      b_claim: (1 - t.trustInClaims) * 0.55 + t.riskAversion * 0.15,
      b_habit: t.cookingHabit * 0.55 + (1 - t.convenienceSeeking) * 0.2,
      b_none: t.convenienceSeeking * 0.25 + t.healthOrientation * 0.2 + t.noveltySeeking * 0.15,
    };
    u += map[optionId] ?? 0;
    factors.barrier = map[optionId] ?? 0;
  }

  const freq = String(priors.find((p) => p.questionId === "q_freq")?.selected ?? "");
  if (freq === "f_rare") {
    if (questionId === "q_intent_498" || questionId === "q_intent_598") u -= 0.12;
    if (optionId === "s_none" || optionId === "b_habit") u += 0.18;
  }
  if (priors.some((p) => p.questionId === "q_priority" && String(p.selected) === "p_price")) {
    if (questionId === "q_intent_598") u -= 0.1;
    if (optionId === "b_price") u += 0.12;
  }

  return { utility: u, factors };
}

function scaleIntent(persona: Persona, questionId: string, priors: Prior[]) {
  const t = persona.traits;
  let latent =
    0.18 +
    t.healthOrientation * 0.28 +
    t.convenienceSeeking * 0.2 +
    t.noveltySeeking * 0.12 +
    t.trustInClaims * 0.12 +
    t.timePoverty * 0.08 -
    t.cookingHabit * 0.22 -
    t.priceSensitivity * (questionId === "q_intent_598" ? 0.32 : 0.12) -
    t.riskAversion * 0.06 +
    (persona.household === "single" ? 0.05 : 0) +
    (persona.age < 40 ? 0.05 : persona.age >= 65 ? -0.08 : 0);

  if (questionId === "q_intent_598") latent -= 0.12 + t.frugalityPride * 0.08;
  latent += (persona.currentState.hunger - 0.5) * 0.08;
  const freq = String(priors.find((p) => p.questionId === "q_freq")?.selected ?? "");
  if (freq === "f_rare") latent -= 0.18;
  if (freq === "f_high" || freq === "f_mid") latent += 0.08;
  const prev = priors.find((p) => p.questionId === "q_intent_498");
  if (questionId === "q_intent_598" && typeof prev?.selected === "number") {
    latent = Math.min(latent, (prev.selected - 1) / 4);
  }
  return {
    latent: clamp01(latent),
    factors: {
      health: t.healthOrientation,
      convenience: t.convenienceSeeking,
      price: questionId === "q_intent_598" ? t.priceSensitivity : t.priceSensitivity * 0.4,
      cooking: t.cookingHabit,
    },
  };
}

export function decideLocal(
  persona: Persona,
  question: Question,
  priors: Prior[] = [],
  jevHint?: Record<string, number>,
): Choice {
  const rng = mulberry32(persona.seed + hash(question.id) * 17);

  if (question.type === "scale" && question.scale) {
    const { latent, factors } = scaleIntent(persona, question.id, priors);
    let biased = latent;
    if (jevHint) {
      const keys = Object.keys(jevHint);
      const weighted =
        keys.reduce((s, k) => s + Number(k) * (jevHint[k] ?? 0), 0) /
        Math.max(1e-6, keys.reduce((s, k) => s + (jevHint[k] ?? 0), 0));
      biased = clamp01(latent * 0.55 + (weighted / (question.scale.max || 4)) * 0.45);
    }
    const noisy = clamp01(biased + (rng() - 0.5) * 0.16);
    const span = question.scale.max - question.scale.min;
    let value = Math.round(question.scale.min + noisy * span);
    value = Number(applyCoherence(question.id, value, priors));
    value = Math.min(question.scale.max, Math.max(question.scale.min, value));
    const scores: Score[] = [];
    for (let i = question.scale.min; i <= question.scale.max; i++) {
      scores.push({
        optionId: String(i),
        utility: 1 - Math.abs(i - (question.scale.min + biased * span)) / span,
        factors,
      });
    }
    return {
      selected: value,
      scores,
      reason: reasonFor(persona, question.id, String(value), priors),
      confidence: clamp01(0.5 + Math.abs(biased - 0.5)),
      consistency: clamp01(0.7 + (1 - Math.abs(noisy - biased)) * 0.25),
    };
  }

  const options = question.options ?? [];
  const scores: Score[] = options.map((opt) => {
    const { utility, factors } = optionUtility(persona, question.id, opt.id, priors);
    const hint = jevHint?.[opt.id] ?? 0;
    return {
      optionId: opt.id,
      utility: utility + hint * 0.55 + gauss(rng, 0, 0.045),
      factors,
    };
  });
  const picked = softmaxPick(rng, scores);
  let selected: string | string[] | number =
    question.type === "multi" ? [picked.optionId] : picked.optionId;
  if (typeof selected === "string") {
    selected = String(applyCoherence(question.id, selected, priors));
  }
  const sel = Array.isArray(selected) ? selected[0]! : String(selected);
  return {
    selected,
    scores,
    reason: reasonFor(persona, question.id, sel, priors),
    confidence: confidenceOf(scores, picked),
    consistency: clamp01(0.68 + picked.utility * 0.22),
  };
}

export function decideWithJev(
  persona: Persona,
  question: Question,
  priors: Prior[],
  answer: JevAnswer | undefined,
): Choice {
  const parsed = pickFromJev(question, answer);
  if (!parsed) return decideLocal(persona, question, priors, answer?.probabilities);
  const selected = applyCoherence(question.id, parsed.selected, priors);
  const scores: Score[] = (question.options ?? []).map((opt) => ({
    optionId: opt.id,
    utility: parsed.probs[opt.id] ?? (opt.id === String(selected) ? parsed.confidence : 0.08),
    factors: { jev: parsed.probs[opt.id] ?? 0 },
  }));
  if (question.type === "scale" && question.scale) {
    for (let i = question.scale.min; i <= question.scale.max; i++) {
      if (!scores.some((s) => s.optionId === String(i))) {
        scores.push({
          optionId: String(i),
          utility: i === selected ? parsed.confidence : 0.1,
          factors: { jev: 1 },
        });
      }
    }
  }
  return {
    selected,
    scores: scores.length ? scores : [{ optionId: String(selected), utility: parsed.confidence, factors: { jev: 1 } }],
    reason: reasonFor(persona, question.id, String(selected), priors),
    confidence: parsed.confidence,
    consistency: clamp01(0.78 + parsed.confidence * 0.18),
  };
}

export function decide(persona: Persona, question: Question, priors: Prior[] = []): Choice {
  return decideLocal(persona, question, priors);
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
