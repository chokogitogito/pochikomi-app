"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { stores } from "@/lib/stores";

export default function QRPage() {
  const storeList = Object.values(stores);
  const [selectedId, setSelectedId] = useState(storeList[0]?.id ?? "");

  // アプリのベースURL（本番ではVercelのURLに変わる）
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const surveyUrl = `${baseUrl}/survey/${selectedId}`;
  const selectedStore = stores[selectedId];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">QRコード管理</h1>
          <p className="text-gray-500 text-sm mt-1">
            店舗のQRコードを表示・印刷できます。
          </p>
        </div>

        {/* 店舗選択 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            店舗を選択
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-base focus:outline-none focus:border-orange-400"
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {selectedStore.name}
            </p>
            <p className="text-xs text-gray-400 mb-5 break-all">{surveyUrl}</p>

            {/* QRコード */}
            <div className="flex justify-center mb-5">
              <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl inline-block">
                <QRCode
                  value={surveyUrl}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            </div>

            {/* 印刷ボタン */}
            <button
              onClick={() => window.print()}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
            >
              🖨️ 印刷する
            </button>

            <p className="text-xs text-gray-400 mt-3">
              このQRコードをお客様が読み取ることで<br />
              アンケート画面が開きます。
            </p>
          </div>
        )}

        {/* テストリンク */}
        <div className="mt-5 text-center">
          <a
            href={surveyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-500 underline"
          >
            アンケート画面をプレビューする →
          </a>
        </div>
      </div>
    </div>
  );
}
