import { generatePanel, PANEL_SIZE } from "./generate";
import type { Persona, PersonaFilter } from "./types";

let cache: Persona[] | null = null;

export function getPanel(): Persona[] {
  if (!cache) cache = generatePanel(PANEL_SIZE);
  return cache;
}

export function matchesFilter(p: Persona, f?: PersonaFilter) {
  if (!f) return true;
  if (f.ageBands?.length && !f.ageBands.includes(p.ageBand)) return false;
  if (f.genders?.length && !f.genders.includes(p.gender)) return false;
  if (f.regions?.length && !f.regions.includes(p.region)) return false;
  if (f.incomeBands?.length && !f.incomeBands.includes(p.incomeBand)) return false;
  if (f.households?.length && !f.households.includes(p.household)) return false;
  return true;
}

export function samplePanel(n: number, filter?: PersonaFilter): Persona[] {
  const pool = getPanel().filter((p) => matchesFilter(p, filter));
  if (n >= pool.length) return pool;
  return pool.slice(0, n);
}

export function panelComposition() {
  const panel = getPanel();
  const count = <T extends string>(key: (p: Persona) => T) => {
    const m: Record<string, number> = {};
    for (const p of panel) m[key(p)] = (m[key(p)] ?? 0) + 1;
    return m;
  };
  return {
    n: panel.length,
    age: count((p) => p.ageBand),
    gender: count((p) => p.gender),
    region: count((p) => p.region),
    income: count((p) => p.incomeBand),
  };
}
