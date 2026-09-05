import crypto from 'crypto';

/**
 * 口コミ外部IDから、恒久保存用のHMACハッシュ（review_ref_hash）を生成する。
 * Google Contentの生IDを恒久テーブルへ保存しないためのTier 1要件。
 */
function getReviewRefSalt(): string {
  const salt = process.env.REVIEW_REF_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === "test") {
      return "test-environment-review-ref-salt-32bytes-secret";
    }
    throw new Error(
      "Tier 1不変条件違反: 環境変数 REVIEW_REF_SALT が未設定です。セキュリティ上の理由により固定ソルトへのフォールバックは禁止されています。"
    );
  }
  return salt;
}

/**
 * 口コミ外部IDから、恒久保存用のHMACハッシュ（review_ref_hash）を生成する。
 * Google Contentの生IDを恒久テーブルへ保存しないためのTier 1要件。
 */
export function computeReviewRefHash(externalReviewId: string): string {
  const salt = getReviewRefSalt();
  return crypto.createHmac("sha256", salt).update(externalReviewId).digest("hex");
}

/**
 * 手動取り込み用の決定論的IDを生成する。
 * 同一の店舗、投稿者、投稿日、本文先頭からハッシュを算出し、同じ口コミを2回登録しても重複しないようにする。
 */
export function generateManualReviewId(params: {
  locationId: string;
  reviewerName?: string | null;
  reviewCreatedAt?: string | null;
  comment?: string | null;
}): string {
  const salt = getReviewRefSalt();
  const seed = [
    params.locationId,
    (params.reviewerName || "").trim(),
    (params.reviewCreatedAt || "").trim(),
    (params.comment || "").trim().slice(0, 100),
  ].join("::");

  const digest = crypto.createHmac("sha256", salt).update(seed).digest("hex").slice(0, 24);
  return `manual:${digest}`;
}
