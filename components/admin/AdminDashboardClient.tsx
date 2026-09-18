"use client";

import { useState } from "react";
import Link from "next/link";
import meoData from "@/data/meo-diagnosis.json";
import { CompetitorScatterChart, GbpTrendChart, FunnelChart } from "@/components/admin/MeoCharts";
import type { Store, StoreMetrics, FunnelMetricsSummary } from "@/lib/types";

interface AdminDashboardClientProps {
  stores: Store[];
  metricsMap: Record<string, StoreMetrics>;
  totalMetrics: StoreMetrics;
  isDemoUser?: boolean;
  totalUnrepliedCount?: number;
  unrepliedCounts?: Record<string, number>;
  funnelComparison?: {
    totalSummary?: FunnelMetricsSummary;
    locationSummaries?: FunnelMetricsSummary[];
  };
}

export default function AdminDashboardClient({
  stores,
  metricsMap,
  totalMetrics,
  isDemoUser = false,
  totalUnrepliedCount = 0,
  unrepliedCounts = {},
  funnelComparison,
}: AdminDashboardClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");

  const activeUnrepliedCount =
    selectedStoreId === "all"
      ? totalUnrepliedCount
      : unrepliedCounts[selectedStoreId] || 0;

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

  // 単一店舗を選んでいる間は「クライアント表示モード」。
  // 他店舗の実績・ステータス・競合は一切描画しない（商談で店舗に画面を見せるため）。
  const isClientView = selectedStoreId !== "all";

  // 選択店舗のMEO診断データ。slug揺れ（classic/golf-a等）を吸収する。
  const diagnosisAliases: Record<string, string> = {
    classic: "classic",
    "golf-a": "classic",
    "ss-grand": "ss-grand",
    "golf-b": "ss-grand",
    hookaalab: "hookaalab",
  };
  type DiagnosisStore = (typeof meoData.stores)["classic"];
  const diagnosisStores = meoData.stores as unknown as Record<string, DiagnosisStore | undefined>;

  const resolveDiagnosis = (storeId: string): DiagnosisStore | undefined =>
    diagnosisStores[diagnosisAliases[storeId] ?? storeId];

  // 表示対象の診断カード（全拠点合計なら管理下の全店舗、単一選択ならその店舗のみ）
  const diagnosisTargets = (isClientView ? stores.filter((s) => s.id === selectedStoreId) : stores)
    .map((s) => ({ store: s, diagnosis: resolveDiagnosis(s.id) }))
    .filter((x): x is { store: Store; diagnosis: DiagnosisStore } => Boolean(x.diagnosis));

  // GBPパフォーマンス／競合は選択店舗のものだけを使う。
  // クライアント表示モードで診断データが無い店舗は、他店舗へフォールバックさせない
  // （フォールバックすると別クライアントの数値が競合欄に出てしまうため）。
  const selectedDiagnosis = isClientView ? resolveDiagnosis(selectedStoreId) : undefined;
  const fallbackDiagnosis = diagnosisStores["classic"] ?? diagnosisStores["golf-a"];
  const gbpSource = isClientView ? selectedDiagnosis : fallbackDiagnosis;
  const currentGbp = gbpSource?.gbpPerformance;
  const gbpIsPlaceholder =
    (gbpSource as { gbpProvenance?: string } | undefined)?.gbpProvenance === "placeholder";

  const competitorSource = gbpSource;
  const competitors = competitorSource?.competitors ?? [];
  const ownCompetitors = competitors.filter((c) => c.isOwn);
  const rivalCompetitors = competitors.filter((c) => !c.isOwn);
  const topRivals = [...rivalCompetitors].sort((a, b) => b.reviews - a.reviews).slice(0, 3);

  // 表示中の店舗群で最も伸びしろが大きいカテゴリ（旧「両拠点とも〜口コミ」の固定文言を動的化）
  const topImprovementCategory = (() => {
    const counts = new Map<string, number>();
    for (const { diagnosis } of diagnosisTargets) {
      const top = diagnosis.improvements?.[0]?.category;
      if (top) counts.set(top, (counts.get(top) || 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [cat, n] of counts) {
      if (n > bestCount) {
        best = cat;
        bestCount = n;
      }
    }
    return best && bestCount === diagnosisTargets.length ? best : null;
  })();

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

        {/* 店舗切り替え（店舗数が増えても幅が変わらないドロップダウン方式） */}
        <div className="shrink-0 w-full sm:w-72">
          <label
            htmlFor="store-selector"
            className="block text-[11px] font-bold text-text-tertiary mb-1"
          >
            表示する店舗
          </label>
          <select
            id="store-selector"
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm font-bold text-text-primary shadow-xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">全拠点合計（{stores.length}店舗・運営者のみ）</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.shortName || store.name}
              </option>
            ))}
          </select>
          <p
            className={`mt-1.5 text-[11px] font-bold flex items-center gap-1 ${
              isClientView ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isClientView ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isClientView
              ? "クライアント表示モード：この店舗の情報のみ表示中"
              : "運営者モード：全店舗の情報が表示されます"}
          </p>
        </div>
      </div>

      {/* 運営者モードの注意喚起（店舗に画面を見せる前の誤操作防止） */}
      {!isClientView && stores.length > 1 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] text-amber-900 flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>
            現在は<strong>全店舗の実績・競合・店舗一覧が表示されています</strong>。
            特定の店舗様に画面をお見せする際は、上の「表示する店舗」からその店舗を選択してください。
          </span>
        </div>
      )}

      {/* 未返信口コミアラートカード */}
      {activeUnrepliedCount > 0 && (
        <div className="bg-brand-light border border-brand/20 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-text-primary">
                  未返信の口コミが <span className="text-brand font-extrabold text-base md:text-lg">{activeUnrepliedCount}</span> 件あります
                </h3>
                <span className="text-[10px] font-bold text-brand uppercase bg-surface px-2 py-0.5 rounded-full border border-brand/20">
                  要対応
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                AI返信下書きを3案自動生成し、Googleマップへすばやく丁寧な返信を投稿できます。
              </p>
            </div>
          </div>
          <Link
            href={selectedStoreId === "all" ? "/admin/reviews" : `/admin/reviews?storeId=${selectedStoreId}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-dark transition-all pressable shrink-0 self-start sm:self-center"
          >
            <span>口コミ返信を開く</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. 口コミ獲得成果（ポチコミ運用ファネル：実データ計測）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">
                1. 口コミ獲得成果（ポチコミ運用実績）
              </h2>
              <ProvenanceBadge provenance="live" label="実測データ (live)" />
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              来店客の卓上QR読み取りから、AI口コミ文章生成・Googleマップ投稿画面への遷移実績
            </p>
          </div>
          <span className="text-[11px] font-semibold text-brand bg-brand-light px-2.5 py-0.5 rounded-full self-start sm:self-auto">
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
                {isClientView ? "店舗ステータス" : "管理店舗ステータス"}
              </h3>
              <div className="space-y-2.5">
                {(isClientView ? stores.filter((s) => s.id === selectedStoreId) : stores).map((store) => (
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

        {/* 多店舗ファネル実績比較テーブル（他店舗が写るため運営者モード限定） */}
        {!isClientView && funnelComparison && funnelComparison.locationSummaries && funnelComparison.locationSummaries.length > 0 && (
          <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  拠点別ファネル転換率比較（多店舗集約）
                </h3>
                <p className="text-[11px] text-text-tertiary">
                  全店舗合算および拠点ごとのアンケート開始・口コミ作成・Google遷移・クーポン発行実績
                </p>
              </div>
              <ProvenanceBadge provenance="live" label="実測集計" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border-subtle text-text-tertiary">
                    <th className="py-2.5 px-3 font-bold">店舗 / 拠点</th>
                    <th className="py-2.5 px-2 text-right font-bold">開始数</th>
                    <th className="py-2.5 px-2 text-right font-bold">AI作成数</th>
                    <th className="py-2.5 px-2 text-right font-bold">作成率</th>
                    <th className="py-2.5 px-2 text-right font-bold">マップ遷移</th>
                    <th className="py-2.5 px-2 text-right font-bold">遷移率</th>
                    <th className="py-2.5 px-2 text-right font-bold">クーポン発行</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {funnelComparison.totalSummary && (
                    <tr className="bg-surface-secondary/70 font-bold">
                      <td className="py-2.5 px-3 text-text-primary">全店舗合算 (Total)</td>
                      <td className="py-2.5 px-2 text-right">{funnelComparison.totalSummary.surveyStarts}件</td>
                      <td className="py-2.5 px-2 text-right">{funnelComparison.totalSummary.generatedReviews}件</td>
                      <td className="py-2.5 px-2 text-right text-brand">{funnelComparison.totalSummary.generationRate}%</td>
                      <td className="py-2.5 px-2 text-right">{funnelComparison.totalSummary.reviewClicks}件</td>
                      <td className="py-2.5 px-2 text-right text-brand">{funnelComparison.totalSummary.clickRate}%</td>
                      <td className="py-2.5 px-2 text-right">{funnelComparison.totalSummary.couponsIssued}件</td>
                    </tr>
                  )}
                  {funnelComparison.locationSummaries.map((loc) => (
                    <tr key={loc.locationId || loc.storeSlug} className="hover:bg-surface-secondary/40">
                      <td className="py-2.5 px-3 text-text-primary font-medium">{loc.storeName || loc.storeSlug}</td>
                      <td className="py-2.5 px-2 text-right">{loc.surveyStarts}件</td>
                      <td className="py-2.5 px-2 text-right">{loc.generatedReviews}件</td>
                      <td className="py-2.5 px-2 text-right text-brand font-semibold">{loc.generationRate}%</td>
                      <td className="py-2.5 px-2 text-right">{loc.reviewClicks}件</td>
                      <td className="py-2.5 px-2 text-right text-brand font-semibold">{loc.clickRate}%</td>
                      <td className="py-2.5 px-2 text-right">{loc.couponsIssued}件</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. Googleビジネスプロフィール集客パフォーマンス分析（参考デモ・推計モデル）
          ※データが無い店舗では他店舗へフォールバックさせず非表示にする
      ───────────────────────────────────────────────────────────── */}
      {currentGbp && (
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">
                2. Googleマップ集客パフォーマンス分析
              </h2>
              <ProvenanceBadge provenance="demo" label="参考デモ (demo)" />
              <ProvenanceBadge provenance="estimated" label="推計モデル (estimated)" />
              {gbpIsPlaceholder && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  GBP未接続・仮数値
                </span>
              )}
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              ※Google Business Profile API審査待ちのため、以下はシミュレーション用モデル値です（審査通過後に実APIデータへ自動切替）。
            </p>
            {gbpIsPlaceholder && (
              <p className="text-[11px] text-rose-700 mt-1 font-semibold">
                ※この店舗はGBP未接続のため、下記の数値は<strong>実測値ではなく仮の参考値</strong>です。接続後に実データへ置き換わります。
              </p>
            )}
          </div>
          <span className="text-[11px] text-text-tertiary">
            ※Google Contentポリシー（30日保持制約）準拠設計
          </span>
        </div>

        {/* GBP インサイトKPIカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-text-tertiary">月間マップ表示回数</p>
              <ProvenanceBadge provenance="demo" label="demo" />
            </div>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {currentGbp.monthlyViews.toLocaleString()}
              <span className="text-xs font-normal text-text-secondary ml-1">回</span>
            </p>
            <p className="text-[10px] text-text-tertiary font-medium mt-1">間接検索比率 {currentGbp.discoverySearchRatio}% (参考値)</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-text-tertiary">ルート検索（来店ナビ）</p>
              <ProvenanceBadge provenance="demo" label="demo" />
            </div>
            <p className="text-2xl font-bold text-brand mt-1">
              {currentGbp.actions.directionRequests}
              <span className="text-xs font-normal text-text-secondary ml-1">回/月</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">最も来店確度の高い行動 (参考値)</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-text-tertiary">ウェブサイト誘導</p>
              <ProvenanceBadge provenance="demo" label="demo" />
            </div>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {currentGbp.actions.websiteClicks}
              <span className="text-xs font-normal text-text-secondary ml-1">回/月</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">公式サイト予約へ流入 (参考値)</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-text-tertiary">直接通話（電話問い合わせ）</p>
              <ProvenanceBadge provenance="demo" label="demo" />
            </div>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {currentGbp.actions.phoneCalls}
              <span className="text-xs font-normal text-text-secondary ml-1">回/月</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">新規体験・予約相談 (参考値)</p>
          </div>
        </div>

        {/* 口コミ数とルート検索数の推移シミュレーション（参考仮説モデル） */}
        <div className="bg-surface rounded-2xl p-6 border border-border-default shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary">
                  口コミ獲得ペースとルート検索数の推移シミュレーション（参考仮説モデル）
                </h3>
                <ProvenanceBadge provenance="estimated" label="推計モデル" />
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                ※過去実績に基づく仮説シミュレーションです。実際の集客数値はGoogle公式API承認後に実データ同期されます。
              </p>
            </div>
            <span className="text-[11px] font-semibold text-text-secondary bg-surface-secondary border border-border-subtle px-2.5 py-1 rounded-full shrink-0">
              参考仮説モデルケース
            </span>
          </div>
          <GbpTrendChart trends={currentGbp.trends} />
        </div>
      </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MEO診断スコア比較（76_meo-score 実診断データ）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">
                3. MEO診断スコア分析（実診断データ）
              </h2>
              <ProvenanceBadge provenance="manual" label="外部診断取込 (manual)" />
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              Googleビジネスプロフィール診断エンジン「76_meo-score」解析結果
              {diagnosisTargets.length === 1 && `（診断日: ${diagnosisTargets[0].diagnosis.diagnosisDate}）`}
            </p>
          </div>
          {topImprovementCategory && (
            <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              {diagnosisTargets.length > 1 ? "全拠点とも" : ""}最大の改善伸びしろは「{topImprovementCategory}」
            </div>
          )}
        </div>

        {diagnosisTargets.length > 0 ? (
          <div className={`grid gap-5 ${diagnosisTargets.length > 1 ? "md:grid-cols-2" : ""}`}>
            {diagnosisTargets.map(({ store, diagnosis }) => (
              <DiagnosisCard key={store.id} storeName={store.name} store={diagnosis} />
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card text-xs text-text-secondary">
            この店舗のMEO診断データは未取得です。診断エンジン「76_meo-score」で診断すると、ここにスコアと改善優先順位が表示されます。
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. 競合分析（評価 × 口コミ数 散布図）
          ※市場が店舗ごとに異なるため、データが無い店舗では非表示にする
      ───────────────────────────────────────────────────────────── */}
      {competitors.length > 0 && (
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">
                4. 競合分析（評価 × 口コミ数 散布図）
              </h2>
              <ProvenanceBadge provenance="manual" label="実地観測 (manual)" />
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              Googleマップ近隣競合実測データ
              {competitorSource?.marketLabel ? `／${competitorSource.marketLabel}` : ""}
              （取得日: {competitorSource?.competitorCheckDate}）
            </p>
          </div>
          {ownCompetitors.length > 0 && rivalCompetitors.length > 0 && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {(() => {
                const ownBest = Math.max(...ownCompetitors.map((c) => c.rating));
                const rivalBest = Math.max(...rivalCompetitors.map((c) => c.rating));
                const ownMaxReviews = Math.max(...ownCompetitors.map((c) => c.reviews));
                const rivalMedian = [...rivalCompetitors].sort((a, b) => a.reviews - b.reviews)[
                  Math.floor(rivalCompetitors.length / 2)
                ].reviews;
                const gap = ownMaxReviews > 0 ? Math.round(rivalMedian / ownMaxReviews) : 0;
                if (ownBest >= rivalBest && gap >= 5) {
                  return `評価は地域最高・口コミ数だけが約${gap}分の1`;
                }
                return "評価 × 口コミ数の市場ポジション";
              })()}
            </span>
          )}
        </div>

        <div className="bg-surface rounded-2xl p-6 border border-border-default shadow-card">
          <CompetitorScatterChart competitors={competitors} />

          <div className="mt-6 pt-5 border-t border-border-subtle grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-secondary">
              <p className="font-bold text-text-primary">
                {ownCompetitors.length > 1 ? `自社${ownCompetitors.length}拠点の現状` : "現状"}
              </p>
              <p className="text-text-secondary mt-1">
                {ownCompetitors.map((c) => (
                  <span key={c.name}>
                    {c.name.replace("（自社）", "")}: <strong>★{c.rating.toFixed(1)} ({c.reviews}件)</strong>
                    <br />
                  </span>
                ))}
                満足度は最高水準ですが、件数が少なくマップで埋もれています。
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary">
              <p className="font-bold text-text-primary">近隣上位競合</p>
              <p className="text-text-secondary mt-1">
                {topRivals.map((c) => (
                  <span key={c.name}>
                    {c.name}: <strong>★{c.rating.toFixed(1)} ({c.reviews}件)</strong>
                    <br />
                  </span>
                ))}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-brand-light border border-brand-border text-brand-text">
              <p className="font-bold">ポチコミ導入後の目標</p>
              <p className="mt-1">
                {(() => {
                  const goal = selectedStore?.monthlyGoal || 20;
                  const base = ownCompetitors.length === 1 ? ownCompetitors[0].reviews : 0;
                  return (
                    <>
                      月{goal}件 × 3ヶ月で<strong>{base + goal * 3}件超</strong>に到達。
                      評価を維持したまま、地域エリア上位のMEO表示を狙います。
                    </>
                  );
                })()}
              </p>
            </div>
          </div>
        </div>
      </section>
      )}
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

export function ProvenanceBadge({
  provenance,
  label,
}: {
  provenance: "live" | "manual" | "fixture" | "demo" | "estimated" | "unavailable";
  label?: string;
}) {
  const styles: Record<string, string> = {
    live: "bg-emerald-50 text-emerald-700 border-emerald-200",
    manual: "bg-blue-50 text-blue-700 border-blue-200",
    fixture: "bg-purple-50 text-purple-700 border-purple-200",
    demo: "bg-amber-50 text-amber-800 border-amber-200",
    estimated: "bg-indigo-50 text-indigo-700 border-indigo-200",
    unavailable: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const defaultLabels: Record<string, string> = {
    live: "実測 (live)",
    manual: "手動 (manual)",
    fixture: "テスト用 (fixture)",
    demo: "参考デモ (demo)",
    estimated: "推計 (estimated)",
    unavailable: "未取得 (unavailable)",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
        styles[provenance] || styles.unavailable
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          provenance === "live"
            ? "bg-emerald-500"
            : provenance === "demo"
            ? "bg-amber-500"
            : provenance === "manual"
            ? "bg-blue-500"
            : "bg-gray-400"
        }`}
      />
      <span>{label || defaultLabels[provenance]}</span>
    </span>
  );
}

