"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import type { Coupon, ReviewDraft, ReviewTone, Store } from "@/lib/types";

// アンケートのステップ
// source (きっかけ) → menu (メニュー) → points (良かった点) → rating (満足度＆ひとこと) → generating → result
type Step = "source" | "menu" | "points" | "rating" | "generating" | "result";

type IssuedCoupon = {
  title: string;
  description: string;
  code: string;
  expiresAt: string;
};

const TOTAL_STEPS = 4;

const toneLabels: Record<ReviewTone, string> = {
  friendly: "親しみ",
  standard: "標準",
  polite: "丁寧",
};

export default function SurveyPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [store, setStore] = useState<Store | null>(null);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [step, setStep] = useState<Step>("source");
  const [source, setSource] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [menu, setMenu] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [activeTone, setActiveTone] = useState<ReviewTone>("standard");
  // 文体を切り替えても編集内容が消えないよう、文体ごとに本文を保持する
  const [texts, setTexts] = useState<Partial<Record<ReviewTone, string>>>({});
  const [generateError, setGenerateError] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [copied, setCopied] = useState(false);
  const [issuedCoupon, setIssuedCoupon] = useState<IssuedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/stores/${storeId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setStore(data.store);
        setActiveCoupon(data.primaryCoupon);
      })
      .catch(() => {
        setStore(null);
        setActiveCoupon(null);
      })
      .finally(() => setLoadingStore(false));
  }, [storeId]);

  if (loadingStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-green-500" />
          <p className="text-gray-500 text-lg">店舗情報を読み込み中です。</p>
        </div>
      </div>
    );
  }

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

  const storeName = store.shortName || store.name;



  const logEvent = (type: string, payload?: Record<string, unknown>) => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, type, payload }),
    }).catch(() => undefined);
  };

  const pointsOptions = store.surveyOptions.goodPoints;
  const pointsQuestion = "特に良かったところ・印象に残った点を教えてください";
  const pointsSubtext = "当てはまるものをすべて選んでください（複数可）。";

  const togglePoint = (point: string) => {
    setSelectedPoints((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point]
    );
  };

  const handleRatingChange = (val: number) => {
    setRating(val);
  };

  const requestDrafts = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, source, menu, rating, selectedPoints, comment }),
    });
    const data = await res.json();
    const list: ReviewDraft[] = Array.isArray(data.drafts) ? data.drafts : [];
    if (list.length === 0) throw new Error("no drafts");

    setDrafts(list);
    setTexts(Object.fromEntries(list.map((d) => [d.tone, d.text])));

    const preferred = list.find((d) => d.tone === "standard") ?? list[0];
    setActiveTone(preferred.tone);
    setGenerateError(false);
  };

  const generateReview = async () => {
    setStep("generating");
    try {
      await requestDrafts();
      logEvent("review_generated", { rating, selectedPoints, menu });
    } catch {
      setGenerateError(true);
    }
    setStep("result");
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      await requestDrafts();
      logEvent("review_generated", { rating, selectedPoints, menu, regenerated: true });
    } catch {
      setGenerateError(true);
    } finally {
      setRegenerating(false);
    }
  };

  const currentText = texts[activeTone] ?? "";

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText).then(() => {
      setCopied(true);
      logEvent("review_copied", { tone: activeTone });
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const issueCoupon = async () => {
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      setIssuedCoupon(data.coupon);
      logEvent("coupon_issued");
    } finally {
      setCouponLoading(false);
    }
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
          <h1 className="text-lg font-bold leading-tight">{storeName}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-8">

        {/* ステップ1：来店経緯 */}
        {step === "source" && (
          <div>
            <StepIndicator current={1} total={TOTAL_STEPS} />
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              どこで知りましたか？
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              当スタジオを知ったきっかけを教えてください。
            </p>
            <div className="space-y-3">
              {store.surveyOptions.sources.map((s) => (
                <ChoiceButton
                  key={s}
                  label={s}
                  selected={source === s}
                  onClick={() => {
                    setSource(s);
                    logEvent("survey_started", { source: s });
                    setStep("menu");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ステップ2：利用メニュー */}
        {step === "menu" && (
          <div>
            <StepIndicator current={2} total={TOTAL_STEPS} />
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              今回ご利用いただいた内容は？
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              当てはまるものを1つ選んでください。
            </p>

            <div className="space-y-3">
              {store.surveyOptions.menus.map((item) => (
                <ChoiceButton
                  key={item}
                  label={item}
                  selected={menu === item}
                  onClick={() => {
                    setMenu(item);
                    setStep("points");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ステップ3：良かった点・印象に残った点 */}
        {step === "points" && (
          <div>
            <StepIndicator current={3} total={TOTAL_STEPS} />
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              {pointsQuestion}
            </h2>
            <p className="text-gray-500 text-sm mb-6">{pointsSubtext}</p>

            <div className="space-y-3">
              {pointsOptions.map((point) => (
                <ChoiceButton
                  key={point}
                  label={point}
                  selected={selectedPoints.includes(point)}
                  multi
                  onClick={() => togglePoint(point)}
                />
              ))}
            </div>

            <button
              onClick={() => setStep("rating")}
              disabled={selectedPoints.length === 0}
              className="mt-6 w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm text-white bg-green-500 hover:bg-green-600"
            >
              次へ
            </button>
          </div>
        )}

        {/* ステップ4：星評価とひとこと */}
        {step === "rating" && (
          <div>
            <StepIndicator current={4} total={TOTAL_STEPS} />
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
              全体の満足度は？
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              星の数で教えてください。
            </p>
            <div className="flex justify-center gap-3 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className="text-5xl transition-transform hover:scale-110 active:scale-95"
                  aria-label={`星${star}`}
                >
                  <span className={star <= rating ? "text-yellow-400" : "text-gray-200"}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            <p className="text-center text-sm font-medium mb-6 h-5">
              {rating === 5 && <span className="text-green-500">とても満足！</span>}
              {rating === 4 && <span className="text-green-400">満足</span>}
              {rating === 3 && <span className="text-gray-400">普通</span>}
              {rating === 2 && <span className="text-gray-400">やや不満</span>}
              {rating === 1 && <span className="text-gray-400">不満</span>}
            </p>

            <div className="mt-4">
              <label htmlFor="comment" className="block text-base font-bold text-gray-800">
                ひとこと（任意）
              </label>
              <p className="text-gray-500 text-sm mt-1 mb-3">
                印象に残ったことや感想があれば教えてください。
              </p>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="例：スイングの原因を数値で説明してもらえて納得できました"
                className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-700 placeholder:text-gray-300 focus:border-green-400 focus:outline-none"
              />
            </div>

            <button
              onClick={generateReview}
              className="mt-6 w-full py-4 rounded-2xl font-bold text-lg transition-colors shadow-sm text-white bg-green-500 hover:bg-green-600"
            >
              口コミ文章を作成する
            </button>
          </div>
        )}

        {/* ローディング */}
        {step === "generating" && <Generating />}

        {/* 結果画面 */}
        {step === "result" && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                口コミ文章ができました！
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                文体を選んで、自由に書き直してからコピーできます。
              </p>
            </div>

            {generateError && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                文章の作成に失敗しました。「別の文章を作る」をお試しください。
              </div>
            )}

            {/* 文体タブ */}
            {drafts.length > 1 && (
              <div className="mb-3 flex gap-2">
                {drafts.map((draft) => (
                  <button
                    key={draft.tone}
                    onClick={() => setActiveTone(draft.tone)}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-bold transition-colors ${
                      activeTone === draft.tone
                        ? "bg-green-500 text-white"
                        : "bg-white text-gray-500 border border-gray-200"
                    }`}
                  >
                    {toneLabels[draft.tone]}
                  </button>
                ))}
              </div>
            )}

            {/* 編集できる本文 */}
            <div className="rounded-2xl border-2 border-green-200 bg-white p-4 shadow-sm">
              <textarea
                value={currentText}
                onChange={(e) =>
                  setTexts((prev) => ({ ...prev, [activeTone]: e.target.value }))
                }
                rows={10}
                className="w-full resize-none bg-transparent text-base leading-relaxed text-gray-700 focus:outline-none min-h-[200px]"
                aria-label="口コミ文章"
              />
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-xs text-gray-400">
                  {currentText.length}文字（目安150〜250文字）
                </span>
                <button
                  onClick={regenerate}
                  disabled={regenerating}
                  className="text-xs font-bold text-green-600 underline disabled:opacity-40"
                >
                  {regenerating ? "作成中..." : "別の文章を作る"}
                </button>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-gray-400">
              気になるところは、そのまま書き直していただけます。
            </p>

            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              disabled={!currentText}
              className="mt-4 w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-sm mb-4 text-white bg-green-500 hover:bg-green-600 disabled:opacity-40"
            >
              {copied ? "コピーしました" : "文章をコピーする"}
            </button>

            {/* Googleマップへのボタン。評価に関わらず全員に同じ導線を出す。 */}
            {store.googleMapsUrl ? (
              <a
                href={store.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logEvent("review_clicked")}
                className="block w-full py-4 rounded-2xl border-2 border-gray-300 text-center font-bold text-gray-700 text-lg hover:border-green-400 hover:text-green-600 transition-all"
              >
                Googleマップで投稿する
              </a>
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-gray-200 py-4 text-center text-sm text-gray-400">
                Googleマップの投稿先が未設定です
              </p>
            )}

            <p className="text-center text-gray-400 text-xs mt-5 leading-relaxed">
              コピーボタンを押してから、<br />
              Googleマップのボタンをタップしてください。<br />
              口コミ欄に貼り付けて送信するだけで完了です。
            </p>

            {activeCoupon && (
              <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-5">
                <p className="text-sm font-bold text-green-800">{activeCoupon.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-green-700">
                  {activeCoupon.description}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-green-700">
                  この特典は口コミ投稿の条件ではありません。アンケート回答のお礼として発行できます。
                </p>
                {issuedCoupon ? (
                  <div className="mt-4 rounded-xl bg-white p-4 text-center">
                    <p className="text-xs text-gray-400">クーポンコード</p>
                    <p className="mt-1 text-xl font-bold tracking-wide text-gray-800">
                      {issuedCoupon.code}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      有効期限: {new Date(issuedCoupon.expiresAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={issueCoupon}
                    disabled={couponLoading}
                    className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-green-700 shadow-sm disabled:opacity-50"
                  >
                    {couponLoading ? "発行中..." : "クーポンを発行する"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChoiceButton({
  label,
  selected,
  multi,
  onClick,
}: {
  label: string;
  selected: boolean;
  multi?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-medium transition-all flex items-center gap-3 ${
        selected
          ? "border-green-500 bg-green-50 text-green-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-green-300"
      }`}
    >
      {multi && (
        <span
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
            selected ? "border-green-500 bg-green-500" : "border-gray-300"
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      )}
      {label}
    </button>
  );
}

function Generating() {
  const messages = [
    "口コミ文章を作成中...",
    "いただいた回答をまとめています...",
    "もう少しで完成します...",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => Math.min(prev + 1, messages.length - 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-6" />
      <p className="text-gray-700 font-medium text-lg">{messages[index]}</p>
      <p className="text-gray-400 text-sm mt-2">少々お待ちください</p>
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
