import type { Store } from "@/lib/types";

export type SurveyAnswers = {
  source: string;
  menu: string;
  rating: number;
  selectedPoints: string[];
  comment: string;
};

const toneGuide = {
  friendly: "親しみやすい話し言葉。友人に勧めるような自然な口調。",
  standard: "標準的な丁寧語。多くの人が書く、落ち着いた一般的な口コミの文体。",
  polite: "丁寧でかしこまった文体。敬語をきちんと使う。",
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
    "各文章は150〜250文字。",
    "実際に利用した一般のお客様が書いた文章として自然であること。",
    `文中で店名に触れる場合は「${storeName}」を使う。`,
    `次の語のうち、回答内容に自然に結びつくものだけを1〜2語だけ使う：${store.keywords.join("、")}`,
    "キーワードを羅列しない。不自然だと感じたら使わなくてよい。",
    "自由コメントがある場合は、その内容を必ず反映する。",
    "「私は〜」「総じて満足です」「この度は」などの定型句を使わない。",
    "AIが書いたと分かる不自然な言い回し、誇張表現、絵文字を使わない。",
    "「口コミを書きました」のようなメタ表現を使わない。",
    "3つの文章は内容の重複を避け、触れる観点を変える。",
  ];

  const toneRules = isPositive
    ? [
        "満足した体験として書く。",
        "回答された「良かった点」を具体的な体験として描写する。",
      ]
    : [
        "感情的にならず、冷静で建設的なトーンで書く。",
        "良かった面にも少し触れたうえで、気になった点を丁寧に伝える。",
        "「最悪」「ひどい」などの強い否定表現は使わない。",
        "次回への期待や改善への希望を添えて締める。",
      ];

  return `あなたはGoogleマップの口コミ文章作成をサポートする編集者です。
以下のアンケート結果をもとに、文体の異なる口コミ文章を3つ作成してください。

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
次のJSON配列のみを出力してください。前置き・説明・コードフェンスは不要です。
[
  { "tone": "friendly", "text": "..." },
  { "tone": "standard", "text": "..." },
  { "tone": "polite", "text": "..." }
]`;
}
