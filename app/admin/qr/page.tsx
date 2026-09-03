"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import type { Store } from "@/lib/types";

export default function QRPage() {
  const [storeList, setStoreList] = useState<Store[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    fetch("/api/stores")
      .then((res) => res.json())
      .then((data) => {
        setStoreList(data.stores);
        setSelectedId(data.stores[0]?.id ?? "");
      });
  }, []);

  // アプリのベースURL（本番ではVercelのURLに変わる）
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const surveyUrl = `${baseUrl}/survey/${selectedId}`;
  const selectedStore = storeList.find((store) => store.id === selectedId);

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary display-heading">QRコード管理</h1>
        <p className="text-text-secondary text-sm mt-1">
          卓上POPやチラシに印刷する、店舗別のお客様用アンケートQRコードを発行・印刷できます。
        </p>
      </div>

      {/* 店舗選択 */}
      <div className="bg-surface rounded-2xl p-5 shadow-card border border-border-default mb-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
          対象店舗を選択
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border border-border-default rounded-xl px-4 py-3 text-text-primary bg-surface text-base focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
        >
          {storeList.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* QRコード表示 */}
      {selectedStore && (
        <div className="bg-surface rounded-2xl p-6 md:p-8 shadow-card border border-border-default text-center">
          <div className="inline-block px-3 py-1 bg-brand-light rounded-full mb-3">
            <span className="text-xs font-bold text-brand">{selectedStore.category}</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">
            {selectedStore.name}
          </h2>
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
            ※来店客がスマートフォンのカメラでこのQRを読み取ると、店舗専用のアンケート画面が開きます。
          </p>
        </div>
      )}
    </div>
  );
}
