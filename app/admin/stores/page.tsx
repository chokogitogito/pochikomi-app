import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserStores } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const stores = await getUserStores(user.id);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="border-b border-border-default pb-4">
        <h1 className="text-2xl font-bold text-text-primary display-heading">店舗管理</h1>
        <p className="mt-1 text-sm text-text-secondary">
          管理対象の店舗設定、キーワード、アンケート設問、GoogleマップレビューURLを管理します。
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        {stores.map((store) => (
          <div
            key={store.id}
            className="rounded-2xl border border-border-default bg-surface p-6 shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
                  {store.category}
                </span>
                <span className="text-[10px] text-text-tertiary">ID: {store.id}</span>
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-2">{store.name}</h2>
              <div className="space-y-1.5 text-xs text-text-secondary mb-4">
                <p>
                  <span className="font-semibold text-text-tertiary">キーワード:</span>{" "}
                  {store.keywords?.join("、") || "未設定"}
                </p>
                <p>
                  <span className="font-semibold text-text-tertiary">月間目標:</span>{" "}
                  {store.monthlyGoal}件/月
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
              <Link
                href={`/admin/stores/${store.id}`}
                className="flex-1 py-2 px-3 rounded-xl bg-brand text-white text-xs font-bold text-center pressable shadow-xs hover:bg-brand-dark transition-all"
              >
                店舗設定を編集
              </Link>
              <Link
                href={`/survey/${store.id}`}
                target="_blank"
                className="py-2 px-3 rounded-xl bg-surface border border-border-default text-text-primary text-xs font-bold text-center pressable hover:bg-surface-secondary transition-all"
              >
                アンケート表示
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
