// AIによる口コミ文章生成APIルート
// 現在はモック（仮の文章）を返します。
// Gemini APIキーが準備できたら、下のコメントアウト部分に差し替えます。

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/stores";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storeId, source, selectedPoints, rating } = body;

  const store = getStore(storeId);
  if (!store) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }

  // 高評価（★4〜5）か低評価（★1〜3）かで処理を分ける
  const isPositive = rating >= 4;

  // ─────────────────────────────────────────────
  // ▼ Gemini APIキー取得後にここを有効化します ▼
  // ─────────────────────────────────────────────
  /*
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const positivePrompt = `
あなたはGoogleマップの口コミ文章作成の専門家です。
以下のアンケート結果を元に、自然でリアルな口コミ文章を1つ作成してください。

【店舗情報】
店舗名：${store.name}
業種：${store.category}
含めてほしいキーワード：${store.keywords.join("、")}

【アンケート結果】
来店経緯：${source}
良かった点：${selectedPoints.join("、")}
満足度：★${rating}

【作成ルール】
- 150〜250文字程度
- 友人に話すような自然な口語体（です・ます調は維持しつつ、堅苦しくなく）
- SNSの口コミのような親しみやすい雰囲気
- キーワードを会話に溶け込ませるように自然に含める
- 具体的なエピソードや感情を交えて生き生きとした文章に
- 「すごく」「めちゃくちゃ」などの過度なカジュアル表現は避ける
- 「口コミを書きました」などのメタ表現は使わない
- 文章のみ出力（前置きや説明は不要）
  `;

  const negativePrompt = `
あなたはGoogleマップの口コミ文章作成の専門家です。
以下のアンケート結果を元に、建設的で誠実な改善提案を含む口コミ文章を1つ作成してください。

【店舗情報】
店舗名：${store.name}
業種：${store.category}

【アンケート結果】
来店経緯：${source}
残念だった点：${selectedPoints.join("、")}
満足度：★${rating}

【作成ルール】
- 150〜250文字程度
- 感情的にならず、冷静で建設的なトーン
- 良かった面にも少し触れながら、改善点を丁寧に伝える
- 「最悪」「ひどい」などの過激な表現は使わない
- 次回への期待や改善への希望を添える
- 文章のみ出力（前置きや説明は不要）
  `;

  const prompt = isPositive ? positivePrompt : negativePrompt;
  const result = await model.generateContent(prompt);
  const reviewText = result.response.text();
  */
  // ─────────────────────────────────────────────
  // ▲ ここまでGemini API部分 ▲
  // ─────────────────────────────────────────────

  // ── モック（仮の文章）──
  const reviewText = isPositive
    ? generatePositiveMock(store.name, store.keywords, selectedPoints, rating)
    : generateNegativeMock(store.name, selectedPoints, rating);

  return NextResponse.json({ reviewText });
}

// ── 高評価用モック ──
function generatePositiveMock(
  storeName: string,
  keywords: string[],
  points: string[],
  rating: number
): string {
  const keyword = keywords[0] ?? "サービス";
  const point1 = points[0] ?? "対応が丁寧";
  const point2 = points[1] ?? "仕上がりが良い";

  const reviews = [
    `${storeName}さん、本当によかったです！${keyword}のことで相談したんですが、${point1}し、${point2}ので大満足でした。担当の方がずっと親身になって話を聞いてくれて、不安なく任せられました。近所の方にもぜひおすすめしたいです。また何かあればお願いしようと思います！（★${rating}）`,
    `先日${storeName}さんに${keyword}をお願いしました。${point1}のが特によかったです。完成した後も${point2}し、頼んで正解でした。費用の説明も最初から明確で、途中で「え、こんなにかかるの？」ってなることもなく安心でした。また利用したいと思います。`,
    `${storeName}さんに初めてお願いしたんですが、${point1}ので安心して進められました。${keyword}も丁寧にやっていただいて、${point2}点が特に気に入っています。対応が誠実で信頼できる会社さんだなと感じました。★${rating}つけさせていただきます。`,
  ];

  return reviews[Math.floor(Math.random() * reviews.length)];
}

// ── 低評価用モック ──
function generateNegativeMock(
  storeName: string,
  points: string[],
  rating: number
): string {
  const point1 = points[0] ?? "対応に改善の余地があった";
  const point2 = points[1];

  const base = `${storeName}さんを利用しました。悪くはなかったのですが、${point1}点が少し気になりました。${
    point2 ? `また、${point2}ことも残念でした。` : ""
  }スタッフの方は親切にしてくださったので、今後その部分が改善されるとより良いサービスになると思います。次回に期待しています。（★${rating}）`;

  return base;
}
