"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/layout/Chrome";
import { getPanel } from "@/lib/personas/panel";
import {
  AGE_LABEL,
  GENDER_LABEL,
  HOUSEHOLD_LABEL,
  INCOME_LABEL,
  REGION_LABEL,
} from "@/lib/personas/demographics";
import {
  AGE_BANDS,
  REGIONS,
  TRAIT_LABELS,
  type AgeBand,
  type Persona,
  type Region,
} from "@/lib/personas/types";

const PEEK_TRAITS = [
  "priceSensitivity",
  "healthOrientation",
  "convenienceSeeking",
  "cookingHabit",
  "noveltySeeking",
  "timePoverty",
] as const;

export default function PersonasPage() {
  const [age, setAge] = useState<AgeBand | "">("");
  const [region, setRegion] = useState<Region | "">("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const all = useMemo(() => getPanel(), []);
  const filtered = useMemo(() => {
    return all.filter((p) => {
      if (age && p.ageBand !== age) return false;
      if (region && p.region !== region) return false;
      if (q) {
        const hay = `${p.displayName}${p.prefecture}${p.occupation}${p.bio}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, age, region, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageIntro
        kicker="Persona gallery"
        title="一千の面。"
        lede="人口加重で置いた仮想日本人。属性だけでなく、価値観の連続量を持ちます。実在の個人ではありません。"
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          placeholder="名前・土地・仕事で探す"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 border border-line bg-surface px-3 py-2 text-sm outline-none"
        />
        <select
          value={age}
          onChange={(e) => setAge(e.target.value as AgeBand | "")}
          className="border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="">すべての年齢</option>
          {AGE_BANDS.map((b) => (
            <option key={b} value={b}>
              {AGE_LABEL[b]}
            </option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as Region | "")}
          className="border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="">すべての地域</option>
          {REGIONS.map((b) => (
            <option key={b} value={b}>
              {REGION_LABEL[b]}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-xs text-muted">{filtered.length} 人</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 60).map((p) => (
          <PersonaCard
            key={p.id}
            persona={p}
            open={open === p.id}
            onToggle={() => setOpen(open === p.id ? null : p.id)}
          />
        ))}
      </div>
      {filtered.length > 60 && (
        <p className="mt-6 text-center text-xs text-muted">
          表示は先頭 60 人。絞り込みで残りの面を見てください。
        </p>
      )}
      {filtered.length === 0 && (
        <div className="paper-card mt-8 p-8 text-center">
          <p className="font-serif text-xl">この条件の面は、いない。</p>
          <p className="mt-2 text-sm text-muted">フィルタをゆるめてください。</p>
        </div>
      )}
    </div>
  );
}

function PersonaCard({
  persona: p,
  open,
  onToggle,
}: {
  persona: Persona;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="paper-card p-4 text-left transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <p className="font-mono text-[10px] text-muted">{p.id}</p>
        <span className="bg-chip px-1.5 py-0.5 text-[10px] text-muted">SYNTH</span>
      </div>
      <h3 className="mt-1 font-serif text-lg">{p.displayName}</h3>
      <p className="mt-1 text-xs text-muted">
        {p.age}歳 {GENDER_LABEL[p.gender]} ／ {p.prefecture} ／ {p.occupation}
      </p>
      <p className="mt-1 text-[11px] text-muted">
        {HOUSEHOLD_LABEL[p.household]} · {INCOME_LABEL[p.incomeBand]}
      </p>
      <p className="mt-3 line-clamp-3 text-xs leading-6 text-ink-soft">{p.bio}</p>
      {open && (
        <div className="mt-4 space-y-2">
          {PEEK_TRAITS.map((k) => (
            <div key={k}>
              <div className="flex justify-between text-[10px] text-muted">
                <span>{TRAIT_LABELS[k]}</span>
                <span className="font-mono">{p.traits[k].toFixed(2)}</span>
              </div>
              <div className="mt-0.5 h-1 bg-chip">
                <div className="h-1 bg-vermillion" style={{ width: `${p.traits[k] * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="pt-1 text-[11px] text-ink-soft">{p.values.join(" · ")}</p>
        </div>
      )}
    </button>
  );
}
