export const AGE_BANDS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const GENDERS = ["female", "male"] as const;
export type Gender = (typeof GENDERS)[number];

export const REGIONS = [
  "hokkaido",
  "tohoku",
  "kanto",
  "chubu",
  "kinki",
  "chugoku",
  "shikoku",
  "kyushu",
] as const;
export type Region = (typeof REGIONS)[number];

export const INCOME_BANDS = [
  "lt300",
  "300-500",
  "500-700",
  "700-1000",
  "gt1000",
] as const;
export type IncomeBand = (typeof INCOME_BANDS)[number];

export const HOUSEHOLDS = ["single", "couple", "family", "multi"] as const;
export type Household = (typeof HOUSEHOLDS)[number];

export const TRAIT_KEYS = [
  "priceSensitivity",
  "healthOrientation",
  "convenienceSeeking",
  "noveltySeeking",
  "brandLoyalty",
  "timePoverty",
  "environmentalConcern",
  "socialConformity",
  "riskAversion",
  "qualityOrientation",
  "traditionOrientation",
  "digitalNative",
  "foodAdventure",
  "portionHunger",
  "saltFatPreference",
  "trustInClaims",
  "sevenAffinity",
  "famimaAffinity",
  "lawsonAffinity",
  "cookingHabit",
  "impulseBuying",
  "familyConsideration",
  "statusSignaling",
  "frugalityPride",
] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];
export type Traits = Record<TraitKey, number>;

export const TRAIT_LABELS: Record<TraitKey, string> = {
  priceSensitivity: "価格感度",
  healthOrientation: "健康志向",
  convenienceSeeking: "利便志向",
  noveltySeeking: "新奇性",
  brandLoyalty: "ブランド忠誠",
  timePoverty: "時間貧困",
  environmentalConcern: "環境意識",
  socialConformity: "同調",
  riskAversion: "リスク回避",
  qualityOrientation: "品質志向",
  traditionOrientation: "伝統志向",
  digitalNative: "デジタル",
  foodAdventure: "食の冒険",
  portionHunger: "量・満足",
  saltFatPreference: "濃い味",
  trustInClaims: "表示信頼",
  sevenAffinity: "セブン親和",
  famimaAffinity: "ファミマ親和",
  lawsonAffinity: "ローソン親和",
  cookingHabit: "自炊習慣",
  impulseBuying: "衝動購買",
  familyConsideration: "家族配慮",
  statusSignaling: "見栄",
  frugalityPride: "倹約の誇り",
};

export type Persona = {
  id: string;
  seed: number;
  displayName: string;
  age: number;
  ageBand: AgeBand;
  gender: Gender;
  prefecture: string;
  region: Region;
  household: Household;
  incomeBand: IncomeBand;
  occupation: string;
  traits: Traits;
  values: string[];
  currentState: {
    mood: number;
    hunger: number;
    budgetPressure: number;
    lastConvenienceVisitDays: number;
  };
  bio: string;
};

export type PersonaFilter = {
  ageBands?: AgeBand[];
  genders?: Gender[];
  regions?: Region[];
  incomeBands?: IncomeBand[];
  households?: Household[];
};

export type SlimPersona = Pick<
  Persona,
  | "id"
  | "displayName"
  | "age"
  | "ageBand"
  | "gender"
  | "prefecture"
  | "region"
  | "household"
  | "incomeBand"
  | "occupation"
>;

export function slimPersona(p: Persona): SlimPersona {
  return {
    id: p.id,
    displayName: p.displayName,
    age: p.age,
    ageBand: p.ageBand,
    gender: p.gender,
    prefecture: p.prefecture,
    region: p.region,
    household: p.household,
    incomeBand: p.incomeBand,
    occupation: p.occupation,
  };
}
