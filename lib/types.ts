export type StorePlan = "starter" | "growth" | "premium";
export type StoreStatus = "active" | "setup" | "paused";

export type Store = {
  id: string;
  name: string;
  /** ヘッダー等での表示用の略称。未設定なら name を使う */
  shortName?: string;
  category: string;
  plan: StorePlan;
  status: StoreStatus;
  keywords: string[];
  googleMapsUrl: string;
  monthlyGoal: number;
  surveyOptions: {
    sources: string[];
    menus: string[];
    goodPoints: string[];
    badPoints: string[];
  };
};

/** 口コミ文の文体バリエーション */
export type ReviewTone = "friendly" | "standard" | "polite";

export type ReviewDraft = {
  tone: ReviewTone;
  text: string;
};

export type Coupon = {
  id: string;
  storeId: string;
  title: string;
  description: string;
  expiresInDays: number;
  issuedCount: number;
  active: boolean;
};

export type StoreMetrics = {
  storeId: string;
  surveyStarts: number;
  generatedReviews: number;
  reviewClicks: number;
  couponsIssued: number;
  averageRating: number;
};

export type StoreEvent = {
  id: string;
  storeId: string;
  type: string;
  payload: Record<string, unknown> | null;
  receivedAt: string;
};

export type AppDb = {
  stores: Store[];
  coupons: Coupon[];
  metrics: StoreMetrics[];
  events: StoreEvent[];
};
