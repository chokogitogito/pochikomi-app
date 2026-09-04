"use client";

import { useState } from "react";
import Link from "next/link";
import meoData from "@/data/meo-diagnosis.json";
import { CompetitorScatterChart, GbpTrendChart, FunnelChart } from "@/components/admin/MeoCharts";
import type { Store, StoreMetrics } from "@/lib/types";

interface AdminDashboardClientProps {
  stores: Store[];
  metricsMap: Record<string, StoreMetrics>;
  totalMetrics: StoreMetrics;
  isDemoUser?: boolean;
}

export default function AdminDashboardClient({
  stores,
  metricsMap,
  totalMetrics,
  isDemoUser = false,
}: AdminDashboardClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");

  const currentMetrics =
    selectedStoreId === "all"
      ? totalMetrics
      : metricsMap[selectedStoreId] || {
          storeId: selectedStoreId,
          surveyStarts: 0,
          generatedReviews: 0,
          reviewClicks: 0,
          couponsIssued: 0,
          averageRating: 0,
        };

  // 選択店舗
  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const monthlyGoal = selectedStore?.monthlyGoal || (stores.length * 20 || 20);
  const goalAchievementRate =
    monthlyGoal > 0 ? Math.min(100, Math.round((currentMetrics.reviewClicks / monthlyGoal) * 100)) : 0;

  const generationRate =
    currentMetrics.surveyStarts > 0
      ? Math.round((currentMetrics.generatedReviews / currentMetrics.surveyStarts) * 100)
      : 0;

  const mapClickRate =
    currentMetrics.surveyStarts > 0
      ? Math.round((currentMetrics.reviewClicks / currentMetrics.surveyStarts) * 100)
      : 0;

  // GBPデモデータ（参考表示）
  const gbpStoreKey =
    selectedStoreId === "ss-grand" || selectedStoreId === "golf-b"
      ? "ss-grand"
      : "classic";
  const currentGbp =
    meoData.stores[gbpStoreKey]?.gbpPerformance ||
    meoData.stores["classic"]?.gbpPerformance ||
    meoData.stores["golf-a"].gbpPerformance;

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* ページヘッダー ＆ 店舗フィルター */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <span className="inline-block text-[11px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full mb-1">
            {isDemoUser ? "商談デモ用ダッシュボード" : "店舗運用コンソール"}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">
            MEO分析＆口コミ運用ダッシュボード
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            店舗の口コミ獲得実績と、Googleマップ集客・競合比較・MEO診断結果を統合管理します。
          </p>
        </div>

        {/* 店舗切り替えタブ */}
        <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-subtle shrink-0 flex-wrap gap-1">
          <button
            onClick={() => setSelectedStoreId("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
              selectedStoreId === "all"
                ? "bg-surface text-brand shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            全拠点合計 ({stores.length}店舗)
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStoreId(store.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
                selectedStoreId === store.id
                  ? "bg-surface text-brand shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {store.name.replace(/（.+?）/, "").replace(/宇都宮\s*/, "")}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. 口コミ獲得成果（ポチコミ運用ファネル：実データ計測）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              1. 口コミ獲得成果（ポチコミ運用実績）
            </h2>
            <p className="text-xs text-text-tertiary">
              来店客の卓上QR読み取りから、AI口コミ文章生成・Googleマップ投稿画面への遷移実績
            </p>
          </div>
          <span className="text-[11px] font-semibold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
            実稼働中
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <KpiCard
            label="アンケート開始数"
            value={`${currentMetrics.surveyStarts}件`}
            subtext="卓上QRコード読み取り"
            badge="入口"
          />
          <KpiCard
            label="口コミ文章作成数"
            value={`${currentMetrics.generatedReviews}件`}
            subtext="AIが3案を瞬時作成"
            badge={`作成率 ${generationRate}%`}
            highlight
          />
          <KpiCard
            label="Googleマップ遷移数"
            value={`${currentMetrics.reviewClicks}件`}
            subtext="コピーして投稿画面へ"
            badge={`遷移率 ${mapClickRate}%`}
            highlight
          />
          <KpiCard
            label="月間目標達成率"
            value={`${goalAchievementRate}%`}
            subtext={`目標 ${monthlyGoal}件/月`}
            badge={goalAchievementRate >= 100 ? "達成" : "進行中"}
            isBrand={goalAchievementRate >= 100}
          />
        </div>

        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">
              アンケート完了・マップ遷移ファネル
            </h3>
            <FunnelChart
              starts={currentMetrics.surveyStarts}
              generated={currentMetrics.generatedReviews}
              clicks={currentMetrics.reviewClicks}
            />
            <p className="text-[11px] text-text-tertiary mt-3 leading-relaxed">
              ※「Googleマップ遷移数」は、来店客が口コミ文章をコピーしてGoogleマップの投稿画面を開いた回数です（Googleの規約上、投稿完了自体の直接コールバックは存在しないため、投稿画面到達数を成果指標としています）。
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                管理店舗ステータス
              </h3>
              <div className="space-y-2.5">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary"
                  >
                    <div>
                      <span className="text-xs font-bold text-text-primary block">
                        {store.name}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {store.category} (ID: {store.id})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/survey/${store.id}`}
                        target="_blank"
                        className="text-[11px] text-brand hover:underline"
                      >
                        アンケート
                      </Link>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        稼働中
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-border-subtle mt-4 flex gap-2">
              <Link
                href="/admin/qr"
                className="flex-1 py-2 px-3 rounded-xl bg-brand text-white text-xs font-bold text-center pressable shadow-xs"
              >
                QRコードを発行
              </Link>
              <Link
                href="/admin/coupons"
                className="flex-1 py-2 px-3 rounded-xl bg-surface border border-border-default text-text-primary text-xs font-bold text-center pressable hover:bg-surface-secondary shadow-xs"
              >
                お礼クーポン管理
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. Googleビジネスプロフィール集客パフォーマンス分析（参考デモ）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">
                2. Googleマップ集客パフォーマンス分析
              </h2>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                【参考デモ】GBP API連携準備中
              </span>
            </div>
            <p className="text-xs text-text-tertiary">
              Googleビジネスプロフィール公式データ連携による、検索露出と来店行動の連動推移（※公式API接続後に実データへ自動移行）
            </p>
          </div>
          <span className="text-[11px] text-text-tertiary">
            ※Google Contentポリシー（30日保持制約）準拠設計
          </span>
        </div>

        {/* GBP インサイトKPIカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <p className="text-[11px] font-bold text-text-tertiary">月間マップ表示回数（参考）</p>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {currentGbp.monthlyViews.toLocaleString()}
              <span className="text-xs font-normal text-text-secondary ml-1">回</span>
            </p>
            <p className="text-[10px] text-brand font-semibold mt-1">間接検索 {currentGbp.discoverySearchRatio}%</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <p className="text-[11px] font-bold text-text-tertiary">ルート検索（来店ナビ）</p>
            <p className="text-2xl font-bold text-brand mt-1">
              {currentGbp.actions.directionRequests}
              <span className="text-xs font-normal text-text-secondary ml-1">回/月</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">最も来店確度の高い行動</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <p className="text-[11px] font-bold text-text-tertiary">ウェブサイト誘導</p>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {currentGbp.actions.websiteClicks}
              <span className="text-xs font-normal text-text-secondary ml-1">回/月</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">公式サイト予約へ流入</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <p className="text-[11px] font-bold text-text-tertiary">直接通話（電話問い合わせ）</p>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {currentGbp.actions.phoneCalls}
              <span className="text-xs font-normal text-text-secondary ml-1">回/月</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">新規体験・予約の相談</p>
          </div>
        </div>

        {/* 口コミ数とルート検索数の連動相関グラフ */}
        <div className="bg-surface rounded-2xl p-6 border border-border-default shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                口コミ獲得ペースと「ルート検索数（来店）」の相関推移（モデルケース）
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                口コミが蓄積されるほどGoogleマップの露出が向上し、ルート検索（ナビ開始）が急増します。
              </p>
            </div>
            <span className="text-[11px] font-semibold text-brand bg-brand-light px-2.5 py-1 rounded-full shrink-0">
              来店アクション約5.4倍成長モデル
            </span>
          </div>
          <GbpTrendChart trends={currentGbp.trends} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. MEO診断スコア比較（76_meo-score 実診断データ）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              3. MEO診断スコア分析（実診断データ）
            </h2>
            <p className="text-xs text-text-tertiary">
              Googleビジネスプロフィール診断エンジン「76_meo-score」解析結果（診断日: {meoData.diagnosisDate}）
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            両拠点とも最大の改善伸びしろは「口コミ」
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <DiagnosisCard
            storeName="ゴルフコンディショニングスタジオ宇都宮 The蔵ssic"
            store={meoData.stores["classic"] || meoData.stores["golf-a"]}
          />
          <DiagnosisCard
            storeName="SS.GRAND（エスエスグランド スクールオブゴルフ）"
            store={meoData.stores["ss-grand"] || meoData.stores["golf-b"]}
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. 宇都宮ゴルフスタジオ競合分析（評価 × 口コミ数 散布図）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              4. 宇都宮ゴルフスタジオ競合分析（評価 × 口コミ数 散布図）
            </h2>
            <p className="text-xs text-text-tertiary">
              Googleマップ近隣競合実測データ（取得日: {meoData.competitorCheckDate}）
            </p>
          </div>
          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            評価は地域最高・口コミ数だけが2桁不足
          </span>
        </div>

        <div className="bg-surface rounded-2xl p-6 border border-border-default shadow-card">
          <CompetitorScatterChart competitors={meoData.competitors} />

          <div className="mt-6 pt-5 border-t border-border-subtle grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-secondary">
              <p className="font-bold text-text-primary">自社2拠点の現状</p>
              <p className="text-text-secondary mt-1">
                The蔵ssic: <strong>★5.0 (7件)</strong><br />
                SS.GRAND: <strong>★5.0 (1件)</strong><br />
                満足度は最高ですが、件数が少なくマップで埋もれています。
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary">
              <p className="font-bold text-text-primary">近隣上位競合</p>
              <p className="text-text-secondary mt-1">
                雀宮練習場: <strong>4.0 (68件)</strong><br />
                Lounge Range: <strong>4.9 (57件)</strong><br />
                SWING24/7: <strong>4.9 (56件)</strong>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-brand-light border border-brand-border text-brand-text">
              <p className="font-bold">ポチコミ導入後の目標</p>
              <p className="mt-1">
                月20件 × 3ヶ月で<strong>60件超</strong>に到達。評価★5.0を維持したまま宇都宮エリアNo.1のMEO上位表示を獲得します。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  badge,
  highlight,
  isBrand,
}: {
  label: string;
  value: string;
  subtext: string;
  badge?: string;
  highlight?: boolean;
  isBrand?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border shadow-card transition-all ${
        isBrand
          ? "bg-brand text-white border-brand shadow-brand"
          : highlight
          ? "bg-surface border-brand/40"
          : "bg-surface border-border-default"
      }`}
    >
      <div className="flex justify-between items-start gap-1">
        <p className={`text-[11px] font-bold ${isBrand ? "text-white/80" : "text-text-tertiary"}`}>
          {label}
        </p>
        {badge && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isBrand
                ? "bg-white/20 text-white"
                : highlight
                ? "bg-brand-light text-brand"
                : "bg-surface-secondary text-text-secondary"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold mt-2 tracking-tight ${isBrand ? "text-white" : "text-text-primary"}`}>
        {value}
      </p>
      <p className={`text-[10px] mt-1 ${isBrand ? "text-white/75" : "text-text-secondary"}`}>
        {subtext}
      </p>
    </div>
  );
}

function DiagnosisCard({
  storeName,
  store,
}: {
  storeName: string;
  store: (typeof meoData.stores)["golf-a"];
}) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card">
      <div className="flex items-start justify-between border-b border-border-subtle pb-3 mb-4">
        <div>
          <span className="text-[10px] font-bold text-text-tertiary uppercase">店舗診断</span>
          <h3 className="text-base font-bold text-text-primary">{storeName}</h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-brand">{store.totalScore}</span>
          <span className="text-xs text-text-tertiary"> / 100点</span>
          <span className="ml-2 text-xs font-bold bg-surface-secondary px-2 py-0.5 rounded text-text-secondary">
            {store.rank}ランク
          </span>
        </div>
      </div>

      <div className="space-y-2.5 mb-4">
        {store.breakdown.map((item, idx) => {
          const pct = Math.round((item.score / item.max) * 100);
          const isReview = item.category === "口コミ";
          return (
            <div key={idx} className="text-xs">
              <div className="flex justify-between font-semibold mb-1">
                <span className={isReview ? "text-brand font-bold" : "text-text-primary"}>
                  {item.category} {isReview && "(伸びしろ最大)"}
                </span>
                <span className={isReview ? "text-brand font-bold" : "text-text-secondary"}>
                  {item.score} / {item.max}点 ({item.note})
                </span>
              </div>
              <div className="h-2 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
                <div
                  className={`h-full rounded-full transition-all ${
                    isReview ? "bg-brand" : pct > 60 ? "bg-text-secondary" : "bg-text-quaternary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-surface-secondary text-xs">
        <p className="font-bold text-text-primary mb-1">最優先の改善インパクト</p>
        <p className="text-brand font-bold">
          1位: {store.improvements[0].category}（+{store.improvements[0].potential}点の伸びしろ）
        </p>
        <p className="text-text-secondary text-[11px] mt-0.5">
          {store.improvements[0].reason}
        </p>
      </div>
    </div>
  );
}
