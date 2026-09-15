/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { FunnelMetricsSummary } from "@/lib/integrations/types";

export interface FunnelQueryParams {
  organizationId: string;
  locationId?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  storeGroupId?: string; // 将来の店舗グループ拡張用境界
}

export interface MultiStoreComparisonResult {
  organizationId: string;
  period: {
    from: string | null;
    to: string | null;
  };
  totalSummary: FunnelMetricsSummary;
  locationSummaries: FunnelMetricsSummary[];
}

/**
 * 特定の組織・店舗・施策のファネル集計を取得（サーバー側集計）
 */
export async function getFunnelMetrics(params: FunnelQueryParams): Promise<FunnelMetricsSummary> {
  const supabase = createAdminClient() as any;
  const { organizationId, locationId, campaignId, startDate, endDate } = params;

  // 1. セッションクエリの構築
  let sessionQuery = supabase
    .from("survey_sessions")
    .select("id, location_id, campaign_id, started_at")
    .eq("organization_id", organizationId);

  if (locationId) {
    sessionQuery = sessionQuery.eq("location_id", locationId);
  }
  if (campaignId) {
    sessionQuery = sessionQuery.eq("campaign_id", campaignId);
  }
  if (startDate) {
    sessionQuery = sessionQuery.gte("started_at", startDate);
  }
  if (endDate) {
    sessionQuery = sessionQuery.lte("started_at", endDate);
  }

  const { data: sessions, error: sessErr } = await sessionQuery;

  if (sessErr) {
    console.error("[funnel-repo] getFunnelMetrics sessions error:", sessErr);
  }

  const sessionList = (sessions || []) as Array<{ id: string; location_id: string; campaign_id: string | null }>;
  const sessionIds = sessionList.map((s) => s.id);
  const surveyStarts = sessionList.length;

  // 2. イベントクエリの構築
  let eventsQuery = supabase
    .from("events")
    .select("id, session_id, event_type, metadata, occurred_at")
    .eq("organization_id", organizationId);

  if (locationId) {
    eventsQuery = eventsQuery.eq("location_id", locationId);
  }
  if (startDate) {
    eventsQuery = eventsQuery.gte("occurred_at", startDate);
  }
  if (endDate) {
    eventsQuery = eventsQuery.lte("occurred_at", endDate);
  }

  const { data: rawEvents, error: evtErr } = await eventsQuery;

  if (evtErr) {
    console.error("[funnel-repo] getFunnelMetrics events error:", evtErr);
  }

  const allEvents = (rawEvents || []) as Array<{ id: string; session_id: string | null; event_type: string; metadata: any }>;

  // campaignId 指定がある場合は対象セッションのイベントのみに絞り込む
  const filteredEvents = campaignId
    ? allEvents.filter((e) => e.session_id && sessionIds.includes(e.session_id))
    : allEvents;

  // ユニークセッション集合（重複クリック等の排除）
  const generatedSessionSet = new Set<string>();
  const copiedSessionSet = new Set<string>();
  const clickedSessionSet = new Set<string>();
  const couponSessionSet = new Set<string>();

  let fallbackGenerated = 0;
  let fallbackCopied = 0;
  let fallbackClicked = 0;
  let fallbackCoupon = 0;
  let generationFailures = 0;
  let copyFailures = 0;

  filteredEvents.forEach((e) => {
    const sId = e.session_id;
    switch (e.event_type) {
      case "review_generated":
      case "generate_click":
        if (sId) generatedSessionSet.add(sId);
        else fallbackGenerated++;
        break;
      case "review_copied":
      case "copy_click":
        if (sId) copiedSessionSet.add(sId);
        else fallbackCopied++;
        break;
      case "review_clicked":
      case "maps_click":
        if (sId) clickedSessionSet.add(sId);
        else fallbackClicked++;
        break;
      case "coupon_issued":
      case "coupon_view":
        if (sId) couponSessionSet.add(sId);
        else fallbackCoupon++;
        break;
      case "review_generation_failed":
        generationFailures++;
        break;
      case "review_copy_failed":
        copyFailures++;
        break;
    }
  });

  // セッション連携済みユニーク数 ＋ フォールバック
  const generatedReviews = Math.max(generatedSessionSet.size, fallbackGenerated);
  const reviewCopies = Math.max(copiedSessionSet.size, fallbackCopied);
  const reviewClicks = Math.max(clickedSessionSet.size, fallbackClicked);
  const couponsIssued = Math.max(couponSessionSet.size, fallbackCoupon);

  // 転換率（0除算防御）
  const generationRate = surveyStarts > 0 ? Math.round((generatedReviews / surveyStarts) * 100) : 0;
  const copyRate = generatedReviews > 0 ? Math.round((reviewCopies / generatedReviews) * 100) : 0;
  const clickRate = reviewCopies > 0 ? Math.round((reviewClicks / reviewCopies) * 100) : 0;
  const couponIssueRate = surveyStarts > 0 ? Math.round((couponsIssued / surveyStarts) * 100) : 0;

  return {
    locationId,
    campaignId,
    period: {
      from: startDate ?? null,
      to: endDate ?? null,
    },
    provenance: "live",
    surveyStarts,
    generatedReviews,
    reviewCopies,
    reviewClicks,
    couponsIssued,
    generationRate,
    copyRate,
    clickRate,
    couponIssueRate,
    generationFailures,
    copyFailures,
  };
}

/**
 * 組織全体の合計および店舗別比較の集計（多店舗集約クエリ境界）
 */
export async function getMultiStoreComparison(
  params: FunnelQueryParams
): Promise<MultiStoreComparisonResult> {
  const supabase = createAdminClient() as any;
  const { organizationId, startDate, endDate, storeGroupId } = params;

  // 組織内のアクティブ店舗一覧を取得
  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("id, public_slug, name")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (locErr || !locations) {
    console.error("[funnel-repo] getMultiStoreComparison locations error:", locErr);
  }

  const activeLocations = (locations || []) as Array<{ id: string; public_slug: string; name: string }>;

  // 各店舗ごとの集計を並列実行
  const locationSummaries: FunnelMetricsSummary[] = await Promise.all(
    activeLocations.map(async (loc) => {
      const summary = await getFunnelMetrics({
        organizationId,
        locationId: loc.id,
        startDate,
        endDate,
        storeGroupId,
      });
      return {
        ...summary,
        storeSlug: loc.public_slug,
        storeName: loc.name,
      };
    })
  );

  // 全店舗合計の集計
  const totalSummary = await getFunnelMetrics({
    organizationId,
    startDate,
    endDate,
    storeGroupId,
  });

  return {
    organizationId,
    period: {
      from: startDate ?? null,
      to: endDate ?? null,
    },
    totalSummary: {
      ...totalSummary,
      storeSlug: "all",
      storeName: "全店舗合算",
    },
    locationSummaries,
  };
}
