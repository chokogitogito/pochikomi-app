"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Store, StorePlan, StoreStatus } from "@/lib/types";

const defaultStore: Store = {
  id: "",
  name: "",
  category: "ゴルフ場・カントリークラブ",
  plan: "starter",
  status: "setup",
  keywords: ["コース整備", "グリーン", "食事・ランチ", "接客対応"],
  googleMapsUrl: "https://search.google.com/local/writereview?placeid=",
  monthlyGoal: 30,
  surveyOptions: {
    sources: ["Google検索", "Googleマップ", "予約サイト（楽天GORA/GDO等）", "知人・コンペ紹介", "その他"],
    menus: ["レギュラーラウンド（18H）", "ハーフプレー", "コンペ利用", "練習場・レストランのみ", "その他"],
    goodPoints: ["コース・グリーンの手入れが良い", "食事が美味しい", "スタッフが親切で進行がスムーズ", "アクセスが良い"],
    badPoints: ["進行の待ち時間が気になった", "設備の空き状況が気になった", "案内が分かりにくかった"],
  },
};

export default function StoreForm({
  initialStore,
  mode,
}: {
  initialStore?: Store | null;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [store, setStore] = useState<Store>(initialStore ?? defaultStore);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const update = <K extends keyof Store>(key: K, value: Store[K]) => {
    setStore((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const url = mode === "edit" ? `/api/stores/${store.id}` : "/api/stores";
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "保存に失敗しました。");
        return;
      }

      setMessage("保存しました。");
      router.refresh();
      if (mode === "create") {
        router.push(`/admin/stores/${data.store.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-default bg-surface p-6 shadow-card">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="店舗ID"
          value={store.id}
          disabled={mode === "edit"}
          placeholder="例: golf-course-a"
          onChange={(value) => update("id", value)}
        />
        <TextField
          label="店舗名"
          value={store.name}
          placeholder="例: ○○ゴルフ倶楽部 / ○○カントリークラブ"
          onChange={(value) => update("name", value)}
        />
        <TextField
          label="業種"
          value={store.category}
          placeholder="例: ゴルフ場 / ゴルフコース / カントリークラブ"
          onChange={(value) => update("category", value)}
        />
        <label className="block text-sm font-bold text-slate-700">
          プラン
          <select
            value={store.plan}
            onChange={(event) => update("plan", event.target.value as StorePlan)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="starter">スターター</option>
            <option value="growth">運用支援</option>
            <option value="premium">上位運用</option>
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-700">
          状態
          <select
            value={store.status}
            onChange={(event) => update("status", event.target.value as StoreStatus)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="setup">準備中</option>
            <option value="active">運用中</option>
            <option value="paused">停止中</option>
          </select>
        </label>
        <TextField
          label="月間口コミ目標"
          value={String(store.monthlyGoal)}
          type="number"
          onChange={(value) => update("monthlyGoal", Number(value))}
        />
      </div>

      <div className="mt-4">
        <TextField
          label="GoogleレビューURL"
          value={store.googleMapsUrl}
          onChange={(value) => update("googleMapsUrl", value)}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextArea
          label="口コミに含めたいキーワード"
          value={store.keywords.join("\n")}
          onChange={(value) => update("keywords", splitLines(value))}
        />
        <TextArea
          label="来店・認知経路"
          value={store.surveyOptions.sources.join("\n")}
          onChange={(value) =>
            update("surveyOptions", {
              ...store.surveyOptions,
              sources: splitLines(value),
            })
          }
        />
        <TextArea
          label="利用メニューの選択肢"
          value={store.surveyOptions.menus.join("\n")}
          onChange={(value) =>
            update("surveyOptions", {
              ...store.surveyOptions,
              menus: splitLines(value),
            })
          }
        />
        <TextArea
          label="良かった点の選択肢"
          value={store.surveyOptions.goodPoints.join("\n")}
          onChange={(value) =>
            update("surveyOptions", {
              ...store.surveyOptions,
              goodPoints: splitLines(value),
            })
          }
        />
        <TextArea
          label="改善点の選択肢"
          value={store.surveyOptions.badPoints.join("\n")}
          onChange={(value) =>
            update("surveyOptions", {
              ...store.surveyOptions,
              badPoints: splitLines(value),
            })
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={save}
          disabled={saving || !store.name || !store.category}
          className="rounded-xl bg-brand hover:bg-brand-hover px-5 py-3 text-sm font-bold text-white disabled:opacity-50 pressable shadow-brand"
        >
          {saving ? "保存中..." : "店舗を保存する"}
        </button>
        {message && <p className="text-sm font-bold text-slate-500">{message}</p>}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed"
      />
    </label>
  );
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
