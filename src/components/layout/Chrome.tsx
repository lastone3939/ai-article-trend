"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  Home,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { classNames } from "@/lib/format";

const TOP = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/survey", label: "調査管理", icon: ClipboardList },
  { href: "/personas", label: "モニター管理", icon: Users },
  { href: "/results", label: "集計・分析", icon: BarChart3 },
  { href: "/results", label: "レポート", icon: FileText, key: "report" },
  { href: "/calibrate", label: "各種設定", icon: Settings },
];

type SideItem = { href: string; label: string; exact?: boolean };
type SideGroup = { title: string; items: SideItem[] };

const SIDE: SideGroup[] = [
  {
    title: "調査管理",
    items: [
      { href: "/", label: "調査一覧", exact: true },
      { href: "/survey", label: "新規調査作成" },
      { href: "/survey", label: "下書き一覧" },
      { href: "/results", label: "公開中の調査" },
      { href: "/results", label: "終了した調査" },
    ],
  },
  {
    title: "テンプレート",
    items: [{ href: "/survey", label: "よく使う設問" }],
  },
  {
    title: "設問ライブラリ",
    items: [{ href: "/survey", label: "画像・動画ライブラリ" }],
  },
  {
    title: "配信管理",
    items: [
      { href: "/run", label: "配信スケジュール" },
      { href: "/run?demo=1", label: "デモ配信" },
    ],
  },
  {
    title: "モニター管理",
    items: [
      { href: "/personas", label: "モニター一覧" },
      { href: "/survey", label: "セグメント設定" },
    ],
  },
  {
    title: "集計・分析",
    items: [
      { href: "/results", label: "リアルタイム集計" },
      { href: "/results", label: "クロス集計" },
      { href: "/results", label: "レポート出力" },
    ],
  },
  {
    title: "各種設定",
    items: [
      { href: "/calibrate", label: "補正設定" },
      { href: "/calibrate", label: "システム連携" },
    ],
  },
];

function topActive(path: string, href: string, label: string) {
  if (label === "ホーム") return path === "/";
  if (label === "調査管理") return path.startsWith("/survey") || path.startsWith("/run");
  if (label === "モニター管理") return path.startsWith("/personas");
  if (label === "集計・分析" || label === "レポート") return path.startsWith("/results");
  if (label === "各種設定") return path.startsWith("/calibrate");
  return path === href;
}

export function Chrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="z-30 flex h-12 shrink-0 items-center gap-3 border-b border-line bg-white px-3">
        <button
          type="button"
          className="grid h-8 w-8 place-items-center text-ink-soft lg:hidden"
          aria-label="メニュー"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu size={18} />
        </button>
        <Link href="/" className="flex items-center gap-2 pr-3">
          <span className="grid h-7 w-7 place-items-center rounded bg-brand text-[12px] font-bold text-white">
            仮
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">仮想日本人</span>
        </Link>
        <nav className="hidden h-full items-stretch gap-1 md:flex">
          {TOP.map((item) => {
            const Icon = item.icon;
            const active = topActive(path, item.href, item.label);
            return (
              <Link
                key={item.key ?? item.label}
                href={item.href}
                className={classNames(
                  "relative flex items-center gap-1.5 px-3 text-[13px]",
                  active ? "font-medium text-brand" : "text-ink-soft hover:text-ink",
                )}
              >
                <Icon size={15} />
                {item.label}
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-brand" />}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-[12px] text-ink-soft">
          <span className="badge-synth hidden sm:inline-flex">仮想パネル／合成回答</span>
          <span className="relative hidden sm:inline-flex">
            <Bell size={16} />
            <span className="absolute -right-1.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-500 px-0.5 text-[9px] text-white">
              1
            </span>
          </span>
          <span className="hidden lg:inline">仮想日本人 デモ</span>
          <span>デモユーザー</span>
          <span className="hidden sm:inline text-slate-400">ログアウト</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={classNames(
            "z-20 w-[208px] shrink-0 overflow-y-auto bg-navy text-[12px] text-slate-200 scrollbar-thin",
            open
              ? "absolute bottom-0 left-0 top-12 block shadow-xl"
              : "hidden lg:block",
          )}
        >
          <p className="bg-navy-2 px-4 py-2.5 text-[12px] font-medium text-white">調査管理</p>
          {SIDE.map((group) => (
            <div key={group.title} className="border-t border-white/10 py-2">
              <p className="px-4 pb-1 pt-1 text-[11px] text-slate-400">{group.title}</p>
              {group.items.map((item) => {
                const active =
                  item.exact
                    ? path === item.href
                    : path === item.href ||
                      (item.href !== "/" && path.startsWith(item.href.split("?")[0]!));
                const unique = `${group.title}-${item.label}`;
                return (
                  <Link
                    key={unique}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={classNames(
                      "block px-4 py-1.5",
                      active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>
        {open && (
          <button
            type="button"
            className="absolute inset-0 z-10 bg-black/30 lg:hidden"
            aria-label="閉じる"
            onClick={() => setOpen(false)}
          />
        )}
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export function PageHead({
  crumbs,
  title,
  actions,
}: {
  crumbs: string[];
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <p className="text-[11px] text-muted">{crumbs.join("  >  ")}</p>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-[18px] font-semibold">
          <FileText size={18} className="text-slate-500" />
          {title}
        </h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
