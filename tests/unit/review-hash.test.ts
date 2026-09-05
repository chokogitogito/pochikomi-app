import { describe, it, expect } from "vitest";
import { computeReviewRefHash, generateManualReviewId } from "@/lib/reviews/reviewRef";

describe("口コミ参照ハッシュ（review_ref_hash）および決定論的ID検証", () => {
  it("同一の外部口コミIDから常に同一のHMACハッシュを生成すること", () => {
    const rawId = "ChZDSUhNMG9nS0VJQ0FnSUNkMU8yM0hREAE";
    const hash1 = computeReviewRefHash(rawId);
    const hash2 = computeReviewRefHash(rawId);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    // Google由来の生IDがハッシュに含まれないこと（不可逆性）
    expect(hash1).not.toContain(rawId);
  });

  it("異なる外部IDは異なるハッシュを生成すること", () => {
    const hashA = computeReviewRefHash("review-001");
    const hashB = computeReviewRefHash("review-002");
    expect(hashA).not.toBe(hashB);
  });

  it("手動取り込みIDが決定論的に生成され、同じ口コミは同一IDになること", () => {
    const input = {
      locationId: "loc-golf-a",
      reviewerName: "佐藤 健",
      reviewCreatedAt: "2026-09-05",
      comment: "非常に快適なインドアゴルフスタジオでした。",
    };

    const id1 = generateManualReviewId(input);
    const id2 = generateManualReviewId(input);

    expect(id1).toBe(id2);
    expect(id1.startsWith("manual:")).toBe(true);

    // 異なる内容なら異なるID
    const id3 = generateManualReviewId({
      ...input,
      comment: "別のコメント内容です。",
    });
    expect(id1).not.toBe(id3);
  });

  it("cache失効後もreview_ref_hashで返信済み状態を突合維持できること", () => {
    // シミュレーション:
    // 1. 口コミ外部IDからハッシュを作成し、恒久テーブルにrepliedとして保存されている状態
    const externalReviewId = "google-maps-rev-999";
    const refHash = computeReviewRefHash(externalReviewId);

    const permanentRecords = new Map<string, { status: string; repliedAt: string }>();
    permanentRecords.set(refHash, {
      status: "replied",
      repliedAt: "2026-09-01T12:00:00Z",
    });

    // 2. 30日経過し、gbp_review_cache からは削除されたとする（cacheListは空）
    const cacheList: Array<{ externalReviewId: string }> = [];
    expect(cacheList).toHaveLength(0);

    // 3. 再度外部から同じ externalReviewId を取得（または参照）した際、ハッシュ突合で返信済み判定が維持される
    const incomingReviewId = "google-maps-rev-999";
    const incomingHash = computeReviewRefHash(incomingReviewId);
    const matchedRecord = permanentRecords.get(incomingHash);

    expect(matchedRecord).toBeDefined();
    expect(matchedRecord?.status).toBe("replied");
  });

  it("本番・開発環境でREVIEW_REF_SALTが未設定の場合は安全のため例外をスローすること（silent fallback防止）", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSalt = process.env.REVIEW_REF_SALT;

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.REVIEW_REF_SALT;

      expect(() => computeReviewRefHash("test-id")).toThrowError(
        /Tier 1不変条件違反: 環境変数 REVIEW_REF_SALT が未設定です/
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      if (originalSalt !== undefined) {
        process.env.REVIEW_REF_SALT = originalSalt;
      } else {
        delete process.env.REVIEW_REF_SALT;
      }
    }
  });
});
