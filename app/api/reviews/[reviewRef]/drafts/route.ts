import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  saveReviewReplyDrafts,
  getReviewReplySettings,
} from "@/lib/repositories/review-repository";
import {
  buildReplyPrompt,
  parseReplyDrafts,
  buildMockReplyDrafts,
  checkNgWords,
  ReplyDraftItem,
} from "@/lib/replyPrompt";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 12000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewRef: string }> }
) {
  try {
    const { reviewRef } = await params;
    const body = await req.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: "storeId が指定されていません" }, { status: 400 });
    }

    const auth = await verifyAdminAuth(storeId);
    if (!auth.authorized || !auth.organizationId || !auth.locationId) {
      return NextResponse.json({ error: auth.error || "権限がありません" }, { status: auth.status || 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 1. 対象のキャッシュ（有効期限内）を取得
    // review_reply_records と照合
    const { data: record, error: recErr } = await supabase
      .from("review_reply_records")
      .select("id, review_ref_hash, status")
      .eq("location_id", auth.locationId)
      .eq("review_ref_hash", reviewRef)
      .maybeSingle();

    if (recErr || !record) {
      return NextResponse.json({ error: "対象の口コミ記録が見つかりません" }, { status: 404 });
    }

    // gbp_review_cache から口コミ本文を取得
    // review_ref_hash は HMAC なので、location 内の有効な cache を全件突合するか external_review_id を検索
    const { data: caches } = await supabase
      .from("gbp_review_cache")
      .select("*")
      .eq("location_id", auth.locationId)
      .gt("expires_at", new Date().toISOString());

    const { computeReviewRefHash } = await import("@/lib/reviews/reviewRef");
    const matchedCache = (caches || []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => computeReviewRefHash(c.external_review_id) === reviewRef
    );

    if (!matchedCache) {
      return NextResponse.json(
        { error: "口コミ本文が30日保持期限切れ（または未キャッシュ）のため、AI返信下書きを生成できません" },
        { status: 400 }
      );
    }

    // 2. 店舗名・設定を取得
    const { data: loc } = await supabase
      .from("locations")
      .select("name")
      .eq("id", auth.locationId)
      .single();

    const storeName = loc?.name || "店舗";
    const settings = await getReviewReplySettings(auth.organizationId, auth.locationId);

    const promptParams = {
      storeName,
      storeCallName: settings.storeCallName,
      starRating: matchedCache.star_rating || 5,
      reviewerName: matchedCache.reviewer_name,
      comment: matchedCache.comment,
      policyNote: settings.policyNote,
      ngWords: settings.ngWords,
    };

    let generatedDrafts: ReplyDraftItem[] = [];
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = buildReplyPrompt(promptParams);
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const response = await withTimeout(
          ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
              temperature: 0.7,
              responseMimeType: "application/json",
            },
          }),
          TIMEOUT_MS
        );

        generatedDrafts = parseReplyDrafts(response.text ?? "");
      } catch (error) {
        console.error("[api/reviews/drafts] Gemini generation failed, falling back to mock:", error);
      }
    }

    // 生成が空または失敗した場合はモックにフォールバック
    if (generatedDrafts.length === 0) {
      generatedDrafts = buildMockReplyDrafts(promptParams);
    }

    // 3. 署名の機械的付加 & NGワード検査・浄化（不変条件6: NGワード制約の強制）
    const signature = settings.signature?.trim();
    const ngWordsDetected: string[] = [];
    const safeMockDrafts = buildMockReplyDrafts(promptParams);

    const finalDrafts = generatedDrafts.map((d) => {
      // NGワード検出
      const foundNg = checkNgWords(d.body, settings.ngWords);
      let bodyText = d.body;

      if (foundNg.length > 0) {
        for (const w of foundNg) {
          if (!ngWordsDetected.includes(w)) ngWordsDetected.push(w);
        }
        // Tier 1不変条件: NGワードを含む文章を保存・返却しない。クリーンな代替案に安全置換
        const fallback = safeMockDrafts.find((m) => m.tone === d.tone) || safeMockDrafts[0];
        bodyText = fallback.body;
      }

      // 署名の機械的付加（AIには書かせない不変条件）
      let finalText = bodyText;
      if (signature && !finalText.includes(signature)) {
        finalText = `${finalText}\n\n${signature}`;
      }

      return {
        tone: d.tone,
        draftText: finalText,
      };
    });

    // 4. 下書き保存（30日TTL継承）
    await saveReviewReplyDrafts({
      organizationId: auth.organizationId,
      locationId: auth.locationId,
      externalReviewId: matchedCache.external_review_id,
      drafts: finalDrafts,
      userId: auth.userId,
    });

    return NextResponse.json({
      success: true,
      drafts: finalDrafts,
      ngWordsDetected,
    });
  } catch (error: unknown) {
    console.error("[api/reviews/drafts] Error:", error);
    return NextResponse.json(
      { error: "AI返信下書きの生成に失敗しました" },
      { status: 500 }
    );
  }
}
