import type { RunResult } from "../survey/types";
import { AGE_LABEL, GENDER_LABEL, INCOME_LABEL, REGION_LABEL } from "../personas/demographics";

export function toCsv(result: RunResult) {
  const personaMap = new Map(result.personas.map((p) => [p.id, p]));
  const header = [
    "persona_id",
    "name",
    "age",
    "age_band",
    "gender",
    "prefecture",
    "region",
    "income",
    "occupation",
    "question_id",
    "question",
    "selected",
    "selected_label",
    "reason",
    "confidence",
    "synthetic",
  ];
  const lines = [header.join(",")];
  for (const a of result.answers) {
    const p = personaMap.get(a.personaId);
    const q = result.survey.questions.find((x) => x.id === a.questionId);
    const cells = [
      a.personaId,
      p?.displayName ?? "",
      p?.age ?? "",
      p ? AGE_LABEL[p.ageBand] : "",
      p ? GENDER_LABEL[p.gender] : "",
      p?.prefecture ?? "",
      p ? REGION_LABEL[p.region] : "",
      p ? INCOME_LABEL[p.incomeBand] : "",
      p?.occupation ?? "",
      a.questionId,
      q?.text ?? "",
      String(a.selected),
      a.selectedLabel,
      a.reason,
      a.confidence.toFixed(3),
      "true",
    ].map(csvEscape);
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

function csvEscape(v: string | number) {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
