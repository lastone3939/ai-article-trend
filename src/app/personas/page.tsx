"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/layout/Chrome";
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
    <div className="p-4 sm:p-5">
      <PageHead
        crumbs={["モニター管理", "モニター一覧"]}
        title="仮想モニター一覧"
        actions={<span className="badge-synth">仮想パネル／実在の個人ではありません</span>}
      />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          className="input"
          placeholder="名前・土地・仕事で探す"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select sm:max-w-[160px]" value={age} onChange={(e) => setAge(e.target.value as AgeBand | "")}>
          <option value="">すべての年齢</option>
          {AGE_BANDS.map((b) => (
            <option key={b} value={b}>
              {AGE_LABEL[b]}
            </option>
          ))}
        </select>
        <select
          className="select sm:max-w-[160px]"
          value={region}
          onChange={(e) => setRegion(e.target.value as Region | "")}
        >
          <option value="">すべての地域</option>
          {REGIONS.map((b) => (
            <option key={b} value={b}>
              {REGION_LABEL[b]}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-3 text-[12px] text-muted">{filtered.length} 人</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 60).map((p) => (
          <PersonaCard
            key={p.id}
            persona={p}
            open={open === p.id}
            onToggle={() => setOpen(open === p.id ? null : p.id)}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="card p-8 text-center text-[13px] text-muted">この条件のモニターはいません。</div>
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
    <button type="button" onClick={onToggle} className="card p-4 text-left">
      <div className="flex items-start justify-between">
        <p className="text-[11px] text-muted">{p.id}</p>
        <span className="badge-synth">SYNTH</span>
      </div>
      <h3 className="mt-1 font-semibold">{p.displayName}</h3>
      <p className="mt-1 text-[12px] text-muted">
        {p.age}歳 {GENDER_LABEL[p.gender]} ／ {p.prefecture} ／ {p.occupation}
      </p>
      <p className="text-[11px] text-muted">
        {HOUSEHOLD_LABEL[p.household]} · {INCOME_LABEL[p.incomeBand]}
      </p>
      <p className="mt-2 line-clamp-3 text-[12px] leading-6 text-ink-soft">{p.bio}</p>
      {open && (
        <div className="mt-3 space-y-1.5">
          {PEEK_TRAITS.map((k) => (
            <div key={k}>
              <div className="flex justify-between text-[10px] text-muted">
                <span>{TRAIT_LABELS[k]}</span>
                <span>{p.traits[k].toFixed(2)}</span>
              </div>
              <div className="h-1 bg-slate-100">
                <div className="h-1 bg-brand" style={{ width: `${p.traits[k] * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
