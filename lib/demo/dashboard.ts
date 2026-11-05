/**
 * 商談デモ用ダッシュボードの固定データ。
 * 実店舗（運用店舗）のデータ・名前を含めない。競合名はすべてサンプル名で統一する。
 *
 * 数値の出所: 件数・評価・マップ指標は、既存の商談デモ拠点 `ramen`
 * （is_demo = true の独立テナント。data/meo-diagnosis.json の同名レコード）の「現行モデル値」を、
 * 計画書（ポチコミ_商談デモ実装プラン.md の2章）の指定どおりそのまま使う。
 * これは運用店舗の実績ではなく、実在店舗の公開インサイトを参考にしたデモ値（移行 20260919000002 参照）。
 * 運用店舗の名前・ID・競合名の混入は tests/unit/demo-isolation.test.ts で検査している。
 */

export type DemoCompetitor = {
  name: string;
  rating: number;
  reviews: number;
  isOwn: boolean;
  category: string;
};

export type DemoTrendPoint = {
  month: string; // "YYYY/MM"
  reviews: number;
};

/** 競合比較（Google上の口コミ件数×星評価）。件数・評価は現行モデル値。 */
export const DEMO_COMPETITORS: DemoCompetitor[] = [
  { name: "サンプルラーメン店", rating: 4.3, reviews: 1989, isOwn: true, category: "家系・豚骨" },
  { name: "サンプル家系A店", rating: 4.1, reviews: 1760, isOwn: false, category: "家系" },
  { name: "サンプル家系B店", rating: 4.1, reviews: 1062, isOwn: false, category: "家系" },
  { name: "サンプル家系C店", rating: 3.9, reviews: 638, isOwn: false, category: "家系" },
  { name: "サンプル家系D店", rating: 3.8, reviews: 634, isOwn: false, category: "家系" },
  { name: "サンプル家系E店", rating: 4.0, reviews: 357, isOwn: false, category: "家系" },
];

/** ポチコミ導入後の口コミ獲得シミュレーション（店舗全体の月間口コミ増加のモデル値） */
export const DEMO_TREND_TITLE = "ポチコミ導入後の口コミ獲得シミュレーション";
export const DEMO_TREND_INTRO_MONTH = "2026/06";
export const DEMO_TREND: DemoTrendPoint[] = [
  { month: "2026/06", reviews: 25 },
  { month: "2026/07", reviews: 65 },
  { month: "2026/08", reviews: 115 },
  { month: "2026/09", reviews: 170 },
];

/** Googleマップ集客（現行値） */
export const DEMO_MAPS_METRICS = {
  monthlyViews: 69666,
  directionRequests: 2509,
  websiteClicks: 826,
  phoneCalls: 0,
};

/** QRアンケートからGoogleマップ遷移までの操作ファネル（サンプル） */
export const DEMO_FUNNEL = {
  surveyStarts: 412,
  generatedReviews: 305,
  mapClicks: 231,
};

export function summarizeTrend(trend: DemoTrendPoint[]) {
  if (trend.length < 2) return null;
  const first = trend[0];
  const last = trend[trend.length - 1];
  const ratio = first.reviews > 0 ? Math.round((last.reviews / first.reviews) * 10) / 10 : null;
  const total = trend.reduce((sum, t) => sum + t.reviews, 0);
  return { first, last, ratio, total };
}
