import { NextResponse } from "next/server";
import { getPanel, panelComposition } from "@/lib/personas/panel";
import type { AgeBand, Gender, Region } from "@/lib/personas/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(1000, Math.max(1, Number(searchParams.get("limit") ?? 24)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const region = searchParams.get("region") as Region | null;
  const ageBand = searchParams.get("ageBand") as AgeBand | null;
  const gender = searchParams.get("gender") as Gender | null;
  const peek = searchParams.get("peek") === "1";

  let list = getPanel();
  if (region) list = list.filter((p) => p.region === region);
  if (ageBand) list = list.filter((p) => p.ageBand === ageBand);
  if (gender) list = list.filter((p) => p.gender === gender);

  const slice = list.slice(offset, offset + limit);
  return NextResponse.json({
    total: list.length,
    composition: panelComposition(),
    items: peek
      ? slice.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          age: p.age,
          ageBand: p.ageBand,
          gender: p.gender,
          prefecture: p.prefecture,
          region: p.region,
          occupation: p.occupation,
          household: p.household,
          incomeBand: p.incomeBand,
          bio: p.bio,
          values: p.values,
          traits: {
            priceSensitivity: p.traits.priceSensitivity,
            healthOrientation: p.traits.healthOrientation,
            convenienceSeeking: p.traits.convenienceSeeking,
            cookingHabit: p.traits.cookingHabit,
            noveltySeeking: p.traits.noveltySeeking,
          },
        }))
      : slice,
  });
}
