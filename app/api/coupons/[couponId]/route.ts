import { NextRequest, NextResponse } from "next/server";
import { getCoupon, saveCoupon } from "@/lib/db";
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
  const coupon = await saveCoupon({ ...body, id: couponId });
  return NextResponse.json({ coupon });
}
