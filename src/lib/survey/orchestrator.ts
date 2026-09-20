import { decideLocal, decideWithJev } from "../engine/decision";
import { hasJev, jevDecide, type JevAnswerMap } from "../engine/jev";
import type { Prior } from "../engine/memory";
import { personaState } from "../engine/state";
import { samplePanel } from "../personas/panel";
import type { Persona } from "../personas/types";
import { slimPersona } from "../personas/types";
import type { Answer, RunResult, Survey } from "./types";

const JEV_LIMIT = 48;
const JEV_CONCURRENCY = 8;

export async function runSurvey(survey: Survey): Promise<RunResult> {
  const started = Date.now();
  const personas = samplePanel(survey.sampleSize, survey.filters);
  const jevById = hasJev() ? await fetchJevSample(personas, survey) : new Map<string, JevAnswerMap>();
  const answers: Answer[] = [];

  for (const persona of personas) {
    const priors: Prior[] = [];
    const own = jevById.get(persona.id);
    const neighbor = own ? undefined : nearestJev(persona, personas, jevById);
    for (const question of survey.questions) {
      const choice = own
        ? decideWithJev(persona, question, priors, own[question.id])
        : decideLocal(persona, question, priors, neighbor?.[question.id]?.probabilities);
      const selected = choice.selected;
      let selectedLabel = String(selected);
      if (typeof selected === "number") selectedLabel = `${selected}`;
      else if (typeof selected === "string") {
        selectedLabel = question.options?.find((o) => o.id === selected)?.label ?? selected;
      } else {
        selectedLabel = selected
          .map((id) => question.options?.find((o) => o.id === id)?.label ?? id)
          .join(" / ");
      }
      priors.push({
        questionId: question.id,
        selected: Array.isArray(selected) ? selected[0]! : selected,
      });
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

function nearestJev(
  persona: Persona,
  all: Persona[],
  map: Map<string, JevAnswerMap>,
) {
  if (map.has(persona.id)) return map.get(persona.id);
  let best: JevAnswerMap | undefined;
  for (const other of all) {
    const hit = map.get(other.id);
    if (!hit) continue;
    if (other.ageBand === persona.ageBand && other.gender === persona.gender) return hit;
    if (!best && other.ageBand === persona.ageBand) best = hit;
  }
  return best;
}

async function fetchJevSample(personas: Persona[], survey: Survey) {
  const picked = stratify(personas, Math.min(JEV_LIMIT, personas.length));
  const out = new Map<string, JevAnswerMap>();
  for (let i = 0; i < picked.length; i += JEV_CONCURRENCY) {
    const chunk = picked.slice(i, i + JEV_CONCURRENCY);
    const rows = await Promise.all(
      chunk.map(async (p) => {
        const answers = await jevDecide(personaState(p), survey.questions);
        return [p.id, answers] as const;
      }),
    );
    for (const [id, answers] of rows) {
      if (answers) out.set(id, answers);
    }
  }
  return out;
}

function stratify(personas: Persona[], n: number) {
  if (personas.length <= n) return personas;
  const buckets = new Map<string, Persona[]>();
  for (const p of personas) {
    const k = `${p.ageBand}:${p.gender}`;
    const list = buckets.get(k) ?? [];
    list.push(p);
    buckets.set(k, list);
  }
  const keys = [...buckets.keys()];
  const out: Persona[] = [];
  let i = 0;
  while (out.length < n) {
    const list = buckets.get(keys[i % keys.length]!);
    const next = list?.shift();
    if (next) out.push(next);
    i += 1;
    if (i > n * 8) break;
  }
  return out;
}
