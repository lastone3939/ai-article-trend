"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { classNames } from "@/lib/format";

const NAV = [
  { href: "/survey", label: "調査をつくる" },
  { href: "/run", label: "実行" },
  { href: "/results", label: "結果" },
  { href: "/personas", label: "パネル" },
  { href: "/calibrate", label: "補正" },
];

export function Chrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border-b border-vermillion/20 bg-vermillion text-surface">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-center text-[11px] tracking-wide sm:text-xs">
          <span className="font-medium">合成パネル</span>
          <span className="opacity-70">／</span>
          <span>
            仮想日本人は実在の回答者ではありません。実査との差分学習を前提とした意思決定支援です。
          </span>
        </p>
      </div>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center bg-vermillion font-serif text-sm text-surface">
              仮
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-[15px] tracking-wide">仮想日本人</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                Synthetic Survey
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = path === item.href || path.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    "px-3 py-1.5 text-[13px] transition-colors",
                    active ? "text-vermillion" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/run?demo=1"
              className="ml-2 bg-ink px-3.5 py-1.5 text-[13px] text-paper transition hover:bg-vermillion"
            >
              デモを実行
            </Link>
          </nav>

          <button
            type="button"
            className="grid h-9 w-9 place-items-center border border-line md:hidden"
            aria-label="メニュー"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="flex w-4 flex-col gap-1">
              <i className="block h-px bg-ink" />
              <i className="block h-px bg-ink" />
              <i className="block h-px bg-ink" />
            </span>
          </button>
        </div>
        {open && (
          <div className="border-t border-line px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/run?demo=1"
                onClick={() => setOpen(false)}
                className="mt-1 bg-ink px-3 py-2 text-center text-sm text-paper"
              >
                デモを実行
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-20 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="font-serif text-lg">仮想日本人</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
              L1 Synthetic Survey MVP。人口統計で加重した 1,000
              人の仮想パネルに質問し、選択と短い理由を集計します。実人同等は主張しません。
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Not real respondents · Calibration required
          </p>
        </div>
      </footer>
    </>
  );
}

export function PageIntro({
  kicker,
  title,
  lede,
  action,
}: {
  kicker: string;
  title: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-vermillion">
          {kicker}
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
        {lede && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{lede}</p>}
      </div>
      {action}
    </div>
  );
}
