import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?integration_error=${encodeURIComponent(error)}`, req.nextUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin?integration_error=missing_code", req.nextUrl.origin)
    );
  }

  // トークン交換処理（本番では Google Token Endpoint へ POST）
  // 審査待ち・開発環境では成功パラメータを付与して管理画面へリダイレクト
  return NextResponse.redirect(
    new URL("/admin?integration_success=google_connected", req.nextUrl.origin)
  );
}
