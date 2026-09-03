"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  {
    label: "ダッシュボード",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "QRコード管理",
    href: "/admin/qr",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0a2 2 0 104 0m-4 0a2 2 0 114 0m-8 4v1m0-1a2 2 0 10-4 0m4 0a2 2 0 11-4 0m0-6H4m6-6v1m0-1a2 2 0 10-4 0m4 0a2 2 0 11-4 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    label: "店舗管理",
    href: "/admin/stores/golf-a",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: "クーポン管理",
    href: "/admin/coupons",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col md:flex-row">
      {/* デスクトップ：サイドバー */}
      <aside className="hidden md:flex md:w-64 flex-col bg-surface border-r border-border-default shrink-0">
        <div className="p-6 border-b border-border-subtle">
          <Link href="/admin" className="block pressable">
            <Logo size={32} />
          </Link>
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded">
            Admin Console
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href.replace(/\/golf-a$/, ""));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all pressable ${
                  isActive
                    ? "bg-brand-light text-brand shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                }`}
              >
                <span className={isActive ? "text-brand" : "text-text-tertiary"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <Link
            href="/survey/golf-a"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-brand hover:bg-brand-light transition-all pressable"
          >
            <span>アンケート画面を開く</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </aside>

      {/* モバイル：すりガラスヘッダー ＆ 水平ナビ */}
      <div className="md:hidden sticky top-0 z-30 frosted-nav">
        <div className="px-5 py-3 flex items-center justify-between">
          <Link href="/admin" className="pressable">
            <Logo size={26} />
          </Link>
          <span className="text-[11px] font-bold text-text-tertiary bg-surface-secondary px-2.5 py-0.5 rounded-full border border-border-subtle">
            管理画面
          </span>
        </div>
        <nav className="flex px-3 pb-2 gap-1 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href.replace(/\/golf-a$/, ""));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold pressable whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-brand text-white shadow-sm"
                    : "text-text-secondary bg-surface border border-border-subtle"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 min-w-0 bg-canvas overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
