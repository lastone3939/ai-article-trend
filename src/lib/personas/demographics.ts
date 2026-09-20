import type {
  AgeBand,
  Gender,
  Household,
  IncomeBand,
  Region,
} from "./types";

/** e-Stat 人口推計を縮約した 18歳以上ウェイト（MVP 近似）。 */
export const AGE_WEIGHTS: { band: AgeBand; w: number; min: number; max: number }[] =
  [
    { band: "18-24", w: 0.08, min: 18, max: 24 },
    { band: "25-34", w: 0.12, min: 25, max: 34 },
    { band: "35-44", w: 0.14, min: 35, max: 44 },
    { band: "45-54", w: 0.17, min: 45, max: 54 },
    { band: "55-64", w: 0.16, min: 55, max: 64 },
    { band: "65+", w: 0.33, min: 65, max: 84 },
  ];

export const GENDER_WEIGHTS: { id: Gender; w: number }[] = [
  { id: "female", w: 0.514 },
  { id: "male", w: 0.486 },
];

export const REGION_META: {
  id: Region;
  w: number;
  label: string;
  prefectures: string[];
}[] = [
  { id: "hokkaido", w: 0.042, label: "北海道", prefectures: ["北海道"] },
  {
    id: "tohoku",
    w: 0.068,
    label: "東北",
    prefectures: ["青森", "岩手", "宮城", "秋田", "山形", "福島"],
  },
  {
    id: "kanto",
    w: 0.345,
    label: "関東",
    prefectures: ["東京", "神奈川", "埼玉", "千葉", "茨城", "栃木", "群馬"],
  },
  {
    id: "chubu",
    w: 0.165,
    label: "中部",
    prefectures: ["新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知"],
  },
  {
    id: "kinki",
    w: 0.16,
    label: "近畿",
    prefectures: ["京都", "大阪", "兵庫", "奈良", "滋賀", "和歌山", "三重"],
  },
  {
    id: "chugoku",
    w: 0.058,
    label: "中国",
    prefectures: ["鳥取", "島根", "岡山", "広島", "山口"],
  },
  {
    id: "shikoku",
    w: 0.029,
    label: "四国",
    prefectures: ["徳島", "香川", "愛媛", "高知"],
  },
  {
    id: "kyushu",
    w: 0.133,
    label: "九州・沖縄",
    prefectures: ["福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"],
  },
];

export const INCOME_WEIGHTS: { id: IncomeBand; w: number; label: string }[] = [
  { id: "lt300", w: 0.28, label: "300万未満" },
  { id: "300-500", w: 0.25, label: "300–500万" },
  { id: "500-700", w: 0.2, label: "500–700万" },
  { id: "700-1000", w: 0.16, label: "700–1000万" },
  { id: "gt1000", w: 0.11, label: "1000万以上" },
];

export const HOUSEHOLD_WEIGHTS: { id: Household; w: number; label: string }[] = [
  { id: "single", w: 0.38, label: "単身" },
  { id: "couple", w: 0.24, label: "夫婦" },
  { id: "family", w: 0.28, label: "ファミリー" },
  { id: "multi", w: 0.1, label: "三世代" },
];

export const REGION_LABEL: Record<Region, string> = Object.fromEntries(
  REGION_META.map((r) => [r.id, r.label]),
) as Record<Region, string>;

export const GENDER_LABEL: Record<Gender, string> = {
  female: "女性",
  male: "男性",
};

export const AGE_LABEL: Record<AgeBand, string> = {
  "18-24": "18–24歳",
  "25-34": "25–34歳",
  "35-44": "35–44歳",
  "45-54": "45–54歳",
  "55-64": "55–64歳",
  "65+": "65歳以上",
};

export const INCOME_LABEL: Record<IncomeBand, string> = Object.fromEntries(
  INCOME_WEIGHTS.map((i) => [i.id, i.label]),
) as Record<IncomeBand, string>;

export const HOUSEHOLD_LABEL: Record<Household, string> = Object.fromEntries(
  HOUSEHOLD_WEIGHTS.map((h) => [h.id, h.label]),
) as Record<Household, string>;
