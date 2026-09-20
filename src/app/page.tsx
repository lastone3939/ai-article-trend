import Link from "next/link";
import { getPanel, panelComposition } from "@/lib/personas/panel";
import { AGE_LABEL, GENDER_LABEL, REGION_LABEL } from "@/lib/personas/demographics";
import { fmtN } from "@/lib/format";

export default function HomePage() {
  const peek = getPanel().filter((_, i) => i % 41 === 0).slice(0, 8);
  const comp = panelComposition();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:pt-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-vermillion">
              L1 · Synthetic Survey
            </p>
            <h1 className="mt-5 font-serif text-[2.35rem] leading-[1.15] sm:text-6xl sm:leading-[1.12]">
              仮想日本人、
              <br />
              一千人。
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              人口分布で加重した合成パネルに、質問を投げる。
              <br className="hidden sm:block" />
              選択と、短い日本語の理由が、その場で返る。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/run?demo=1"
                className="bg-vermillion px-6 py-3 text-center text-sm text-surface transition hover:bg-vermillion-deep"
              >
                コンビニ弁当のデモを見る
              </Link>
              <Link
                href="/survey"
                className="border border-ink/20 bg-surface px-6 py-3 text-center text-sm hover:border-ink"
              >
                調査を設計する
              </Link>
            </div>
          </div>
          <aside className="seal text-[13px] lg:mb-2">合成・非実在</aside>
        </div>

        <div className="hairline" />

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            ["パネル", `${fmtN(comp.n)} 人`],
            ["加重", "年齢・地域・所得"],
            ["潜在変数", "24 次元"],
            ["レイヤー", "L1 回答のみ"],
          ].map(([k, v]) => (
            <div key={k} className="bg-paper px-4 py-5 sm:px-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{k}</p>
              <p className="mt-1 font-serif text-xl">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="paper-card p-5 sm:p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-vermillion">
            Honest disclaimer
          </p>
          <h2 className="mt-2 font-serif text-2xl">売らないこと。</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-soft">
            「AIに聞きました」を「日本人に聞きました」と同義では売りません。
            仮想回答は、人口縮約と価値観の連続量から生成した
            <strong className="font-medium text-ink"> 合成データ </strong>
            です。本格品質の本丸は、実人アンケートとの差分学習と補正です。この
            MVP はその前段——瞬時のパネル回答と、読める集計——までです。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">How it works</p>
        <h2 className="mt-2 font-serif text-3xl">三つの層。</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "仮想人間エンジン",
              d: "年齢・性別・地域・所得を e-Stat 縮約でサンプリング。価値観と購買ルールを 0–1 の連続量で持つ。",
            },
            {
              n: "02",
              t: "回答エンジン",
              d: "TypeSafe Choice / Score。設問ごとに効用を計算し、選択と短い理由、確信度を返す。",
            },
            {
              n: "03",
              t: "集計と補正口",
              d: "セグメントクロス、理由テーマ、CSV/JSON。実査アップロードは次フェーズの受け口だけ用意。",
            },
          ].map((s) => (
            <article key={s.n} className="paper-card p-6">
              <p className="font-mono text-[11px] text-vermillion">{s.n}</p>
              <h3 className="mt-3 font-serif text-xl">{s.t}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="paper-card overflow-hidden">
            <div className="border-b border-line bg-surface-2 px-6 py-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Featured demo
              </p>
              <h2 className="mt-1 font-serif text-2xl">コンビニ弁当 購買意向</h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-7 text-ink-soft">
                高たんぱく・低糖質弁当（498円）を、仮想パネル 1,000
                人に聞く。頻度、重視点、価格感度（598円）、店舗、阻害要因。
                年齢×意向のクロスと、理由のテーマが同時に出ます。
              </p>
              <ul className="mt-5 space-y-2 text-sm text-ink-soft">
                {[
                  "週次の購買頻度",
                  "選択基準（価格 / 味 / 健康 / 量）",
                  "498円と598円の意向差",
                  "チェーン選好とためらい",
                ].map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 bg-vermillion" />
                    {x}
                  </li>
                ))}
              </ul>
              <Link
                href="/run?demo=1"
                className="mt-6 inline-block bg-ink px-5 py-2.5 text-sm text-paper hover:bg-vermillion"
              >
                1,000人に聞く
              </Link>
            </div>
          </article>

          <article className="paper-card p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Weighted panel
            </p>
            <h3 className="mt-1 font-serif text-xl">人口の縮約</h3>
            <dl className="mt-5 space-y-3 text-sm">
              {Object.entries(comp.age).map(([k, n]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs text-muted">
                    <dt>{AGE_LABEL[k as keyof typeof AGE_LABEL]}</dt>
                    <dd>{Math.round((n / comp.n) * 100)}%</dd>
                  </div>
                  <div className="mt-1 h-1 bg-chip">
                    <div
                      className="h-1 bg-indigo"
                      style={{ width: `${(n / comp.n) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-xs leading-6 text-muted">
              女性 {Math.round(((comp.gender.female ?? 0) / comp.n) * 100)}% ／ 関東{" "}
              {Math.round(((comp.region.kanto ?? 0) / comp.n) * 100)}%
              。高齢層を厚くした、日本の縮図です。
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Persona gallery
            </p>
            <h2 className="mt-2 font-serif text-3xl">面を覗く。</h2>
          </div>
          <Link href="/personas" className="text-sm text-vermillion hover:underline">
            1,000人を見る
          </Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {peek.map((p) => (
            <article key={p.id} className="paper-card p-4">
              <p className="font-mono text-[10px] text-muted">{p.id}</p>
              <h3 className="mt-1 font-serif text-lg">{p.displayName}</h3>
              <p className="mt-1 text-xs text-muted">
                {p.age}歳 {GENDER_LABEL[p.gender]} ／ {p.prefecture} ／ {p.occupation}
              </p>
              <p className="mt-3 line-clamp-3 text-xs leading-6 text-ink-soft">{p.bio}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">
                {REGION_LABEL[p.region]}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
