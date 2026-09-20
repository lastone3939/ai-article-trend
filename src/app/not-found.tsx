import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-vermillion">404</p>
      <h1 className="mt-3 font-serif text-4xl">頁がない。</h1>
      <p className="mt-4 text-sm leading-7 text-ink-soft">
        このアドレスには、調査もパネルもありません。
      </p>
      <Link href="/" className="mt-6 inline-block bg-ink px-5 py-2.5 text-sm text-paper">
        扉へ戻る
      </Link>
    </div>
  );
}
