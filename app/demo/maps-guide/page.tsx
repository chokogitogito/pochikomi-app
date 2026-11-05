import Link from "next/link";
import { DEMO_MAPS_GUIDE_NOTE } from "@/lib/demo/store";

/** Googleマップの口コミ投稿画面の代わりに、デモで案内する画面 */
export default function DemoMapsGuidePage() {
  return (
    <div className="px-4 py-10">
      <div className="max-w-md mx-auto bg-surface rounded-3xl border border-border-default shadow-card p-6 text-center space-y-4">
        <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
          デモ用の案内画面
        </span>
        <h1 className="text-xl font-bold text-text-primary">ここでGoogleマップの投稿画面が開きます</h1>
        <p className="text-sm text-text-secondary leading-relaxed">{DEMO_MAPS_GUIDE_NOTE}</p>
        <ol className="text-left text-xs text-text-secondary space-y-1.5 bg-surface-secondary rounded-xl p-4 list-decimal list-inside">
          <li>アンケートに答えて、AIが作った口コミ文を確認する</li>
          <li>必要なら文章を書き直して「文章をコピーする」を押す</li>
          <li>Googleマップの口コミ欄に貼り付けて、お客様ご自身が投稿する</li>
        </ol>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/demo/survey"
            className="w-full py-3 rounded-2xl bg-brand text-white font-bold text-sm shadow-brand pressable"
          >
            アンケートをもう一度体験する
          </Link>
          <Link
            href="/demo"
            className="w-full py-3 rounded-2xl border border-border-default bg-surface text-text-primary font-bold text-sm pressable"
          >
            デモのダッシュボードへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
