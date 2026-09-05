import { wrapReviewForPrompt } from "@/lib/reviews/sanitize";

export type ReplyTone = "polite" | "standard" | "friendly";

export interface ReplyDraftItem {
  tone: ReplyTone;
  body: string;
}

export interface ReplyPromptParams {
  storeName: string;
  storeCallName?: string;
  starRating: number;
  reviewerName?: string | null;
  comment?: string | null;
  policyNote?: string;
  ngWords?: string[];
}

/**
 * AI返信下書き用のシステム指示・プロンプトを構築する
 */
export function buildReplyPrompt(params: ReplyPromptParams): string {
  const storeLabel = params.storeCallName?.trim() || params.storeName;
  const wrappedReview = wrapReviewForPrompt(
    params.comment || "",
    params.reviewerName,
    params.starRating
  );

  let ratingGuideline = "";
  if (params.starRating >= 4) {
    ratingGuideline = `
【★4〜★5 高評価への返信方針】
- ご来店と高評価に対する心からの感謝を主軸にしてください。
- 口コミ本文で具体的に褒めていただいた点（接客、雰囲気、味、サービス等）があれば、1箇所だけ自然に触れて共感を示してください。
- またのご来店を歓迎する温かい一言で結んでください。`;
  } else if (params.starRating === 3) {
    ratingGuideline = `
【★3 普通・中立評価への返信方針】
- ご来店への感謝をまず述べてください。
- いただいたご意見やご感想を真摯に受け止め、今後より快適にお過ごしいただけるよう店舗改善に取り組む姿勢を簡潔に示してください。
- 言い訳や釈明は一切書かず、前向きで誠実なトーンを維持してください。`;
  } else {
    ratingGuideline = `
【★1〜★2 低評価・ご不満への返信方針】
- まずご来店いただいたことへの謝意と、ご期待に沿えず不快な思いやご不便をおかけしたことへのお詫びを真摯に伝えてください。
- 口コミの内容に対する事実関係の反論・争いは絶対にしないでください。
- 詳細なご事情をお伺いして改善に役立てるため、「お気づきの点がございましたら店舗まで直接ご連絡いただけますと幸いです」等の個別対応の連絡導線を一言添えてください。
- スタッフ一同で再発防止とサービス向上に努める決意で結んでください。`;
  }

  const ngWordsSection =
    params.ngWords && params.ngWords.length > 0
      ? `\n【使用禁止ワード（NGワード）】\n以下の単語・表現は絶対に返信文に含めないでください: ${params.ngWords.join(
          ", "
        )}\n`
      : "";

  const customPolicySection = params.policyNote?.trim()
    ? `\n【店舗独自の返信方針・特記事項】\n${params.policyNote.trim()}\n`
    : "";

  return `
あなたは店舗「${storeLabel}」のオーナー・店長として、Googleマップに投稿された口コミに対して返信文を作成するアシスタントです。
以下の指示に従い、トーンが異なる3つの返信下書き（丁寧、標準、親しみ）を作成してください。

${ratingGuideline}
${ngWordsSection}
${customPolicySection}

【全体共通の絶対厳守ルール】
1. **割引・特典・次回サービスの提示は絶対に禁止です**（Googleクチコミポリシーおよびガイドライン違反となるため）。
2. 「この度はご来店いただき…」「〜な空間を提供しております」といった陳腐で定型的なAI構文は避け、血の通った自然な日本語にしてください。
3. 店舗名の連呼や、不自然なSEO/MEOキーワードの詰め込みは禁止です。
4. お客様の個人情報や過去の来店履歴・利用状況を勝手に推測して言及しないでください。
5. 各返信文の長さは**100文字〜220文字程度**に収めてください。
6. 返信文の末尾に署名は含めないでください（署名はシステム側で自動付加されます）。

【トーンの定義】
- "polite" (丁寧): 格調高く誠実な敬語。かしこまった接客表現。
- "standard" (標準): ビジネスとして一般的で安心感のある親切な敬語。
- "friendly" (親しみ): 温かみがあり、親近感を感じられる柔らかい表現（崩しすぎない敬語）。

【出力フォーマット】
以下のJSON配列形式のみを出力してください。Markdownのコードフェンスや余計な解説は不要です。
[
  { "tone": "polite", "body": "返信本文" },
  { "tone": "standard", "body": "返信本文" },
  { "tone": "friendly", "body": "返信本文" }
]

以下が対象の口コミデータです：
${wrappedReview}
`.trim();
}

/**
 * AI生成された文字列から返信下書きJSONを堅牢にパースする
 */
export function parseReplyDrafts(raw: string): ReplyDraftItem[] {
  if (!raw) return [];

  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    let items: unknown[] = [];

    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (typeof parsed === "object" && parsed !== null) {
      // { drafts: [...] } や { replies: [...] } などのラッパー対応
      const record = parsed as Record<string, unknown>;
      const candidate = record.drafts || record.replies || record.data;
      if (Array.isArray(candidate)) {
        items = candidate;
      }
    }

    const validTones: ReplyTone[] = ["polite", "standard", "friendly"];
    const result: ReplyDraftItem[] = [];

    for (const item of items) {
      if (typeof item === "object" && item !== null) {
        const row = item as Record<string, unknown>;
        const tone = String(row.tone || "").toLowerCase() as ReplyTone;
        const body = String(row.body || row.text || row.draft || "").trim();

        if (validTones.includes(tone) && body) {
          result.push({ tone, body });
        }
      }
    }

    return result;
  } catch (error) {
    console.warn("[replyPrompt] parseReplyDrafts JSON parse failed:", error);
    return [];
  }
}

/**
 * 設定されたNGワードが含まれているか検査する
 */
export function checkNgWords(text: string, ngWords: string[]): string[] {
  if (!text || !ngWords || ngWords.length === 0) return [];
  const detected: string[] = [];
  for (const word of ngWords) {
    const trimmed = word.trim();
    if (trimmed && text.includes(trimmed)) {
      detected.push(trimmed);
    }
  }
  return detected;
}

/**
 * APIキー未設定時やGeminiエラー時のモックフォールバック返信下書き
 */
export function buildMockReplyDrafts(params: ReplyPromptParams): ReplyDraftItem[] {
  const reviewer = params.reviewerName || "お客様";
  const stars = params.starRating;

  if (stars >= 4) {
    return [
      {
        tone: "polite",
        body: `${reviewer}様、温かいご評価を賜り心より御礼申し上げます。ご満足いただけたご様子を拝見し、スタッフ一同大変励みになっております。今後ともより快適にお過ごしいただけますよう尽力してまいります。またのお越しを心よりお待ち申し上げております。`,
      },
      {
        tone: "standard",
        body: `${reviewer}様、高評価をいただきありがとうございます！快適にお過ごしいただけたようで大変嬉しく思います。これからも皆さまに喜んでいただける環境づくりに努めてまいります。またのご来店を心よりお待ちしております。`,
      },
      {
        tone: "friendly",
        body: `${reviewer}様、嬉しいクチコミをありがとうございます！楽しんでいただけて本当に良かったです。またいつでもお気軽に遊びにいらしてくださいね。次回のご来店もスタッフ一同楽しみにお待ちしております！`,
      },
    ];
  } else if (stars === 3) {
    return [
      {
        tone: "polite",
        body: `${reviewer}様、ご来店および貴重なご意見をお寄せいただき誠にありがとうございます。頂戴したご感想を真摯に受け止め、よりご満足いただけるサービスと施設環境の向上に努めてまいります。またのご利用を心よりお待ち申し上げております。`,
      },
      {
        tone: "standard",
        body: `${reviewer}様、ご来店いただきありがとうございました。いただいたご意見を参考に、より良いサービスをお届けできるよう改善に取り組んでまいります。今後ともどうぞよろしくお願いいたします。`,
      },
      {
        tone: "friendly",
        body: `${reviewer}様、ご来店いただきありがとうございました！もっとご満足いただけるよう、スタッフみんなで工夫して改善していきますね。また機会がございましたらぜひお立ち寄りください。`,
      },
    ];
  } else {
    return [
      {
        tone: "polite",
        body: `${reviewer}様、この度はご来店いただいたにもかかわらず、ご期待に沿えず不快な思いをおかけしましたことを深くお詫び申し上げます。頂戴しましたご指摘を厳粛に受け止め、再発防止とサービス改善に全力を尽くしてまいります。もしよろしければ詳細をお聞かせいただけますと幸いに存じます。`,
      },
      {
        tone: "standard",
        body: `${reviewer}様、ご来店いただいたにもかかわらず、ご満足いただける対応ができず大変申し訳ございませんでした。今回いただいたご意見をスタッフ一同で共有し、早急な改善に努めます。ご不明な点などがございましたら直接ご連絡いただけますと幸いです。`,
      },
      {
        tone: "friendly",
        body: `${reviewer}様、せっかくお越しいただいたのに、至らない点があり本当に申し訳ありませんでした。いただいたお声を無駄にせず、しっかり改善してまいります。貴重なご意見をいただき感謝いたします。`,
      },
    ];
  }
}
