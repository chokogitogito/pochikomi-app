"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { label: "ダッシュボード", href: "/demo" },
  { label: "AI検索分析", href: "/demo/ai-search" },
  { label: "来店客アンケート", href: "/demo/survey" },
  { label: "口コミ返信", href: "/demo/reviews" },
];

/**
 * 商談デモ専用のシェル。店舗選択メニューや実店舗の管理導線（店舗管理・QR・クーポン・Google連携）は置かない。
 */
export default function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col">
      <header className="sticky top-0 z-30 frosted-nav border-b border-border-default">
        <div className="max-w-6xl w-full mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
          <Link href="/demo" className="flex items-center gap-3 pressable" aria-label="商談デモのトップへ">
            <Logo size={28} />
            <span className="text-[11px] font-bold text-white bg-brand px-2.5 py-1 rounded-full tracking-wide">
              商談デモ
            </span>
          </Link>
          <p className="hidden sm:block text-[11px] text-text-tertiary text-right leading-snug">
            架空の「サンプルラーメン店」を使ったデモです。
            <br />
            実在店舗のデータは含まれません。
          </p>
        </div>
        <nav className="max-w-6xl w-full mx-auto px-3 md:px-7 pb-2 flex gap-1 overflow-x-auto no-scrollbar" aria-label="デモ内ナビゲーション">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/demo" ? pathname === "/demo" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold pressable whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-brand text-white shadow-sm"
                    : "text-text-secondary bg-surface border border-border-subtle hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
