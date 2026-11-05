import { NextResponse } from "next/server";
import { verifyDemoAccess } from "@/lib/demo/access";
import { DEMO_STORE } from "@/lib/demo/store";

export const dynamic = "force-dynamic";

/**
 * 商談デモ用アンケートの店舗情報。常に固定のデモ店舗を返す。
 * クエリ・ボディに店舗IDが指定されても一切参照しない（実店舗に切り替わらない）。
 */
export async function GET() {
  const access = await verifyDemoAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  return NextResponse.json({ store: DEMO_STORE, primaryCoupon: null });
}
