export type GbpConnectionStatus =
  | "pending_approval"
  | "not_connected"
  | "disabled"
  | "connecting"
  | "connected"
  | "stale"
  | "error";

export type DataProvenance =
  | "live"
  | "manual"
  | "fixture"
  | "demo"
  | "estimated"
  | "unavailable";

export interface QrCampaign {
  id: string;
  organizationId: string;
  locationId: string;
  publicId: string;
  name: string;
  placement: string;
  medium: string;
  staffLabel: string | null;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FunnelStageMetric {
  stage: "survey_started" | "review_generated" | "review_copied" | "review_clicked" | "coupon_issued";
  label: string;
  count: number;
  conversionRateFromStart: number;
  conversionRateFromPrev: number;
}

export interface FunnelMetricsSummary {
  locationId?: string;
  storeSlug?: string;
  storeName?: string;
  campaignId?: string;
  campaignName?: string;
  period: {
    from: string | null;
    to: string | null;
  };
  provenance: DataProvenance;
  surveyStarts: number;
  generatedReviews: number;
  reviewCopies: number;
  reviewClicks: number;
  couponsIssued: number;
  generationRate: number;
  copyRate: number;
  clickRate: number;
  couponIssueRate: number;
  generationFailures: number;
  copyFailures: number;
}
