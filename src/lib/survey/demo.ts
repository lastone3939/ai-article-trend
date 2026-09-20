import type { Survey } from "./types";

/** 営業デモ：コンビニ弁当購買意向。 */
export const DEMO_SURVEY: Survey = {
  id: "demo-bento",
  title: "コンビニ弁当 購買意向",
  description:
    "高たんぱく・低糖質の新商品弁当（希望小売 498円）に対する、仮想日本人パネルの購買意向と阻害要因。",
  category: "食品・小売",
  sampleSize: 1000,
  questions: [
    {
      id: "q_freq",
      type: "single",
      text: "直近1か月で、コンビニのお弁当をどのくらい購入しましたか。",
      options: [
        { id: "f_high", label: "週4回以上" },
        { id: "f_mid", label: "週2〜3回" },
        { id: "f_week", label: "週1回程度" },
        { id: "f_month", label: "月1〜2回" },
        { id: "f_rare", label: "ほとんど買わない" },
      ],
    },
    {
      id: "q_priority",
      type: "single",
      text: "コンビニ弁当を選ぶとき、いちばん重視することは何ですか。",
      options: [
        { id: "p_price", label: "価格" },
        { id: "p_taste", label: "味・おいしさ" },
        { id: "p_health", label: "健康・栄養" },
        { id: "p_volume", label: "量・満足感" },
        { id: "p_new", label: "新しさ・話題性" },
        { id: "p_brand", label: "いつもの店・ブランド" },
      ],
    },
    {
      id: "q_intent_498",
      type: "scale",
      text: "新商品「高たんぱく・低糖質弁当（498円）」を、次の1週間で購入する可能性はどのくらいですか。",
      help: "1 = まったく買わない　／　5 = 必ず買う",
      scale: {
        min: 1,
        max: 5,
        minLabel: "まったく買わない",
        maxLabel: "必ず買う",
      },
    },
    {
      id: "q_intent_598",
      type: "scale",
      text: "同じ弁当が 598円 だった場合、購入意向はどのくらいですか。",
      scale: {
        min: 1,
        max: 5,
        minLabel: "まったく買わない",
        maxLabel: "必ず買う",
      },
    },
    {
      id: "q_store",
      type: "single",
      text: "この弁当を買うとしたら、どの店舗で買いたいですか。",
      options: [
        { id: "s_seven", label: "セブン-イレブン" },
        { id: "s_famima", label: "ファミリーマート" },
        { id: "s_lawson", label: "ローソン" },
        { id: "s_any", label: "どこでもよい" },
        { id: "s_none", label: "買わない" },
      ],
    },
    {
      id: "q_barrier",
      type: "single",
      text: "購入をためらう最大の理由は何ですか。",
      options: [
        { id: "b_price", label: "価格が高い" },
        { id: "b_taste", label: "味への不安" },
        { id: "b_volume", label: "量が足りなさそう" },
        { id: "b_claim", label: "健康表示を信じにくい" },
        { id: "b_habit", label: "弁当自体を買わない" },
        { id: "b_none", label: "特にない（買える）" },
      ],
    },
  ],
};

export function emptySurvey(): Survey {
  return {
    id: `s-${Date.now()}`,
    title: "新しい調査",
    description: "",
    category: "未分類",
    sampleSize: 400,
    questions: [
      {
        id: "q1",
        type: "single",
        text: "この商品を次に購入する可能性は？",
        options: [
          { id: "a", label: "買う" },
          { id: "b", label: "迷う" },
          { id: "c", label: "買わない" },
        ],
      },
    ],
  };
}
