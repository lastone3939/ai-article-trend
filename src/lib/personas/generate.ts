import {
  clamp01,
  gauss,
  intBetween,
  mulberry32,
  pick,
  weightedPick,
  type Rng,
} from "../rng";
import {
  AGE_WEIGHTS,
  GENDER_WEIGHTS,
  HOUSEHOLD_WEIGHTS,
  INCOME_WEIGHTS,
  REGION_META,
} from "./demographics";
import {
  TRAIT_KEYS,
  type AgeBand,
  type Household,
  type IncomeBand,
  type Persona,
  type Region,
  type Traits,
} from "./types";

const SURNAMES = [
  "佐藤",
  "鈴木",
  "高橋",
  "田中",
  "伊藤",
  "渡辺",
  "山本",
  "中村",
  "小林",
  "加藤",
  "吉田",
  "山田",
  "佐々木",
  "山口",
  "松本",
  "井上",
  "木村",
  "林",
  "斎藤",
  "清水",
  "山崎",
  "森",
  "池田",
  "橋本",
  "阿部",
  "石川",
  "山下",
  "中島",
  "石井",
  "小川",
  "前田",
  "岡田",
  "長谷川",
  "藤田",
  "後藤",
  "近藤",
  "村上",
  "遠藤",
  "青木",
  "坂本",
];

const GIVEN_F_YOUNG = ["美咲", "陽菜", "結衣", "葵", "咲良", "凛", "芽衣", "紬", "心春", "彩葉"];
const GIVEN_F_MID = ["真由", "彩", "恵", "直子", "優子", "香織", "美穂", "里奈", "裕美", "奈々"];
const GIVEN_F_OLD = ["和子", "幸子", "洋子", "君子", "弘子", "節子", "京子", "敏子", "文子", "昭子"];
const GIVEN_M_YOUNG = ["翔太", "蓮", "陽太", "大輝", "悠", "湊", "樹", "朝陽", "蒼", "陸"];
const GIVEN_M_MID = ["拓也", "直樹", "健", "誠", "大輔", "智也", "亮", "浩", "雅人", "翔"];
const GIVEN_M_OLD = ["浩司", "健一", "正男", "博", "和夫", "隆", "誠一", "茂", "勇", "清"];

const VALUES = [
  "家族を最優先",
  "無駄遣いはしない",
  "新しいものは試したい",
  "健康で長く働きたい",
  "近所の目を気にする",
  "コスパが正義",
  "時間より質",
  "手間をかけない",
  "国産・安心",
  "流行には乗り遅れたくない",
  "自炊が当たり前",
  "自分へのご褒美",
];

function givenName(rng: Rng, gender: "female" | "male", age: number) {
  if (gender === "female") {
    if (age < 32) return pick(rng, GIVEN_F_YOUNG);
    if (age < 55) return pick(rng, GIVEN_F_MID);
    return pick(rng, GIVEN_F_OLD);
  }
  if (age < 32) return pick(rng, GIVEN_M_YOUNG);
  if (age < 55) return pick(rng, GIVEN_M_MID);
  return pick(rng, GIVEN_M_OLD);
}

function occupation(rng: Rng, age: number, gender: "female" | "male", household: Household) {
  if (age <= 22) return pick(rng, ["大学生", "専門学生", "アルバイト"]);
  if (age >= 65) return pick(rng, ["退職", "年金生活", "パート", "自営業"]);
  const pool = [
    "会社員",
    "会社員",
    "会社員",
    "公務員",
    "自営業",
    "専門職",
    "ITエンジニア",
    "販売・接客",
    "製造",
    "医療・介護",
    "教育",
    "サービス",
    "パート・アルバイト",
  ];
  if (gender === "female" && (household === "family" || household === "multi")) {
    pool.push("主婦", "主婦", "パート・アルバイト");
  }
  if (gender === "male" && household === "family") pool.push("会社員", "管理職");
  return pick(rng, pool);
}

function baseTraits(rng: Rng): Traits {
  const t = {} as Traits;
  for (const key of TRAIT_KEYS) t[key] = gauss(rng, 0.48, 0.16);
  return t;
}

function nudge(t: Traits, key: keyof Traits, delta: number) {
  t[key] = clamp01(t[key] + delta);
}

function applyDemographics(
  t: Traits,
  age: number,
  gender: "female" | "male",
  region: Region,
  income: IncomeBand,
  household: Household,
) {
  const young = age < 30 ? 1 : age < 45 ? 0.45 : 0;
  const old = age >= 65 ? 1 : age >= 55 ? 0.45 : 0;

  nudge(t, "digitalNative", young * 0.28 - old * 0.32);
  nudge(t, "noveltySeeking", young * 0.22 - old * 0.2);
  nudge(t, "traditionOrientation", old * 0.3 - young * 0.18);
  nudge(t, "cookingHabit", old * 0.22 + (household !== "single" ? 0.08 : -0.12));
  nudge(t, "timePoverty", (age >= 30 && age <= 49 ? 0.2 : -0.04) + (household === "family" ? 0.12 : 0));
  nudge(t, "convenienceSeeking", (age >= 25 && age <= 44 ? 0.16 : 0) - old * 0.14);
  nudge(t, "healthOrientation", (gender === "female" ? 0.1 : 0) + (age >= 45 ? 0.12 : -0.04));
  nudge(t, "familyConsideration", household === "family" || household === "multi" ? 0.22 : -0.1);
  nudge(t, "portionHunger", gender === "male" ? 0.12 : -0.04);
  nudge(t, "priceSensitivity", income === "lt300" ? 0.22 : income === "gt1000" ? -0.18 : 0);
  nudge(t, "frugalityPride", income === "lt300" || income === "300-500" ? 0.12 : 0);
  nudge(t, "statusSignaling", income === "gt1000" || income === "700-1000" ? 0.12 : -0.06);
  nudge(t, "qualityOrientation", income === "gt1000" ? 0.14 : 0);

  if (region === "kanto" || region === "kinki") {
    nudge(t, "convenienceSeeking", 0.1);
    nudge(t, "timePoverty", 0.08);
    nudge(t, "sevenAffinity", 0.1);
  }
  if (region === "tohoku" || region === "shikoku" || region === "hokkaido") {
    nudge(t, "traditionOrientation", 0.08);
    nudge(t, "cookingHabit", 0.06);
  }
  if (region === "kanto") nudge(t, "sevenAffinity", 0.08);
  if (region === "kinki") nudge(t, "famimaAffinity", 0.06);
  if (region === "kyushu") nudge(t, "lawsonAffinity", 0.05);

  if (household === "single") {
    nudge(t, "convenienceSeeking", 0.14);
    nudge(t, "impulseBuying", 0.08);
    nudge(t, "cookingHabit", -0.1);
  }
}

function bioFor(p: Omit<Persona, "bio" | "id" | "seed">, rng: Rng): string {
  const bits: string[] = [];
  bits.push(`${p.prefecture}在住の${p.age}歳。`);
  if (p.household === "single") bits.push("一人暮らし。");
  if (p.household === "family") bits.push("子どもと暮らす。");
  if (p.household === "couple") bits.push("夫婦二人。");
  if (p.household === "multi") bits.push("親と同居。");
  if (p.traits.cookingHabit > 0.65) bits.push("食事はできるだけ自分で作る。");
  else if (p.traits.convenienceSeeking > 0.62) bits.push("帰りが遅く、寄り道で済ますことが多い。");
  if (p.traits.healthOrientation > 0.65) bits.push("糖質と塩分は気にしている。");
  if (p.traits.priceSensitivity > 0.65) bits.push("値段を見てからカゴに入れる。");
  if (p.traits.noveltySeeking > 0.68) bits.push("新商品の棚はつい見てしまう。");
  if (bits.length < 3) bits.push(pick(rng, ["週の買い物は決まった店。", "特売の日だけ足を伸ばす。", "駅前のコンビニが生活圏。"]));
  return bits.join("");
}

export const PANEL_SEED = 20260920;
export const PANEL_SIZE = 1000;

export function generatePersona(index: number, seed = PANEL_SEED): Persona {
  const rng = mulberry32(seed + index * 9973 + 13);
  const ageMeta = weightedPick(rng, AGE_WEIGHTS);
  const age = intBetween(rng, ageMeta.min, ageMeta.max);
  const gender = weightedPick(rng, GENDER_WEIGHTS).id;
  const regionMeta = weightedPick(rng, REGION_META);
  const prefecture = pick(rng, regionMeta.prefectures);

  let household = weightedPick(rng, HOUSEHOLD_WEIGHTS).id;
  if (age < 28 && rng() < 0.55) household = "single";
  if (age >= 70 && household === "family" && rng() < 0.5) household = "couple";

  let income = weightedPick(rng, INCOME_WEIGHTS).id;
  if (age <= 22 || age >= 70) {
    income = weightedPick(rng, [
      { id: "lt300" as IncomeBand, w: 0.55 },
      { id: "300-500" as IncomeBand, w: 0.3 },
      { id: "500-700" as IncomeBand, w: 0.15 },
    ]).id;
  }

  const traits = baseTraits(rng);
  applyDemographics(traits, age, gender, regionMeta.id, income, household);

  const first = givenName(rng, gender, age);
  const last = pick(rng, SURNAMES);
  const occ = occupation(rng, age, gender, household);

  const draft = {
    displayName: `${last} ${first}`,
    age,
    ageBand: ageMeta.band as AgeBand,
    gender,
    prefecture,
    region: regionMeta.id,
    household,
    incomeBand: income,
    occupation: occ,
    traits,
    values: [pick(rng, VALUES), pick(rng, VALUES)].filter((v, i, a) => a.indexOf(v) === i),
    currentState: {
      mood: gauss(rng, 0.55, 0.18),
      hunger: gauss(rng, 0.5, 0.2),
      budgetPressure: clamp01(
        (income === "lt300" ? 0.62 : income === "gt1000" ? 0.22 : 0.42) + (rng() - 0.5) * 0.2,
      ),
      lastConvenienceVisitDays: intBetween(rng, 0, 21),
    },
  };

  return {
    ...draft,
    id: `p${String(index + 1).padStart(4, "0")}`,
    seed: seed + index,
    bio: bioFor(draft, rng),
  };
}

export function generatePanel(size = PANEL_SIZE, seed = PANEL_SEED): Persona[] {
  return Array.from({ length: size }, (_, i) => generatePersona(i, seed));
}
