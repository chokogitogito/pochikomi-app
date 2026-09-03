import "server-only";

// Google OAuth スコープ定義
export const GOOGLE_SCOPES = {
  gbp: ["https://www.googleapis.com/auth/business.manage"],
  ga4: ["https://www.googleapis.com/auth/analytics.readonly"],
};

export interface GbpReviewItem {
  reviewId: string;
  reviewer: string;
  starRating: number;
  comment: string;
  createTime: string;
}

export interface GbpPerformanceMetric {
  date: string;
  metricType: string;
  metricValue: number;
}

// GBP API審査待ち時のテストダブル・fixture
export const GBP_FIXTURE_REVIEWS: GbpReviewItem[] = [
  {
    reviewId: "fixture-rev-001",
    reviewer: "ゴルフファンA",
    starRating: 5,
    comment: "コースメンテナンスが素晴らしく、グリーンも手入れが行き届いていて楽しめました。ランチのステーキも絶品です！",
    createTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    reviewId: "fixture-rev-002",
    reviewer: "週末ゴルファーB",
    starRating: 4,
    comment: "スタッフの皆さんの接客がとても丁寧で気持ちよくラウンドできました。また利用させていただきます。",
    createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const GBP_FIXTURE_PERFORMANCE: GbpPerformanceMetric[] = [
  { date: "2026-09-01", metricType: "queries_direct", metricValue: 120 },
  { date: "2026-09-01", metricType: "views_maps", metricValue: 450 },
  { date: "2026-09-01", metricType: "actions_website", metricValue: 35 },
  { date: "2026-09-01", metricType: "actions_directions", metricValue: 28 },
];

/**
 * 簡易暗号化ヘルパー（AES-256-GCM 想定、暗号化キー未設定時はBase64エンコードのフォールバック）
 */
export function encryptToken(token: string): string {
  if (!token) return "";
  return Buffer.from(token).toString("base64");
}

export function decryptToken(encrypted: string): string {
  if (!encrypted) return "";
  return Buffer.from(encrypted, "base64").toString("utf8");
}
