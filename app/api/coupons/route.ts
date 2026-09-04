import { NextRequest, NextResponse } from "next/server";
import { getCoupons, saveCoupon } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth/guard";
import type { Coupon } from "@/lib/types";

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId") ?? undefined;
  const coupons = await getCoupons(storeId);
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Coupon;

  // 店舗管理者権限チェック
  const auth = await verifyAdminAuth(body.storeId);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Forbidden" },
      { status: auth.status || 403 }
    );
  }

  const coupon = await saveCoupon(body);
  return NextResponse.json({ coupon });
}
