import { NextRequest, NextResponse } from "next/server";
import { getCoupons, saveCoupon } from "@/lib/db";
import type { Coupon } from "@/lib/types";

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId") ?? undefined;
  const coupons = await getCoupons(storeId);
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Coupon;
  const coupon = await saveCoupon(body);
  return NextResponse.json({ coupon });
}
