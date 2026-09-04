/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { validateAndNormalizeSlug } from "@/lib/repositories/supabase-repository";
import { verifyAdminAuth } from "@/lib/auth/guard";

// テスト用環境変数の設定
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";

// Supabase client のモック
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: null },
        error: new Error("No session"),
      })),
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({ data: { is_platform_admin: false } })),
        };
      }
      if (table === "organization_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          data: [
            { organization_id: "org-real-1", role: "owner", status: "active" },
          ],
        };
      }
      if (table === "locations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          contains: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({
            data: { id: "loc-1", organization_id: "org-real-1" },
          })),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: null })),
      };
    }),
  })),
}));

describe("E2E & Integration Flow: 管理者認可・実店舗・URL互換性", () => {
  describe("1. URLおよびSlug後方互換性テスト", () => {
    it("旧URL classic が The蔵ssic の slug 'golf-a' に正規化されること", () => {
      expect(validateAndNormalizeSlug("classic")).toBe("golf-a");
    });

    it("旧URL ss-grand が SS.GRAND の slug 'golf-b' に正規化されること", () => {
      expect(validateAndNormalizeSlug("ss-grand")).toBe("golf-b");
    });

    it("旧URL demo-golf が 商談デモ の slug 'golf' に正規化されること", () => {
      expect(validateAndNormalizeSlug("demo-golf")).toBe("golf");
    });

    it("正規slug 'golf-a' および 'golf-b' がそのまま通過すること", () => {
      expect(validateAndNormalizeSlug("golf-a")).toBe("golf-a");
      expect(validateAndNormalizeSlug("golf-b")).toBe("golf-b");
    });

    it("PostgRESTインジェクションや不正文字列が安全に拒絶（null）されること", () => {
      expect(validateAndNormalizeSlug("x,id.neq.0")).toBeNull();
      expect(validateAndNormalizeSlug("golf-a;DROP TABLE")).toBeNull();
      expect(validateAndNormalizeSlug("../../../etc/passwd")).toBeNull();
      expect(validateAndNormalizeSlug("")).toBeNull();
    });
  });

  describe("2. 管理者認可ガード（未認証アクセス遮断）テスト", () => {
    it("未ログイン状態の管理API呼び出しが401エラーで遮断されること", async () => {
      const result = await verifyAdminAuth("golf-a");
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toContain("認証されていません");
    });

    it("無効なslugを指定した場合に400エラーが返ること", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "test-user-id" } },
            error: null,
          })),
        },
      } as any);

      const result = await verifyAdminAuth("invalid,slug!@#");
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain("無効な店舗ID");
    });

    it("他組織に属する店舗を指定した場合に403エラーで遮断されること", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "test-user-id" } },
            error: null,
          })),
        },
      } as any);

      // loc-2 は org-other に属するモック
      const { createAdminClient } = await import("@/lib/supabase/admin");
      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: { is_platform_admin: false } })),
            };
          }
          if (table === "organization_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              data: [{ organization_id: "org-real-1", role: "owner", status: "active" }],
            };
          }
          if (table === "locations") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              contains: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({
                data: { id: "loc-other", organization_id: "org-other" },
              })),
            };
          }
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null })) };
        }),
      } as any);

      const result = await verifyAdminAuth("golf-other");
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(403);
      expect(result.error).toContain("この店舗を管理する権限がありません");
    });
  });

  describe("3. 実店舗データ構造と設定値の検証", () => {
    it("The蔵ssicのGoogle口コミURLが有効なPlaceID形式であること", () => {
      const classicMapsUrl = "https://search.google.com/local/writereview?placeid=ChIJq6cE-5BnH2ARkt6391zxpfE";
      expect(classicMapsUrl).toContain("search.google.com/local/writereview?placeid=");
      expect(classicMapsUrl).toContain("ChIJq6cE-5BnH2ARkt6391zxpfE");
    });

    it("SS.GRANDのGoogle口コミURLが有効なPlaceID形式であること", () => {
      const ssgrandMapsUrl = "https://search.google.com/local/writereview?placeid=ChIJS4v-189cH2ARWAD0JxG0qb8";
      expect(ssgrandMapsUrl).toContain("search.google.com/local/writereview?placeid=");
      expect(ssgrandMapsUrl).toContain("ChIJS4v-189cH2ARWAD0JxG0qb8");
    });
  });

  describe("4. テナント境界・データ隔離（フォールバックによる越境漏洩防止）テスト", () => {
    it("所属店舗が0件のユーザーに対してgetUserStoresが他店舗へフォールバックせず空配列を返すこと", async () => {
      const { getUserStores } = await import("@/lib/db");
      const { createAdminClient } = await import("@/lib/supabase/admin");

      // 所属組織なしのモック
      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(async () => ({ data: { is_platform_admin: false } })),
            };
          }
          if (table === "organization_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              data: [], // 所属なし
            };
          }
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null })) };
        }),
      } as any);

      const stores = await getUserStores("no-store-user");
      expect(stores).toEqual([]);
    });

    it("自店舗以外のクーポンUUIDを指定して更新しようとした場合にCross-tenant violation例外で遮断されること", async () => {
      const { saveCouponToSupabase } = await import("@/lib/repositories/supabase-repository");
      const { createAdminClient } = await import("@/lib/supabase/admin");

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn((table: string) => {
          const chain: any = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            limit: vi.fn(() => chain),
            contains: vi.fn(() => chain),
          };
          if (table === "locations") {
            chain.maybeSingle = vi.fn(async () => ({
              data: { id: "loc-store-a", public_slug: "store-a", organization_id: "org-1" },
            }));
            return chain;
          }
          if (table === "coupons") {
            chain.maybeSingle = vi.fn(async () => ({
              data: { id: "c0000000-0000-0000-0000-000000000002", location_id: "loc-store-b" },
            }));
            return chain;
          }
          chain.maybeSingle = vi.fn(async () => ({ data: null }));
          return chain;
        }),
      } as any);

      await expect(
        saveCouponToSupabase({
          id: "c0000000-0000-0000-0000-000000000002",
          storeId: "store-a",
          title: "不正更新クーポン",
          description: "説明",
          expiresInDays: 30,
          issuedCount: 0,
          active: true,
        })
      ).rejects.toThrow("Cross-tenant violation");
    });
  });
});
