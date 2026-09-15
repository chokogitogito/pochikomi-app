import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredGbpCacheFromSupabase } from "@/lib/repositories/supabase-repository";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // テスト環境で明示的にスキップが指定されている場合を除き、CRON_SECRET未設定または不一致は拒絶（fail closed）
  const isTestBypass = process.env.NODE_ENV === "test" && process.env.ALLOW_CRON_TEST_BYPASS === "true";

  if (!isTestBypass) {
    if (!cronSecret) {
      console.error("[cron/cleanup-gbp-cache] CRON_SECRET is not configured. Rejecting request (fail closed).");
      return NextResponse.json(
        { error: "Unauthorized: CRON_SECRET is not configured on the server." },
        { status: 401 }
      );
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
