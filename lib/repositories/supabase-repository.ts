import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import type { Store, Coupon, StoreMetrics, StoreEvent } from "@/lib/types";

// slugの正規化（後方互換性エイリアス）
export function normalizeSlug(slug: string): string {
  if (slug === "classic") return "golf-a";
  if (slug === "ss-grand") return "golf-b";
  if (slug === "demo-golf") return "golf";
  return slug;
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
  title: string;
  description: string;
  is_active: boolean;
  locations?: { public_slug: string };
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
  const normalized = normalizeSlug(slugOrId);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .or(`public_slug.eq.${normalized},legacy_slugs.cs.{${normalized}}`)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapLocationToStore(data as unknown as RawLocation);
}

export async function getCouponsFromSupabase(storeId?: string): Promise<Coupon[]> {
  const supabase = createAdminClient();
  let query = supabase.from("coupons").select("*, locations!inner(public_slug)").eq("is_active", true);

  if (storeId) {
    const normalized = normalizeSlug(storeId);
    query = query.eq("locations.public_slug", normalized);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("[supabase-repo] getCoupons error:", error);
    return [];
  }

  return (data as unknown as RawCoupon[]).map((item) => ({
    id: item.id,
    storeId: item.locations?.public_slug || storeId || "",
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

export async function recordEventToSupabase(
  storeId: string,
  type: string,
  payload: Record<string, unknown> | null
): Promise<StoreEvent | null> {
  const normalized = normalizeSlug(storeId);
  const supabase = createAdminClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id, organization_id")
    .or(`public_slug.eq.${normalized},legacy_slugs.cs.{${normalized}}`)
    .limit(1)
    .maybeSingle();

  if (!location) {
    return null;
  }

  const loc = location as { id: string; organization_id: string };

  const newEvent: Database["public"]["Tables"]["events"]["Insert"] = {
    organization_id: loc.organization_id,
    location_id: loc.id,
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
    storeId: normalized,
    type: row.event_type,
    payload: row.metadata,
    receivedAt: row.occurred_at,
  };
}

export async function getMetricsFromSupabase(storeId: string): Promise<StoreMetrics> {
  const normalized = normalizeSlug(storeId);
  const supabase = createAdminClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .or(`public_slug.eq.${normalized},legacy_slugs.cs.{${normalized}}`)
    .limit(1)
    .maybeSingle();

  if (!location) {
    return {
      storeId: normalized,
      surveyStarts: 0,
      generatedReviews: 0,
      reviewClicks: 0,
      couponsIssued: 0,
      averageRating: 0,
    };
  }

  const loc = location as { id: string };

  const { data: events } = await supabase
    .from("events")
    .select("event_type, metadata")
    .eq("location_id", loc.id);

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
    storeId: normalized,
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
