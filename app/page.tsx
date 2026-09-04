import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full text-center">
        <div className="flex justify-center mb-6">
          <Logo size={44} />
        </div>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed">
          店舗のQRコードを読み取って、<br />
          かんたんなアンケートと口コミ作成をご利用いただけます。
        </p>

        <div className="bg-surface border border-border-default rounded-3xl p-6 shadow-card">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-light text-brand flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0a2 2 0 104 0m-4 0a2 2 0 114 0m-8 4v1m0-1a2 2 0 10-4 0m4 0a2 2 0 11-4 0m0-6H4m6-6v1m0-1a2 2 0 10-4 0m4 0a2 2 0 11-4 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm font-medium">
            卓上POPのQRコードをスキャンしてください
          </p>
        </div>

        {/* 開発用テストリンク。NEXT_PUBLIC_SHOW_DEV_LINKS=true のときだけ表示 */}
        {process.env.NEXT_PUBLIC_SHOW_DEV_LINKS === "true" && (
          <div className="mt-10 pt-6 border-t border-border-subtle">
            <p className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase mb-3">
              開発・デモ用リンク
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/survey/classic"
                className="py-2.5 px-4 rounded-xl bg-surface border border-border-default text-sm font-bold text-brand shadow-sm pressable hover:bg-surface-secondary"
              >
                The蔵ssic アンケートを開く
              </Link>
              <Link
                href="/survey/ss-grand"
                className="py-2.5 px-4 rounded-xl bg-surface border border-border-default text-sm font-bold text-text-secondary shadow-sm pressable hover:bg-surface-secondary"
              >
                SS.GRAND アンケートを開く
              </Link>
              <Link
                href="/survey/golf"
                className="py-2.5 px-4 rounded-xl bg-surface border border-border-default text-sm font-bold text-text-secondary shadow-sm pressable hover:bg-surface-secondary"
              >
                ゴルフ場（商談デモ用）アンケートを開く
              </Link>
              <Link
                href="/admin"
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-text-secondary pressable hover:text-text-primary underline"
              >
                管理者ダッシュボードを開く
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
