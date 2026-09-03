"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Logo } from "@/components/Logo";
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
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-3 border-brand-subtle border-t-brand" />
          <p className="text-text-secondary text-sm font-medium">店舗情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <p className="text-text-primary font-bold text-base">店舗情報が見つかりませんでした</p>
          <p className="text-text-secondary text-xs mt-2">QRコードをもう一度読み取ってください。</p>
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
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col">
      {/* Apple風 すりガラスフローティングヘッダー */}
      <header className="sticky top-0 z-30 frosted-nav px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo variant="horizontal" size={24} className="text-brand" />
        </div>
        <div className="bg-surface-secondary px-3 py-1 rounded-full border border-border-subtle">
          <p className="text-xs font-semibold text-text-secondary truncate max-w-[160px]">
            {storeName}
          </p>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-5 pt-6 pb-12 safe-area-bottom flex-1 flex flex-col">
        {/* ステップ1：来店経緯 */}
        {step === "source" && (
          <div>
            <StepIndicator current={1} total={TOTAL_STEPS} />
            <h2 className="text-2xl font-bold text-text-primary display-heading mt-4 mb-1">
              どこで知りましたか？
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              当スタジオを知ったきっかけを教えてください。
            </p>
            <div className="space-y-2.5">
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
            <h2 className="text-2xl font-bold text-text-primary display-heading mt-4 mb-1">
              今回のご利用内容は？
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              当てはまるものを1つ選んでください。
            </p>

            <div className="space-y-2.5">
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
            <h2 className="text-2xl font-bold text-text-primary display-heading mt-4 mb-1">
              {pointsQuestion}
            </h2>
            <p className="text-text-secondary text-sm mb-6">{pointsSubtext}</p>

            <div className="space-y-2.5">
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
              className="mt-6 w-full py-4 rounded-2xl font-bold text-base text-white bg-brand shadow-brand pressable hover:bg-brand-hover disabled:opacity-40 disabled:pointer-events-none"
            >
              次へ進む
            </button>
          </div>
        )}

        {/* ステップ4：星評価とひとこと */}
        {step === "rating" && (
          <div>
            <StepIndicator current={4} total={TOTAL_STEPS} />
            <h2 className="text-2xl font-bold text-text-primary display-heading mt-4 mb-1">
              全体の満足度は？
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              星をタップして教えてください。
            </p>

            <div className="flex justify-center gap-2 mb-3 bg-surface p-4 rounded-2xl border border-border-default shadow-card">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className="w-12 h-12 flex items-center justify-center text-4xl pressable active:scale-90 transition-transform"
                  aria-label={`星${star}`}
                >
                  <span className={star <= rating ? "text-[#f5a623]" : "text-border-default"}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            <p className="text-center text-sm font-semibold mb-6 h-5">
              {rating === 5 && <span className="text-brand">大変満足！</span>}
              {rating === 4 && <span className="text-brand">満足</span>}
              {rating === 3 && <span className="text-text-secondary">普通</span>}
              {rating === 2 && <span className="text-text-secondary">やや不満</span>}
              {rating === 1 && <span className="text-text-secondary">不満</span>}
            </p>

            <div className="mt-4">
              <label htmlFor="comment" className="block text-sm font-bold text-text-primary">
                ひとこと（任意）
              </label>
              <p className="text-text-tertiary text-xs mt-0.5 mb-2.5">
                印象に残ったことや感想があれば教えてください。
              </p>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="例：スイングの原因を数値で説明してもらえて納得できました"
                className="w-full rounded-2xl border border-border-default bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-quaternary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-card"
              />
            </div>

            <button
              onClick={generateReview}
              className="mt-6 w-full py-4 rounded-2xl font-bold text-base text-white bg-brand hover:bg-brand-hover shadow-brand pressable"
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
              <h2 className="text-2xl font-bold text-text-primary display-heading">
                口コミ文章ができました！
              </h2>
              <p className="text-text-secondary text-sm mt-1">
                文体を選んで、自由に書き直してからコピーできます。
              </p>
            </div>

            {generateError && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                文章の作成に失敗しました。「別の文章を作る」をお試しください。
              </div>
            )}

            {/* 文体タブ（iOSセグメントコントロール風） */}
            {drafts.length > 1 && (
              <div className="mb-3.5 flex p-1 bg-surface-secondary rounded-xl border border-border-subtle">
                {drafts.map((draft) => (
                  <button
                    key={draft.tone}
                    onClick={() => setActiveTone(draft.tone)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold pressable transition-all ${
                      activeTone === draft.tone
                        ? "bg-surface text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {toneLabels[draft.tone]}
                  </button>
                ))}
              </div>
            )}

            {/* 編集できる本文 */}
            <div className="rounded-2xl border border-border-default bg-surface p-4 shadow-card">
              <textarea
                value={currentText}
                onChange={(e) =>
                  setTexts((prev) => ({ ...prev, [activeTone]: e.target.value }))
                }
                rows={10}
                className="w-full resize-none bg-transparent text-base leading-relaxed text-text-primary focus:outline-none min-h-[200px]"
                aria-label="口コミ文章"
              />
              <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5">
                <span className="text-xs text-text-tertiary">
                  {currentText.length}文字（目安150〜250文字）
                </span>
                <button
                  onClick={regenerate}
                  disabled={regenerating}
                  className="text-xs font-bold text-brand underline pressable disabled:opacity-40"
                >
                  {regenerating ? "作成中..." : "別の文章を作る"}
                </button>
              </div>
            </div>

            <p className="mt-2.5 text-center text-xs text-text-tertiary">
              気になるところは、そのまま書き直していただけます。
            </p>

            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              disabled={!currentText}
              className={`mt-4 w-full py-4 rounded-2xl font-bold text-base text-white shadow-brand pressable transition-all flex items-center justify-center gap-2 ${
                copied ? "bg-brand-active" : "bg-brand hover:bg-brand-hover"
              } disabled:opacity-40`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>コピーしました！</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-white opacity-85" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>文章をコピーする</span>
                </>
              )}
            </button>

            {/* Googleマップへのボタン。評価に関わらず全員に同じ導線 */}
            {store.googleMapsUrl ? (
              <a
                href={store.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logEvent("review_clicked")}
                className="mt-2.5 block w-full py-4 rounded-2xl border border-border-default bg-surface text-center font-bold text-text-primary text-base shadow-card pressable hover:bg-surface-secondary transition-all"
              >
                Googleマップで投稿する
              </a>
            ) : (
              <p className="mt-2.5 rounded-2xl border border-dashed border-border-default py-4 text-center text-xs text-text-tertiary">
                Googleマップの投稿先が未設定です
              </p>
            )}

            <p className="text-center text-text-tertiary text-xs mt-5 leading-relaxed">
              コピーボタンを押してから、Googleマップのボタンをタップしてください。<br />
              口コミ欄に貼り付けて送信するだけで完了です。
            </p>

            {activeCoupon && (
              <div className="mt-7 rounded-2xl border border-brand-border bg-brand-light p-5 shadow-card">
                <p className="text-sm font-bold text-brand-text">{activeCoupon.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  {activeCoupon.description}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-text-tertiary">
                  ※この特典は口コミ投稿の条件ではありません。アンケートご回答のお礼として発行できます。
                </p>
                {issuedCoupon ? (
                  <div className="mt-3.5 rounded-xl bg-surface p-4 text-center border border-border-subtle">
                    <p className="text-xs text-text-tertiary">クーポンコード</p>
                    <p className="mt-1 text-xl font-bold tracking-wider text-text-primary">
                      {issuedCoupon.code}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      有効期限: {new Date(issuedCoupon.expiresAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={issueCoupon}
                    disabled={couponLoading}
                    className="mt-3.5 w-full rounded-xl bg-surface py-3 text-sm font-bold text-brand shadow-sm pressable hover:bg-surface-secondary border border-border-subtle disabled:opacity-50"
                  >
                    {couponLoading ? "発行中..." : "クーポンを発行する"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
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
      className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between gap-3 min-h-[52px] pressable ${
        selected
          ? "border-brand bg-brand-light text-brand-text font-semibold shadow-sm"
          : "border-border-default bg-surface text-text-primary hover:border-text-secondary/40 shadow-card"
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {multi && (
          <span
            className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
              selected ? "border-brand bg-brand text-white" : "border-border-default bg-transparent"
            }`}
          >
            {selected && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      {!multi && (
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${
            selected ? "text-brand" : "text-border-default opacity-50"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

const GENERATING_MESSAGES = [
  "口コミ文章を作成中...",
  "いただいた回答をまとめています...",
  "自然な文章に整えています...",
];

function Generating() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % GENERATING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Apple風 ミニマル・デュアルリング */}
      <div className="relative w-14 h-14 mb-5">
        <div className="absolute inset-0 rounded-full border-3 border-brand-subtle" />
        <div className="absolute inset-0 rounded-full border-3 border-brand border-t-transparent animate-spin" />
      </div>
      <p className="text-text-primary font-bold text-base display-heading">
        {GENERATING_MESSAGES[index]}
      </p>
      <p className="text-text-tertiary text-xs mt-1.5">少々お待ちください</p>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i + 1 <= current ? "bg-brand" : "bg-border-subtle"
          }`}
        />
      ))}
      <span className="text-text-tertiary text-[11px] font-semibold ml-1.5 flex-shrink-0">
        {current}/{total}
      </span>
    </div>
  );
}
