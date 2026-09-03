// アンケート回答から口コミ文章を3パターン生成するAPI。
// Gemini APIを使い、APIキー未設定・失敗・タイムアウト時はモックへフォールバックする。

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { buildPrompt, type SurveyAnswers } from "@/lib/prompt";
import { buildMockDrafts } from "@/lib/mockReview";
import type { ReviewDraft, ReviewTone } from "@/lib/types";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 12000;
const TONES: ReviewTone[] = ["friendly", "standard", "polite"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const store = await getStore(String(body.storeId ?? ""));

  if (!store) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }

  const answers: SurveyAnswers = {
    source: String(body.source ?? ""),
    menu: String(body.menu ?? ""),
    rating: Number(body.rating) || 5,
    selectedPoints: Array.isArray(body.selectedPoints) ? body.selectedPoints.map(String) : [],
    comment: String(body.comment ?? ""),
  };

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const drafts = await generateWithGemini(apiKey, buildPrompt(store, answers));
      if (drafts.length > 0) {
        return NextResponse.json({ drafts, source: "gemini" });
      }
    } catch (error) {
      console.error("[generate] Gemini生成に失敗したためモックへ切り替えます", error);
    }
  }

  return NextResponse.json({
    drafts: buildMockDrafts(store, answers),
    source: apiKey ? "mock-fallback" : "mock",
  });
}

async function generateWithGemini(apiKey: string, prompt: string): Promise<ReviewDraft[]> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 1.0,
        responseMimeType: "application/json",
      },
    }),
    TIMEOUT_MS
  );

  return parseDrafts(response.text ?? "");
}

/**
 * モデルの出力ゆらぎ（コードフェンス付き、オブジェクト包み等）を吸収してJSONを取り出す。
 */
function parseDrafts(raw: string): ReviewDraft[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { drafts?: unknown })?.drafts)
      ? (parsed as { drafts: unknown[] }).drafts
      : [];

  return list
    .map((item, index): ReviewDraft | null => {
      if (!item || typeof item !== "object") return null;
      const text = String((item as { text?: unknown }).text ?? "").trim();
      if (!text) return null;

      const rawTone = String((item as { tone?: unknown }).tone ?? "");
      const tone = TONES.includes(rawTone as ReviewTone)
        ? (rawTone as ReviewTone)
        : TONES[index] ?? "standard";

      return { tone, text };
    })
    .filter((draft): draft is ReviewDraft => draft !== null);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)
    ),
  ]);
}
