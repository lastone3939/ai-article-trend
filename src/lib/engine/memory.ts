export type Prior = { questionId: string; selected: string | number };

export function applyCoherence(
  questionId: string,
  selected: string | number,
  priors: Prior[],
): string | number {
  const freq = String(priors.find((p) => p.questionId === "q_freq")?.selected ?? "");
  const priority = String(priors.find((p) => p.questionId === "q_priority")?.selected ?? "");
  const intent498 = Number(priors.find((p) => p.questionId === "q_intent_498")?.selected ?? 0);
  const store = String(priors.find((p) => p.questionId === "q_store")?.selected ?? "");

  if (questionId === "q_intent_498" && typeof selected === "number") {
    if (freq === "f_rare") return Math.min(selected, 3);
    if (freq === "f_month") return Math.min(selected, 4);
  }
  if (questionId === "q_intent_598" && typeof selected === "number") {
    let next = selected;
    if (intent498) next = Math.min(next, intent498);
    if (priority === "p_price") next = Math.min(next, Math.max(1, intent498 - 1 || next - 1));
    if (freq === "f_rare") next = Math.min(next, 2);
    return next;
  }
  if (questionId === "q_store" && freq === "f_rare" && selected !== "s_none") {
    return "s_none";
  }
  if (questionId === "q_barrier") {
    if (freq === "f_rare") return "b_habit";
    if (store === "s_none" && selected === "b_none") return "b_habit";
    if (priority === "p_price" && Number(priors.find((p) => p.questionId === "q_intent_598")?.selected) <= 2) {
      return "b_price";
    }
  }
  return selected;
}
