import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import StoreForm from "../StoreForm";

export const dynamic = "force-dynamic";

export default async function EditStorePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStore(storeId);

  if (!store) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-bold text-green-600 underline">
          管理画面へ戻る
        </Link>
        <h1 className="mt-4 text-2xl font-bold">店舗編集</h1>
        <p className="mt-2 text-sm text-slate-500">
          {store.name} の口コミ生成キーワード、GoogleレビューURL、アンケート項目を編集します。
        </p>
        <div className="mt-6">
          <StoreForm mode="edit" initialStore={store} />
        </div>
      </div>
    </main>
  );
}
