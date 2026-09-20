/**
 * TypeSafe Jev — L1 意思決定インターフェイス（Choice / Score）。
 *
 * 共有設計の「TypeSafe Jev」は回答分岐と一貫性判定用。
 * browser-use / jev-ultrafast は L3 実験層であり、本 MVP の対象外。
 */

export interface Score<TOption extends string = string> {
  optionId: TOption;
  /** 効用。高いほど選ばれやすい。 */
  utility: number;
  /** 寄与因子（説明可能性・一貫性判定用）。 */
  factors: Readonly<Record<string, number>>;
}

export type SelectedValue = string | string[] | number;

export interface Choice<TSelected extends SelectedValue = SelectedValue> {
  selected: TSelected;
  scores: Score[];
  /** 短い日本語理由。 */
  reason: string;
  /** 0–1。効用差が開くほど高い。 */
  confidence: number;
  /** 0–1。同一ペルソナの先行回答との整合。 */
  consistency: number;
}

export interface DecisionInput {
  personaId: string;
  questionId: string;
  questionText: string;
  type: "single" | "multi" | "scale";
  options?: { id: string; label: string }[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
}

export interface DecisionEngine {
  decide(input: DecisionInput, persona: unknown): Choice;
}
