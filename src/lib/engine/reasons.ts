import type { Persona } from "../personas/types";
import { mulberry32 } from "../rng";
import type { Prior } from "./memory";

function pick(rng: () => number, xs: string[]) {
  return xs[Math.floor(rng() * xs.length)] ?? xs[0] ?? "";
}

export function reasonFor(
  persona: Persona,
  questionId: string,
  selectedId: string,
  priors: Prior[],
): string {
  const rng = mulberry32(persona.seed + hash(questionId + selectedId + persona.occupation));
  const t = persona.traits;
  const who =
    persona.age >= 65
      ? pick(rng, ["うちは", "最近は", "あんまり"])
      : persona.age < 30
        ? pick(rng, ["正直", "なんか", "だいたい"])
        : pick(rng, ["うちは", "ふだんは", "正直"]);
  const work =
    persona.occupation.includes("会社") || persona.occupation.includes("IT")
      ? "帰りが遅くなる日"
      : persona.household === "family"
        ? "子どもの夕飯のあと"
        : "忙しい日";

  if (questionId === "q_freq") {
    if (selectedId === "f_high") return `${work}は寄る。週に何回か、弁当で済ませてる。`;
    if (selectedId === "f_mid") return `${work}、コンビニで済ますこと、週2回くらいはある。`;
    if (selectedId === "f_week") return `週1回くらい。作りたくない夜に限る。`;
    if (selectedId === "f_month") return `月に1回あるかないか。基本は家で食べる。`;
    return t.cookingHabit > 0.55
      ? `弁当は家で作る。コンビニは高いし、味も好みじゃない。`
      : `必要なとき以外、あんまり寄らない。`;
  }

  if (questionId === "q_priority") {
    const map: Record<string, string[]> = {
      p_price: [
        `値段見てからカゴに入れる。百円違うと迷う。`,
        `同じなら安い方。今月ちょっと切り詰めてる。`,
      ],
      p_taste: [`まず味。健康でもまずかったら続かない。`, `おいしくない弁当は、二度と買わない。`],
      p_health: [
        `糖質と塩分は気にしてる。表示を見て選ぶ。`,
        `たんぱく質が取れるなら、そっちにする。`,
      ],
      p_volume: [`量が少ないと、あとで間食する。腹持ち優先。`, `小分けは物足りない。`],
      p_new: [`新商品の棚、つい見てしまう。`, `話題のうちに、一度は試したい。`],
      p_brand: [`いつもの店で揃うなら買う。ポイントも気になる。`, `知ってるチェーンの方が安心。`],
    };
    return pick(rng, map[selectedId] ?? [`${who}、それで選んでる。`]);
  }

  if (questionId === "q_intent_498" || questionId === "q_intent_598") {
    const n = Number(selectedId);
    const yen = questionId === "q_intent_598" ? "598円" : "498円";
    if (questionId === "q_intent_598" && n <= 2) {
      return `498円なら考えるけど、${yen}は高い。他でいい。`;
    }
    if (n >= 4) {
      return t.healthOrientation > 0.55
        ? `低糖質なら、${yen}でも一度は買ってみる。`
        : `${work}、${yen}なら手に取ると思う。`;
    }
    if (n === 3) return `気になるけど、味が薄そうで迷う。一度見てから。`;
    if (priors.some((p) => p.questionId === "q_freq" && String(p.selected) === "f_rare")) {
      return `弁当自体、ほとんど買わないから、今回もパスしそう。`;
    }
    return t.cookingHabit > 0.6
      ? `家で作るし、この値段で温めるだけ、というのは気が引ける。`
      : `表示をどこまで信じていいか分からない。`;
  }

  if (questionId === "q_store") {
    if (selectedId === "s_none") return `買う気が起きない。店を選ぶ以前の話。`;
    if (selectedId === "s_any") return `どこでもいい。近い方に入る。`;
    if (selectedId === "s_seven") return `セブンが多いし、寄るならそこ。`;
    if (selectedId === "s_famima") return `ファミマが近い。いつもの動線。`;
    return `ローソンの方が、なんとなく体に良さそうなイメージ。`;
  }

  if (questionId === "q_barrier") {
    const map: Record<string, string[]> = {
      b_price: [`この値段、弁当にしては高い。`, `百円積み上がると、家で作った方がいい。`],
      b_taste: [`健康弁当って、味が薄いイメージがある。`, `一度食べてみないと、買う気になれない。`],
      b_volume: [`高たんぱくだと、量が少なそう。`, `昼にこれだと、夕方お腹が空く。`],
      b_claim: [`「高たんぱく」って書いてあっても、どこまで本当か。`, `表示を信じきれない。`],
      b_habit: [`弁当は買わない。それが習慣。`, `コンビニは飲み物とお菓子くらい。`],
      b_none: [`特にない。条件が揃えば買う。`, `試しに一度は手に取る。`],
    };
    return pick(rng, map[selectedId] ?? [`なんとなく、引っかかる。`]);
  }

  return `${who}、そう答えると思う。`;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
