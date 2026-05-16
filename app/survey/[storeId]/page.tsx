"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getStore } from "@/lib/stores";

// アンケートのステップ
// source → rating → points（評価に応じて内容が変わる）→ generating → result
type Step = "source" | "rating" | "points" | "generating" | "result";

export default function SurveyPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const store = getStore(storeId);

  const [step, setStep] = useState<Step>("source");
  const [source, setSource] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState<string>("");
  const [copied, setCopied] = useState(false);

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

  // 高評価かどうか
  const isPositive = rating >= 4;

  // 評価に応じた選択肢と質問文
  const pointsOptions = isPositive
    ? store.surveyOptions.goodPoints
    : store.surveyOptions.badPoints;

  const pointsQuestion = isPositive
    ? "特に良かったところを教えてください"
    : "改善してほしかった点を教えてください";

  const pointsSubtext = isPositive
    ? "当てはまるものをすべて選んでください（複数可）。"
    : "率直なご意見をお聞かせください（複数可）。";

  // 選択肢トグル
  const togglePoint = (point: string) => {
    setSelectedPoints((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point]
    );
  };

  // 評価が変わったとき選択をリセット
  const handleRatingChange = (val: number) => {
    setRating(val);
    setSelectedPoints([]);
  };

  // AI文章生成
  const generateReview = async () => {
    setStep("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, source, selectedPoints, rating }),
      });
      const data = await res.json();
      setReviewText(data.reviewText);
      setStep("result");
    } catch {
      setReviewText("文章の生成に失敗しました。もう一度お試しください。");
      setStep("result");
    }
  };

  // コピー
  const handleCopy = () => {
    navigator.clipboard.writeText(reviewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // 現在のステップ番号（プログレスバー用）
  const stepNumber: Record<Step, number> = {
    source: 1,
    rating: 2,
    points: 3,
    generating: 3,
    result: 3,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* ヘッダー */}
      <div className="bg-green-500 text-white px-6 py-3 shadow-sm flex items-center gap-3">
        <Image
          src="/logo/logo-v2.png"
          alt="ポチコミ"
          width={80}
          height={28}
          className="object-contain flex-shrink-0"
        />
        <div>
          <p className="text-xs opacity-80">口コミ投稿のご協力をお願いします</p>
          <h1 className="text-lg font-bold leading-tight">{store.name}</h1>
        </div>
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
                    setStep("rating");
                  }}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-medium transition-all ${
                    source === s
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-green-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ステップ2：満足度 */}
        {step === "rating" && (
          <div>
            <StepIndicator current={2} total={3} />
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              全体の満足度は？
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              星の数でお教えください。
            </p>
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className="text-5xl transition-transform hover:scale-110 active:scale-95"
                >
                  <span className={star <= rating ? "text-yellow-400" : "text-gray-200"}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            {/* 評価に応じたラベル */}
            <p className="text-center text-sm font-medium mb-8 h-5">
              {rating === 5 && <span className="text-green-500">とても満足！</span>}
              {rating === 4 && <span className="text-green-400">満足</span>}
              {rating === 3 && <span className="text-gray-400">普通</span>}
              {rating === 2 && <span className="text-gray-400">やや不満</span>}
              {rating === 1 && <span className="text-gray-400">不満</span>}
            </p>

            <button
              onClick={() => setStep("points")}
              className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 transition-colors shadow-sm"
            >
              次へ →
            </button>
          </div>
        )}

        {/* ステップ3：良かった点 or 改善点 */}
        {step === "points" && (
          <div>
            <StepIndicator current={3} total={3} />

            {/* 評価に応じてヘッダーの雰囲気を変える */}
            {isPositive ? (
              <>
                <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
                  {pointsQuestion}
                </h2>
                <p className="text-gray-500 text-sm mb-6">{pointsSubtext}</p>
              </>
            ) : (
              <>
                <div className="mt-4 mb-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    {pointsQuestion}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    ご意見はサービス改善のために活用させていただきます。
                  </p>
                </div>
                <p className="text-gray-500 text-sm mb-6">{pointsSubtext}</p>
              </>
            )}

            <div className="space-y-3">
              {pointsOptions.map((point) => (
                <button
                  key={point}
                  onClick={() => togglePoint(point)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-medium transition-all flex items-center gap-3 ${
                    selectedPoints.includes(point)
                      ? isPositive
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-400 bg-gray-50 text-gray-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    selectedPoints.includes(point)
                      ? isPositive
                        ? "border-green-500 bg-green-500"
                        : "border-gray-500 bg-gray-500"
                      : "border-gray-300"
                  }`}>
                    {selectedPoints.includes(point) && (
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
              onClick={generateReview}
              disabled={selectedPoints.length === 0}
              className={`mt-6 w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm text-white ${
                isPositive
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {isPositive ? "口コミ文章を作成する ✨" : "口コミ文章を作成する"}
            </button>
          </div>
        )}

        {/* ローディング */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-6" />
            <p className="text-gray-700 font-medium text-lg">口コミ文章を作成中...</p>
            <p className="text-gray-400 text-sm mt-2">少々お待ちください</p>
          </div>
        )}

        {/* 結果画面 */}
        {step === "result" && (
          <div>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{isPositive ? "🎉" : "📝"}</div>
              <h2 className="text-xl font-bold text-gray-800">
                口コミ文章ができました！
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                下の文章をコピーして、Googleマップに投稿してください。
              </p>
            </div>

            {/* 生成された文章 */}
            <div className={`border-2 rounded-2xl p-5 mb-4 shadow-sm bg-white ${
              isPositive ? "border-green-200" : "border-gray-200"
            }`}>
              <p className="text-gray-700 text-base leading-relaxed">{reviewText}</p>
            </div>

            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-sm mb-4 text-white ${
                copied
                  ? "bg-green-500"
                  : isPositive
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {copied ? "✅ コピーしました！" : "📋 文章をコピーする"}
            </button>

            {/* Googleマップへのボタン */}
            <a
              href={store.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 rounded-2xl border-2 border-gray-300 text-center font-bold text-gray-700 text-lg hover:border-green-400 hover:text-green-600 transition-all"
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

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            i + 1 <= current ? "bg-green-500" : "bg-gray-200"
          }`}
        />
      ))}
      <span className="text-gray-400 text-xs ml-1 flex-shrink-0">
        {current}/{total}
      </span>
    </div>
  );
}
