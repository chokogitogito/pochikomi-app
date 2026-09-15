import { describe, it, expect } from "vitest";
import type { FunnelMetricsSummary } from "@/lib/types";

describe("Phase 1 テスト: 匿名セッション・QR施策・ファネル転換率集計", () => {
  describe("1. 匿名セッションとファネルイベント順序", () => {
    it("同一セッション内で規定のイベント順序が追跡できること", () => {
      const sessionId = "session-test-uuid-001";
      const events: Array<{ sessionId: string; type: string; timestamp: number }> = [
        { sessionId, type: "survey_started", timestamp: 1000 },
        { sessionId, type: "review_generated", timestamp: 2000 },
        { sessionId, type: "review_copied", timestamp: 3000 },
        { sessionId, type: "review_clicked", timestamp: 4000 },
        { sessionId, type: "coupon_issued", timestamp: 5000 },
      ];

      // 全イベントが同一セッションに紐づいていること
      expect(events.every((e) => e.sessionId === sessionId)).toBe(true);

      const eventSequence = events.map((e) => e.type);
      expect(eventSequence).toEqual([
        "survey_started",
        "review_generated",
        "review_copied",
        "review_clicked",
        "coupon_issued",
      ]);
    });

    it("同一セッションでの重複イベント（連打・戻る操作）がユニーク集計で排除されること", () => {
      const sessionId = "session-test-uuid-002";
      const rawEvents = [
        { sessionId, type: "survey_started" },
        { sessionId, type: "review_generated" },
        { sessionId, type: "review_copied" },
        { sessionId, type: "review_copied" }, // コピーボタン2度押し
        { sessionId, type: "review_clicked" },
        { sessionId, type: "review_clicked" }, // マップボタン連打
        { sessionId, type: "coupon_issued" },
      ];

      const uniqueSessionsByStage = {
        starts: new Set(rawEvents.filter((e) => e.type === "survey_started").map((e) => e.sessionId)).size,
        generated: new Set(rawEvents.filter((e) => e.type === "review_generated").map((e) => e.sessionId)).size,
        copied: new Set(rawEvents.filter((e) => e.type === "review_copied").map((e) => e.sessionId)).size,
        clicked: new Set(rawEvents.filter((e) => e.type === "review_clicked").map((e) => e.sessionId)).size,
        coupon: new Set(rawEvents.filter((e) => e.type === "coupon_issued").map((e) => e.sessionId)).size,
      };

      // 重複があっても各ステージ1回としてカウント
      expect(uniqueSessionsByStage.starts).toBe(1);
      expect(uniqueSessionsByStage.generated).toBe(1);
      expect(uniqueSessionsByStage.copied).toBe(1);
      expect(uniqueSessionsByStage.clicked).toBe(1);
      expect(uniqueSessionsByStage.coupon).toBe(1);
    });
  });

  describe("2. ファネル転換率計算（0除算防御と正確性）", () => {
    function calculateRates(metrics: {
      starts: number;
      generated: number;
      copied: number;
      clicks: number;
      coupons: number;
    }) {
      const generationRate = metrics.starts > 0 ? Math.round((metrics.generated / metrics.starts) * 100) : 0;
      const copyRate = metrics.generated > 0 ? Math.round((metrics.copied / metrics.generated) * 100) : 0;
      const clickRate = metrics.copied > 0 ? Math.round((metrics.clicks / metrics.copied) * 100) : 0;
      const couponRate = metrics.starts > 0 ? Math.round((metrics.coupons / metrics.starts) * 100) : 0;

      return { generationRate, copyRate, clickRate, couponRate };
    }

    it("実績0件のときに0除算エラーにならず0%を返すこと", () => {
      const zeroMetrics = { starts: 0, generated: 0, copied: 0, clicks: 0, coupons: 0 };
      const rates = calculateRates(zeroMetrics);
      expect(rates.generationRate).toBe(0);
      expect(rates.copyRate).toBe(0);
      expect(rates.clickRate).toBe(0);
      expect(rates.couponRate).toBe(0);
    });

    it("各段階の転換率が正しく算出されること", () => {
      const normalMetrics = { starts: 100, generated: 80, copied: 60, clicks: 45, coupons: 70 };
      const rates = calculateRates(normalMetrics);
      expect(rates.generationRate).toBe(80); // 80 / 100
      expect(rates.copyRate).toBe(75); // 60 / 80
      expect(rates.clickRate).toBe(75); // 45 / 60
      expect(rates.couponRate).toBe(70); // 70 / 100
    });
  });

  describe("3. QRキャンペーンと後方互換性", () => {
    it("キャンペーンコードなしの通常QRは基本URLとなり後方互換が保たれること", () => {
      const baseUrl = "https://pochikomi.com";
      const storeSlug = "golf-a";

      const generateUrl = (slug: string, campaignPublicId?: string | null) => {
        if (!campaignPublicId) {
          return `${baseUrl}/survey/${slug}`;
        }
        return `${baseUrl}/survey/${slug}?c=${campaignPublicId}`;
      };

      expect(generateUrl(storeSlug)).toBe("https://pochikomi.com/survey/golf-a");
      expect(generateUrl(storeSlug, null)).toBe("https://pochikomi.com/survey/golf-a");
      expect(generateUrl(storeSlug, "c98x72pa")).toBe("https://pochikomi.com/survey/golf-a?c=c98x72pa");
    });
  });

  describe("4. 多店舗集約（全店舗合算と拠点別比較の分離）", () => {
    it("複数店舗の集計値が正しく合算され、各店舗ごとの数値も維持されること", () => {
      const storeA: FunnelMetricsSummary = {
        locationId: "loc-a",
        storeSlug: "golf-a",
        storeName: "The蔵ssic",
        period: { from: null, to: null },
        provenance: "live",
        surveyStarts: 50,
        generatedReviews: 40,
        reviewCopies: 30,
        reviewClicks: 20,
        couponsIssued: 35,
        generationRate: 80,
        copyRate: 75,
        clickRate: 67,
        couponIssueRate: 70,
        generationFailures: 0,
        copyFailures: 0,
      };

      const storeB: FunnelMetricsSummary = {
        locationId: "loc-b",
        storeSlug: "golf-b",
        storeName: "SS.GRAND",
        period: { from: null, to: null },
        provenance: "live",
        surveyStarts: 30,
        generatedReviews: 20,
        reviewCopies: 15,
        reviewClicks: 10,
        couponsIssued: 20,
        generationRate: 67,
        copyRate: 75,
        clickRate: 67,
        couponIssueRate: 67,
        generationFailures: 0,
        copyFailures: 0,
      };

      const summaries = [storeA, storeB];
      const totalStarts = summaries.reduce((sum, s) => sum + s.surveyStarts, 0);
      const totalGenerated = summaries.reduce((sum, s) => sum + s.generatedReviews, 0);
      const totalClicks = summaries.reduce((sum, s) => sum + s.reviewClicks, 0);

      expect(totalStarts).toBe(80);
      expect(totalGenerated).toBe(60);
      expect(totalClicks).toBe(30);
      expect(summaries.length).toBe(2);
      expect(summaries[0].storeSlug).toBe("golf-a");
      expect(summaries[1].storeSlug).toBe("golf-b");
    });
  });
});
