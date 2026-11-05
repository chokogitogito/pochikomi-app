import { NextRequest, NextResponse } from "next/server";
import { verifyDemoAccess } from "@/lib/demo/access";
import { findDemoReview } from "@/lib/demo/reviews";
import { generateDemoReplyDrafts } from "@/lib/demo/replyGeneration";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * 商談デモ用の返信下書き生成。
 * 受け取るのは固定デモ口コミのID（reviewId）のみ。口コミ本文・店舗IDはクライアントから受け取らず、
 * 結果はDBへ保存しない（編集・承認状態はブラウザのセッション内だけで保持する）。
 */
export async function POST(req: NextRequest) {
  const access = await verifyDemoAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const rateLimit = checkRateLimit(`demo-reply:${access.userId}`, 15, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "リクエスト回数が上限を超えました。しばらく待ってから再度お試しください。" },
      { status: 429 }
    );
  }

  let reviewId: unknown;
  try {
    const body = (await req.json()) as Record<string, unknown> | null;
    reviewId = body?.reviewId;
  } catch {
    return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
  }

  const review = findDemoReview(reviewId);
  if (!review) {
    return NextResponse.json({ error: "デモ口コミが見つかりません" }, { status: 404 });
  }

  const result = await generateDemoReplyDrafts(review);
  return NextResponse.json({ success: true, ...result });
}
