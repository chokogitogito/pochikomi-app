import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/guard";
import { syncReviewsForLocation, getReviewReplySettings } from "@/lib/repositories/review-repository";
import { FixtureReviewSource } from "@/lib/reviews/sources/fixtureSource";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, source } = body;

    if (!storeId) {
      return NextResponse.json({ error: "storeId が指定されていません" }, { status: 400 });
    }

    const auth = await verifyAdminAuth(storeId);
    if (!auth.authorized || !auth.organizationId || !auth.locationId) {
      return NextResponse.json({ error: auth.error || "権限がありません" }, { status: auth.status || 403 });
    }

    // 店舗設定から取り込み元を取得するか、リクエスト指定のソースを使用
    const settings = await getReviewReplySettings(auth.organizationId, auth.locationId);
    const targetSource = source || settings.reviewSource;

    let reviews = [];
    if (targetSource === "fixture") {
      const fixtureSource = new FixtureReviewSource();
      reviews = await fixtureSource.fetchReviews(auth.locationId);
    } else {
      // manualの場合は個別手動登録API (/api/reviews/manual) を使用
      return NextResponse.json({
        success: true,
        message: "手動取り込みモードです。口コミはフォームから追加してください。",
        added: 0,
        total: 0,
      });
    }

    const result = await syncReviewsForLocation(auth.organizationId, auth.locationId, reviews);

    return NextResponse.json({
      success: true,
      message: `${result.total}件中 ${result.added}件 の新規口コミを取り込みました`,
      ...result,
    });
  } catch (error: unknown) {
    console.error("[api/reviews/sync] Error:", error);
    return NextResponse.json(
      { error: "口コミの同期に失敗しました" },
      { status: 500 }
    );
  }
}
