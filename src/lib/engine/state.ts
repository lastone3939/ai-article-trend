import {
  AGE_LABEL,
  GENDER_LABEL,
  HOUSEHOLD_LABEL,
  INCOME_LABEL,
  REGION_LABEL,
} from "../personas/demographics";
import type { Persona } from "../personas/types";
import { TRAIT_LABELS } from "../personas/types";

export function personaState(p: Persona) {
  const traits = Object.entries(p.traits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, v]) => `${TRAIT_LABELS[k as keyof typeof TRAIT_LABELS]}:${v.toFixed(2)}`)
    .join("、");
  return {
    kind: "synthetic_jp_persona",
    id: p.id,
    name: p.displayName,
    age: p.age,
    age_band: AGE_LABEL[p.ageBand],
    gender: GENDER_LABEL[p.gender],
    prefecture: p.prefecture,
    region: REGION_LABEL[p.region],
    household: HOUSEHOLD_LABEL[p.household],
    income: INCOME_LABEL[p.incomeBand],
    occupation: p.occupation,
    values: p.values,
    bio: p.bio,
    mood: p.currentState.mood,
    hunger: p.currentState.hunger,
    budget_pressure: p.currentState.budgetPressure,
    last_convenience_visit_days: p.currentState.lastConvenienceVisitDays,
    salient_traits: traits,
    note: "実在しない仮想の日本人。この人の生活と価値観に沿って、アンケートに一貫して答える。",
  };
}
