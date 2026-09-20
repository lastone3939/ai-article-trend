import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-10">
      <p className="text-[12px] text-muted">404</p>
      <h1 className="mt-2 text-[20px] font-semibold">ページがありません</h1>
      <p className="mt-2 text-[13px] text-ink-soft">このアドレスに調査はありません。</p>
      <Link href="/" className="btn btn-primary mt-4">
        調査一覧へ
      </Link>
    </div>
  );
}
