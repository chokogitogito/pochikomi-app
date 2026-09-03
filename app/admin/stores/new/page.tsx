import Link from "next/link";
import StoreForm from "../StoreForm";

export default function NewStorePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-bold text-brand hover:underline">
          管理画面へ戻る
        </Link>
        <h1 className="mt-4 text-2xl font-bold">店舗追加</h1>
        <p className="mt-2 text-sm text-slate-500">
          業種に依存しない形で、店舗ごとの口コミ導線とアンケート項目を設定します。
        </p>
        <div className="mt-6">
          <StoreForm mode="create" />
        </div>
      </div>
    </main>
  );
}
