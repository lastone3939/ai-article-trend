import type { Persona } from "../personas/types";
import { clamp01, gauss, mulberry32 } from "../rng";
import type { Question } from "../survey/types";
import type { Choice, Score } from "./typesafe";
import { reasonFor } from "./reasons";

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

function topFactor(factors: Record<string, number>) {
  return (
    Object.entries(factors).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0] ??
    "convenience"
  );
}

function optionUtility(persona: Persona, questionId: string, optionId: string) {
  const t = persona.traits;
  const urban = persona.region === "kanto" || persona.region === "kinki" ? 0.08 : 0;
  const young = persona.age < 35 ? 0.08 : persona.age >= 65 ? -0.1 : 0;
  const factors: Record<string, number> = {};

  const add = (k: string, v: number) => {
    factors[k] = (factors[k] ?? 0) + v;
  };

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
    add("convenience", conv);
    const map: Record<string, number> = {
      f_high: conv + 0.05,
      f_mid: conv + 0.12,
      f_week: 0.18 + (0.5 - Math.abs(conv - 0.35)),
      f_month: 0.22 - conv * 0.3 + t.cookingHabit * 0.15,
      f_rare: 0.08 + t.cookingHabit * 0.4 - conv * 0.45 + (persona.age >= 65 ? 0.18 : 0),
    };
    u += map[optionId] ?? 0;
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
    Object.entries(map).forEach(([k, v]) => {
      if (k === optionId) {
        u += v;
        add(k.slice(2), v);
      }
    });
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
    add("store", map[optionId] ?? 0);
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
    add("barrier", map[optionId] ?? 0);
  }

  return { utility: u, factors };
}

function scaleIntent(persona: Persona, questionId: string) {
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
  latent = clamp01(latent);

  const factors = {
    health: t.healthOrientation,
    convenience: t.convenienceSeeking,
    price: questionId === "q_intent_598" ? t.priceSensitivity : t.priceSensitivity * 0.4,
    cooking: t.cookingHabit,
  };
  return { latent, factors };
}

export function decide(persona: Persona, question: Question): Choice {
  const rng = mulberry32(persona.seed + hash(question.id) * 17);

  if (question.type === "scale" && question.scale) {
    const { latent, factors } = scaleIntent(persona, question.id);
    const noisy = clamp01(latent + (rng() - 0.5) * 0.22);
    const span = question.scale.max - question.scale.min;
    const value = Math.round(question.scale.min + noisy * span);
    const clamped = Math.min(question.scale.max, Math.max(question.scale.min, value));
    const scores: Score[] = [];
    for (let i = question.scale.min; i <= question.scale.max; i++) {
      scores.push({
        optionId: String(i),
        utility: 1 - Math.abs(i - (question.scale.min + latent * span)) / span,
        factors,
      });
    }
    return {
      selected: clamped,
      scores,
      reason: reasonFor(persona, question.id, String(clamped), topFactor(factors)),
      confidence: clamp01(0.5 + Math.abs(latent - 0.5)),
      consistency: clamp01(0.62 + (1 - Math.abs(noisy - latent)) * 0.3),
    };
  }

  const options = question.options ?? [];
  const scores: Score[] = options.map((opt) => {
    const { utility, factors } = optionUtility(persona, question.id, opt.id);
    return {
      optionId: opt.id,
      utility: utility + gauss(rng, 0, 0.06),
      factors,
    };
  });

  const picked = softmaxPick(rng, scores);
  const selected = question.type === "multi" ? [picked.optionId] : picked.optionId;

  return {
    selected,
    scores,
    reason: reasonFor(persona, question.id, picked.optionId, topFactor(picked.factors as Record<string, number>)),
    confidence: confidenceOf(scores, picked),
    consistency: clamp01(0.58 + picked.utility * 0.25),
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
