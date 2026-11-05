import "server-only";

import { verifyAdminAuth } from "@/lib/auth/guard";

export type DemoAccess =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

/**
 * 商談デモの画面・APIに入れるのは、既存の管理者ログインを済ませた担当者のみ。
 * 店舗IDは受け取らない（どの店舗の管理者かではなく「管理者であること」だけを確認する）。
 * 認証基盤の障害時も、デモのデータを返さず拒否側に倒す。
 */
export async function verifyDemoAccess(): Promise<DemoAccess> {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized || !auth.userId) {
      return { ok: false, status: auth.status ?? 401, error: auth.error ?? "認証されていません。" };
    }
    return { ok: true, userId: auth.userId };
  } catch (error) {
    console.error("[demo/access] 認証確認に失敗しました:", error);
    return { ok: false, status: 401, error: "認証を確認できませんでした。ログインし直してください。" };
  }
}
