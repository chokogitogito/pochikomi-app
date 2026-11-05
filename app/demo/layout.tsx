import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { verifyDemoAccess } from "@/lib/demo/access";
import DemoShell from "@/components/demo/DemoShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商談デモ | ポチコミ",
  robots: { index: false, follow: false },
};

/**
 * 商談デモ専用レイアウト。運営者用の管理画面レイアウト（/admin）とは独立している。
 * 認証はミドルウェアに加え、ここでも既存の管理者ログインを確認する（多層防御）。
 */
export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  const access = await verifyDemoAccess();
  if (!access.ok) {
    redirect("/admin/login?redirect=/demo");
  }
  return <DemoShell>{children}</DemoShell>;
}
