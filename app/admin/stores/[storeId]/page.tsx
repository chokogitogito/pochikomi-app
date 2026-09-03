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
    <div className="p-6 md:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary display-heading">店舗編集</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {store.name} の口コミ生成キーワード、GoogleレビューURL、アンケート項目を編集します。
        </p>
      </header>
      <StoreForm mode="edit" initialStore={store} />
    </div>
  );
}
