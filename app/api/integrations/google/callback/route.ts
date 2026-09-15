import { NextRequest, NextResponse } from "next/server";
import { isGbpConnectionEnabled } from "@/lib/integrations/google";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl?.origin || new URL(req.url).origin;
  const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;

  // GBP API審査待ち・機能フラグ無効時のfail closed
  if (!isGbpConnectionEnabled()) {
    return NextResponse.redirect(
      new URL("/admin?integration_error=pending_approval", origin)
    );
  }

  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?integration_error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin?integration_error=missing_code", origin)
    );
  }

  // トークン交換処理（API審査通過・接続有効化後のフェーズで本物のトークン交換を配備）
  return NextResponse.redirect(
    new URL("/admin?integration_error=token_exchange_disabled", origin)
  );
}
