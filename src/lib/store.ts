import { useCallback, useSyncExternalStore } from "react";
import { DEMO_SURVEY } from "./survey/demo";
import type { RunResult, Survey } from "./survey/types";

const SURVEY_KEY = "kasou:survey-draft";
const RUN_KEY = "kasou:last-run";
const DRAFT_EVT = "kasou-draft";
const RUN_EVT = "kasou-run";

let draftRaw: string | null | undefined;
let draftValue: Survey = DEMO_SURVEY;
let runRaw: string | null | undefined;
let runValue: RunResult | null = null;

function parseDraft(raw: string | null): Survey {
  if (!raw) return DEMO_SURVEY;
  try {
    return JSON.parse(raw) as Survey;
  } catch {
    return DEMO_SURVEY;
  }
}

function parseRun(raw: string | null): RunResult | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RunResult;
  } catch {
    return null;
  }
}

export function loadDraft(): Survey | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SURVEY_KEY);
  if (!raw) return null;
  return parseDraft(raw);
}

export function saveDraft(survey: Survey) {
  const raw = JSON.stringify(survey);
  localStorage.setItem(SURVEY_KEY, raw);
  draftRaw = raw;
  draftValue = survey;
  window.dispatchEvent(new Event(DRAFT_EVT));
}

export function saveRun(result: RunResult) {
  runValue = result;
  try {
    const raw = JSON.stringify(result);
    sessionStorage.setItem(RUN_KEY, raw);
    runRaw = raw;
  } catch {
    runRaw = undefined;
  }
  window.dispatchEvent(new Event(RUN_EVT));
}

export function loadRun(): RunResult | null {
  if (typeof window === "undefined") return null;
  return snapshotRun();
}

function snapshotDraft() {
  const raw = localStorage.getItem(SURVEY_KEY);
  if (raw !== draftRaw) {
    draftRaw = raw;
    draftValue = parseDraft(raw);
  }
  return draftValue;
}

function snapshotRun() {
  try {
    const raw = sessionStorage.getItem(RUN_KEY);
    if (raw != null && raw !== runRaw) {
      runRaw = raw;
      runValue = parseRun(raw);
    }
  } catch {
    /* private mode / quota */
  }
  return runValue;
}

function subscribe(event: string) {
  return (onStoreChange: () => void) => {
    window.addEventListener(event, onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
      window.removeEventListener(event, onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    };
  };
}

export function useDraftSurvey() {
  const survey = useSyncExternalStore(subscribe(DRAFT_EVT), snapshotDraft, () => DEMO_SURVEY);
  const setSurvey = useCallback((next: Survey | ((prev: Survey) => Survey)) => {
    const prev = snapshotDraft();
    saveDraft(typeof next === "function" ? next(prev) : next);
  }, []);
  return [survey, setSurvey] as const;
}

export function useLastRun() {
  return useSyncExternalStore(subscribe(RUN_EVT), snapshotRun, () => null);
}
