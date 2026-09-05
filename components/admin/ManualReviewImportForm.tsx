"use client";

import { useState } from "react";

interface ManualReviewImportFormProps {
  storeId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function ManualReviewImportForm({
  storeId,
  onSuccess,
  onClose,
}: ManualReviewImportFormProps) {
  const [reviewerName, setReviewerName] = useState("");
  const [starRating, setStarRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [reviewCreatedAt, setReviewCreatedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/reviews/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          reviewerName: reviewerName.trim() || null,
          starRating,
          comment: comment.trim() || null,
          reviewCreatedAt: reviewCreatedAt ? new Date(reviewCreatedAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "口コミの取り込みに失敗しました");
      }

      onSuccess();
    } catch (err: unknown) {
      console.error("手動取り込みエラー:", err);
      setErrorMessage(err instanceof Error ? err.message : "取り込みに失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-surface rounded-2xl border border-border-default max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              口コミの手動取り込み
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Googleマップに届いた口コミを貼り付けて取り込みます。
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary p-1.5 rounded-lg pressable"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 星評価選択 */}
          <div>
            <label className="block font-bold text-text-primary mb-1.5">
              星評価 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStarRating(s)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all pressable ${
                    starRating === s
                      ? "bg-brand text-white border-brand shadow-xs"
                      : "bg-surface-secondary text-text-secondary border-border-subtle hover:bg-border-subtle"
                  }`}
                >
                  ★ {s}
                </button>
              ))}
            </div>
          </div>

          {/* 投稿者名 */}
          <div>
            <label className="block font-bold text-text-primary mb-1.5">
              投稿者名（任意）
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="例: 山田 太郎"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary text-xs"
            />
          </div>

          {/* 投稿日 */}
          <div>
            <label className="block font-bold text-text-primary mb-1.5">
              投稿日（任意）
            </label>
            <input
              type="date"
              value={reviewCreatedAt}
              onChange={(e) => setReviewCreatedAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary text-xs"
            />
          </div>

          {/* 口コミ本文 */}
          <div>
            <label className="block font-bold text-text-primary mb-1.5">
              口コミ本文（任意・最大1000文字）
            </label>
            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Googleマップから口コミ本文をコピー＆ペーストしてください..."
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary text-xs leading-relaxed resize-y"
            />
            <div className="text-right text-[10px] text-text-tertiary mt-0.5">
              {comment.length} / 1000文字
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-secondary text-text-secondary text-xs font-semibold hover:bg-border-subtle transition-all pressable"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-dark transition-all pressable disabled:opacity-50"
            >
              {isSubmitting ? "取り込み中..." : "口コミを取り込む"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
