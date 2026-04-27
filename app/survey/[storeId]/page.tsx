"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { getStore } from "@/lib/stores";

// アンケートの進行ステップ
type Step = "source" | "goodPoints" | "rating" | "generating" | "result";

export default function SurveyPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const store = getStore(storeId);

  const [step, setStep] = useState<Step>("source");
  const [source, setSource] = useState<string>("");
  const [goodPoints, setGoodPoints] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // 店舗が見つからない場合
  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500 text-lg">店舗情報が見つかりませんでした。</p>
          <p className="text-gray-400 text-sm mt-2">QRコードを再度読み取ってください。</p>
        </div>
      </div>
    );
  }

  // 良かった点の選択トグル
  const toggleGoodPoint = (point: string) => {
    setGoodPoints((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point]
    );
  };

  // AI文章生成を呼び出す
  const generateReview = async () => {
    setStep("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, source, goodPoints, rating }),
      });
      const data = await res.json();
      setReviewText(data.reviewText);
      setStep("result");
    } catch {
      setReviewText("申し訳ありません。文章の生成に失敗しました。もう一度お試しください。");
      setStep("result");
    }
  };

  // コピー処理
  const handleCopy = () => {
    navigator.clipboard.writeText(reviewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* ヘッダー */}
      <div className="bg-orange-500 text-white px-6 py-4 shadow-sm">
        <p className="text-xs opacity-80">口コミ投稿のご協力をお願いします</p>
        <h1 className="text-lg font-bold mt-0.5">{store.name}</h1>
      </div>

      <div className="max-w-md mx-auto px-5 py-8">

        {/* ステップ1：来店経緯 */}
        {step === "source" && (
          <div>
            <StepIndicator current={1} total={3} />
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              どこで知りましたか？
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              当店を知ったきっかけを教えてください。
            </p>
            <div className="space-y-3">
              {store.surveyOptions.sources.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSource(s);
                    setStep("goodPoints");
                  }}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-medium transition-all ${
                    source === s
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ステップ2：良かった点 */}
        {step === "goodPoints" && (
          <div>
            <StepIndicator current={2} total={3} />
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              良かった点を教えてください
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              当てはまるものをすべて選んでください（複数可）。
            </p>
            <div className="space-y-3">
              {store.surveyOptions.goodPoints.map((point) => (
                <button
                  key={point}
                  onClick={() => toggleGoodPoint(point)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-medium transition-all flex items-center gap-3 ${
                    goodPoints.includes(point)
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    goodPoints.includes(point)
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-300"
                  }`}>
                    {goodPoints.includes(point) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  {point}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("rating")}
              disabled={goodPoints.length === 0}
              className="mt-6 w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors shadow-sm"
            >
              次へ →
            </button>
          </div>
        )}

        {/* ステップ3：満足度 */}
        {step === "rating" && (
          <div>
            <StepIndicator current={3} total={3} />
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              全体の満足度は？
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              星の数でお教えください。
            </p>
            <div className="flex justify-center gap-3 mb-10">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-5xl transition-transform hover:scale-110"
                >
                  <span className={star <= rating ? "text-yellow-400" : "text-gray-200"}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={generateReview}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-lg hover:bg-orange-600 transition-colors shadow-sm"
            >
              口コミ文章を作成する ✨
            </button>
          </div>
        )}

        {/* ローディング */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6" />
            <p className="text-gray-700 font-medium text-lg">口コミ文章を作成中...</p>
            <p className="text-gray-400 text-sm mt-2">少々お待ちください</p>
          </div>
        )}

        {/* 結果画面 */}
        {step === "result" && (
          <div>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-gray-800">
                口コミ文章ができました！
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                下の文章をコピーして、Googleマップに投稿してください。
              </p>
            </div>

            {/* 生成された文章 */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 mb-4 shadow-sm">
              <p className="text-gray-700 text-base leading-relaxed">{reviewText}</p>
            </div>

            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-sm mb-4 ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              {copied ? "✅ コピーしました！" : "📋 文章をコピーする"}
            </button>

            {/* Googleマップへのボタン */}
            <a
              href={store.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 rounded-2xl border-2 border-gray-300 text-center font-bold text-gray-700 text-lg hover:border-orange-400 hover:text-orange-600 transition-all"
            >
              🗺️ Googleマップで投稿する
            </a>

            <p className="text-center text-gray-400 text-xs mt-5 leading-relaxed">
              コピーボタンを押してから、<br />
              Googleマップのボタンをタップしてください。<br />
              口コミ欄に貼り付けて送信するだけで完了です。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ステップインジケーター（上部の進行バー）
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            i + 1 <= current ? "bg-orange-500" : "bg-gray-200"
          }`}
        />
      ))}
      <span className="text-gray-400 text-xs ml-1 flex-shrink-0">
        {current}/{total}
      </span>
    </div>
  );
}
