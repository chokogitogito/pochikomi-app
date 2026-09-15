/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

// 推測不能な公開識別子（8文字のランダム英数字）
function generatePublicId(): string {
  const chars = "23456789abcdefghjkmnpqrstuvwxyz";
  let result = "c";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const storeId = req.nextUrl.searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const auth = await verifyAdminAuth(storeId);
    if (!auth.authorized || !auth.organizationId || !auth.locationId) {
      return NextResponse.json(
        { error: auth.error || "権限がありません" },
        { status: auth.status || 403 }
      );
    }

    const supabase = createAdminClient() as any;
    const { data: campaigns, error } = await supabase
      .from("qr_campaigns")
      .select("*")
      .eq("location_id", auth.locationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/admin/campaigns] GET error:", error);
      return NextResponse.json({ error: "キャンペーン取得に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({
      campaigns: (campaigns || []).map((c: any) => ({
        id: c.id,
        organizationId: c.organization_id,
        locationId: c.location_id,
        publicId: c.public_id,
        name: c.name,
        placement: c.placement,
        medium: c.medium,
        staffLabel: c.staff_label,
        startAt: c.start_at,
        endAt: c.end_at,
        isActive: c.is_active,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
    });
  } catch (err) {
    console.error("[api/admin/campaigns] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, name, placement, medium, staffLabel, startAt, endAt } = body;

    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "キャンペーン名は必須です" }, { status: 400 });
    }

    const auth = await verifyAdminAuth(storeId);
    if (!auth.authorized || !auth.organizationId || !auth.locationId) {
      return NextResponse.json(
        { error: auth.error || "権限がありません" },
        { status: auth.status || 403 }
      );
    }

    const supabase = createAdminClient() as any;
    const publicId = generatePublicId();

    const insertPayload = {
      organization_id: auth.organizationId,
      location_id: auth.locationId,
      public_id: publicId,
      name: name.trim().slice(0, 100),
      placement: typeof placement === "string" && placement.trim() ? placement.trim().slice(0, 50) : "table",
      medium: typeof medium === "string" && medium.trim() ? medium.trim().slice(0, 50) : "qr",
      staff_label: typeof staffLabel === "string" && staffLabel.trim() ? staffLabel.trim().slice(0, 50) : null,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      is_active: true,
    };

    const { data: newCampaign, error } = await supabase
      .from("qr_campaigns")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !newCampaign) {
      console.error("[api/admin/campaigns] POST error:", error);
      return NextResponse.json({ error: "キャンペーン作成に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: newCampaign.id,
        organizationId: newCampaign.organization_id,
        locationId: newCampaign.location_id,
        publicId: newCampaign.public_id,
        name: newCampaign.name,
        placement: newCampaign.placement,
        medium: newCampaign.medium,
        staffLabel: newCampaign.staff_label,
        startAt: newCampaign.start_at,
        endAt: newCampaign.end_at,
        isActive: newCampaign.is_active,
        createdAt: newCampaign.created_at,
        updatedAt: newCampaign.updated_at,
      },
    });
  } catch (err) {
    console.error("[api/admin/campaigns] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
