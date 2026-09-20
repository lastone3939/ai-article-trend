/** Seeded mulberry32 — same seed always yields the same panel. */
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

export function weightedPick<T extends { w: number }>(
  rng: Rng,
  items: readonly T[],
): T {
  const total = items.reduce((s, i) => s + i.w, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.w;
    if (roll <= 0) return item;
  }
  return items[items.length - 1] as T;
}

export function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function gauss(rng: Rng, mean = 0.5, sd = 0.15) {
  const u = Math.max(1e-9, rng());
  const v = Math.max(1e-9, rng());
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return clamp01(mean + z * sd);
}

export function intBetween(rng: Rng, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
