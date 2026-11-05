import { describe, it, expect } from "vitest";
import {
  DEMO_COMPETITORS,
  DEMO_FUNNEL,
  DEMO_MAPS_METRICS,
  DEMO_TREND,
  DEMO_TREND_INTRO_MONTH,
  DEMO_TREND_TITLE,
  summarizeTrend,
} from "@/lib/demo/dashboard";
import { computeXAxis, computeYAxis, median, rankCompetitor } from "@/lib/charts/scatter";

describe("商談デモ: ダッシュボードの固定データ", () => {
  it("推移は2026年6〜9月の4か月のみで、月次件数は 25/65/115/170", () => {
    expect(DEMO_TREND.map((t) => t.month)).toEqual(["2026/06", "2026/07", "2026/08", "2026/09"]);
    expect(DEMO_TREND.map((t) => t.reviews)).toEqual([25, 65, 115, 170]);
    expect(DEMO_TREND_INTRO_MONTH).toBe("2026/06");
    expect(DEMO_TREND_TITLE).toBe("ポチコミ導入後の口コミ獲得シミュレーション");
  });

  it("マップ指標とファネルは計画どおりの値", () => {
    expect(DEMO_MAPS_METRICS).toEqual({ monthlyViews: 69666, directionRequests: 2509, websiteClicks: 826, phoneCalls: 0 });
    expect(DEMO_FUNNEL).toEqual({ surveyStarts: 412, generatedReviews: 305, mapClicks: 231 });
  });

  it("推移の要約は導入月と最終月から算出される", () => {
    const s = summarizeTrend(DEMO_TREND);
    expect(s?.first.reviews).toBe(25);
    expect(s?.last.reviews).toBe(170);
    expect(s?.ratio).toBe(6.8);
    expect(summarizeTrend([])).toBeNull();
  });
});

describe("競合散布図の軸", () => {
  it("ラーメン店モデルの横軸は 0〜2,500 で、6点すべてが収まる", () => {
    const axis = computeXAxis(DEMO_COMPETITORS.map((c) => c.reviews));
    expect(axis.max).toBe(2500);
    expect(axis.ticks).toEqual([0, 500, 1000, 1500, 2000, 2500]);
    for (const c of DEMO_COMPETITORS) expect(c.reviews).toBeLessThanOrEqual(axis.max);
    expect(DEMO_COMPETITORS).toHaveLength(6);
  });

  it("少件数の店舗でも固定の80件ではなくデータに合わせた上限になる", () => {
    const small = computeXAxis([7, 1, 57, 56, 68]);
    expect(small.max).toBeGreaterThanOrEqual(68);
    expect(small.max).toBeLessThanOrEqual(100);
    expect(small.ticks[0]).toBe(0);
    expect(small.ticks.at(-1)).toBe(small.max);

    const tiny = computeXAxis([3, 2, 1]);
    expect(tiny.max).toBeGreaterThanOrEqual(3);
    expect(tiny.max).toBeLessThan(20);

    const empty = computeXAxis([]);
    expect(empty.max).toBeGreaterThan(0);
  });

  it("縦軸は通常 3.5〜5.2、低評価の店舗があれば下限を広げる", () => {
    expect(computeYAxis([4.3, 4.1, 3.8]).min).toBe(3.5);
    expect(computeYAxis([4.3, 2.9]).min).toBeLessThan(3.5);
  });

  it("順位と中央値は同値を同順位として算出される", () => {
    const own = DEMO_COMPETITORS[0];
    expect(rankCompetitor(DEMO_COMPETITORS, own)).toEqual({ reviewRank: 1, ratingRank: 1, total: 6 });
    const b = DEMO_COMPETITORS[2];
    expect(rankCompetitor(DEMO_COMPETITORS, b).ratingRank).toBe(2);
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(3);
    expect(median([])).toBeNull();
  });
});
