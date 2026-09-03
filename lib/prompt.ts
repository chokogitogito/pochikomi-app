import type { Store } from "@/lib/types";

export type SurveyAnswers = {
  source: string;
  menu: string;
  rating: number;
  selectedPoints: string[];
  comment: string;
};

const toneGuide = {
  friendly: "親しみやすい話し言葉。友人にLINEでおすすめするような生き生きとしたトーン。感嘆符（！）を積極的に使い、絵文字（⛳️, 🏌️‍♂️, ✨, 😊 など）を1〜3個自然に織り交ぜる。",
  standard: "標準的な口コミ文体。絵文字は一切使わず、感嘆符（！）と句点（。）を適度に混ぜて、明るく自然なトーンにする。",
  polite: "丁寧で品格のある文体。絵文字や感嘆符（！）は使わず、句読点（。、）のみで礼儀正しい敬語でまとめる。",
} as const;

/**
 * アンケート回答から口コミ生成用のプロンプトを組み立てる。
 * MEOキーワードは回答内容に関連するものだけを1〜2語だけ使わせる。
 * 詰め込むと不自然になり、Googleのスパム判定リスクも上がるため。
 */
export function buildPrompt(store: Store, answers: SurveyAnswers): string {
  const { source, menu, rating, selectedPoints, comment } = answers;
  const isPositive = rating >= 4;
  const storeName = store.shortName || store.name;

  const answerBlock = [
    `店舗名：${store.name}`,
    `業種：${store.category}`,
    `お店を知ったきっかけ：${source || "未回答"}`,
    `利用したメニュー：${menu || "未回答"}`,
    `満足度：★${rating}（5段階）`,
    isPositive
      ? `良かった点：${selectedPoints.join("、") || "未回答"}`
      : `気になった点：${selectedPoints.join("、") || "未回答"}`,
    comment ? `本人の自由コメント：${comment}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const sharedRules = [
    "文字数は各文章150〜250文字程度（改行を含む）。",
    "実際に利用した一般のお客様がスマートフォンから投稿したリアルな口コミとして書くこと。",
    `文中で店名に触れる場合は「${storeName}」を使う。`,
    `次のMEOキーワード候補のうち、回答内容に最も自然に結びつくものだけを1〜2語だけ選んで使う（無理に使わなくてもよい）：${store.keywords.join("、")}`,
    "キーワードの羅列や詰め込みはスパム判定されるため厳禁。",
    "自由コメントがある場合は、その内容やニュアンスを必ず反映する。",
    "【AIっぽさの徹底排除】",
    "  - 「私は〜」「総じて満足です」「この度は」「〜な空間です」「素晴らしい体験でした」などの定型句や紋切り型の表現は絶対に使わない。",
    "  - 「また、」「さらに、」「そのため、」などの機械的な接続詞を多用しない。",
    "  - アンケートの設問順（きっかけ→メニュー→良かった点）をそのままなぞるテンプレート構文は禁止。",
    "【多様性の確保（同一文章の重複防止）】",
    "  - 3つの文章は、書き出しの切り口（感動した点から入る／悩みや動機から入る／施設やスタッフの印象から入るなど）をそれぞれ大胆に変えること。",
    "  - 同じ回答内容であっても、人によって着眼点や語り口が全く異なるようにバリエーションを持たせること。",
    "【改行とレイアウトのルール（最重要）】",
    "  - 文末（句点「。」や感嘆符「！」）で基本的に改行すること。",
    "  - 話題やテーマが変わる箇所では「空行（改行2回）」を挟み、2〜3つの読みやすいブロックに分けること。ぎっしり詰まった文章にしないこと。",
  ];

  const toneRules = isPositive
    ? [
        "満足した実体験として、率直な喜びや納得感が伝わる言葉で書く。",
        "回答された「良かった点」を具体的なエピソードとして描写する。",
      ]
    : [
        "感情的にならず、冷静で建設的なトーンで書く。",
        "良かった面にも少し触れたうえで、気になった点を丁寧に伝える。",
        "「最悪」「ひどい」などの強い否定表現は使わない。",
        "次回への期待や改善への希望を添えて締める。",
      ];

  return `あなたはGoogleマップの口コミ文章作成をサポートするプロの編集者です。
以下のアンケート結果をもとに、Googleマップに投稿された一般客の自然な口コミとして、文体の異なる文章を3つ作成してください。

【アンケート結果】
${answerBlock}

【共通ルール】
${sharedRules.map((rule) => `- ${rule}`).join("\n")}

【トーン】
${toneRules.map((rule) => `- ${rule}`).join("\n")}

【文体の指定】
- friendly: ${toneGuide.friendly}
- standard: ${toneGuide.standard}
- polite: ${toneGuide.polite}

【出力形式】
次のJSON配列のみを出力してください。改行は「\\n」で表現してください。前置き・説明・コードフェンスは不要です。
[
  { "tone": "friendly", "text": "..." },
  { "tone": "standard", "text": "..." },
  { "tone": "polite", "text": "..." }
]`;
}
