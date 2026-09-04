import { NextRequest, NextResponse } from "next/server";
import { getStores, saveStore } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth/guard";
import type { Store } from "@/lib/types";

export async function GET() {
  const stores = await getStores();
  return NextResponse.json({ stores });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Store;

  // 管理者権限チェック（対象店舗に対する認可を検証）
  const auth = await verifyAdminAuth(body.id);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Forbidden" },
      { status: auth.status || 403 }
    );
  }

  const store = await saveStore(body);
  return NextResponse.json({ store });
}
