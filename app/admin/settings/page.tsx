"use client";

import { useState } from "react";
import Link from "next/link";
import type { GbpConnectionStatus } from "@/lib/types";

interface StoreSetting {
  id: string;
  name: string;
  placeId: string;
  reviewUrl: string;
  connectionStatus: GbpConnectionStatus;
  lastSyncedAt: string;
}

const INITIAL_STORES: StoreSetting[] = [
  {
    id: "classic",
    name: "ゴルフコンディショニングスタジオ宇都宮 The蔵ssic",
    placeId: "ChIJq6cE-5BnH2ARkt6391zxpfE",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJq6cE-5BnH2ARkt6391zxpfE",
    connectionStatus: "pending_approval",
    lastSyncedAt: "未連携（API審査待ち）",
  },
  {
    id: "ss-grand",
    name: "SS.GRAND（エスエスグランド スクールオブゴルフ）",
    placeId: "ChIJS4v-189cH2ARWAD0JxG0qb8",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJS4v-189cH2ARWAD0JxG0qb8",
    connectionStatus: "pending_approval",
    lastSyncedAt: "未連携（API審査待ち）",
  },
];

export default function AdminSettingsPage() {
  const [stores] = useState<StoreSetting[]>(INITIAL_STORES);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("classic");

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

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
            <span className="inline-block text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-1">
              Google Business Profile API: 審査結果待ち
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">
              Googleビジネスプロフィール連携設定
            </h1>
            <p className="text-text-secondary text-xs md:text-sm mt-1">
              Google公式APIとの連携状態を確認します。現在はAPI審査結果待ちのため自動同期・OAuth接続は無効化されています。
            </p>
          </div>

          <button
            disabled
            title="GBP API審査待ちのため同期は実行できません"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-surface-secondary text-text-tertiary border border-border-default text-xs font-bold shadow-xs cursor-not-allowed flex items-center gap-2 shrink-0 opacity-70"
          >
            <svg
              className="w-4 h-4 text-text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>同期停止中（審査待ち）</span>
          </button>
        </div>

        {/* 審査待ちアナウンスバナー */}
        <div className="mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <svg className="w-4 h-4 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Google API審査待ち・現在利用不可</span>
          </div>
          <p className="text-amber-800 text-[11px]">
            Google Business Profile APIへの本番アクセスは審査通過後に有効化されます。現在は誤接続を防ぐため、OAuth開始・トークン保存・直接同期を遮断（fail closed）しています。口コミ返信は「手動取り込み」機能で安全に下書き生成・コピー運用が可能です。
          </p>
        </div>
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
              Google Business Profile APIとの認可・接続状況
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            審査待ち (pending_approval)
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-secondary">
            <span className="text-text-tertiary block mb-1">連携アカウント</span>
            <span className="font-bold text-text-secondary">未接続（API審査待ち）</span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-secondary">
            <span className="text-text-tertiary block mb-1">最終同期日時</span>
            <span className="font-bold text-text-secondary">{selectedStore.lastSyncedAt}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-secondary">
            <span className="text-text-tertiary block mb-1">同期ステータス</span>
            <span className="font-bold text-amber-700">機能無効（審査通過後に有効化）</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            disabled
            className="px-4 py-2 rounded-xl bg-surface-secondary border border-border-default text-xs font-bold text-text-tertiary cursor-not-allowed flex items-center gap-2 opacity-60"
          >
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/>
            </svg>
            Googleアカウント連携（審査完了後に利用可能）
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
            Googleマップ上に登録されている対象店舗のPlace IDおよび口コミURL（アンケート後の実遷移先）
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
            </div>
            <p className="text-[11px] text-text-tertiary mt-1">
              ※ Place IDにより、Googleマップ上の口コミ投稿URL（同一導線）へ来店客を案内します。
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              直接口コミ投稿URL（ポチコミ最終遷移先・全星同一導線）
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
    </div>
  );
}
