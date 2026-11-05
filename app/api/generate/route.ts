// アンケート回答から口コミ文章を3パターン生成するAPI。
// 生成処理本体は lib/reviewGeneration.ts（商談デモと共通）。

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { generateReviewDrafts, normalizeSurveyAnswers } from "@/lib/reviewGeneration";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // レートリミット検証（IPヘッダーまたはフォールバック）
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rateLimit = checkRateLimit(`generate:${ip}`, 15, 60_000); // 1分間に最大15回

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "リクエスト回数が上限を超えました。しばらく待ってから再度お試しください。" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
  }

  const storeId = String(body.storeId ?? "");
  const store = await getStore(storeId);

  if (!store) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }

  const result = await generateReviewDrafts(store, normalizeSurveyAnswers(body));
  return NextResponse.json(result);
}
