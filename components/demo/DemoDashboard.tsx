"use client";

import { CompetitorScatterChart, GbpTrendChart, FunnelChart } from "@/components/admin/MeoCharts";
import {
  DEMO_COMPETITORS,
  DEMO_FUNNEL,
  DEMO_MAPS_METRICS,
  DEMO_TREND,
  DEMO_TREND_INTRO_MONTH,
  DEMO_TREND_TITLE,
  summarizeTrend,
} from "@/lib/demo/dashboard";
import { DEMO_STORE_NAME } from "@/lib/demo/store";

function SourceBadge({ children, tone = "demo" }: { children: React.ReactNode; tone?: "demo" | "model" | "actual" }) {
  const styles = {
    demo: "bg-amber-50 text-amber-800 border-amber-200",
    model: "bg-indigo-50 text-indigo-700 border-indigo-200",
    actual: "bg-emerald-50 text-emerald-700 border-emerald-200",
  } as const;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${styles[tone]}`}>
      {children}
    </span>
  );
}

function MetricCard({ label, value, unit, note }: { label: string; value: string; unit: string; note: string }) {
  return (
    <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
      <div className="flex justify-between items-start gap-2">
        <p className="text-[11px] font-bold text-text-tertiary">{label}</p>
        <SourceBadge tone="demo">デモ値</SourceBadge>
      </div>
      <p className="text-2xl font-bold text-text-primary mt-1">
        {value}
        <span className="text-xs font-normal text-text-secondary ml-1">{unit}</span>
      </p>
      <p className="text-[10px] text-text-tertiary mt-1">{note}</p>
    </div>
  );
}

/** 商談デモのダッシュボード。表示するのはすべて lib/demo/dashboard.ts の固定データ */
export default function DemoDashboard() {
  const trendSummary = summarizeTrend(DEMO_TREND);
  const own = DEMO_COMPETITORS.find((c) => c.isOwn);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="border-b border-border-default pb-5">
        <span className="inline-block text-[11px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full mb-1">
          商談デモ用ダッシュボード
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">
          {DEMO_STORE_NAME}の集客ダッシュボード
        </h1>
        <p className="text-text-secondary text-xs md:text-sm mt-1">
          口コミ獲得の推移、Googleマップでの見え方、近隣競合との比較をひと目で確認できます。
        </p>
      </div>

      {/* 1. 口コミ獲得の推移 */}
      <section className="space-y-4" aria-labelledby="demo-trend-title">
        <div className="bg-surface rounded-2xl p-5 md:p-6 border border-border-default shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
            <div>
              <h2 id="demo-trend-title" className="text-lg font-bold text-text-primary">
                {DEMO_TREND_TITLE}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                店舗全体の月間口コミ増加のモデル（2026年6〜9月）。{Number(DEMO_TREND_INTRO_MONTH.slice(5))}月にポチコミを導入した想定です。
              </p>
            </div>
            <SourceBadge tone="model">シミュレーション（仮値）</SourceBadge>
          </div>

          <GbpTrendChart
            trends={DEMO_TREND}
            showDirections={false}
            markers={[{ month: DEMO_TREND_INTRO_MONTH, label: "導入" }]}
            ariaLabel="ポチコミ導入後の月別口コミ獲得シミュレーション（2026年6月〜9月）"
          />

          {trendSummary && (
            <p className="mt-3 text-xs text-text-secondary">
              導入月の{trendSummary.first.reviews}件から、{Number(trendSummary.last.month.slice(5))}月には
              <strong className="text-brand">{trendSummary.last.reviews}件</strong>
              {trendSummary.ratio !== null && <>（約{trendSummary.ratio}倍）</>}まで増加するモデルです。
            </p>
          )}
          <p className="mt-2 text-[11px] text-text-tertiary leading-relaxed">
            指標: 店舗全体の月間口コミ増加件数（モデル）／出典: 商談用シミュレーション。実際のGoogle上の口コミ件数や、実店舗の実績ではありません。
          </p>
        </div>
      </section>

      {/* 2. Googleマップ集客 + アンケートファネル */}
      <section className="space-y-4" aria-labelledby="demo-maps-title">
        <div>
          <h2 id="demo-maps-title" className="text-lg font-bold text-text-primary">
            Googleマップでの集客状況
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">月間の表示・行動回数（デモ用の参考値）</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <MetricCard label="月間マップ表示回数" value={DEMO_MAPS_METRICS.monthlyViews.toLocaleString()} unit="回" note="Googleマップ・検索での表示" />
          <MetricCard label="ルート検索（来店ナビ）" value={DEMO_MAPS_METRICS.directionRequests.toLocaleString()} unit="回/月" note="来店確度の高い行動" />
          <MetricCard label="ウェブサイト誘導" value={DEMO_MAPS_METRICS.websiteClicks.toLocaleString()} unit="回/月" note="公式サイトへの流入" />
          <MetricCard label="通話" value={DEMO_MAPS_METRICS.phoneCalls.toLocaleString()} unit="回/月" note="電話番号ボタンのタップ" />
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">QRアンケートの操作ファネル</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                来店客がQRを読み取ってから、口コミ文を作り、Googleマップの投稿画面を開くまでの操作数
              </p>
            </div>
            <SourceBadge tone="demo">デモデータ</SourceBadge>
          </div>
          <FunnelChart
            starts={DEMO_FUNNEL.surveyStarts}
            generated={DEMO_FUNNEL.generatedReviews}
            clicks={DEMO_FUNNEL.mapClicks}
          />
          <p className="text-[11px] text-text-tertiary mt-3 leading-relaxed">
            ※「Googleマップ遷移」は投稿画面を開いた回数です。実際に投稿された口コミの件数ではありません。また、上の推移グラフ（店舗全体の月間口コミ増加のモデル）や、下の競合比較に表示されるGoogle上の口コミ件数とも別の指標です。
          </p>
        </div>
      </section>

      {/* 3. 競合比較 */}
      <section className="space-y-4" aria-labelledby="demo-compare-title">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 id="demo-compare-title" className="text-lg font-bold text-text-primary">
              近隣競合との比較（星評価 × Google口コミ件数）
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              指標: Googleマップ上の累計口コミ件数と平均星評価（現行モデル値）／店舗名はサンプル名です
            </p>
          </div>
          <SourceBadge tone="demo">デモデータ</SourceBadge>
        </div>

        <div className="bg-surface rounded-2xl p-5 md:p-6 border border-border-default shadow-card">
          <CompetitorScatterChart competitors={DEMO_COMPETITORS} />
          {own && (
            <p className="mt-4 text-[11px] text-text-tertiary">
              {own.name}のGoogle上の口コミ件数は現在{own.reviews.toLocaleString()}件です。導入後の増加ペースは、上の推移グラフ（モデル）で確認できます。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
