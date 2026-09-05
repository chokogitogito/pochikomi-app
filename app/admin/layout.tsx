"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  {
    label: "ダッシュボード",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "店舗管理",
    href: "/admin/stores",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: "口コミ返信",
    href: "/admin/reviews",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
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
    label: "クーポン管理",
    href: "/admin/coupons",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    label: "Google連携",
    href: "/admin/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("ログアウト処理に失敗しました", err);
      router.push("/admin/login");
    }
  };

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
                : pathname.startsWith(item.href);

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

        <div className="p-4 border-t border-border-subtle space-y-2">
          <Link
            href="/survey/classic"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-brand hover:bg-brand-light transition-all pressable"
          >
            <span>アンケート画面を開く</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-all pressable"
          >
            <span>ログアウト</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* モバイル：すりガラスヘッダー ＆ 水平ナビ */}
      <div className="md:hidden sticky top-0 z-30 frosted-nav">
        <div className="px-5 py-3 flex items-center justify-between">
          <Link href="/admin" className="pressable">
            <Logo size={26} />
          </Link>
          <button
            onClick={handleLogout}
            className="text-[11px] font-bold text-red-600 bg-surface-secondary px-2.5 py-0.5 rounded-full border border-border-subtle"
          >
            ログアウト
          </button>
        </div>
        <nav className="flex px-3 pb-2 gap-1 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

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
