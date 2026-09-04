import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserStores, getMetrics } from "@/lib/db";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import type { StoreMetrics } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // ログインユーザーが管理可能な店舗一覧を取得（実顧客組織ならThe蔵ssicとSS.GRANDのみ）
  const stores = await getUserStores(user.id);

  // 各店舗の実測メトリクスを取得
  const metricsEntries = await Promise.all(
    stores.map(async (store) => {
      const metrics = await getMetrics(store.id);
      return [store.id, metrics] as const;
    })
  );

  const metricsMap: Record<string, StoreMetrics> = Object.fromEntries(metricsEntries);

  // 全店舗合算メトリクス
  const totalMetrics: StoreMetrics = {
    storeId: "all",
    surveyStarts: 0,
    generatedReviews: 0,
    reviewClicks: 0,
    couponsIssued: 0,
    averageRating: 0,
  };

  let ratingSum = 0;
  let ratingCount = 0;

  for (const m of Object.values(metricsMap)) {
    totalMetrics.surveyStarts += m.surveyStarts;
    totalMetrics.generatedReviews += m.generatedReviews;
    totalMetrics.reviewClicks += m.reviewClicks;
    totalMetrics.couponsIssued += m.couponsIssued;
    if (m.averageRating > 0) {
      ratingSum += m.averageRating;
      ratingCount++;
    }
  }

  if (ratingCount > 0) {
    totalMetrics.averageRating = Math.round((ratingSum / ratingCount) * 10) / 10;
  }

  return (
    <AdminDashboardClient
      stores={stores}
      metricsMap={metricsMap}
      totalMetrics={totalMetrics}
      isDemoUser={false}
    />
  );
}
