"use client";

import { useState } from "react";
import {
  AI_NAMES,
  AI_OBSERVATIONS,
  AI_QUESTIONS,
  AI_SEARCH_DATA_LABEL,
  STATUS_LABELS,
  findObservation,
  summarizeByAi,
  type AiObservation,
  type ObservationStatus,
} from "@/lib/demo/aiSearch";
import { DEMO_STORE_NAME } from "@/lib/demo/store";

const STATUS_STYLES: Record<ObservationStatus, { badge: string; card: string; mark: string }> = {
  mentioned: { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", card: "border-emerald-200", mark: "◎" },
  not_mentioned: { badge: "bg-slate-100 text-slate-700 border-slate-300", card: "border-border-default", mark: "×" },
  failed: { badge: "bg-rose-50 text-rose-700 border-rose-200", card: "border-rose-200", mark: "！" },
  unobserved: { badge: "bg-gray-100 text-gray-600 border-gray-300 border-dashed", card: "border-border-default border-dashed", mark: "—" },
};

function StatusBadge({ status }: { status: ObservationStatus }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status].badge}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function ObservationCard({ aiName, observation }: { aiName: string; observation: AiObservation | undefined }) {
  if (!observation) {
    return (
      <div className="bg-surface rounded-2xl p-4 border border-dashed border-border-default">
        <h3 className="text-sm font-bold text-text-primary">{aiName}</h3>
        <p className="text-xs text-text-tertiary mt-2">この質問の観測データはありません。</p>
      </div>
    );
  }

  const answered = observation.status === "mentioned" || observation.status === "not_mentioned";

  return (
    <div className={`bg-surface rounded-2xl p-4 border shadow-card space-y-3 ${STATUS_STYLES[observation.status].card}`} data-testid={`obs-${aiName}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-text-primary">{aiName}</h3>
        <StatusBadge status={observation.status} />
      </div>

      {observation.status === "mentioned" && (
        <dl className="text-xs space-y-1.5">
          <div className="flex gap-2">
            <dt className="text-text-tertiary shrink-0">紹介された位置</dt>
            <dd className="font-bold text-text-primary">回答内で{observation.position}番目</dd>
          </div>
          {observation.reason && (
            <div className="flex gap-2">
              <dt className="text-text-tertiary shrink-0">紹介された理由</dt>
              <dd className="text-text-primary">{observation.reason}</dd>
            </div>
          )}
        </dl>
      )}

      {answered && observation.excerpt && (
        <blockquote className="text-xs text-text-secondary leading-relaxed bg-surface-secondary rounded-xl p-3 border-l-2 border-border-strong">
          {observation.excerpt}
        </blockquote>
      )}

      {answered && (
        <div className="text-xs">
          <p className="text-text-tertiary mb-1">参照元</p>
          {observation.sources.length > 0 ? (
            <ul className="space-y-1">
              {observation.sources.map((s) => (
                <li key={`${s.site}-${s.title}`} className="text-text-primary">
                  {s.title}
                  <span className="text-text-tertiary">（{s.site}）</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-semibold text-amber-800">参照元なし</p>
          )}
        </div>
      )}

      {!answered && observation.statusNote && (
        <p className="text-xs text-text-secondary">{observation.statusNote}</p>
      )}

      <p className="text-[10px] text-text-tertiary pt-1 border-t border-border-subtle">
        {observation.observedAt ? `観測日 ${observation.observedAt}` : "観測日なし"}／{observation.region}／{observation.language}
      </p>
    </div>
  );
}

/** AI検索分析のデモ。表示するのはすべて lib/demo/aiSearch.ts の「サンプル観測」データ */
export default function DemoAiSearch() {
  const [questionId, setQuestionId] = useState(AI_QUESTIONS[0].id);
  const question = AI_QUESTIONS.find((q) => q.id === questionId) ?? AI_QUESTIONS[0];

  const summaries = AI_NAMES.map((name) => summarizeByAi(AI_OBSERVATIONS, name));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="border-b border-border-default pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block text-[11px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">AI検索分析</span>
          <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
            {AI_SEARCH_DATA_LABEL}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary display-heading">
          ChatGPT・Gemini・Claudeでの「{DEMO_STORE_NAME}」の見え方
        </h1>
        <p className="text-text-secondary text-xs md:text-sm mt-1">
          同じ質問を3つのAIに投げたときに、お店の名前が紹介されるかを比較します。この画面の数値は実測ではなく、商談用のサンプル観測です。
        </p>
      </div>

      {/* AI別の言及率 */}
      <section className="space-y-3" aria-labelledby="ai-rate-title">
        <h2 id="ai-rate-title" className="text-lg font-bold text-text-primary">AI別の店舗言及率</h2>
        <div className="grid sm:grid-cols-3 gap-3.5">
          {summaries.map((s) => (
            <div key={s.aiName} className="bg-surface rounded-2xl p-4 border border-border-default shadow-card" data-testid={`rate-${s.aiName}`}>
              <p className="text-[11px] font-bold text-text-tertiary">{s.aiName}</p>
              <p className="text-3xl font-bold text-brand mt-1">
                {s.rate === null ? "—" : `${s.rate}%`}
              </p>
              <p className="text-xs text-text-primary mt-1 font-semibold">
                店名が出た回答 {s.mentioned}件 ÷ 取得できた回答 {s.answered}件
              </p>
              <p className="text-[11px] text-text-tertiary mt-1">
                観測 {s.total}件中、取得失敗 {s.failed}件・未観測 {s.unobserved}件は分母に含めていません。
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 質問×AIの一覧（質問を選ぶと下に詳細） */}
      <section className="space-y-3" aria-labelledby="ai-matrix-title">
        <h2 id="ai-matrix-title" className="text-lg font-bold text-text-primary">質問別の結果一覧</h2>
        <div className="bg-surface rounded-2xl border border-border-default shadow-card overflow-x-auto">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary text-left">
                <th className="py-2.5 px-3 font-bold">質問</th>
                {AI_NAMES.map((name) => (
                  <th key={name} className="py-2.5 px-3 font-bold text-center">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {AI_QUESTIONS.map((q) => (
                <tr key={q.id} className={q.id === questionId ? "bg-brand-light/60" : ""}>
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => setQuestionId(q.id)}
                      aria-pressed={q.id === questionId}
                      className="text-left font-semibold text-text-primary hover:text-brand pressable"
                    >
                      <span className="text-[10px] text-brand bg-brand-light px-1.5 py-0.5 rounded mr-1.5">{q.label}</span>
                      {q.text}
                    </button>
                  </td>
                  {AI_NAMES.map((name) => {
                    const o = findObservation(AI_OBSERVATIONS, name, q.id);
                    return (
                      <td key={name} className="py-2 px-3 text-center">
                        {o ? (
                          <span title={STATUS_LABELS[o.status]} className="font-bold text-text-primary">
                            {STATUS_STYLES[o.status].mark}
                            <span className="sr-only">{STATUS_LABELS[o.status]}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-text-tertiary">
          ◎ 店名が出た ／ × 回答は取得したが店名は出なかった ／ ！ 取得失敗 ／ — 未観測
        </p>
      </section>

      {/* 選択した質問の詳細（3つのAIを横並び） */}
      <section className="space-y-3" aria-labelledby="ai-detail-title">
        <div>
          <h2 id="ai-detail-title" className="text-lg font-bold text-text-primary">質問ごとの回答比較</h2>
          <div className="flex flex-wrap gap-2 mt-2" role="tablist" aria-label="質問を選択">
            {AI_QUESTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                role="tab"
                aria-selected={q.id === questionId}
                onClick={() => setQuestionId(q.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold pressable border transition-all ${
                  q.id === questionId
                    ? "bg-brand text-white border-brand shadow-sm"
                    : "bg-surface text-text-secondary border-border-default hover:text-text-primary"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-text-primary mt-3 font-semibold">質問: 「{question.text}」</p>
        </div>

        <div className="grid md:grid-cols-3 gap-3.5">
          {AI_NAMES.map((name) => (
            <ObservationCard key={name} aiName={name} observation={findObservation(AI_OBSERVATIONS, name, question.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
