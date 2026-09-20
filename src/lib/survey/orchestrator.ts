import { decide } from "../engine/decision";
import { samplePanel } from "../personas/panel";
import { slimPersona } from "../personas/types";
import type { Answer, RunResult, Survey } from "./types";

export function runSurvey(survey: Survey): RunResult {
  const started = Date.now();
  const personas = samplePanel(survey.sampleSize, survey.filters);
  const answers: Answer[] = [];

  for (const persona of personas) {
    for (const question of survey.questions) {
      const choice = decide(persona, question);
      const selected = choice.selected;
      let selectedLabel = String(selected);
      if (typeof selected === "number" && question.scale) {
        selectedLabel = `${selected}`;
      } else if (typeof selected === "string") {
        selectedLabel = question.options?.find((o) => o.id === selected)?.label ?? selected;
      } else if (Array.isArray(selected)) {
        selectedLabel = (selected as string[])
          .map((id) => question.options?.find((o) => o.id === id)?.label ?? id)
          .join(" / ");
      }
      answers.push({
        personaId: persona.id,
        questionId: question.id,
        selected,
        selectedLabel,
        reason: choice.reason,
        confidence: choice.confidence,
        consistency: choice.consistency,
      });
    }
  }

  const finished = Date.now();
  return {
    id: `run-${started}`,
    survey,
    startedAt: new Date(started).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    elapsedMs: finished - started,
    sampleSize: personas.length,
    answers,
    personas: personas.map(slimPersona),
    synthetic: true,
  };
}
