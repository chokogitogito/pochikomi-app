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

import type { GbpConnectionStatus } from "./types";

/**
 * GBP連携が有効化されているかどうかを判定（既定値: false）
 */
export function isGbpConnectionEnabled(): boolean {
  return process.env.GBP_CONNECTION_ENABLED === "true";
}

/**
 * Google連携ステータスを取得
 * - GBP API審査待ち環境では "pending_approval" を返す
 * - フラグが無効化されている場合は "disabled" または "pending_approval"
 */
export function getGbpConnectionStatus(hasValidConnection = false): GbpConnectionStatus {
  if (!isGbpConnectionEnabled()) {
    // 審査待ち（環境変数 GBP_STATUS_PENDING が設定されているか、既定値）
    return "pending_approval";
  }
  if (hasValidConnection) {
    return "connected";
  }
  return "not_connected";
}

/**
 * トークン暗号化ヘルパー（fail closed: 安全な暗号化鍵が設定されていない場合は即座に例外をスロー）
 * ※ Base64等の仮方式へのフォールバックはセキュリティポリシーにより厳格に禁止
 */
export function encryptToken(token: string): string {
  if (!token) return "";
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "TOKEN_ENCRYPTION_NOT_CONFIGURED: 安全な暗号鍵 (TOKEN_ENCRYPTION_KEY) が未設定のためトークンを暗号化できません。仮方式へのフォールバックは禁止されています。"
    );
  }
  // 実OAuth接続・安全なAES-GCM実装はAPI承認後のフェーズで配備
  throw new Error(
    "TOKEN_ENCRYPTION_UNAVAILABLE: Google Business Profile API審査待ちのためトークン保存は無効化されています。"
  );
}

export function decryptToken(encrypted: string): string {
  if (!encrypted) return "";
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "TOKEN_DECRYPTION_NOT_CONFIGURED: 安全な暗号鍵 (TOKEN_ENCRYPTION_KEY) が未設定のためトークンを復号できません。"
    );
  }
  throw new Error(
    "TOKEN_DECRYPTION_UNAVAILABLE: Google Business Profile API審査待ちのためトークン復号は無効化されています。"
  );
}

