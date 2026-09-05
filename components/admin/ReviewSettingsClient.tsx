"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ReviewReplySettingsData } from "@/lib/repositories/review-repository";
import type { Store } from "@/lib/types";

interface ReviewSettingsClientProps {
  stores: Store[];
  initialStoreId: string;
  initialSettings: ReviewReplySettingsData;
}

export function ReviewSettingsClient({
  stores,
  initialStoreId,
  initialSettings,
}: ReviewSettingsClientProps) {
  const [storeId, setStoreId] = useState(initialStoreId);
  const [settings, setSettings] = useState<ReviewReplySettingsData>(initialSettings);
  const [ngWordsInput, setNgWordsInput] = useState((initialSettings.ngWords || []).join(", "));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSettings = useCallback(async (targetStoreId: string) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/reviews/settings?storeId=${targetStoreId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setNgWordsInput((data.settings.ngWords || []).join(", "));
      } else {
        setErrorMessage(data.error || "設定の読み込みに失敗しました");
      }
    } catch (err) {
      console.error("設定読み込みエラー:", err);
      setErrorMessage("設定の読み込み中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStoreChange = (newStoreId: string) => {
    setStoreId(newStoreId);
    loadSettings(newStoreId);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage("");

    const parsedNgWords = ngWordsInput
      .split(/[,、]/)
      .map((w) => w.trim())
      .filter(Boolean);

    const newSettings = {
      ...settings,
      ngWords: parsedNgWords,
    };

    try {
      const res = await fetch("/api/reviews/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          settings: newSettings,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(data.error || "保存に失敗しました");
      }
    } catch (err) {
      console.error("設定保存エラー:", err);
      setErrorMessage("設定の保存中にエラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between border-b border-border-default pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={storeId ? `/admin/reviews?storeId=${storeId}` : "/admin/reviews"}
              className="text-text-tertiary hover:text-text-primary p-1 -ml-1 rounded-lg pressable"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">
              口コミ返信設定
            </h1>
          </div>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            店舗ごとの呼称、署名、既定トーン、使用禁止ワードを設定します。
          </p>
        </div>

        <Link
          href={`/admin/reviews?storeId=${storeId}`}
          className="px-4 py-2 rounded-xl bg-surface-secondary text-text-secondary text-xs font-semibold hover:bg-border-subtle transition-all pressable"
        >
          受信箱に戻る
        </Link>
      </div>

      {/* 店舗切り替えタブ */}
      <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-subtle max-w-md gap-1">
        {stores.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleStoreChange(s.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
              storeId === s.id
                ? "bg-surface text-brand shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {s.name.replace(/（.+?）/, "").replace(/宇都宮\s*/, "")}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
          {errorMessage}
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs border border-emerald-200">
          ✓ 返信設定を保存しました
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-text-tertiary">
          設定を読み込み中...
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-surface rounded-2xl border border-border-default p-6 space-y-6 shadow-xs">
          {/* 店名の呼称 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary">
              店名の呼称（AI文中で自店を指す呼び方）
            </label>
            <input
              type="text"
              value={settings.storeCallName}
              onChange={(e) =>
                setSettings({ ...settings, storeCallName: e.target.value })
              }
              placeholder="例: 当スタジオ、当店、The蔵ssic"
              className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary text-xs"
            />
            <p className="text-[11px] text-text-tertiary">
              未入力の場合は登録店舗名がそのまま使用されます。
            </p>
          </div>

          {/* 返信末尾の署名 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary">
              返信末尾の署名（自動付加）
            </label>
            <textarea
              rows={3}
              value={settings.signature}
              onChange={(e) =>
                setSettings({ ...settings, signature: e.target.value })
              }
              placeholder="例: ゴルフコンディショニングスタジオ宇都宮 The蔵ssic&#10;店長 山田"
              className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary text-xs leading-relaxed resize-y"
            />
            <p className="text-[11px] text-text-tertiary">
              ※AIには署名を書かせず、生成後にシステムが確実に末尾へ付加します（不変条件）。
            </p>
          </div>

          {/* 既定トーン */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary">
              既定トーン
            </label>
            <div className="flex max-w-md bg-surface-secondary p-1 rounded-xl border border-border-subtle gap-1">
              {[
                { key: "polite", label: "丁寧" },
                { key: "standard", label: "標準" },
                { key: "friendly", label: "親しみ" },
              ].map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      toneDefault: t.key as typeof settings.toneDefault,
                    })
                  }
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold pressable transition-all ${
                    settings.toneDefault === t.key
                      ? "bg-surface text-brand shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 使用禁止ワード（NGワード） */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary">
              使用禁止ワード（カンマ区切り）
            </label>
            <input
              type="text"
              value={ngWordsInput}
              onChange={(e) => setNgWordsInput(e.target.value)}
              placeholder="例: 安い, 激安, 保証, クーポン差し上げます"
              className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary text-xs"
            />
            <p className="text-[11px] text-text-tertiary">
              生成文に含めたくない単語やブランド表現を指定できます。
            </p>
          </div>

          {/* 店舗独自の返信方針メモ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary">
              返信方針の補足メモ（プロンプトに追加指示）
            </label>
            <textarea
              rows={3}
              value={settings.policyNote}
              onChange={(e) =>
                setSettings({ ...settings, policyNote: e.target.value })
              }
              placeholder="例: 当店は完全予約制である点にさりげなく触れてください。初心者歓迎の姿勢をアピールしてください。"
              className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary text-xs leading-relaxed resize-y"
            />
          </div>

          {/* 口コミ取り込み経路 */}
          <div className="space-y-1.5 pt-4 border-t border-border-subtle">
            <label className="block text-xs font-bold text-text-primary">
              口コミ取り込み経路
            </label>
            <select
              value={settings.reviewSource}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reviewSource: e.target.value as typeof settings.reviewSource,
                })
              }
              className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-border-default focus:border-brand focus:ring-1 focus:ring-brand outline-hidden bg-surface text-text-primary text-xs"
            >
              <option value="manual">手動取り込み（本番推奨・承認不要）</option>
              <option value="fixture">テスト用（固定ダミーデータ）</option>
              <option value="places" disabled>
                Places API (New)（Phase 6 購入ゲート承認待ち）
              </option>
              <option value="gbp" disabled>
                Google Business Profile API（Phase 7 審査承認待ち）
              </option>
            </select>
            <p className="text-[11px] text-text-tertiary">
              GBP API未申請の間は「手動取り込み」により安全に本番運用を行えます。
            </p>
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-dark transition-all pressable disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "設定を保存する"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
