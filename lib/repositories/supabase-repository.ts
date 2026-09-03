import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import type { Store, Coupon, StoreMetrics, StoreEvent } from "@/lib/types";

// slugの厳格バリデーションおよび正規化（英数字、ハイフン、アンダースコアのみ許可）
export function validateAndNormalizeSlug(slug: string): string | null {
  if (!slug || typeof slug !== "string") return null;
  const trimmed = slug.trim();
  // 許可文字: 英数字、ハイフン、アンダースコア (1〜64文字)
  // カンマやピリオド、括弧などPostgREST構文を破壊しうる文字は即座に拒絶
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(trimmed)) {
    return null;
  }

  // 後方互換性エイリアスのマッピング
  if (trimmed === "classic") return "golf-a";
  if (trimmed === "ss-grand") return "golf-b";
  if (trimmed === "demo-golf") return "golf";
  return trimmed;
}

// 後方互換用（文字列のみ返す版）
export function normalizeSlug(slug: string): string {
  const validated = validateAndNormalizeSlug(slug);
  return validated || slug;
}

interface RawLocation {
  id: string;
  organization_id: string;
  public_slug: string;
  legacy_slugs: string[];
  name: string;
  category: string;
  google_place_id: string | null;
  google_maps_review_url: string;
  survey_options: Record<string, unknown>;
  keywords: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawCoupon {
  id: string;
  organization_id: string;
  location_id: string;
  title: string;
  description: string;
  badge_text: string | null;
  expiry_date: string | null;
  is_active: boolean;
  locations?: { public_slug: string };
}

/**
 * 安全な店舗検索ヘルパー（PostgREST生文字列結合を完全廃止し、パラメータ化クエリで検索）
 */
async function findLocationBySlug(
  supabase: ReturnType<typeof createAdminClient>,
  slugOrId: string
): Promise<RawLocation | null> {
  const safeSlug = validateAndNormalizeSlug(slugOrId);
  if (!safeSlug) return null;

  // 1. まず public_slug 一致で安全に検索
  const { data: primaryLoc, error: primaryErr } = await supabase
    .from("locations")
    .select("*")
    .eq("public_slug", safeSlug)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!primaryErr && primaryLoc) {
    return primaryLoc as unknown as RawLocation;
  }

  // 2. 見つからなければ legacy_slugs 配列含有で安全に検索
  const { data: legacyLoc, error: legacyErr } = await supabase
    .from("locations")
    .select("*")
    .contains("legacy_slugs", [safeSlug])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!legacyErr && legacyLoc) {
    return legacyLoc as unknown as RawLocation;
  }

  return null;
}

export async function getStoresFromSupabase(): Promise<Store[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[supabase-repo] getStores error:", error);
    return [];
  }

  return (data as unknown as RawLocation[]).map(mapLocationToStore);
}

export async function getStoreFromSupabase(slugOrId: string): Promise<Store | null> {
  const supabase = createAdminClient();
  const location = await findLocationBySlug(supabase, slugOrId);
  if (!location) return null;
  return mapLocationToStore(location);
}

export async function getCouponsFromSupabase(storeId?: string): Promise<Coupon[]> {
  const supabase = createAdminClient();

  if (storeId) {
    const location = await findLocationBySlug(supabase, storeId);
    if (!location) return [];

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("location_id", location.id)
      .eq("is_active", true);

    if (error || !data) {
      console.error("[supabase-repo] getCoupons error:", error);
      return [];
    }

    return (data as unknown as RawCoupon[]).map((item) => ({
      id: item.id,
      storeId: location.public_slug,
      title: item.title,
      description: item.description,
      expiresInDays: 30,
      issuedCount: 0,
      active: item.is_active,
    }));
  }

  const { data, error } = await supabase
    .from("coupons")
    .select("*, locations!inner(public_slug)")
    .eq("is_active", true);

  if (error || !data) {
    console.error("[supabase-repo] getCoupons error:", error);
    return [];
  }

  return (data as unknown as RawCoupon[]).map((item) => ({
    id: item.id,
    storeId: item.locations?.public_slug || "",
    title: item.title,
    description: item.description,
    expiresInDays: 30,
    issuedCount: 0,
    active: item.is_active,
  }));
}

export async function getPrimaryCouponFromSupabase(storeId: string): Promise<Coupon | null> {
  const coupons = await getCouponsFromSupabase(storeId);
  return coupons.length > 0 ? coupons[0] : null;
}

/**
 * Supabaseでクーポンを発行し記録する（P2解消）
 */
export async function issueCouponFromSupabase(storeId: string): Promise<Coupon | null> {
  const supabase = createAdminClient();
  const location = await findLocationBySlug(supabase, storeId);
  if (!location) return null;

  // 店舗の有効なクーポンを1件取得
  const { data: coupon, error: couponErr } = await supabase
    .from("coupons")
    .select("*")
    .eq("location_id", location.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (couponErr || !coupon) {
    console.error("[supabase-repo] issueCoupon error - no active coupon found:", couponErr);
    return null;
  }

  const rawCoupon = coupon as unknown as RawCoupon;

  // クーポン発行履歴（coupon_issues）へ記録
  const issuePayload: Database["public"]["Tables"]["coupon_issues"]["Insert"] = {
    coupon_id: rawCoupon.id,
    session_id: null,
  };

  const { error: issueErr } = await (
    supabase.from("coupon_issues") as unknown as {
      insert: (data: typeof issuePayload) => Promise<{ error: unknown }>;
    }
  ).insert(issuePayload);

  if (issueErr) {
    console.warn("[supabase-repo] coupon_issues insert warning:", issueErr);
  }

  return {
    id: rawCoupon.id,
    storeId: location.public_slug,
    title: rawCoupon.title,
    description: rawCoupon.description,
    expiresInDays: 30,
    issuedCount: 1,
    active: rawCoupon.is_active,
  };
}

export async function recordEventToSupabase(
  storeId: string,
  type: string,
  payload: Record<string, unknown> | null
): Promise<StoreEvent | null> {
  const supabase = createAdminClient();
  const location = await findLocationBySlug(supabase, storeId);
  if (!location) {
    return null;
  }

  const newEvent: Database["public"]["Tables"]["events"]["Insert"] = {
    organization_id: location.organization_id,
    location_id: location.id,
    event_type: type,
    metadata: (payload ?? {}) as Database["public"]["Tables"]["events"]["Insert"]["metadata"],
  };

  const { data, error } = await supabase
    .from("events")
    // @ts-expect-error Supabase client generic overload mismatch
    .insert(newEvent)
    .select()
    .single();

  if (error || !data) {
    console.error("[supabase-repo] recordEvent error:", error);
    return null;
  }

  const row = data as { id: string; event_type: string; metadata: Record<string, unknown>; occurred_at: string };
  return {
    id: row.id,
    storeId: location.public_slug,
    type: row.event_type,
    payload: row.metadata,
    receivedAt: row.occurred_at,
  };
}

export async function getMetricsFromSupabase(storeId: string): Promise<StoreMetrics> {
  const supabase = createAdminClient();
  const location = await findLocationBySlug(supabase, storeId);

  if (!location) {
    return {
      storeId,
      surveyStarts: 0,
      generatedReviews: 0,
      reviewClicks: 0,
      couponsIssued: 0,
      averageRating: 0,
    };
  }

  const { data: events } = await supabase
    .from("events")
    .select("event_type, metadata")
    .eq("location_id", location.id);

  let surveyStarts = 0;
  let generatedReviews = 0;
  let reviewClicks = 0;
  let couponsIssued = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  const eventList = (events || []) as Array<{ event_type: string; metadata: Record<string, unknown> }>;

  eventList.forEach((evt) => {
    if (evt.event_type === "survey_started" || evt.event_type === "survey_view") surveyStarts++;
    if (evt.event_type === "review_generated" || evt.event_type === "generate_click") {
      generatedReviews++;
      const rating = Number(evt.metadata?.rating);
      if (Number.isFinite(rating) && rating > 0) {
        ratingSum += rating;
        ratingCount++;
      }
    }
    if (evt.event_type === "review_clicked" || evt.event_type === "maps_click") reviewClicks++;
    if (evt.event_type === "coupon_issued" || evt.event_type === "coupon_view") couponsIssued++;
  });

  return {
    storeId: location.public_slug,
    surveyStarts,
    generatedReviews,
    reviewClicks,
    couponsIssued,
    averageRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0,
  };
}

export async function cleanupExpiredGbpCacheFromSupabase(): Promise<{ deleted_reviews: number; deleted_performance_metrics: number }> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: unknown; error: unknown }>)("cleanup_expired_gbp_cache");

  if (error) {
    console.error("[supabase-repo] cleanupExpiredGbpCache error:", error);
    return { deleted_reviews: 0, deleted_performance_metrics: 0 };
  }

  return (data as { deleted_reviews: number; deleted_performance_metrics: number }) || {
    deleted_reviews: 0,
    deleted_performance_metrics: 0,
  };
}

function mapLocationToStore(loc: RawLocation): Store {
  const options = (loc.survey_options || {}) as {
    sources?: string[];
    menus?: string[];
    goodPoints?: string[];
    badPoints?: string[];
  };

  return {
    id: loc.public_slug,
    name: loc.name,
    category: loc.category || "ゴルフ場・ゴルフコース",
    plan: "growth",
    status: "active",
    keywords: loc.keywords || [],
    googleMapsUrl: loc.google_maps_review_url || "",
    monthlyGoal: 20,
    surveyOptions: {
      sources: options.sources || [],
      menus: options.menus || [],
      goodPoints: options.goodPoints || [],
      badPoints: options.badPoints || [],
    },
  };
}
