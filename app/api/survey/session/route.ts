/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAndNormalizeSlug } from "@/lib/repositories/supabase-repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, campaignCode } = body;

    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const safeSlug = validateAndNormalizeSlug(storeId);
    if (!safeSlug) {
      return NextResponse.json({ error: "Invalid storeId format" }, { status: 400 });
    }

    const supabase = createAdminClient() as any;

    // 1. 店舗の特定（クライアントのorganization_idは信用せずサーバー側で解決）
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("id, organization_id, public_slug, is_active")
      .or(`public_slug.eq.${safeSlug},legacy_slugs.cs.{"${safeSlug}"}`)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (locError || !location) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 2. キャンペーンコードがあれば解決
    let resolvedCampaignId: string | null = null;
    if (campaignCode && typeof campaignCode === "string") {
      const cleanCode = campaignCode.trim();
      const { data: campaign } = await supabase
        .from("qr_campaigns")
        .select("id")
        .eq("location_id", location.id)
        .eq("public_id", cleanCode)
        .eq("is_active", true)
        .maybeSingle();

      if (campaign) {
        resolvedCampaignId = campaign.id;
      }
    }

    // 3. 匿名サーベイセッションの作成（個人特定情報は保存しない）
    const userAgent = req.headers.get("user-agent") || null;
    const { data: session, error: sessError } = await supabase
      .from("survey_sessions")
      .insert({
        organization_id: location.organization_id,
        location_id: location.id,
        campaign_id: resolvedCampaignId,
        user_agent: userAgent ? userAgent.slice(0, 255) : null,
      })
      .select("id, started_at")
      .single();

    if (sessError || !session) {
      console.error("[survey/session] session insert error:", sessError);
      return NextResponse.json({
        ok: true,
        sessionId: crypto.randomUUID(),
        storeSlug: location.public_slug,
        campaignId: resolvedCampaignId,
      });
    }

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      storeSlug: location.public_slug,
      campaignId: resolvedCampaignId,
    });
  } catch (error: unknown) {
    console.error("[survey/session] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
