import "server-only";

import {
  buildReplyPrompt,
  parseReplyDrafts,
  buildMockReplyDrafts,
  checkNgWords,
  type ReplyDraftItem,
  type ReplyPromptParams,
} from "@/lib/replyPrompt";
import { DEMO_STORE_NAME } from "@/lib/demo/store";
import {
  DEMO_REPLY_NG_WORDS,
  DEMO_REPLY_POLICY_NOTE,
  DEMO_REPLY_SIGNATURE,
  type DemoReview,
} from "@/lib/demo/reviews";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 12000;

export type DemoGeneratedDraft = { tone: ReplyDraftItem["tone"]; draftText: string };
export type DemoDraftResult = {
  drafts: DemoGeneratedDraft[];
  /** gemini=AI生成 / fallback=サンプル案（APIキー未設定・生成失敗・NGワード検出） */
  source: "gemini" | "fallback";
  ngWordsDetected: string[];
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

/**
 * デモ口コミに対する返信下書きを生成する。
 * 既存の返信プロンプト・パーサ・NGワード検査をそのまま使い、DBへは何も保存しない。
 * 口コミ本文は引数の固定データから取り、クライアント入力は受け取らない。
 */
export async function generateDemoReplyDrafts(review: DemoReview): Promise<DemoDraftResult> {
  const params: ReplyPromptParams = {
    storeName: DEMO_STORE_NAME,
    storeCallName: DEMO_STORE_NAME,
    starRating: review.stars,
    reviewerName: review.reviewer,
    comment: review.comment,
    policyNote: DEMO_REPLY_POLICY_NOTE,
    ngWords: DEMO_REPLY_NG_WORDS,
  };

  let generated: ReplyDraftItem[] = [];
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const response = await withTimeout(
        ai.models.generateContent({
          model: MODEL,
          contents: buildReplyPrompt(params),
          config: { temperature: 0.7, responseMimeType: "application/json" },
        }),
        TIMEOUT_MS
      );
      generated = parseReplyDrafts(response.text ?? "");
    } catch (error) {
      console.error("[demo/reply] Gemini generation failed, using sample drafts:", error);
    }
  }

  let source: DemoDraftResult["source"] = generated.length > 0 ? "gemini" : "fallback";
  const mock = buildMockReplyDrafts(params);
  if (generated.length === 0) generated = mock;

  const ngWordsDetected: string[] = [];
  const drafts = generated.map((d) => {
    let body = d.body;
    const found = checkNgWords(body, DEMO_REPLY_NG_WORDS);
    if (found.length > 0) {
      for (const w of found) if (!ngWordsDetected.includes(w)) ngWordsDetected.push(w);
      body = (mock.find((m) => m.tone === d.tone) ?? mock[0]).body;
      source = "fallback";
    }
    if (!body.includes(DEMO_REPLY_SIGNATURE)) body = `${body}\n\n${DEMO_REPLY_SIGNATURE}`;
    return { tone: d.tone, draftText: body };
  });

  return { drafts, source, ngWordsDetected };
}
