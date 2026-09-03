import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredGbpCacheFromSupabase } from "@/lib/repositories/supabase-repository";

export async function GET(req: NextRequest) {
  // CRON_SECRETによる保護（設定されている場合）
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredGbpCacheFromSupabase();
    return NextResponse.json({
      success: true,
      message: "Google Content 30日TTL期限切れキャッシュのクリーンアップが完了しました",
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "クリーンアップエラー";
    console.error("[cron/cleanup-gbp-cache] Error:", error);
    return NextResponse.json(
      { error: "クリーンアップ処理に失敗しました", details: message },
      { status: 500 }
    );
  }
}
