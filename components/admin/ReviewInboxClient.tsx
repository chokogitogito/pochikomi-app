"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ReviewInboxItem, ReviewDraftItem } from "@/lib/repositories/review-repository";
import { ReviewReplyCard } from "@/components/admin/ReviewReplyCard";
import { ManualReviewImportForm } from "@/components/admin/ManualReviewImportForm";
import type { Store } from "@/lib/types";

interface ReviewInboxClientProps {
  stores: Store[];
  initialStoreId: string;
  initialReviews?: ReviewInboxItem[];
  initialUnrepliedCount?: number;
}

export default function ReviewInboxClient({
  stores,
  initialStoreId,
  initialReviews = [],
  initialUnrepliedCount = 0,
}: ReviewInboxClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId);
  const [reviews, setReviews] = useState<ReviewInboxItem[]>(initialReviews);
  const [unrepliedCount, setUnrepliedCount] = useState(initialUnrepliedCount);
  const [ngWords, setNgWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "unreplied" | "drafted" | "replied">("unreplied");
  const [starFilter, setStarFilter] = useState<"all" | "high" | "mid" | "low">("all");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSyncingFixture, setIsSyncingFixture] = useState(false);

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  // 口コミ一覧および返信設定の取得
  const loadReviews = useCallback(async (storeId: string) => {
    setIsLoading(true);
    try {
      const [reviewRes, settingsRes] = await Promise.all([
        fetch(`/api/reviews?storeId=${storeId}`),
        fetch(`/api/reviews/settings?storeId=${storeId}`),
      ]);
      const data = await reviewRes.json();
      if (reviewRes.ok && data.success) {
        setReviews(data.reviews || []);
        setUnrepliedCount(data.unrepliedCount || 0);
      } else {
        console.error("口コミ一覧の取得失敗:", data.error);
      }

      if (settingsRes.ok) {
        const setJson = await settingsRes.json();
        setNgWords(setJson.settings?.ngWords || []);
      }
    } catch (err) {
      console.error("口コミ一覧の取得エラー:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStoreChange = (newStoreId: string) => {
    setSelectedStoreId(newStoreId);
    loadReviews(newStoreId);
  };

  // ステータス更新
  const handleStatusChange = async (
    reviewRefHash: string,
    newStatus: "replied" | "ignored" | "unreplied"
  ) => {
    try {
      const res = await fetch(`/api/reviews/${reviewRefHash}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: selectedStoreId, status: newStatus }),
      });
      if (res.ok) {
        await loadReviews(selectedStoreId);
      } else {
        const err = await res.json();
        alert(err.error || "ステータスの更新に失敗しました");
      }
    } catch (err) {
      console.error("ステータス更新エラー:", err);
    }
  };

  // AI返信下書き生成
  const handleGenerateDrafts = async (reviewRefHash: string): Promise<ReviewDraftItem[]> => {
    const res = await fetch(`/api/reviews/${reviewRefHash}/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: selectedStoreId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "下書き生成に失敗しました");
    }
    return data.drafts || [];
  };

  // テスト用fixture口コミの同期
  const handleSyncFixture = async () => {
    setIsSyncingFixture(true);
    try {
      const res = await fetch("/api/reviews/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: selectedStoreId, source: "fixture" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "テスト口コミを取り込みました");
        await loadReviews(selectedStoreId);
      } else {
        alert(data.error || "同期に失敗しました");
      }
    } catch (err) {
      console.error("fixture同期エラー:", err);
    } finally {
      setIsSyncingFixture(false);
    }
  };

  // フィルタリング処理
  const filteredReviews = reviews.filter((item) => {
    // ステータスフィルター
    if (statusFilter === "unreplied" && item.status !== "unreplied" && item.status !== "drafted") {
      return false;
    }
    if (statusFilter === "drafted" && item.status !== "drafted") {
      return false;
    }
    if (statusFilter === "replied" && item.status !== "replied") {
      return false;
    }

    // 星フィルター
    if (starFilter === "high" && (item.starRating || 0) < 4) return false;
    if (starFilter === "mid" && item.starRating !== 3) return false;
    if (starFilter === "low" && ((item.starRating || 0) > 2 || (item.starRating || 0) === 0)) return false;

    return true;
  });

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">
              口コミ返信管理
            </h1>
            <span className="text-xs font-bold bg-brand-light text-brand px-2.5 py-0.5 rounded-full">
              未返信 {unrepliedCount}件
            </span>
          </div>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            Googleマップの口コミを確認し、AIで返信下書きを生成・編集して返信を管理します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-dark transition-all pressable"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>口コミを手動追加</span>
          </button>

          <Link
            href={`/admin/reviews/settings?storeId=${selectedStoreId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface border border-border-default text-text-secondary hover:text-text-primary text-xs font-semibold hover:bg-surface-secondary transition-all pressable"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>返信設定</span>
          </Link>
        </div>
      </div>

      {/* 店舗切り替えタブ ＆ テスト同期 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border-default shadow-xs">
        <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-subtle flex-wrap gap-1">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleStoreChange(store.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
                selectedStoreId === store.id
                  ? "bg-surface text-brand shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {store.name.replace(/（.+?）/, "").replace(/宇都宮\s*/, "")}
            </button>
          ))}
        </div>

        <button
          onClick={handleSyncFixture}
          disabled={isSyncingFixture}
          className="text-xs text-text-tertiary hover:text-brand transition-all pressable self-start sm:self-auto px-2 py-1 disabled:opacity-50"
        >
          {isSyncingFixture ? "テスト口コミ取り込み中..." : "＋ テスト用口コミを同期"}
        </button>
      </div>

      {/* フィルターバー */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-secondary/60 p-3 rounded-xl border border-border-subtle text-xs">
        {/* ステータスフィルター */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-text-secondary mr-1">状態:</span>
          {[
            { key: "unreplied", label: "未返信" },
            { key: "drafted", label: "下書き済み" },
            { key: "replied", label: "返信済み" },
            { key: "all", label: "すべて" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-lg font-bold pressable transition-all ${
                statusFilter === f.key
                  ? "bg-surface text-brand border border-border-default shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 星評価フィルター */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-text-secondary mr-1">評価:</span>
          {[
            { key: "all", label: "全評価" },
            { key: "high", label: "高評価 (★4-5)" },
            { key: "mid", label: "中立 (★3)" },
            { key: "low", label: "低評価 (★1-2)" },
          ].map((sf) => (
            <button
              key={sf.key}
              onClick={() => setStarFilter(sf.key as typeof starFilter)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold pressable transition-all ${
                starFilter === sf.key
                  ? "bg-surface text-text-primary border border-border-default shadow-xs"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* 口コミカードリスト */}
      {isLoading ? (
        <div className="p-12 text-center text-text-tertiary space-y-2">
          <svg className="animate-spin w-6 h-6 mx-auto text-brand" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-xs">口コミデータを読み込み中...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border-default p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-text-tertiary flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              表示対象の口コミがありません
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
              Googleマップに届いた口コミを「口コミを手動追加」から登録するか、テスト用口コミを同期してAI返信機能を試すことができます。
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-dark transition-all pressable"
            >
              口コミを手動追加
            </button>
            <button
              onClick={handleSyncFixture}
              disabled={isSyncingFixture}
              className="px-4 py-2 rounded-xl bg-surface-secondary text-text-secondary text-xs font-semibold hover:bg-border-subtle transition-all pressable"
            >
              テスト口コミを同期
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((item) => (
            <ReviewReplyCard
              key={item.reviewRefHash}
              item={item}
              googleMapsUrl={selectedStore?.googleMapsUrl}
              ngWords={ngWords}
              onStatusChange={handleStatusChange}
              onGenerateDrafts={handleGenerateDrafts}
            />
          ))}
        </div>
      )}

      {/* 手動追加モーダル */}
      {isManualModalOpen && (
        <ManualReviewImportForm
          storeId={selectedStoreId}
          onSuccess={() => {
            setIsManualModalOpen(false);
            loadReviews(selectedStoreId);
          }}
          onClose={() => setIsManualModalOpen(false)}
        />
      )}
    </div>
  );
}
