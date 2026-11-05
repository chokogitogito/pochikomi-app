"use client";

import { useRef, useState } from "react";
import {
  DEMO_REVIEWS,
  applyGeneratedDraft,
  approveReply,
  countByStatus,
  editDraft,
  revokeApproval,
  type DemoReplyStatus,
  type DemoReview,
} from "@/lib/demo/reviews";
import { useDemoReplyState } from "@/lib/demo/replyStore";

type Tone = "polite" | "standard" | "friendly";
type Candidate = { tone: Tone; draftText: string };

const TONE_LABELS: Record<Tone, string> = { friendly: "親しみ", standard: "標準", polite: "丁寧" };

const STATUS_LABELS: Record<DemoReplyStatus, string> = {
  unreplied: "未対応",
  drafted: "AI下書き・承認待ち",
  approved: "承認済み",
};

const STATUS_STYLES: Record<DemoReplyStatus, string> = {
  unreplied: "bg-rose-50 text-rose-700 border-rose-200",
  drafted: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const KIND_LABELS: Record<DemoReview["kind"], string> = {
  positive: "好意的",
  improvement: "改善要望",
  negative: "低評価",
};

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`星${value}`} className="text-[#f5a623] tracking-tight">
      {"★".repeat(value)}
      <span className="text-border-default">{"★".repeat(5 - value)}</span>
    </span>
  );
}

/**
 * 口コミ返信デモ。
 * 編集・承認の状態はこのブラウザタブ（sessionStorage）だけに保持する。
 * サーバーへは「どのデモ口コミか」のIDしか送らず、DB・実店舗の口コミ管理には何も書き込まない。
 */
export default function DemoReviewInbox() {
  const { state, update, reset } = useDemoReplyState();
  const [selectedId, setSelectedId] = useState<string>(DEMO_REVIEWS[0].id);
  const [filter, setFilter] = useState<DemoReplyStatus | "all">("all");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ kind: "info" | "warn"; text: string } | null>(null);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [activeTone, setActiveTone] = useState<Record<string, Tone>>({});
  const requestSeq = useRef(0);

  const counts = countByStatus(state);
  const review = DEMO_REVIEWS.find((r) => r.id === selectedId) ?? DEMO_REVIEWS[0];
  const entry = state[review.id];
  const visibleReviews = DEMO_REVIEWS.filter((r) => filter === "all" || state[r.id].status === filter);

  const selectReview = (id: string) => {
    setSelectedId(id);
    setMessage(null);
  };

  const generate = async () => {
    const targetId = review.id;
    const seq = ++requestSeq.current;
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/demo/reviews/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: targetId }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.drafts) || data.drafts.length === 0) {
        throw new Error(data?.error || "生成に失敗しました");
      }
      if (seq !== requestSeq.current) return; // 後から押された生成を優先
      const list: Candidate[] = data.drafts;
      const preferred = list.find((d) => d.tone === "standard") ?? list[0];
      const source = data.source === "gemini" ? "ai" : "fallback";
      setCandidates((prev) => ({ ...prev, [targetId]: list }));
      setActiveTone((prev) => ({ ...prev, [targetId]: preferred.tone }));
      update((prev) => applyGeneratedDraft(prev, targetId, preferred.draftText, source));
      setMessage(
        source === "ai"
          ? { kind: "info", text: "AIが返信案を作成しました。必要なら文面を編集してから承認してください。" }
          : { kind: "warn", text: "AIでの生成ができなかったため、サンプルの返信案を表示しています（AI生成ではありません）。" }
      );
    } catch {
      if (seq !== requestSeq.current) return;
      setMessage({ kind: "warn", text: "返信案を作成できませんでした。時間をおいて再度お試しください。" });
    } finally {
      if (seq === requestSeq.current) setGenerating(false);
    }
  };

  const switchTone = (tone: Tone) => {
    const cand = candidates[review.id]?.find((c) => c.tone === tone);
    if (!cand || entry.status === "approved") return;
    setActiveTone((prev) => ({ ...prev, [review.id]: tone }));
    const source = entry.source === "fallback" ? "fallback" : "ai";
    update((prev) => applyGeneratedDraft(prev, review.id, cand.draftText, source));
  };

  const resetDemo = () => {
    requestSeq.current += 1;
    setGenerating(false);
    reset();
    setCandidates({});
    setActiveTone({});
    setFilter("all");
    setSelectedId(DEMO_REVIEWS[0].id);
    setMessage({ kind: "info", text: "デモを初期状態に戻しました。" });
  };

  const sourceNote =
    entry.source === "sample"
      ? "サンプルの下書き"
      : entry.source === "ai"
        ? "AI生成"
        : entry.source === "fallback"
          ? "サンプル案（AI生成に失敗したため）"
          : entry.source === "manual"
            ? "手入力"
            : null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border-default pb-5">
        <div>
          <span className="inline-block text-[11px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full mb-1">口コミ返信</span>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">口コミ返信の受信箱</h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            口コミを開き、AIの返信案を確認・編集して承認します。この画面の操作はデモ上の状態変更で、実店舗の口コミ管理には影響しません。
          </p>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="self-start sm:self-auto text-xs font-bold px-3.5 py-2 rounded-xl border border-border-default bg-surface text-text-primary hover:bg-surface-secondary pressable"
        >
          デモをリセット
        </button>
      </div>

      {/* ステータス絞り込み */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="対応状況で絞り込み">
        {(["all", "unreplied", "drafted", "approved"] as const).map((key) => {
          const label = key === "all" ? "すべて" : STATUS_LABELS[key];
          const count = key === "all" ? DEMO_REVIEWS.length : counts[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold pressable border transition-all ${
                filter === key ? "bg-brand text-white border-brand shadow-sm" : "bg-surface text-text-secondary border-border-default"
              }`}
            >
              {label} <span className="opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5">
        {/* 一覧 */}
        <ul className="space-y-2.5" aria-label="口コミ一覧">
          {visibleReviews.length === 0 && (
            <li className="text-xs text-text-tertiary bg-surface rounded-2xl border border-dashed border-border-default p-6 text-center">
              この状態の口コミはありません。
            </li>
          )}
          {visibleReviews.map((r) => {
            const e = state[r.id];
            const active = r.id === review.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => selectReview(r.id)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full text-left bg-surface rounded-2xl border p-4 shadow-card pressable transition-all ${
                    active ? "border-brand ring-1 ring-brand" : "border-border-default hover:border-border-strong"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                      {r.reviewer}
                      <Stars value={r.stars} />
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[e.status]}`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{r.comment}</p>
                  <p className="text-[10px] text-text-tertiary mt-1.5">
                    {r.postedAt}／{KIND_LABELS[r.kind]}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        {/* 詳細・返信案 */}
        <section className="bg-surface rounded-2xl border border-border-default shadow-card p-5 space-y-4 self-start" aria-label="返信案の確認">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                {review.reviewer}
                <Stars value={review.stars} />
              </h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[entry.status]}`} data-testid="reply-status">
                {STATUS_LABELS[entry.status]}
              </span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed mt-2 bg-surface-secondary rounded-xl p-3">{review.comment}</p>
            <p className="text-[10px] text-text-tertiary mt-1">{review.postedAt}／{KIND_LABELS[review.kind]}の口コミ（サンプル）</p>
          </div>

          {entry.status === "approved" ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-emerald-700 mb-1.5">承認済みの返信文（最終文面）</p>
                <p className="whitespace-pre-wrap text-sm text-text-primary leading-relaxed bg-emerald-50 border border-emerald-200 rounded-xl p-3" data-testid="approved-text">
                  {entry.text}
                </p>
                <p className="text-[11px] text-text-tertiary mt-2 leading-relaxed">
                  承認はデモ上の状態変更です。実際の運用では、この返信文をコピーして、Googleマップ側で担当者が投稿します。
                </p>
              </div>
              <button
                type="button"
                onClick={() => update((prev) => revokeApproval(prev, review.id))}
                className="text-xs font-bold px-3.5 py-2 rounded-xl border border-border-default bg-surface text-text-primary hover:bg-surface-secondary pressable"
              >
                承認を取り消して編集する
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="reply-text" className="text-xs font-bold text-text-primary">
                  返信案{sourceNote && <span className="ml-2 text-[10px] font-semibold text-text-tertiary">（{sourceNote}{entry.edited ? "・編集済み" : ""}）</span>}
                </label>
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand text-white shadow-xs pressable disabled:opacity-50"
                >
                  {generating ? "作成中…" : entry.status === "unreplied" ? "AIで下書きを作成" : "AIで下書きを作り直す"}
                </button>
              </div>

              {(candidates[review.id]?.length ?? 0) > 1 && (
                <div className="flex p-1 bg-surface-secondary rounded-xl border border-border-subtle" role="tablist" aria-label="文体">
                  {candidates[review.id].map((c) => (
                    <button
                      key={c.tone}
                      type="button"
                      role="tab"
                      aria-selected={activeTone[review.id] === c.tone}
                      onClick={() => switchTone(c.tone)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold pressable transition-all ${
                        activeTone[review.id] === c.tone ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary"
                      }`}
                    >
                      {TONE_LABELS[c.tone]}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                id="reply-text"
                value={entry.text}
                onChange={(e) => update((prev) => editDraft(prev, review.id, e.target.value))}
                rows={8}
                maxLength={1000}
                placeholder="「AIで下書きを作成」を押すと、返信案がここに入ります。自分で書くこともできます。"
                className="w-full rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm leading-relaxed text-text-primary placeholder:text-text-quaternary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />

              {message && (
                <p
                  role="status"
                  className={`text-xs rounded-xl px-3 py-2 border ${
                    message.kind === "warn" ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-brand-light border-brand-border text-brand-text"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-text-tertiary">{entry.text.length}文字</span>
                <button
                  type="button"
                  onClick={() => update((prev) => approveReply(prev, review.id))}
                  disabled={entry.status !== "drafted"}
                  className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-bold shadow-brand pressable disabled:opacity-40 disabled:pointer-events-none"
                >
                  この内容で承認する
                </button>
              </div>
            </div>
          )}
          {entry.status === "approved" && message && (
            <p role="status" className="text-xs rounded-xl px-3 py-2 border bg-brand-light border-brand-border text-brand-text">{message.text}</p>
          )}
        </section>
      </div>
    </div>
  );
}
