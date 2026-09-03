import Link from "next/link";
import { getAllMetrics, getCoupons, getStores } from "@/lib/db";

export const dynamic = "force-dynamic";

const planLabels = {
  starter: "スターター",
  growth: "運用支援",
  premium: "上位運用",
};

const statusLabels = {
  active: "運用中",
  setup: "準備中",
  paused: "停止中",
};

export default async function AdminPage() {
  const stores = await getStores();
  const coupons = await getCoupons();
  const metrics = await getAllMetrics();
  const totals = stores.reduce(
    (acc, store) => {
      const item = metrics.find((metric) => metric.storeId === store.id) ?? {
        storeId: store.id,
        surveyStarts: 0,
        generatedReviews: 0,
        reviewClicks: 0,
        couponsIssued: 0,
        averageRating: 0,
      };
      return {
        surveyStarts: acc.surveyStarts + item.surveyStarts,
        generatedReviews: acc.generatedReviews + item.generatedReviews,
        reviewClicks: acc.reviewClicks + item.reviewClicks,
        couponsIssued: acc.couponsIssued + item.couponsIssued,
      };
    },
    { surveyStarts: 0, generatedReviews: 0, reviewClicks: 0, couponsIssued: 0 }
  );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Pochikomi Admin</p>
            <h1 className="mt-1 text-2xl font-bold">管理ダッシュボード</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              店舗、QR、口コミ生成、クーポン、今後のAPI連携をまとめて管理するためのMVP画面です。
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/stores/new"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
            >
              店舗追加
            </Link>
            <Link
              href="/admin/qr"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
            >
              QR管理
            </Link>
            <Link
              href="/admin/coupons"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm"
            >
              クーポン発行
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <Kpi label="アンケート開始" value={totals.surveyStarts} />
          <Kpi label="口コミ文生成" value={totals.generatedReviews} />
          <Kpi label="Google遷移" value={totals.reviewClicks} />
          <Kpi label="クーポン発行" value={totals.couponsIssued} />
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold">店舗一覧</h2>
            <p className="mt-1 text-sm text-slate-500">
              業種を固定せず、店舗ごとにキーワードとアンケート項目を切り替えられる前提です。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">店舗</th>
                  <th className="px-5 py-3 font-bold">業種</th>
                  <th className="px-5 py-3 font-bold">プラン</th>
                  <th className="px-5 py-3 font-bold">状態</th>
                  <th className="px-5 py-3 font-bold">月間目標</th>
                  <th className="px-5 py-3 font-bold">生成/遷移</th>
                  <th className="px-5 py-3 font-bold">導線</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stores.map((store) => {
                  const item = metrics.find((metric) => metric.storeId === store.id) ?? {
                    storeId: store.id,
                    surveyStarts: 0,
                    generatedReviews: 0,
                    reviewClicks: 0,
                    couponsIssued: 0,
                    averageRating: 0,
                  };
                  return (
                    <tr key={store.id}>
                      <td className="px-5 py-4 font-bold text-slate-800">{store.name}</td>
                      <td className="px-5 py-4 text-slate-600">{store.category}</td>
                      <td className="px-5 py-4 text-slate-600">{planLabels[store.plan]}</td>
                      <td className="px-5 py-4 text-slate-600">{statusLabels[store.status]}</td>
                      <td className="px-5 py-4 text-slate-600">{store.monthlyGoal}件</td>
                      <td className="px-5 py-4 text-slate-600">
                        {item.generatedReviews} / {item.reviewClicks}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <Link
                            href={`/admin/stores/${store.id}`}
                            className="text-sm font-bold text-slate-600 underline"
                          >
                            編集
                          </Link>
                          <Link
                            href={`/survey/${store.id}`}
                            className="text-sm font-bold text-green-600 underline"
                          >
                            アンケート
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold">API連携前の準備状況</h2>
            <div className="mt-4 space-y-3">
              <Roadmap title="DB化" body="店舗、クーポン、イベント、口コミ生成履歴を置き換えやすい型に整理済み。" done />
              <Roadmap title="クーポン発行" body="発行APIとアンケート画面の発行導線を追加済み。" done />
              <Roadmap title="イベント計測" body="開始、生成、コピー、Google遷移、クーポン発行を記録するAPI入口を追加済み。" done />
              <Roadmap title="外部API" body="Google Business Profile、順位計測、LINE通知は次フェーズでまとめて接続。" />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold">有効クーポン</h2>
            <div className="mt-4 space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="rounded-lg border border-slate-100 p-4">
                  <p className="text-sm font-bold text-slate-800">{coupon.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {coupon.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    発行済み {coupon.issuedCount}件 / 有効 {coupon.expiresInDays}日
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

function Roadmap({
  title,
  body,
  done,
}: {
  title: string;
  body: string;
  done?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-slate-50 p-4">
      <div
        className={`mt-1 h-3 w-3 rounded-full ${
          done ? "bg-green-500" : "bg-slate-300"
        }`}
      />
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
      </div>
    </div>
  );
}
