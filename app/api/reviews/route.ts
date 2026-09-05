import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/guard";
import { getReviewInbox, getUnrepliedReviewCount } from "@/lib/repositories/review-repository";

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "storeId が指定されていません" }, { status: 400 });
  }

  const auth = await verifyAdminAuth(storeId);
  if (!auth.authorized || !auth.locationId) {
    return NextResponse.json({ error: auth.error || "権限がありません" }, { status: auth.status || 403 });
  }

  try {
    const reviews = await getReviewInbox(auth.locationId);
    const unrepliedCount = await getUnrepliedReviewCount(auth.locationId);

    return NextResponse.json({
      success: true,
      reviews,
      unrepliedCount,
    });
  } catch (error: unknown) {
    console.error("[api/reviews] GET error:", error);
    return NextResponse.json(
      { error: "口コミ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
