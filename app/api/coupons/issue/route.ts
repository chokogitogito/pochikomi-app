import { NextRequest, NextResponse } from "next/server";
import { getStore, issueCoupon } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storeId } = body;

  if (typeof storeId !== "string") {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  const store = await getStore(storeId);
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const coupon = await issueCoupon(storeId);
  if (!coupon) {
    return NextResponse.json({ error: "Active coupon not found" }, { status: 404 });
  }

  const code = `PC-${storeId.slice(0, 3).toUpperCase()}-${Date.now()
    .toString(36)
    .toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + coupon.expiresInDays);

  return NextResponse.json({
    coupon: {
      ...coupon,
      code,
      expiresAt: expiresAt.toISOString(),
      storeName: store.name,
    },
  });
}
