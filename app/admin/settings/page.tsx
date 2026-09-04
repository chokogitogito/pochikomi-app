"use client";

import { useState } from "react";
import Link from "next/link";

interface StoreSetting {
  id: string;
  name: string;
  placeId: string;
  reviewUrl: string;
  isConnected: boolean;
  lastSyncedAt: string;
}

const INITIAL_STORES: StoreSetting[] = [
  {
    id: "classic",
    name: "ゴルフコンディショニングスタジオ宇都宮 The蔵ssic",
    placeId: "ChIJq6cE-5BnH2ARkt6391zxpfE",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJq6cE-5BnH2ARkt6391zxpfE",
    isConnected: true,
    lastSyncedAt: "2026-09-04 09:30",
  },
  {
    id: "ss-grand",
    name: "SS.GRAND（エスエスグランド スクールオブゴルフ）",
    placeId: "ChIJS4v-189cH2ARWAD0JxG0qb8",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJS4v-189cH2ARWAD0JxG0qb8",
    isConnected: true,
    lastSyncedAt: "2026-09-04 09:30",
  },
];

export default function AdminSettingsPage() {
  const [stores, setStores] = useState<StoreSetting[]>(INITIAL_STORES);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("classic");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  const handleSyncNow = () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setStores((prev) =>
        prev.map((s) =>
          s.id === selectedStoreId
            ? { ...s, lastSyncedAt: "2026-09-04 14:25（最新）" }
            : s
        )
      );
      setTimeout(() => setSyncSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* ページヘッダー */}
      <div className="border-b border-border-default pb-5">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/admin"
            className="text-xs font-bold text-text-tertiary hover:text-brand transition-colors"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-[11px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full mb-1">
              Google Business Profile API連携
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">
              Googleビジネスプロフィール連携設定
            </h1>
            <p className="text-text-secondary text-xs md:text-sm mt-1">
              店舗のGoogleアカウントと連携し、検索数・閲覧数・ルート案内・口コミデータを自動同期します。
            </p>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-hover pressable transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isSyncing ? "データ同期間中..." : "今すぐGoogle同期"}</span>
          </button>
        </div>

        {syncSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Googleビジネスプロフィールから最新のパフォーマンスデータを正常に取得・更新しました。
          </div>
        )}
      </div>

      {/* 店舗切り替えタブ */}
      <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-subtle w-fit">
        {stores.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStoreId(s.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold pressable transition-all ${
              selectedStoreId === s.id
                ? "bg-surface text-brand shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {s.name.includes("The蔵ssic") ? "The蔵ssic" : "SS.GRAND"}
          </button>
        ))}
      </div>

      {/* 1. Googleアカウント接続ステータス */}
      <div className="bg-surface rounded-2xl p-6 border border-border-default shadow-card space-y-5">
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              1. Googleアカウント接続状態
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              GBP管理権限を持つGoogleアカウントとのOAuth認証状況
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            連携済み (Connected)
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-secondary">
            <span className="text-text-tertiary block mb-1">連携アカウント</span>
            <span className="font-bold text-text-primary">sakai@the-classic-golf.jp</span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-secondary">
            <span className="text-text-tertiary block mb-1">最終同期日時</span>
            <span className="font-bold text-text-primary">{selectedStore.lastSyncedAt}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-secondary">
            <span className="text-text-tertiary block mb-1">同期ステータス</span>
            <span className="font-bold text-emerald-600">正常稼働中 (日次自動同期)</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={() => alert("Googleアカウント認証画面へリダイレクトします（デモ動作）")}
            className="px-4 py-2 rounded-xl bg-surface border border-border-default text-xs font-bold text-text-primary hover:bg-surface-secondary pressable transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/>
            </svg>
            Googleアカウントを再認証する
          </button>
          <button
            onClick={() => alert("連携解除の確認ダイアログです（デモ動作）")}
            className="px-4 py-2 rounded-xl bg-surface border border-border-default text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 pressable transition-all"
          >
            連携を解除する
          </button>
        </div>
      </div>

      {/* 2. ロケーション・Place ID 設定 */}
      <div className="bg-surface rounded-2xl p-6 border border-border-default shadow-card space-y-5">
        <div className="border-b border-border-subtle pb-4">
          <h2 className="text-sm font-bold text-text-primary">
            2. 対象ロケーション（店舗）設定
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Googleマップ上に登録されている対象店舗のPlace IDおよび口コミURL
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Google登録ビジネス名
            </label>
            <input
              type="text"
              readOnly
              value={selectedStore.name}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-xs text-text-primary font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Google Place ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={selectedStore.placeId}
                className="flex-1 font-mono px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-xs text-text-primary focus:outline-none"
              />
              <button
                onClick={() => alert("Google Place IDの存在確認・疎通チェックに成功しました（200 OK）")}
                className="px-4 py-2.5 rounded-xl bg-brand-light text-brand text-xs font-bold pressable hover:bg-brand/15 transition-all"
              >
                ID検証
              </button>
            </div>
            <p className="text-[11px] text-text-tertiary mt-1">
              ※ Place IDにより、Googleマップ上の口コミ投稿URLおよび閲覧統計データと自動紐付けされます。
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              直接口コミ投稿URL（ポチコミ最終遷移先）
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={selectedStore.reviewUrl}
                className="flex-1 font-mono text-[11px] px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-text-secondary focus:outline-none truncate"
              />
              <a
                href={selectedStore.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-surface border border-border-default text-xs font-bold text-text-primary hover:bg-surface-secondary pressable transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>確認</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. クライアント案内用：導入ステップ解説 */}
      <div className="p-5 rounded-2xl bg-brand-light border border-brand-border space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
          <span>💡</span> クライアント新規導入時の設定手順
        </h3>
        <div className="grid sm:grid-cols-3 gap-3 text-xs leading-relaxed text-brand-text">
          <div className="p-3 rounded-xl bg-surface/70 border border-brand-border/40">
            <span className="font-bold text-brand block mb-0.5">ステップ 1</span>
            Googleアカウント認証ボタンを押して、店舗のGoogleビジネスプロフィール権限を承認します。
          </div>
          <div className="p-3 rounded-xl bg-surface/70 border border-brand-border/40">
            <span className="font-bold text-brand block mb-0.5">ステップ 2</span>
            管理対象の店舗（ロケーション）を選択すると、Place IDと口コミURLが自動セットされます。
          </div>
          <div className="p-3 rounded-xl bg-surface/70 border border-brand-border/40">
            <span className="font-bold text-brand block mb-0.5">ステップ 3</span>
            直近の閲覧数・検索数・口コミ推移がダッシュボードへ自動でインポートされ、運用開始となります。
          </div>
        </div>
      </div>
    </div>
  );
}
