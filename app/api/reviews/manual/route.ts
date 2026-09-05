import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/guard";
import { syncReviewsForLocation } from "@/lib/repositories/review-repository";
import { createManualReview } from "@/lib/reviews/sources/manualSource";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, reviewerName, starRating, comment, reviewCreatedAt } = body;

    if (!storeId) {
      return NextResponse.json({ error: "storeId が指定されていません" }, { status: 400 });
    }

    const auth = await verifyAdminAuth(storeId);
    if (!auth.authorized || !auth.organizationId || !auth.locationId) {
      return NextResponse.json({ error: auth.error || "権限がありません" }, { status: auth.status || 403 });
    }

    if (!starRating || typeof starRating !== "number" || starRating < 1 || starRating > 5) {
      return NextResponse.json({ error: "星評価は1〜5で指定してください" }, { status: 400 });
    }

    const manualReview = createManualReview({
      locationId: auth.locationId,
      reviewerName,
      starRating,
      comment,
      reviewCreatedAt,
    });

    const result = await syncReviewsForLocation(auth.organizationId, auth.locationId, [manualReview]);

    return NextResponse.json({
      success: true,
      message: result.added > 0 ? "口コミを手動登録しました" : "この口コミは既に登録されています",
      review: manualReview,
      added: result.added,
    });
  } catch (error: unknown) {
    console.error("[api/reviews/manual] Error:", error);
    return NextResponse.json(
      { error: "手動口コミの登録に失敗しました" },
      { status: 500 }
    );
  }
}
