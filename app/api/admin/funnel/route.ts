import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/guard";
import { getMultiStoreComparison, getFunnelMetrics } from "@/lib/repositories/funnel-repository";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const storeId = searchParams.get("storeId");
    const campaignId = searchParams.get("campaignId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // 店舗指定がある場合はその店舗、ない場合は組織全体の管理者権限で認可チェックし組織IDを確定
    const auth = storeId && storeId !== "all"
      ? await verifyAdminAuth(storeId)
      : await verifyAdminAuth();

    if (!auth.authorized || !auth.organizationId) {
      return NextResponse.json(
        { error: auth.error || "認証または権限がありません" },
        { status: auth.status || 401 }
      );
    }

    if (storeId && storeId !== "all") {
      // 単一店舗のファネル集計
      const metrics = await getFunnelMetrics({
        organizationId: auth.organizationId,
        locationId: auth.locationId,
        campaignId,
        startDate,
        endDate,
      });

      return NextResponse.json({
        type: "single_location",
        metrics,
      });
    }

    // 全店舗合算および店舗別比較の多店舗集約
    const comparison = await getMultiStoreComparison({
      organizationId: auth.organizationId,
      campaignId,
      startDate,
      endDate,
    });

    return NextResponse.json({
      type: "multi_location_comparison",
      ...comparison,
    });
  } catch (err: unknown) {
    console.error("[api/admin/funnel] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
