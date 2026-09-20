import type { PersonaFilter, SlimPersona } from "../personas/types";

export type QuestionType = "single" | "multi" | "scale";

export type QuestionOption = { id: string; label: string };

export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  help?: string;
  options?: QuestionOption[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
};

export type Survey = {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  sampleSize: number;
  filters?: PersonaFilter;
};

export type Answer = {
  personaId: string;
  questionId: string;
  selected: string | string[] | number;
  selectedLabel: string;
  reason: string;
  confidence: number;
  consistency: number;
};

export type RunResult = {
  id: string;
  survey: Survey;
  startedAt: string;
  finishedAt: string;
  elapsedMs: number;
  sampleSize: number;
  answers: Answer[];
  personas: SlimPersona[];
  synthetic: true;
};
