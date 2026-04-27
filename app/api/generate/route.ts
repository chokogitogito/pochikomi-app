// AIによる口コミ文章生成APIルート
// 現在はモック（仮の文章）を返します。
// Gemini APIキーが準備できたら、下のコメントアウト部分に差し替えます。

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/stores";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storeId, source, goodPoints, rating } = body;

  const store = getStore(storeId);
  if (!store) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }

  // ─────────────────────────────────────────────
  // ▼ Gemini APIキー取得後にここを有効化します ▼
  // ─────────────────────────────────────────────
  /*
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
あなたはGoogleマップの口コミ文章作成の専門家です。
以下のアンケート結果を元に、自然でリアルな口コミ文章を1つ作成してください。

【店舗情報】
店舗名：${store.name}
業種：${store.category}
含めてほしいキーワード：${store.keywords.join("、")}

【アンケート結果】
来店経緯：${source}
良かった点：${goodPoints.join("、")}
満足度：★${rating}

【作成ルール】
- 150〜250文字程度
- 自然な口語体（です・ます調）
- キーワードを自然に文中に含める
- 具体的なエピソードを交えて読み手に伝わりやすく
- 「口コミを書きました」などのメタ表現は使わない
- 文章のみ出力（前置きや説明は不要）
  `;

  const result = await model.generateContent(prompt);
  const reviewText = result.response.text();
  */
  // ─────────────────────────────────────────────
  // ▲ ここまでGemini API部分 ▲
  // ─────────────────────────────────────────────

  // ── モック（仮の文章）──
  const reviewText = generateMockReview(store.name, store.keywords, goodPoints, rating);

  return NextResponse.json({ reviewText });
}

// ── モック用の文章生成関数 ──
function generateMockReview(
  storeName: string,
  keywords: string[],
  goodPoints: string[],
  rating: number
): string {
  const keyword = keywords[0] ?? "サービス";
  const point1 = goodPoints[0] ?? "対応が丁寧";
  const point2 = goodPoints[1] ?? "仕上がりが良い";

  const reviews = [
    `${storeName}さんにお願いして本当に良かったです。${keyword}の専門知識が豊富で、${point1}のが印象的でした。また、${point2}ため、近くで見ても満足のいく出来栄えでした。担当の方が最後まで丁寧に対応してくださり、安心してお任せできました。次回もぜひお願いしたいと思います。`,
    `先日、${storeName}さんに${keyword}をお願いしました。${point1}おかげで不安なく進められ、完成した後の${point2}には大変満足しています。価格も明確で、追加費用なども事前にしっかり説明いただけたので信頼できました。地域の方にもおすすめしたい業者さんです。`,
    `${storeName}さんは${keyword}においてとても信頼できる会社です。${point1}ことはもちろん、${point2}点も高く評価しています。丁寧な事前説明から施工後のアフターフォローまで、一貫して誠実な対応をしていただきました。満足度★${rating}です！`,
  ];

  return reviews[Math.floor(Math.random() * reviews.length)];
}
