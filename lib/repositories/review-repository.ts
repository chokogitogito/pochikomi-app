import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeReviewRefHash } from "@/lib/reviews/reviewRef";
import { RawReview } from "@/lib/reviews/reviewSource";

export interface ReviewDraftItem {
  id: string;
  tone: "polite" | "standard" | "friendly";
  draftText: string;
  expiresAt: string;
  createdAt: string;
}

export interface ReviewInboxItem {
  id: string; // cache id または record id
  locationId: string;
  externalReviewId: string | null;
  reviewRefHash: string;
  reviewerName: string | null;
  starRating: number | null;
  comment: string | null;
  reviewCreatedAt: string | null;
  source: "gbp" | "places" | "manual" | "fixture" | null;
  status: "unreplied" | "drafted" | "replied" | "ignored";
  isTtlExpired: boolean;
  drafts: ReviewDraftItem[];
  firstSeenAt: string;
  repliedAt: string | null;
}

export interface ReviewReplySettingsData {
  storeCallName: string;
  signature: string;
  toneDefault: "polite" | "standard" | "friendly";
  ngWords: string[];
  policyNote: string;
  reviewSource: "fixture" | "manual" | "places" | "gbp";
}

/**
 * 口コミ受信箱の一覧を取得する
 * 未返信を最上位にし、30日TTL失効した未返信レコードはプレースホルダーとして表示
 */
export async function getReviewInbox(locationId: string): Promise<ReviewInboxItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const now = new Date().toISOString();

  // 1. 恒久テーブル review_reply_records を取得
  const { data: records, error: recErr } = await supabase
    .from("review_reply_records")
    .select("*")
    .eq("location_id", locationId);

  if (recErr) {
    console.error("[review-repo] getReviewInbox records error:", recErr);
    return [];
  }

  // 2. 有効期限内の gbp_review_cache を取得（Google Content 30日保持制約）
  const { data: caches, error: cacheErr } = await supabase
    .from("gbp_review_cache")
    .select("*")
    .eq("location_id", locationId)
    .gt("expires_at", now);

  if (cacheErr) {
    console.error("[review-repo] getReviewInbox caches error:", cacheErr);
  }

  // 3. 有効期限内の review_reply_drafts を取得
  const { data: drafts, error: draftErr } = await supabase
    .from("review_reply_drafts")
    .select("*")
    .eq("location_id", locationId)
    .gt("expires_at", now);

  if (draftErr) {
    console.error("[review-repo] getReviewInbox drafts error:", draftErr);
  }

  const cacheList = (caches || []) as Array<{
    id: string;
    external_review_id: string;
    reviewer_name: string | null;
    star_rating: number | null;
    comment: string | null;
    review_created_at: string | null;
    source: "gbp" | "places" | "manual" | "fixture";
    fetched_at: string;
    expires_at: string;
  }>;

  const draftList = (drafts || []) as Array<{
    id: string;
    external_review_id: string;
    tone: "polite" | "standard" | "friendly";
    draft_text: string;
    expires_at: string;
    created_at: string;
  }>;

  const recordList = (records || []) as Array<{
    id: string;
    review_ref_hash: string;
    status: "unreplied" | "drafted" | "replied" | "ignored";
    first_seen_at: string;
    replied_at: string | null;
  }>;

  // キャッシュを external_review_id のハッシュでマップ
  const cacheByHash = new Map<string, (typeof cacheList)[0]>();
  for (const c of cacheList) {
    const hash = computeReviewRefHash(c.external_review_id);
    cacheByHash.set(hash, c);
  }

  // 下書きを external_review_id でグループ化
  const draftsByExternalId = new Map<string, ReviewDraftItem[]>();
  for (const d of draftList) {
    const arr = draftsByExternalId.get(d.external_review_id) || [];
    arr.push({
      id: d.id,
      tone: d.tone,
      draftText: d.draft_text,
      expiresAt: d.expires_at,
      createdAt: d.created_at,
    });
    draftsByExternalId.set(d.external_review_id, arr);
  }

  const items: ReviewInboxItem[] = [];
  const processedHashes = new Set<string>();

  // A. 既存の記録（review_reply_records）をベースに構築
  for (const r of recordList) {
    processedHashes.add(r.review_ref_hash);
    const matchedCache = cacheByHash.get(r.review_ref_hash);

    if (matchedCache) {
      // キャッシュが存在（生存中）
      const itemDrafts = draftsByExternalId.get(matchedCache.external_review_id) || [];
      items.push({
        id: matchedCache.id,
        locationId,
        externalReviewId: matchedCache.external_review_id,
        reviewRefHash: r.review_ref_hash,
        reviewerName: matchedCache.reviewer_name,
        starRating: matchedCache.star_rating,
        comment: matchedCache.comment,
        reviewCreatedAt: matchedCache.review_created_at,
        source: matchedCache.source,
        status: itemDrafts.length > 0 && r.status === "unreplied" ? "drafted" : r.status,
        isTtlExpired: false,
        drafts: itemDrafts,
        firstSeenAt: r.first_seen_at,
        repliedAt: r.replied_at,
      });
    } else {
      // 30日TTL失効（Google Content本文は安全に消滅済み）
      items.push({
        id: r.id,
        locationId,
        externalReviewId: null,
        reviewRefHash: r.review_ref_hash,
        reviewerName: null,
        starRating: null,
        comment: null,
        reviewCreatedAt: null,
        source: null,
        status: r.status,
        isTtlExpired: true,
        drafts: [],
        firstSeenAt: r.first_seen_at,
        repliedAt: r.replied_at,
      });
    }
  }

  // B. キャッシュはあるが records がまだ無い場合（同期直後の補完）
  for (const c of cacheList) {
    const hash = computeReviewRefHash(c.external_review_id);
    if (!processedHashes.has(hash)) {
      const itemDrafts = draftsByExternalId.get(c.external_review_id) || [];
      items.push({
        id: c.id,
        locationId,
        externalReviewId: c.external_review_id,
        reviewRefHash: hash,
        reviewerName: c.reviewer_name,
        starRating: c.star_rating,
        comment: c.comment,
        reviewCreatedAt: c.review_created_at,
        source: c.source,
        status: itemDrafts.length > 0 ? "drafted" : "unreplied",
        isTtlExpired: false,
        drafts: itemDrafts,
        firstSeenAt: c.fetched_at,
        repliedAt: null,
      });
    }
  }

  // 4. ソート順: 未返信(unreplied, drafted)が最上位、次に日時降順
  return items.sort((a, b) => {
    const isUnrepliedA = a.status === "unreplied" || a.status === "drafted";
    const isUnrepliedB = b.status === "unreplied" || b.status === "drafted";
    if (isUnrepliedA && !isUnrepliedB) return -1;
    if (!isUnrepliedA && isUnrepliedB) return 1;

    const timeA = new Date(a.reviewCreatedAt || a.firstSeenAt).getTime();
    const timeB = new Date(b.reviewCreatedAt || b.firstSeenAt).getTime();
    return timeB - timeA;
  });
}

/**
 * 口コミを同期・取り込む（冪等処理）
 */
export async function syncReviewsForLocation(
  organizationId: string,
  locationId: string,
  reviews: RawReview[]
): Promise<{ added: number; total: number }> {
  if (reviews.length === 0) {
    return { added: 0, total: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  let addedCount = 0;

  for (const rev of reviews) {
    const hash = computeReviewRefHash(rev.externalReviewId);

    // 既存キャッシュの有無を確認（P2-2: 再同期時にexpires_atを延長して無期限化させない不変条件）
    const { data: existingCache } = await supabase
      .from("gbp_review_cache")
      .select("fetched_at, expires_at")
      .eq("location_id", locationId)
      .eq("external_review_id", rev.externalReviewId)
      .maybeSingle();

    const recordFetchedAt = existingCache?.fetched_at || now.toISOString();
    const recordExpiresAt = existingCache?.expires_at || expiresAt;

    // 1. gbp_review_cache に upsert
    const { error: cacheErr } = await supabase.from("gbp_review_cache").upsert(
      {
        location_id: locationId,
        external_review_id: rev.externalReviewId,
        reviewer_name: rev.reviewerName,
        star_rating: rev.starRating,
        comment: rev.comment,
        review_created_at: rev.reviewCreatedAt,
        source: rev.source,
        fetched_at: recordFetchedAt,
        expires_at: recordExpiresAt,
        updated_at: now.toISOString(),
      },
      { onConflict: "location_id,external_review_id" }
    );

    if (cacheErr) {
      console.error("[review-repo] upsert gbp_review_cache error:", cacheErr);
      continue;
    }

    // 2. review_reply_records に insert (なければ unreplied で作成)
    const { data: existingRec } = await supabase
      .from("review_reply_records")
      .select("id")
      .eq("location_id", locationId)
      .eq("review_ref_hash", hash)
      .maybeSingle();

    if (!existingRec) {
      const { error: insErr } = await supabase.from("review_reply_records").insert({
        organization_id: organizationId,
        location_id: locationId,
        review_ref_hash: hash,
        status: "unreplied",
        first_seen_at: recordFetchedAt,
      });
      if (!insErr) {
        addedCount++;
      } else {
        console.error("[review-repo] insert review_reply_records error:", insErr);
      }
    }
  }

  return { added: addedCount, total: reviews.length };
}

/**
 * AI返信下書きを保存する
 * Google Content 30日保持制約に従い、元口コミキャッシュの expires_at を継承する
 */
export async function saveReviewReplyDrafts(params: {
  organizationId: string;
  locationId: string;
  externalReviewId: string;
  drafts: Array<{ tone: "polite" | "standard" | "friendly"; draftText: string }>;
  userId?: string | null;
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // 1. 元の口コミキャッシュから expires_at を取得
  const { data: cache } = await supabase
    .from("gbp_review_cache")
    .select("expires_at, fetched_at")
    .eq("location_id", params.locationId)
    .eq("external_review_id", params.externalReviewId)
    .maybeSingle();

  const now = new Date();
  const maxExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const expiresAt = cache?.expires_at || maxExpires;

  for (const d of params.drafts) {
    await supabase.from("review_reply_drafts").upsert(
      {
        organization_id: params.organizationId,
        location_id: params.locationId,
        external_review_id: params.externalReviewId,
        tone: d.tone,
        draft_text: d.draftText,
        model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
        prompt_version: "reply-v1",
        generated_by: params.userId || null,
        fetched_at: cache?.fetched_at || now.toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "location_id,external_review_id,tone" }
    );
  }

  // 2. review_reply_records の状態が unreplied なら drafted へ
  const hash = computeReviewRefHash(params.externalReviewId);
  await supabase
    .from("review_reply_records")
    .update({ status: "drafted", updated_at: now.toISOString() })
    .eq("location_id", params.locationId)
    .eq("review_ref_hash", hash)
    .eq("status", "unreplied");
}

/**
 * 返信状態の更新（replied / ignored）
 * P2-1: 影響行数を検査し、0件更新ならfalseを返す
 */
export async function updateReviewReplyStatus(params: {
  locationId: string;
  reviewRefHash: string;
  status: "replied" | "ignored" | "unreplied";
}): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: params.status,
    updated_at: now,
  };

  if (params.status === "replied") {
    updateData.replied_at = now;
  } else if (params.status === "unreplied") {
    updateData.replied_at = null;
  }

  const { data, error } = await supabase
    .from("review_reply_records")
    .update(updateData)
    .eq("location_id", params.locationId)
    .eq("review_ref_hash", params.reviewRefHash)
    .select("id");

  if (error || !data || data.length === 0) {
    if (error) console.error("[review-repo] updateReviewReplyStatus error:", error);
    return false;
  }
  return true;
}

/**
 * 店舗ごとの未返信件数を取得する（管理画面バッジ・アラート用）
 */
export async function getUnrepliedReviewCount(locationId: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { count, error } = await supabase
    .from("review_reply_records")
    .select("id", { count: "exact", head: true })
    .eq("location_id", locationId)
    .in("status", ["unreplied", "drafted"]);

  if (error) {
    console.error("[review-repo] getUnrepliedReviewCount error:", error);
    return 0;
  }
  return count || 0;
}

/**
 * 店舗別の返信設定を取得する
 */
export async function getReviewReplySettings(
  organizationId: string,
  locationId: string
): Promise<ReviewReplySettingsData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("review_reply_settings")
    .select("*")
    .eq("location_id", locationId)
    .maybeSingle();

  if (error || !data) {
    return {
      storeCallName: "",
      signature: "",
      toneDefault: "polite",
      ngWords: [],
      policyNote: "",
      reviewSource: "manual",
    };
  }

  return {
    storeCallName: data.store_call_name || "",
    signature: data.signature || "",
    toneDefault: data.tone_default || "polite",
    ngWords: data.ng_words || [],
    policyNote: data.policy_note || "",
    reviewSource: data.review_source || "manual",
  };
}

/**
 * 店舗別の返信設定を保存する
 */
export async function saveReviewReplySettings(
  organizationId: string,
  locationId: string,
  input: Partial<ReviewReplySettingsData>
): Promise<ReviewReplySettingsData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const current = await getReviewReplySettings(organizationId, locationId);
  const updated = {
    storeCallName: input.storeCallName !== undefined ? input.storeCallName : current.storeCallName,
    signature: input.signature !== undefined ? input.signature : current.signature,
    toneDefault: input.toneDefault !== undefined ? input.toneDefault : current.toneDefault,
    ngWords: input.ngWords !== undefined ? input.ngWords : current.ngWords,
    policyNote: input.policyNote !== undefined ? input.policyNote : current.policyNote,
    reviewSource: input.reviewSource !== undefined ? input.reviewSource : current.reviewSource,
  };

  const { error } = await supabase.from("review_reply_settings").upsert(
    {
      organization_id: organizationId,
      location_id: locationId,
      store_call_name: updated.storeCallName,
      signature: updated.signature,
      tone_default: updated.toneDefault,
      ng_words: updated.ngWords,
      policy_note: updated.policyNote,
      review_source: updated.reviewSource,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "location_id" }
  );

  if (error) {
    console.error("[review-repo] saveReviewReplySettings error:", error);
    throw new Error("返信設定の保存に失敗しました");
  }

  return updated;
}
