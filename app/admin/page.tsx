"use client";

import { useState } from "react";
import Link from "next/link";
import meoData from "@/data/meo-diagnosis.json";
import { CompetitorScatterChart, GbpTrendChart, FunnelChart } from "@/components/admin/MeoCharts";

export default function AdminDashboardPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<"all" | "golf-a" | "golf-b">("all");

  const golfADiagnosis = meoData.stores["golf-a"];
  const golfBDiagnosis = meoData.stores["golf-b"];

  const currentGbp =
    selectedStoreId === "golf-b"
      ? golfBDiagnosis.gbpPerformance
      : golfADiagnosis.gbpPerformance;

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* ページヘッダー ＆ 店舗フィルター */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <span className="inline-block text-[11px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full mb-1">
            商談デモ用ダッシュボード
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">
            MEO分析＆口コミ運用ダッシュボード
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            口コミ獲得の運用成果と、Googleマップ集客・競合比較・MEO診断結果を統合可視化します。
          </p>
        </div>

        {/* 店舗切り替えタブ */}
        <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-subtle shrink-0">
          <button
            onClick={() => setSelectedStoreId("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
              selectedStoreId === "all"
                ? "bg-surface text-brand shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            2拠点合計
          </button>
          <button
            onClick={() => setSelectedStoreId("golf-a")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
              selectedStoreId === "golf-a"
                ? "bg-surface text-brand shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            ゴルフ場A
          </button>
          <button
            onClick={() => setSelectedStoreId("golf-b")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
              selectedStoreId === "golf-b"
                ? "bg-surface text-brand shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            ゴルフ場B
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. 口コミ運用ファネル＆KPIサマリ（ポチコミの直接成果）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              1. 口コミ獲得成果（ポチコミ運用ファネル）
            </h2>
            <p className="text-xs text-text-tertiary">
              来店客のQR読み取りから、AI口コミ生成・Googleマップ投稿画面への遷移率
            </p>
          </div>
          <span className="text-[11px] font-semibold text-text-quaternary bg-surface-secondary px-2 py-0.5 rounded">
            リアルタイム計測中
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <KpiCard
            label="アンケート開始数"
            value="100件"
            subtext="卓上QRコード読み取り"
            badge="入口"
          />
          <KpiCard
            label="口コミ文章作成数"
            value="73件"
            subtext="AIが3案を瞬時作成"
            badge="作成率 73%"
            highlight
          />
          <KpiCard
            label="Googleマップ遷移数"
            value="55件"
            subtext="コピーして投稿画面へ"
            badge="遷移率 55%"
            highlight
          />
          <KpiCard
            label="月間目標達成率"
            value="100%"
            subtext="目標 20件/月 を突破"
            badge="達成"
            isBrand
          />
        </div>

        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">
              アンケート完了・マップ遷移ファネル
            </h3>
            <FunnelChart starts={100} generated={73} clicks={55} />
            <p className="text-[11px] text-text-tertiary mt-3">
              ※アンケートを開始した来店客の半数以上（55%）がGoogleマップの口コミ投稿画面まで到達しています。
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
                運用ステータス
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary">
                  <span className="text-xs font-medium text-text-secondary">ゴルフ場A（本コース）</span>
                  <span className="text-xs font-bold text-brand">運用中 (Active)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary">
                  <span className="text-xs font-medium text-text-secondary">ゴルフ場B（リゾートコース）</span>
                  <span className="text-xs font-bold text-brand">運用中 (Active)</span>
                </div>
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
          2. Googleビジネスプロフィール集客パフォーマンス分析（新要件）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">
                2. Googleマップ集客パフォーマンス分析
              </h2>
              <span className="text-[10px] font-bold text-brand bg-brand-light px-2 py-0.5 rounded-full">
                連携機能デモ
              </span>
            </div>
            <p className="text-xs text-text-tertiary">
              Googleビジネスプロフィール公式データ連携（口コミ増加に伴う検索露出と来店アクションの連動）
            </p>
          </div>
          <span className="text-[11px] text-text-tertiary">
            ※受注後にGBP APIと完全自動連携
          </span>
        </div>

        {/* GBP インサイトKPIカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-surface rounded-2xl p-4 border border-border-default shadow-card">
            <p className="text-[11px] font-bold text-text-tertiary">月間マップ表示回数</p>
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
            <p className="text-[11px] font-bold text-text-tertiary">直接通話（電話予約）</p>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {currentGbp.actions.phoneCalls}
              <span className="text-xs font-normal text-text-secondary ml-1">回/月</span>
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">新規体験の問い合わせ</p>
          </div>
        </div>

        {/* 口コミ数とルート検索数の連動相関グラフ */}
        <div className="bg-surface rounded-2xl p-6 border border-border-default shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                口コミ獲得ペースと「ルート検索数（来店）」の相関推移
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                口コミが蓄積されるほどGoogleアルゴリズムの評価が上がり、ルート検索（来店ナビ開始）が急増します。
              </p>
            </div>
            <span className="text-[11px] font-semibold text-brand bg-brand-light px-2.5 py-1 rounded-full shrink-0">
              来店アクション約5.4倍に成長
            </span>
          </div>
          <GbpTrendChart trends={currentGbp.trends} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. MEO診断スコア比較（76_MEO診断くん 2026-07-27実データ）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              3. MEO診断スコア分析（2拠点並列比較）
            </h2>
            <p className="text-xs text-text-tertiary">
              Googleビジネスプロフィール診断エンジン「76_meo-score」解析結果（診断日: {meoData.diagnosisDate}）
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            2店舗とも伸びしろ1位が「口コミ」で一致
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* ゴルフ場A */}
          <DiagnosisCard store={golfADiagnosis} />

          {/* ゴルフ場B */}
          <DiagnosisCard store={golfBDiagnosis} />
        </div>

        {/* 2店舗一致のインサイト訴求 */}
        <div className="p-4 rounded-2xl bg-brand-light border border-brand-border">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              !
            </span>
            <div className="text-xs leading-relaxed text-brand-text">
              <p className="font-bold text-sm mb-0.5">
                商談ポイント：自社2拠点共通で「口コミ」が最大の改善インパクト（+21.2点 / +29.5点）
              </p>
              ゴルフ場A・ゴルフ場Bの2拠点とも、写真や基本情報は高評価である一方、「口コミ件数と具体性」がボトルネックとなって総合スコアがCランクに留まっています。
              ポチコミを導入して月間20件ペースの高品質口コミを蓄積することで、両拠点とも一気に<strong>Aランク（75点以上・MEO上位表示圏）</strong>へ到達できます。
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. 近隣ゴルフ場競合分析（評価 × 口コミ数 散布図）
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              4. 近隣ゴルフ場競合分析（評価 × 口コミ数 散布図）
            </h2>
            <p className="text-xs text-text-tertiary">
              Googleマップ近隣競合実測データ（取得日: {meoData.competitorCheckDate}）
            </p>
          </div>
          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            評価は競合最高・口コミ数だけが2桁不足
          </span>
        </div>

        <div className="bg-surface rounded-2xl p-6 border border-border-default shadow-card">
          <CompetitorScatterChart competitors={meoData.competitors} />

          <div className="mt-6 pt-5 border-t border-border-subtle grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-secondary">
              <p className="font-bold text-text-primary">自社2拠点の現状</p>
              <p className="text-text-secondary mt-1">
                ゴルフ場A: <strong>★5.0 (7件)</strong><br />
                ゴルフ場B: <strong>★5.0 (1件)</strong><br />
                満足度は最高ですが、件数が少なくマップで埋もれています。
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary">
              <p className="font-bold text-text-primary">近隣上位競合</p>
              <p className="text-text-secondary mt-1">
                競合Cゴルフ場: <strong>4.0 (68件)</strong><br />
                競合Aゴルフ倶楽部: <strong>4.9 (57件)</strong><br />
                競合Bカントリークラブ: <strong>4.9 (56件)</strong>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-brand-light border border-brand-border text-brand-text">
              <p className="font-bold">ポチコミ導入後の目標</p>
              <p className="mt-1">
                月20件 × 3ヶ月で<strong>60件超</strong>に到達。高評価を維持したまま地域No.1のMEO上位表示を獲得します。
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
  store,
}: {
  store: (typeof meoData.stores)["golf-a"];
}) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border-default shadow-card">
      <div className="flex items-start justify-between border-b border-border-subtle pb-3 mb-4">
        <div>
          <span className="text-[10px] font-bold text-text-tertiary uppercase">店舗診断</span>
          <h3 className="text-base font-bold text-text-primary">{store.shortName}</h3>
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
