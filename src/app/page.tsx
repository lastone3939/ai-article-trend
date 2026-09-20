"use client";

import Link from "next/link";
import { useDraftSurvey } from "@/lib/store";
import { DEMO_SURVEY } from "@/lib/survey/demo";
import { PageHead } from "@/components/layout/Chrome";
import { fmtN } from "@/lib/format";

export default function HomePage() {
  const [draft, setDraft] = useDraftSurvey();

  return (
    <div className="p-4 sm:p-5">
      <PageHead
        crumbs={["調査管理", "調査一覧"]}
        title="調査一覧"
        actions={
          <>
            <Link href="/survey" className="btn btn-ghost">
              新規調査作成
            </Link>
            <Link
              href="/run?demo=1"
              className="btn btn-primary"
              onClick={() => setDraft(DEMO_SURVEY)}
            >
              デモを実行
            </Link>
          </>
        }
      />

      <div className="card mb-4 p-4 text-[13px] leading-6 text-ink-soft">
        <p>
          <span className="badge-synth mr-2">仮想パネル／合成回答</span>
          コンビニ弁当のデモ調査が用意されています。右上の「デモを実行」で 1,000
          人の仮想回答まで一気に進めます。実在モニターではありません。
        </p>
      </div>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[12px] text-muted">
              <tr>
                {["調査名", "手法", "ステータス", "サンプル", "設問", "操作"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line">
                <td className="px-4 py-3">
                  <p className="font-medium">{DEMO_SURVEY.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{DEMO_SURVEY.id}</p>
                </td>
                <td className="px-4 py-3">仮想パネル</td>
                <td className="px-4 py-3">下書き</td>
                <td className="px-4 py-3">{fmtN(DEMO_SURVEY.sampleSize)}</td>
                <td className="px-4 py-3">{DEMO_SURVEY.questions.length}</td>
                <td className="px-4 py-3">
                  <Link
                    href="/survey"
                    className="text-brand"
                    onClick={() => setDraft(DEMO_SURVEY)}
                  >
                    編集
                  </Link>
                  <Link href="/run?demo=1" className="ml-3 text-brand">
                    実行
                  </Link>
                </td>
              </tr>
              {draft.id !== DEMO_SURVEY.id && (
                <tr className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="font-medium">{draft.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{draft.id}</p>
                  </td>
                  <td className="px-4 py-3">仮想パネル</td>
                  <td className="px-4 py-3">{draft.status === "ready" ? "実行可能" : "下書き"}</td>
                  <td className="px-4 py-3">{fmtN(draft.sampleSize)}</td>
                  <td className="px-4 py-3">{draft.questions.length}</td>
                  <td className="px-4 py-3">
                    <Link href="/survey" className="text-brand">
                      編集
                    </Link>
                    <Link href="/run" className="ml-3 text-brand">
                      実行
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
