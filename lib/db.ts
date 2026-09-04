import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { AppDb, Coupon, Store, StoreEvent, StoreMetrics } from "@/lib/types";
import {
  getStoresFromSupabase,
  getStoreFromSupabase,
  saveStoreToSupabase,
  getCouponsFromSupabase,
  getCouponFromSupabase,
  saveCouponToSupabase,
  getPrimaryCouponFromSupabase,
  recordEventToSupabase,
  getMetricsFromSupabase,
  issueCouponFromSupabase,
  getUserManagedLocations,
  normalizeSlug,
} from "@/lib/repositories/supabase-repository";

const dbPath = path.join(process.cwd(), "data", "db.json");

// Supabase設定の有無を判定
function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ローカルJSONキャッシュ
let cache: AppDb | null = null;

export async function readDb(): Promise<AppDb> {
  if (cache) return cache;

  const raw = await fs.readFile(dbPath, "utf8");
  cache = JSON.parse(raw) as AppDb;
  return cache;
}

export async function writeDb(db: AppDb): Promise<void> {
  cache = db;

  try {
    await fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  } catch (error) {
    console.warn("[db] ファイルへの書き込みをスキップしました", error);
  }
}

export function createSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `store-${Date.now().toString(36)}`;
}

export async function getStores(): Promise<Store[]> {
  if (isSupabaseConfigured()) {
    try {
      const stores = await getStoresFromSupabase();
      if (stores.length > 0) return stores;
    } catch (err) {
      console.warn("[db] Supabase fallback to local db.json for getStores", err);
    }
  }

  const db = await readDb();
  return db.stores;
}

export async function getStore(storeId: string): Promise<Store | null> {
  if (isSupabaseConfigured()) {
    try {
      const store = await getStoreFromSupabase(storeId);
      if (store) return store;
    } catch (err) {
      console.warn("[db] Supabase fallback to local db.json for getStore", err);
    }
  }

  const db = await readDb();
  const normalizedId = normalizeSlug(storeId);
  return db.stores.find((store) => store.id === normalizedId) ?? null;
}

export async function saveStore(input: Store): Promise<Store> {
  if (isSupabaseConfigured()) {
    return await saveStoreToSupabase(input);
  }

  const db = await readDb();
  const id = createSlug(input.id || input.name);
  const store: Store = { ...input, id };
  const index = db.stores.findIndex((item) => item.id === id);

  if (index >= 0) {
    db.stores[index] = store;
  } else {
    db.stores.push(store);
    db.metrics.push(createEmptyMetrics(id));
  }

  await writeDb(db);
  return store;
}

export async function getCoupons(storeId?: string): Promise<Coupon[]> {
  if (isSupabaseConfigured()) {
    try {
      const coupons = await getCouponsFromSupabase(storeId);
      if (coupons.length > 0) return coupons;
    } catch (err) {
      console.warn("[db] Supabase fallback to local db.json for getCoupons", err);
    }
  }

  const db = await readDb();
  return db.coupons.filter((coupon) => !storeId || coupon.storeId === storeId);
}

export async function getCoupon(couponId: string): Promise<Coupon | null> {
  if (isSupabaseConfigured()) {
    try {
      const coupon = await getCouponFromSupabase(couponId);
      if (coupon) return coupon;
    } catch (err) {
      console.warn("[db] Supabase fallback to local db.json for getCoupon", err);
    }
  }

  const db = await readDb();
  return db.coupons.find((coupon) => coupon.id === couponId) ?? null;
}

export async function saveCoupon(input: Coupon): Promise<Coupon> {
  if (isSupabaseConfigured()) {
    return await saveCouponToSupabase(input);
  }

  const db = await readDb();
  const id = createSlug(input.id || input.title);
  const coupon: Coupon = {
    ...input,
    id,
    expiresInDays: Number(input.expiresInDays) || 30,
    issuedCount: Number(input.issuedCount) || 0,
    active: Boolean(input.active),
  };
  const index = db.coupons.findIndex((item) => item.id === id);

  if (index >= 0) {
    db.coupons[index] = coupon;
  } else {
    db.coupons.push(coupon);
  }

  await writeDb(db);
  return coupon;
}

export async function getUserStores(userId: string): Promise<Store[]> {
  if (isSupabaseConfigured()) {
    try {
      // 所属組織の管理店舗のみを返す（0件の場合は他店舗へフォールバックさせず空配列を安全に返す）
      return await getUserManagedLocations(userId);
    } catch (err) {
      console.error("[db] Supabase error in getUserStores:", err);
      return [];
    }
  }

  // ローカル開発環境（Supabase未設定環境）のみ全店舗を返す
  return getStores();
}

export async function getMetrics(storeId: string): Promise<StoreMetrics> {
  if (isSupabaseConfigured()) {
    try {
      return await getMetricsFromSupabase(storeId);
    } catch (err) {
      console.warn("[db] Supabase fallback to local db.json for getMetrics", err);
    }
  }

  const db = await readDb();
  return db.metrics.find((item) => item.storeId === storeId) ?? createEmptyMetrics(storeId);
}

export async function getAllMetrics(): Promise<StoreMetrics[]> {
  const db = await readDb();
  return db.metrics;
}

export async function getPrimaryCoupon(storeId: string): Promise<Coupon | null> {
  if (isSupabaseConfigured()) {
    try {
      const coupon = await getPrimaryCouponFromSupabase(storeId);
      if (coupon) return coupon;
    } catch (err) {
      console.warn("[db] Supabase fallback to local db.json for getPrimaryCoupon", err);
    }
  }

  const db = await readDb();
  return db.coupons.find((coupon) => coupon.storeId === storeId && coupon.active) ?? null;
}

export async function issueCoupon(storeId: string): Promise<Coupon | null> {
  if (isSupabaseConfigured()) {
    try {
      const coupon = await issueCouponFromSupabase(storeId);
      if (coupon) return coupon;
    } catch (error) {
      console.error("[db] Supabase issueCoupon error, fallback to local:", error);
    }
  }

  const db = await readDb();
  const coupon = db.coupons.find((item) => item.storeId === storeId && item.active);

  if (!coupon) {
    return null;
  }

  coupon.issuedCount += 1;
  incrementMetric(db, storeId, "couponsIssued");
  await writeDb(db);
  return coupon;
}

export async function recordEvent(
  storeId: string,
  type: string,
  payload: Record<string, unknown> | null
): Promise<StoreEvent> {
  if (isSupabaseConfigured()) {
    try {
      const supaEvent = await recordEventToSupabase(storeId, type, payload);
      if (supaEvent) return supaEvent;
    } catch (err) {
      console.warn("[db] Supabase fallback to local db.json for recordEvent", err);
    }
  }

  const db = await readDb();
  const event: StoreEvent = {
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    storeId,
    type,
    payload,
    receivedAt: new Date().toISOString(),
  };

  db.events.push(event);

  if (type === "survey_started") incrementMetric(db, storeId, "surveyStarts");
  if (type === "review_generated") {
    incrementMetric(db, storeId, "generatedReviews");
    updateAverageRating(db, storeId, payload?.rating);
  }
  if (type === "review_clicked") incrementMetric(db, storeId, "reviewClicks");
  await writeDb(db);
  return event;
}

function createEmptyMetrics(storeId: string): StoreMetrics {
  return {
    storeId,
    surveyStarts: 0,
    generatedReviews: 0,
    reviewClicks: 0,
    couponsIssued: 0,
    averageRating: 0,
  };
}

function ensureMetrics(db: AppDb, storeId: string): StoreMetrics {
  let item = db.metrics.find((metric) => metric.storeId === storeId);
  if (!item) {
    item = createEmptyMetrics(storeId);
    db.metrics.push(item);
  }

  return item;
}

function incrementMetric(
  db: AppDb,
  storeId: string,
  key: "surveyStarts" | "generatedReviews" | "reviewClicks" | "couponsIssued"
): void {
  const item = ensureMetrics(db, storeId);
  item[key] += 1;
}

function updateAverageRating(db: AppDb, storeId: string, value: unknown): void {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating <= 0) return;

  const item = ensureMetrics(db, storeId);
  if (item.averageRating === 0) {
    item.averageRating = rating;
    return;
  }

  item.averageRating = Math.round(((item.averageRating + rating) / 2) * 10) / 10;
}
