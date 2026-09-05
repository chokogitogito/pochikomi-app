import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/guard";
import { updateReviewReplyStatus } from "@/lib/repositories/review-repository";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewRef: string }> }
) {
  try {
    const { reviewRef } = await params;
    const body = await req.json();
    const { storeId, status } = body;

    if (!storeId) {
      return NextResponse.json({ error: "storeId が指定されていません" }, { status: 400 });
    }

    if (!["replied", "ignored", "unreplied"].includes(status)) {
      return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
    }

    const auth = await verifyAdminAuth(storeId);
    if (!auth.authorized || !auth.locationId) {
      return NextResponse.json({ error: auth.error || "権限がありません" }, { status: auth.status || 403 });
    }

    const success = await updateReviewReplyStatus({
      locationId: auth.locationId,
      reviewRefHash: reviewRef,
      status,
    });

    if (!success) {
      return NextResponse.json({ error: "ステータスの更新に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `ステータスを「${status}」に更新しました`,
    });
  } catch (error: unknown) {
    console.error("[api/reviews/status] Error:", error);
    return NextResponse.json(
      { error: "ステータス更新処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
