import { NextRequest, NextResponse } from "next/server";
import { getCoupon, saveCoupon } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth/guard";
import type { Coupon } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const { couponId } = await params;
  const coupon = await getCoupon(couponId);

  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  return NextResponse.json({ coupon });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const { couponId } = await params;
  const body = (await req.json()) as Coupon;

  // 店舗管理者権限チェック
  const auth = await verifyAdminAuth(body.storeId);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Forbidden" },
      { status: auth.status || 403 }
    );
  }

  const coupon = await saveCoupon({ ...body, id: couponId });
  return NextResponse.json({ coupon });
}
