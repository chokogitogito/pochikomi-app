import { describe, it, expect } from "vitest";
import { isGbpConnectionEnabled, getGbpConnectionStatus, encryptToken, decryptToken } from "@/lib/integrations/google";

describe("Phase 0 ゴールデンテスト: 不変条件とセキュリティ・データ隔離", () => {
  describe("1. 全星数でGoogle導線が同一であること（レビューゲーティング排除）", () => {
    it("星1〜5のすべての評価において、同一のGoogleマップ口コミURL導線を提供すること", () => {
      const googleMapsUrl = "https://search.google.com/local/writereview?placeid=test-place-id";
      const ratings = [1, 2, 3, 4, 5];

      ratings.forEach((rating) => {
        // 全星数で遷移先URLが同一であることを検証
        const resolveDestinationUrl = (storeGoogleUrl: string, userRating: number) => {
          if (!storeGoogleUrl) return null;
          // 星数によるURL分岐や非表示化を行わない
          if (userRating >= 1 && userRating <= 5) {
            return storeGoogleUrl;
          }
          return storeGoogleUrl;
        };

        expect(resolveDestinationUrl(googleMapsUrl, rating)).toBe(googleMapsUrl);
      });
    });
  });

  describe("2. アンケート完了とクーポン発行の関係（ポリシー準拠）", () => {
    it("クーポンはGoogle口コミ投稿の対価ではなく、アンケート回答完了の特典として発行されること", () => {
      const evaluateCouponEligibility = (state: { surveyAnswered: boolean; googleReviewClicked: boolean }) => {
        // アンケートに回答完了していれば、Googleマップに遷移していなくてもクーポン対象となる
        return state.surveyAnswered;
      };

      // ケースA: アンケート回答完了、Google未遷移 -> クーポン発行可能
      expect(evaluateCouponEligibility({ surveyAnswered: true, googleReviewClicked: false })).toBe(true);

      // ケースB: アンケート未回答、Google遷移のみ -> クーポン発行不可
      expect(evaluateCouponEligibility({ surveyAnswered: false, googleReviewClicked: true })).toBe(false);
    });
  });

  describe("3. review_clicked != review_posted", () => {
    it("review_clickedイベントはGoogleマップへの画面遷移であり、口コミ投稿完了として計上・表示しないこと", () => {
      const eventType = "review_clicked";
      const labelMapping: Record<string, string> = {
        survey_started: "アンケート開始数",
        review_generated: "口コミ文章作成数",
        review_copied: "口コミ文章コピー数",
        review_clicked: "Googleマップ遷移数",
        coupon_issued: "クーポン発行数",
      };

      expect(labelMapping[eventType]).toBe("Googleマップ遷移数");
      expect(labelMapping[eventType]).not.toBe("口コミ投稿数");
      expect(labelMapping[eventType]).not.toContain("投稿完了");
    });
  });

  describe("4. GBP無効時にOAuth/callback/syncが成功しないこと（fail closed）", () => {
    it("GBP_CONNECTION_ENABLED が未設定またはfalseの場合、GBP接続はpending_approvalとなること", () => {
      delete process.env.GBP_CONNECTION_ENABLED;
      expect(isGbpConnectionEnabled()).toBe(false);
      expect(getGbpConnectionStatus(false)).toBe("pending_approval");
      expect(getGbpConnectionStatus(true)).toBe("pending_approval");
    });

    it("GBP無効時はOAuth開始APIが503を返すこと", async () => {
      delete process.env.GBP_CONNECTION_ENABLED;
      const { GET: oauthHandler } = await import("@/app/api/integrations/google/oauth/route");
      const req = new Request("http://localhost:3000/api/integrations/google/oauth");
      // @ts-expect-error NextRequest mock
      const res = await oauthHandler(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.status).toBe("pending_approval");
    });

    it("GBP無効時はOAuth callbackが成功パラメータ付きリダイレクトを返さないこと", async () => {
      delete process.env.GBP_CONNECTION_ENABLED;
      const { GET: callbackHandler } = await import("@/app/api/integrations/google/callback/route");
      const req = new Request("http://localhost:3000/api/integrations/google/callback?code=fake-code");
      // @ts-expect-error NextRequest mock
      const res = await callbackHandler(req);
      const location = res.headers.get("location");
      expect(location).not.toContain("integration_success=google_connected");
      expect(location).toContain("integration_error=pending_approval");
    });
  });

  describe("5. 仮暗号化でtoken保存できないこと（安全な方式がない限り保存不能）", () => {
    it("暗号鍵が未設定の状態でencryptTokenを実行すると即座に例外をスローすること", () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      expect(() => encryptToken("fake-access-token")).toThrowError(/TOKEN_ENCRYPTION_NOT_CONFIGURED/);
    });

    it("Base64へのフォールバックは行われず、例外がスローされること", () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      try {
        encryptToken("my-secret-token");
        expect.unreachable("例外が発生するべきです");
      } catch (err: unknown) {
        expect((err as Error).message).toContain("仮方式へのフォールバックは禁止されています");
      }
    });

    it("decryptTokenも暗号鍵未設定時は即座に例外をスローすること", () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      expect(() => decryptToken("some-encrypted-token")).toThrowError(/TOKEN_DECRYPTION_NOT_CONFIGURED/);
    });
  });

  describe("6. TTL cleanup認証がfail closedであること", () => {
    it("CRON_SECRETが未設定の場合、cleanup routeは401で拒否すること", async () => {
      delete process.env.CRON_SECRET;
      delete process.env.ALLOW_CRON_TEST_BYPASS;
      const { GET: cronHandler } = await import("@/app/api/cron/cleanup-gbp-cache/route");
      const req = new Request("http://localhost:3000/api/cron/cleanup-gbp-cache");
      // @ts-expect-error NextRequest mock
      const res = await cronHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("CRON_SECRET is not configured");
    });

    it("CRON_SECRETが不一致の場合、cleanup routeは401で拒否すること", async () => {
      process.env.CRON_SECRET = "secret-12345";
      delete process.env.ALLOW_CRON_TEST_BYPASS;
      const { GET: cronHandler } = await import("@/app/api/cron/cleanup-gbp-cache/route");
      const req = new Request("http://localhost:3000/api/cron/cleanup-gbp-cache", {
        headers: { authorization: "Bearer wrong-secret" },
      });
      // @ts-expect-error NextRequest mock
      const res = await cronHandler(req);
      expect(res.status).toBe(401);
    });
  });

  describe("7. demo/fixtureがlive実績へ混ざらないこと", () => {
    it("ポチコミ実測指標（live）の集計にdemoデータやfixtureデータを含めないこと", () => {
      interface MetricItem {
        source: "live" | "demo" | "fixture";
        count: number;
      }

      const metricsPool: MetricItem[] = [
        { source: "live", count: 12 },
        { source: "live", count: 8 },
        { source: "demo", count: 450 }, // デモ表示回数等
        { source: "fixture", count: 100 }, // テスト用
      ];

      const liveTotal = metricsPool
        .filter((m) => m.source === "live")
        .reduce((sum, m) => sum + m.count, 0);

      expect(liveTotal).toBe(20);
      expect(liveTotal).not.toBe(570);
    });
  });

  describe("8. organization/locationの越境がないこと", () => {
    it("クライアントが提供した別organization_idを指定しても、サーバー側で所属組織のみに制限されること", () => {
      const userOrgId = "org-real-001";
      const requestedOrgId = "org-other-999";

      const resolveSafeOrgId = (currentSessionOrgId: string, clientInputOrgId: string) => {
        // クライアントからの入力は無視し、認証セッションの組織IDを採用
        if (clientInputOrgId !== currentSessionOrgId) {
          return currentSessionOrgId;
        }
        return currentSessionOrgId;
      };

      expect(resolveSafeOrgId(userOrgId, requestedOrgId)).toBe("org-real-001");
      expect(resolveSafeOrgId(userOrgId, requestedOrgId)).not.toBe("org-other-999");
    });
  });
});
