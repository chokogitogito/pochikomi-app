import SurveyFlow from "@/components/survey/SurveyFlow";

/**
 * 商談デモ用の来店客アンケート入口。店舗はサーバー側の固定デモ店舗のみ。
 * URLのクエリ（?storeId= 等）は一切参照しない。
 */
export default function DemoSurveyPage() {
  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-md mx-auto mb-4 text-center">
        <h1 className="text-lg md:text-xl font-bold text-text-primary">来店客アンケート体験</h1>
        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
          来店客がスマートフォンで回答する流れです。回答 → 口コミ文の生成 → コピーまでを実演できます。
        </p>
      </div>
      <div className="max-w-md mx-auto rounded-3xl border border-border-default shadow-card overflow-hidden bg-canvas">
        <SurveyFlow mode="demo" embedded />
      </div>
    </div>
  );
}
