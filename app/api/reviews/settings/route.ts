import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/guard";
import { getReviewReplySettings, saveReviewReplySettings } from "@/lib/repositories/review-repository";

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "storeId が指定されていません" }, { status: 400 });
  }

  const auth = await verifyAdminAuth(storeId);
  if (!auth.authorized || !auth.organizationId || !auth.locationId) {
    return NextResponse.json({ error: auth.error || "権限がありません" }, { status: auth.status || 403 });
  }

  try {
    const settings = await getReviewReplySettings(auth.organizationId, auth.locationId);
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    console.error("[api/reviews/settings] GET error:", error);
    return NextResponse.json({ error: "設定の取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, settings } = body;

    if (!storeId) {
      return NextResponse.json({ error: "storeId が指定されていません" }, { status: 400 });
    }

    const auth = await verifyAdminAuth(storeId);
    if (!auth.authorized || !auth.organizationId || !auth.locationId) {
      return NextResponse.json({ error: auth.error || "権限がありません" }, { status: auth.status || 403 });
    }

    const updated = await saveReviewReplySettings(auth.organizationId, auth.locationId, settings || {});
    return NextResponse.json({
      success: true,
      message: "返信設定を保存しました",
      settings: updated,
    });
  } catch (error: unknown) {
    console.error("[api/reviews/settings] PUT error:", error);
    return NextResponse.json({ error: "設定の保存に失敗しました" }, { status: 500 });
  }
}
