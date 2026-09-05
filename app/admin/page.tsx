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

  // 各店舗の未返信口コミ件数を集計（サーバー側事前集計）
  let totalUnrepliedCount = 0;
  let unrepliedCounts: Record<string, number> = {};
  try {
    const { getUnrepliedReviewCount } = await import("@/lib/repositories/review-repository");
    const { createAdminClient } = await import("@/lib/supabase/admin");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    const countResults = await Promise.all(
      stores.map(async (store) => {
        const { data: loc } = await admin
          .from("locations")
          .select("id")
          .eq("public_slug", store.id)
          .maybeSingle();

        if (loc?.id) {
          const count = await getUnrepliedReviewCount(loc.id);
          return { storeId: store.id, count };
        }
        return { storeId: store.id, count: 0 };
      })
    );

    unrepliedCounts = Object.fromEntries(countResults.map((r) => [r.storeId, r.count]));
    totalUnrepliedCount = countResults.reduce((sum, r) => sum + r.count, 0);
  } catch (err) {
    console.error("[AdminDashboardPage] 未返信件数の集計エラー:", err);
  }

  return (
    <AdminDashboardClient
      stores={stores}
      metricsMap={metricsMap}
      totalMetrics={totalMetrics}
      isDemoUser={false}
      totalUnrepliedCount={totalUnrepliedCount}
      unrepliedCounts={unrepliedCounts}
    />
  );
}
