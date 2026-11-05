import { NextRequest, NextResponse } from "next/server";
import { verifyDemoAccess } from "@/lib/demo/access";
import { DEMO_STORE } from "@/lib/demo/store";
import { generateReviewDrafts, normalizeSurveyAnswers } from "@/lib/reviewGeneration";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * 商談デモ用アンケートの口コミ文生成。
 * 対象は常に固定のデモ店舗。リクエストの storeId 等は無視する（DBの店舗を引かない）。
 */
export async function POST(req: NextRequest) {
  const access = await verifyDemoAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const rateLimit = checkRateLimit(`demo-generate:${access.userId}`, 15, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "リクエスト回数が上限を超えました。しばらく待ってから再度お試しください。" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
  }

  const result = await generateReviewDrafts(DEMO_STORE, normalizeSurveyAnswers(body));
  return NextResponse.json(result);
}
