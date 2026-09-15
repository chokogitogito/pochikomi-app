"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import type { Store, QrCampaign } from "@/lib/types";

const PLACEMENT_OPTIONS = [
  { value: "table", label: "卓上POP・スタンド" },
  { value: "cashier", label: "レジカウンター" },
  { value: "receipt", label: "レシート・領収書" },
  { value: "staff_card", label: "スタッフ名刺・カード" },
  { value: "flyer", label: "チラシ・案内板" },
];

export default function QRPage() {
  const [storeList, setStoreList] = useState<Store[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [campaigns, setCampaigns] = useState<QrCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("none");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // キャンペーン作成フォーム
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newPlacement, setNewPlacement] = useState("table");
  const [newStaffLabel, setNewStaffLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchCampaigns = useCallback(async (storeId: string) => {
    if (!storeId) return;
    try {
      const res = await fetch(`/api/admin/campaigns?storeId=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } else {
        setCampaigns([]);
      }
    } catch {
      setCampaigns([]);
    }
  }, []);

  useEffect(() => {
    fetch("/api/stores")
      .then((res) => res.json())
      .then((data) => {
        setStoreList(data.stores);
        const initialId = data.stores[0]?.id ?? "";
        setSelectedId(initialId);
        if (initialId) {
          fetchCampaigns(initialId);
        }
      });
  }, [fetchCampaigns]);

  const handleStoreChange = (newStoreId: string) => {
    setSelectedId(newStoreId);
    setSelectedCampaignId("none");
    fetchCampaigns(newStoreId);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      setCreateError("キャンペーン名を入力してください");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedId,
          name: newCampaignName.trim(),
          placement: newPlacement,
          staffLabel: newStaffLabel.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "作成に失敗しました");
      }

      setCampaigns((prev) => [data.campaign, ...prev]);
      setSelectedCampaignId(data.campaign.id);
      setNewCampaignName("");
      setNewStaffLabel("");
      setShowCreateModal(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsCreating(false);
    }
  };

  // アプリのベースURL
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const selectedStore = storeList.find((store) => store.id === selectedId);
  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // QR URL: キャンペーン選択時は安全な公開識別子(?c=...)を付与、未選択時は通常URL（完全後方互換）
  const surveyUrl = activeCampaign
    ? `${baseUrl}/survey/${selectedId}?c=${activeCampaign.publicId}`
    : `${baseUrl}/survey/${selectedId}`;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary display-heading">QRコード・施策管理</h1>
        <p className="text-text-secondary text-sm mt-1">
          卓上POPやレジ、スタッフ別にアンケートQRコードを発行し、設置場所ごとの口コミ獲得効果を計測できます。
        </p>
      </div>

      {/* 店舗・キャンペーン選択パネル */}
      <div className="bg-surface rounded-2xl p-5 shadow-card border border-border-default space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
            対象店舗を選択
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="w-full border border-border-default rounded-xl px-4 py-3 text-text-primary bg-surface text-sm font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
          >
            {storeList.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary">
              設置場所・キャンペーン施策
            </label>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
            >
              <span>＋ 新規QRキャンペーン作成</span>
            </button>
          </div>

          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full border border-border-default rounded-xl px-4 py-3 text-text-primary bg-surface text-sm font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
          >
            <option value="none">通常店舗QR（キャンペーン指定なし・基本URL）</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                【{c.name}】 設置場所: {c.placement} {c.staffLabel ? `(担当: ${c.staffLabel})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 新規キャンペーン作成モーダル / アコーディオン */}
      {showCreateModal && (
        <div className="p-5 rounded-2xl bg-brand-light border border-brand/30 shadow-sm space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-brand/20 pb-2">
            <h3 className="text-sm font-bold text-text-primary">新規QR施策（キャンペーン）発行</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-xs text-text-tertiary hover:text-text-primary font-bold"
            >
              ✕ 閉じる
            </button>
          </div>

          {createError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-text-secondary mb-1">
                施策名・キャンペーン名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="例: 10月卓上POP、レジ前POP A、スタッフ田中"
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border-default text-text-primary focus:outline-none focus:border-brand"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-text-secondary mb-1">設置場所（配置先）</label>
                <select
                  value={newPlacement}
                  onChange={(e) => setNewPlacement(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border-default text-text-primary focus:outline-none focus:border-brand"
                >
                  {PLACEMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  担当・運用ラベル（任意）
                </label>
                <input
                  type="text"
                  value={newStaffLabel}
                  onChange={(e) => setNewStaffLabel(e.target.value)}
                  placeholder="例: スタッフA、1番打席"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border-default text-text-primary focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-surface border border-border-default text-xs font-bold text-text-secondary hover:bg-surface-secondary"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-hover pressable disabled:opacity-50"
              >
                {isCreating ? "発行中..." : "QRコードを発行する"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QRコード表示パネル */}
      {selectedStore && (
        <div className="bg-surface rounded-2xl p-6 md:p-8 shadow-card border border-border-default text-center">
          <div className="inline-block px-3 py-1 bg-brand-light rounded-full mb-3">
            <span className="text-xs font-bold text-brand">{selectedStore.category}</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">
            {selectedStore.name}
          </h2>

          {activeCampaign ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
              <span>施策: {activeCampaign.name}</span>
              <span>({activeCampaign.placement})</span>
              {activeCampaign.staffLabel && <span>[担当: {activeCampaign.staffLabel}]</span>}
            </div>
          ) : (
            <p className="text-xs text-text-tertiary mb-2">基本店舗アンケートQR（全設置共通）</p>
          )}

          <p className="text-xs text-text-tertiary mb-6 font-mono break-all max-w-md mx-auto">{surveyUrl}</p>

          {/* QRコード */}
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-white border border-border-subtle rounded-3xl shadow-sm inline-block">
              <QRCode
                value={surveyUrl}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
          </div>

          {/* 印刷・プレビューボタン */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3.5 px-5 rounded-xl bg-brand text-white font-bold text-sm shadow-brand pressable hover:bg-brand-hover flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>卓上POP用に印刷</span>
            </button>
            <a
              href={surveyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-5 rounded-xl border border-border-default bg-surface text-text-primary font-bold text-sm shadow-card pressable hover:bg-surface-secondary flex items-center justify-center gap-2"
            >
              <span>実画面を開く</span>
              <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <p className="text-xs text-text-tertiary mt-4">
            ※来店客がスマートフォンのカメラでこのQRを読み取ると、施策・セッションが紐付けられたアンケート画面が開きます。
          </p>
        </div>
      )}
    </div>
  );
}
