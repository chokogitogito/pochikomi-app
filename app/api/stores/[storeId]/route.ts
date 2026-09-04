import { NextRequest, NextResponse } from "next/server";
import { getPrimaryCoupon, getStore, saveStore } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth/guard";
import type { Store } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const store = await getStore(storeId);

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const primaryCoupon = await getPrimaryCoupon(storeId);
  return NextResponse.json({ store, primaryCoupon });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;

  // 店舗管理者権限の検証
  const auth = await verifyAdminAuth(storeId);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Forbidden" },
      { status: auth.status || 403 }
    );
  }

  const body = (await req.json()) as Store;
  const store = await saveStore({ ...body, id: storeId });
  return NextResponse.json({ store });
}
