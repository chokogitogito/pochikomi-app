import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_SCOPES } from "@/lib/integrations/google";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `${req.nextUrl.origin}/api/integrations/google/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID が設定されていません。審査完了後に設定してください。" },
      { status: 503 }
    );
  }

  const scopeType = req.nextUrl.searchParams.get("scope") || "gbp";
  const scopes = scopeType === "ga4" ? GOOGLE_SCOPES.ga4 : GOOGLE_SCOPES.gbp;

  // CSRF保護用のstate生成
  const state = Buffer.from(
    JSON.stringify({
      nonce: Math.random().toString(36).slice(2),
      scope: scopeType,
    })
  ).toString("base64url");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
