"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Coupon, Store } from "@/lib/types";

type IssuedCoupon = {
  title: string;
  description: string;
  code: string;
  expiresAt: string;
  storeName: string;
};

export default function CouponAdminPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [couponForm, setCouponForm] = useState({
    id: "",
    storeId: "",
    title: "",
    description: "",
    expiresInDays: 30,
    active: true,
  });
  const [issuedCoupon, setIssuedCoupon] = useState<IssuedCoupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [storesRes, couponsRes] = await Promise.all([
      fetch("/api/stores"),
      fetch("/api/coupons"),
    ]);
    const storesData = await storesRes.json();
    const couponsData = await couponsRes.json();
    const nextStores = storesData.stores as Store[];

    setStores(nextStores);
    setCoupons(couponsData.coupons);
    setStoreId((current) => current || nextStores[0]?.id || "");
    setCouponForm((current) => ({
      ...current,
      storeId: current.storeId || nextStores[0]?.id || "",
    }));
  };

  useEffect(() => {
    // 初回表示時に、DBから管理用データを読み込みます。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const issueCoupon = async () => {
    setLoading(true);
    setIssuedCoupon(null);
    try {
      const res = await fetch("/api/coupons/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      setIssuedCoupon(data.coupon);
    } finally {
      setLoading(false);
    }
  };

  const saveCoupon = async () => {
    setSaving(true);
    try {
      const body: Coupon = {
        id: couponForm.id,
        storeId: couponForm.storeId,
        title: couponForm.title,
        description: couponForm.description,
        expiresInDays: Number(couponForm.expiresInDays),
        issuedCount: coupons.find((coupon) => coupon.id === couponForm.id)?.issuedCount ?? 0,
        active: couponForm.active,
      };
      const method = couponForm.id && coupons.some((coupon) => coupon.id === couponForm.id)
        ? "PUT"
        : "POST";
      const url = method === "PUT" ? `/api/coupons/${couponForm.id}` : "/api/coupons";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setCouponForm({
        id: "",
        storeId: stores[0]?.id ?? "",
        title: "",
        description: "",
        expiresInDays: 30,
        active: true,
      });
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const editCoupon = (coupon: Coupon) => {
    setCouponForm({
      id: coupon.id,
      storeId: coupon.storeId,
      title: coupon.title,
      description: coupon.description,
      expiresInDays: coupon.expiresInDays,
      active: coupon.active,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-slate-200 pb-6">
          <Link href="/admin" className="text-sm font-bold text-green-600 underline">
            管理画面へ戻る
          </Link>
          <h1 className="mt-4 text-2xl font-bold">クーポン発行</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            アンケート回答のお礼として発行する特典の動作確認画面です。口コミ投稿を条件にしない設計にしています。
          </p>
        </header>

        <section className="mt-6 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-bold text-slate-700">店舗</label>
            <select
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <button
              onClick={issueCoupon}
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "発行中..." : "テスト発行する"}
            </button>

            {issuedCoupon && (
              <div className="mt-5 rounded-lg border border-green-100 bg-green-50 p-5 text-center">
                <p className="text-xs text-green-700">{issuedCoupon.storeName}</p>
                <p className="mt-1 text-sm font-bold text-green-800">
                  {issuedCoupon.title}
                </p>
                <p className="mt-3 text-2xl font-bold tracking-wide text-slate-900">
                  {issuedCoupon.code}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  有効期限: {new Date(issuedCoupon.expiresAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold">クーポン作成・編集</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-bold text-slate-700">
                クーポンID
                <input
                  value={couponForm.id}
                  onChange={(event) =>
                    setCouponForm((current) => ({ ...current, id: event.target.value }))
                  }
                  placeholder="例: next-visit"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                対象店舗
                <select
                  value={couponForm.storeId}
                  onChange={(event) =>
                    setCouponForm((current) => ({ ...current, storeId: event.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-700">
                タイトル
                <input
                  value={couponForm.title}
                  onChange={(event) =>
                    setCouponForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                説明
                <textarea
                  value={couponForm.description}
                  onChange={(event) =>
                    setCouponForm((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                有効日数
                <input
                  type="number"
                  value={couponForm.expiresInDays}
                  onChange={(event) =>
                    setCouponForm((current) => ({
                      ...current,
                      expiresInDays: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={couponForm.active}
                  onChange={(event) =>
                    setCouponForm((current) => ({ ...current, active: event.target.checked }))
                  }
                />
                有効にする
              </label>
              <button
                onClick={saveCoupon}
                disabled={saving || !couponForm.storeId || !couponForm.title}
                className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "保存中..." : "クーポンを保存する"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold">登録済みクーポン</h2>
            <div className="mt-4 space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-slate-800">{coupon.title}</p>
                    <button
                      onClick={() => editCoupon(coupon)}
                      className="text-xs font-bold text-green-600 underline"
                    >
                      編集
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {coupon.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    店舗ID: {coupon.storeId} / 発行済み {coupon.issuedCount}件
                  </p>
                </div>
              ))}
            </div>
        </section>
      </div>
    </main>
  );
}
