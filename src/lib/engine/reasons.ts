import type { Persona } from "../personas/types";
import { mulberry32, pick } from "../rng";

const BANK: Record<string, string[]> = {
  price: [
    "値段を見て、手が止まる。",
    "この値段なら、まだ許容できる。",
    "同じなら、もっと安い店でいい。",
    "今月は出費を抑えたい。",
  ],
  health: [
    "たんぱく質が取れるなら試したい。",
    "糖質が気になるので、低糖質は魅力。",
    "表示をどこまで信じていいか分からない。",
    "健康そうに見えても、塩分が心配。",
  ],
  convenience: [
    "仕事帰りに、そのまま買えるのが楽。",
    "作る時間がない日の逃げ場。",
    "駅前で揃うなら、それで十分。",
  ],
  cooking: [
    "弁当は家で作る。コンビニは高い。",
    "温めるだけ、という生活にはしたくない。",
    "たまにならいいが、日常にはしない。",
  ],
  taste: [
    "健康弁当は味が薄いイメージがある。",
    "おいしくなければ続かない。",
    "一度食べてみてから判断したい。",
  ],
  volume: [
    "高たんぱくだと量が少なく感じる。",
    "腹持ちしないと、あとで間食する。",
    "男性には物足りない気がする。",
  ],
  novelty: [
    "新商品の棚は、つい手が伸びる。",
    "話題のうちに一度は試したい。",
    "目新しさだけではリピートしない。",
  ],
  family: [
    "自分だけ別メニュー、というのは気が引ける。",
    "子どもの分もあるので、単価が気になる。",
    "自分の夜食なら、あり。",
  ],
  store: [
    "いつもの店で揃うなら買う。",
    "ポイントが貯まる店を優先する。",
    "チェーンにこだわりはない。",
  ],
  rare: [
    "コンビニ弁当は、ほとんど買わない。",
    "必要なとき以外は、寄らない。",
    "習慣になっていない。",
  ],
};

export function reasonFor(
  persona: Persona,
  questionId: string,
  selectedId: string,
  topFactor: string,
): string {
  const rng = mulberry32(persona.seed + hash(questionId + selectedId));
  const t = persona.traits;

  if (questionId === "q_freq") {
    if (selectedId === "f_rare" || selectedId === "f_month") return pick(rng, BANK.cooking.concat(BANK.rare));
    return pick(rng, BANK.convenience);
  }
  if (questionId === "q_priority") {
    const map: Record<string, string[]> = {
      p_price: BANK.price,
      p_taste: BANK.taste,
      p_health: BANK.health,
      p_volume: BANK.volume,
      p_new: BANK.novelty,
      p_brand: BANK.store,
    };
    return pick(rng, map[selectedId] ?? BANK.taste);
  }
  if (questionId === "q_intent_498" || questionId === "q_intent_598") {
    const n = Number(selectedId);
    if (questionId === "q_intent_598" && n <= 2) return pick(rng, BANK.price);
    if (n >= 4) {
      if (t.healthOrientation > 0.55) return pick(rng, BANK.health);
      return pick(rng, BANK.convenience.concat(BANK.novelty));
    }
    if (t.cookingHabit > 0.6) return pick(rng, BANK.cooking);
    if (t.priceSensitivity > 0.6) return pick(rng, BANK.price);
    return pick(rng, BANK.taste.concat(BANK.volume));
  }
  if (questionId === "q_store") {
    if (selectedId === "s_none") return pick(rng, BANK.rare.concat(BANK.cooking));
    return pick(rng, BANK.store);
  }
  if (questionId === "q_barrier") {
    const map: Record<string, string[]> = {
      b_price: BANK.price,
      b_taste: BANK.taste,
      b_volume: BANK.volume,
      b_claim: BANK.health,
      b_habit: BANK.cooking.concat(BANK.rare),
      b_none: ["特に理由はない。条件が揃えば買う。", "試しに一度は手に取る。"],
    };
    return pick(rng, map[selectedId] ?? BANK.taste);
  }

  const fallback: Record<string, string[]> = {
    price: BANK.price,
    health: BANK.health,
    convenience: BANK.convenience,
    cooking: BANK.cooking,
    taste: BANK.taste,
    volume: BANK.volume,
    novelty: BANK.novelty,
    family: BANK.family,
  };
  return pick(rng, fallback[topFactor] ?? BANK.convenience);
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
