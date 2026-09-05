"use client";

import { useState } from "react";
import { ReviewInboxItem, ReviewDraftItem } from "@/lib/repositories/review-repository";

interface ReviewReplyCardProps {
  item: ReviewInboxItem;
  googleMapsUrl?: string;
  ngWords?: string[];
  onStatusChange: (reviewRefHash: string, newStatus: "replied" | "ignored" | "unreplied") => Promise<void>;
  onGenerateDrafts: (reviewRefHash: string) => Promise<ReviewDraftItem[]>;
}

export function ReviewReplyCard({
  item,
  googleMapsUrl,
  ngWords = [],
  onStatusChange,
  onGenerateDrafts,
}: ReviewReplyCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<ReviewDraftItem[]>(item.drafts || []);
  const [selectedTone, setSelectedTone] = useState<"polite" | "standard" | "friendly">("polite");
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const d of item.drafts || []) {
      map[d.tone] = d.draftText;
    }
    return map;
  });
  const [copiedTone, setCopiedTone] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const activeDraftText = draftTexts[selectedTone] || "";

  // AI返信下書き生成
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await onGenerateDrafts(item.reviewRefHash);
      setDrafts(generated);
      const newMap: Record<string, string> = {};
      for (const d of generated) {
        newMap[d.tone] = d.draftText;
      }
      setDraftTexts(newMap);
    } catch (err) {
      console.error("AI返信下書き生成失敗:", err);
      alert("AI返信下書きの生成に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsGenerating(false);
    }
  };

  // クリップボードコピー
  const handleCopy = async () => {
    if (!activeDraftText) return;
    try {
      await navigator.clipboard.writeText(activeDraftText);
      setCopiedTone(selectedTone);
      setTimeout(() => setCopiedTone(null), 2500);
    } catch (err) {
      console.error("クリップボードコピー失敗:", err);
    }
  };

  // ステータス更新
  const handleStatusUpdate = async (newStatus: "replied" | "ignored" | "unreplied") => {
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(item.reviewRefHash, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 1. TTL失効プレースホルダー表示（Google Content 30日保持制約・正直な設計）
  if (item.isTtlExpired) {
    return (
      <div className="bg-surface rounded-2xl border border-border-default p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-xs font-bold text-text-tertiary">
              記録日時: {new Date(item.firstSeenAt).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            保持期限切れ（30日超過）
          </span>
        </div>

        <div className="bg-surface-secondary rounded-xl p-4 border border-border-subtle text-xs text-text-secondary">
          <p className="font-semibold text-text-primary mb-1">
            未返信の口コミが1件あります（Google規約に基づき30日経過したため本文は表示できません）
          </p>
          <p>
            Googleマップの店舗管理画面から実際の口コミ内容を確認し、返信を行ってください。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline pressable"
            >
              <span>Googleマップで確認する</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : <div />}

          <div className="flex items-center gap-2">
            {item.status !== "replied" ? (
              <button
                onClick={() => handleStatusUpdate("replied")}
                disabled={isUpdatingStatus}
                className="px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-dark transition-all pressable disabled:opacity-50"
              >
                返信済みにする
              </button>
            ) : (
              <span className="text-xs font-semibold text-text-tertiary">✓ 返信記録済み</span>
            )}
            {item.status !== "ignored" && item.status !== "replied" && (
              <button
                onClick={() => handleStatusUpdate("ignored")}
                disabled={isUpdatingStatus}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary text-text-secondary text-xs font-semibold hover:bg-border-subtle transition-all pressable disabled:opacity-50"
              >
                対応不要
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. 通常の口コミカード
  const stars = item.starRating || 5;
  const isReplied = item.status === "replied";
  const isIgnored = item.status === "ignored";

  const sourceLabels: Record<string, { label: string; bg: string }> = {
    gbp: { label: "GBP公式", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    places: { label: "Places API", bg: "bg-purple-50 text-purple-700 border-purple-200" },
    manual: { label: "手動取り込み", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    fixture: { label: "テスト用", bg: "bg-surface-secondary text-text-tertiary border-border-subtle" },
  };
  const sourceInfo = sourceLabels[item.source || "manual"] || sourceLabels.manual;

  return (
    <div className={`bg-surface rounded-2xl border transition-all p-5 md:p-6 space-y-4 shadow-xs ${
      isReplied
        ? "border-border-subtle opacity-80"
        : isIgnored
        ? "border-border-subtle bg-surface-secondary/40 opacity-60"
        : "border-border-default hover:border-brand/40"
    }`}>
      {/* カードヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* 星評価 */}
          <div className="flex items-center text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < stars ? "fill-current" : "fill-border-subtle text-border-subtle"}`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-xs font-extrabold text-text-primary">{stars}.0</span>
          </div>

          <span className="font-bold text-sm text-text-primary">
            {item.reviewerName || "Googleユーザー"}
          </span>

          <span className="text-xs text-text-tertiary">
            {item.reviewCreatedAt ? new Date(item.reviewCreatedAt).toLocaleDateString("ja-JP") : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sourceInfo.bg}`}>
            {sourceInfo.label}
          </span>
          {isReplied ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary border border-border-subtle">
              返信済み
            </span>
          ) : isIgnored ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-text-tertiary border border-border-subtle">
              対応不要
            </span>
          ) : drafts.length > 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-light text-brand border border-brand/20">
              下書き作成済み
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              未返信
            </span>
          )}
        </div>
      </div>

      {/* 口コミ本文 */}
      <div className="bg-surface-secondary rounded-xl p-4 text-xs md:text-sm text-text-primary leading-relaxed whitespace-pre-wrap border border-border-subtle">
        {item.comment || <span className="text-text-tertiary italic">（本文なし・星評価のみの口コミ）</span>}
      </div>

      {/* AI返信下書きエリア */}
      {drafts.length > 0 ? (
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">AI返信下書き（3案）</span>
              <span className="text-[10px] text-text-tertiary">編集してコピーできます</span>
            </div>
            {/* 再生成ボタン */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-xs text-brand font-semibold hover:underline pressable disabled:opacity-50"
            >
              {isGenerating ? "生成中..." : "↺ 別の案を再生成"}
            </button>
          </div>

          {/* トーンタブ */}
          <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-subtle gap-1">
            {(["polite", "standard", "friendly"] as const).map((tone) => {
              const toneLabels = {
                polite: "丁寧（格調高い）",
                standard: "標準（安心・親切）",
                friendly: "親しみ（柔らかい）",
              };
              const isSelected = selectedTone === tone;
              return (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
                    isSelected
                      ? "bg-surface text-brand shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {toneLabels[tone]}
                </button>
              );
            })}
          </div>

          {/* 下書き編集テキストエリア */}
          <div className="relative">
            <textarea
              rows={4}
              value={activeDraftText}
              onChange={(e) => {
                const val = e.target.value;
                setDraftTexts((prev) => ({ ...prev, [selectedTone]: val }));
              }}
              className="w-full text-xs md:text-sm p-3.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary leading-relaxed resize-y"
              placeholder="返信下書き文章..."
            />
            <div className="flex justify-between items-center text-[10px] text-text-tertiary mt-1 px-1">
              <span>※Googleの規約により、割引や次回特典の提示は含まれません</span>
              <span>{activeDraftText.length} 文字</span>
            </div>
          </div>

          {/* NGワード検知警告 */}
          {(() => {
            const detected = (ngWords || []).filter((w) => w && activeDraftText.includes(w));
            if (detected.length === 0) return null;
            return (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>使用禁止ワードが含まれています:</strong> {detected.join(", ")}（修正するまでコピーできません）
                </span>
              </div>
            );
          })()}

          {/* アクションボタン群 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {(() => {
                const hasNg = (ngWords || []).some((w) => w && activeDraftText.includes(w));
                return (
                  <button
                    onClick={handleCopy}
                    disabled={hasNg || !activeDraftText}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all pressable ${
                      hasNg
                        ? "bg-surface-secondary text-text-tertiary border-border-subtle cursor-not-allowed opacity-60"
                        : "bg-brand-light text-brand border-brand/20 hover:bg-brand/10"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>
                      {hasNg
                        ? "NGワード修正待ち"
                        : copiedTone === selectedTone
                        ? "コピー完了！"
                        : "文章をコピー"}
                    </span>
                  </button>
                );
              })()}

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-secondary text-text-secondary hover:text-brand text-xs font-bold border border-border-subtle transition-all pressable"
                >
                  <span>Googleマップで返信</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isReplied ? (
                <button
                  onClick={() => handleStatusUpdate("replied")}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-dark transition-all pressable disabled:opacity-50"
                >
                  {isUpdatingStatus ? "更新中..." : "返信済みにする"}
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate("unreplied")}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 rounded-xl bg-surface-secondary text-text-secondary text-xs font-semibold hover:bg-border-subtle transition-all pressable disabled:opacity-50"
                >
                  未返信に戻す
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 下書き未作成時の生成ボタン */
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-dark transition-all pressable disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>AI返信下書きを生成中...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>AI返信案を作る（3案）</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {!isReplied ? (
              <button
                onClick={() => handleStatusUpdate("replied")}
                disabled={isUpdatingStatus}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary text-text-secondary text-xs font-semibold hover:bg-border-subtle transition-all pressable disabled:opacity-50"
              >
                手動返信済みとして記録
              </button>
            ) : (
              <span className="text-xs font-semibold text-text-tertiary">✓ 返信済み</span>
            )}
            {!isIgnored && !isReplied && (
              <button
                onClick={() => handleStatusUpdate("ignored")}
                disabled={isUpdatingStatus}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary text-text-tertiary text-xs hover:text-text-secondary transition-all pressable disabled:opacity-50"
              >
                対応不要にする
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
