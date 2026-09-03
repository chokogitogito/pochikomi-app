import StoreForm from "../StoreForm";

export default function NewStorePage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary display-heading">店舗追加</h1>
        <p className="mt-1 text-sm text-text-secondary">
          業種に依存しない形で、店舗ごとの口コミ導線とアンケート項目を設定します。
        </p>
      </header>
      <StoreForm mode="create" />
    </div>
  );
}
