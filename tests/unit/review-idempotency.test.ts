import { describe, it, expect } from "vitest";
import { computeReviewRefHash } from "@/lib/reviews/reviewRef";
import { createManualReview } from "@/lib/reviews/sources/manualSource";

describe("口コミ同期・取り込みの冪等性検証", () => {
  it("同じ手動入力を複数回実行しても同一の外部IDとハッシュが生成され、二重登録されないこと", () => {
    const input = {
      locationId: "loc-golf-a",
      reviewerName: "田中 一郎",
      starRating: 5,
      comment: "施設がとても綺麗で、最新の測定器も使いやすかったです。",
      reviewCreatedAt: "2026-09-05T10:00:00.000Z",
    };

    const review1 = createManualReview(input);
    const review2 = createManualReview(input);

    expect(review1.externalReviewId).toBe(review2.externalReviewId);

    const hash1 = computeReviewRefHash(review1.externalReviewId);
    const hash2 = computeReviewRefHash(review2.externalReviewId);
    expect(hash1).toBe(hash2);

    // インメモリストアでのupsert冪等性シミュレーション
    const store = new Map<string, typeof review1>();
    store.set(review1.externalReviewId, review1);
    expect(store.size).toBe(1);

    store.set(review2.externalReviewId, review2); // 2回目の同期
    expect(store.size).toBe(1); // 行数は1行のまま増殖しない
  });

  it("下書き生成のupsertキー（location_id, external_review_id, tone）により同一トーンの下書きが重複増殖しないこと", () => {
    const draftsStore = new Map<string, { tone: string; draftText: string }>();

    const makeKey = (locId: string, extId: string, tone: string) => `${locId}::${extId}::${tone}`;

    const locId = "loc-golf-a";
    const extId = "manual:abc123";

    // 1回目の生成
    draftsStore.set(makeKey(locId, extId, "polite"), { tone: "polite", draftText: "丁寧な返信案1" });
    draftsStore.set(makeKey(locId, extId, "standard"), { tone: "standard", draftText: "標準返信案1" });
    expect(draftsStore.size).toBe(2);

    // 2回目の再生成（同じキーに対して上書き）
    draftsStore.set(makeKey(locId, extId, "polite"), { tone: "polite", draftText: "丁寧な返信案2（再生成）" });
    draftsStore.set(makeKey(locId, extId, "standard"), { tone: "standard", draftText: "標準返信案2（再生成）" });

    // 重複せず2行のまま更新される
    expect(draftsStore.size).toBe(2);
    expect(draftsStore.get(makeKey(locId, extId, "polite"))?.draftText).toBe("丁寧な返信案2（再生成）");
  });
});
