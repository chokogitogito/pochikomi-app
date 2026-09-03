import type { ReviewDraft, Store } from "@/lib/types";
import type { SurveyAnswers } from "@/lib/prompt";

/**
 * APIキー未設定・通信失敗・タイムアウト時のフォールバック。
 * 商談中に画面が止まるのを防ぐための保険であり、通常はGemini生成が使われる。
 */
export function buildMockDrafts(store: Store, answers: SurveyAnswers): ReviewDraft[] {
  const storeName = store.shortName || store.name;
  const { source, menu, rating, selectedPoints, comment } = answers;
  const isPositive = rating >= 4;

  const area = store.keywords[0] ?? "";
  const point1 = selectedPoints[0] ?? "";
  const point2 = selectedPoints[1] ?? "";
  const menuText = menu && menu !== "その他" ? menu : "";
  const sourceText = source && source !== "その他" ? source : "";
  const commentText = comment.trim()
    ? (/[。！？!?]$/.test(comment.trim()) ? comment.trim() : `${comment.trim()}。`)
    : "";

  const sourceLead = (() => {
    if (!sourceText) return `${storeName}に行ってきました。`;
    if (sourceText.endsWith("て") || sourceText.endsWith("で")) {
      return `${sourceText}、${storeName}に行ってきました。`;
    }
    return `${sourceText}で見つけて${storeName}に行ってきました。`;
  })();

  if (isPositive) {
    return [
      {
        tone: "friendly",
        text: join([
          sourceLead,
          menuText ? `${menuText}をお願いしました。` : "",
          point1 ? `${point1}のがうれしかったです。` : "",
          point2 ? `${point2}のも良かったです。` : "",
          commentText,
          area ? `${area}で通えるところを探している人にはおすすめだと思います。` : "",
        ]),
      },
      {
        tone: "standard",
        text: join([
          `${storeName}を利用しました。`,
          menuText ? `今回は${menuText}を受けました。` : "",
          point1 ? `${point1}点が特に印象に残っています。` : "",
          point2 ? `${point2}ところも良かったです。` : "",
          commentText,
          "また利用したいと思います。",
        ]),
      },
      {
        tone: "polite",
        text: join([
          `${storeName}を利用させていただきました。`,
          menuText ? `${menuText}をお願いしました。` : "",
          point1 ? `${point1}点がとてもありがたかったです。` : "",
          point2 ? `また、${point2}ところにも安心感がありました。` : "",
          commentText,
          "次回もぜひお願いしたいと思っております。",
        ]),
      },
    ];
  }

  return [
    {
      tone: "friendly",
      text: join([
        `${storeName}を利用しました。`,
        menuText ? `${menuText}をお願いしました。` : "",
        point1 ? `${point1}のが少し気になりました。` : "",
        point2 ? `${point2}のも改善されるとうれしいです。` : "",
        commentText,
        "良かったところもあったので、また様子を見て伺いたいです。",
      ]),
    },
    {
      tone: "standard",
      text: join([
        `${storeName}を利用しました。`,
        "全体として悪い印象ではありませんでした。",
        point1 ? `ただ、${point1}点が気になりました。` : "",
        point2 ? `また、${point2}点も改善されるとより利用しやすいと感じます。` : "",
        commentText,
        "今後さらに良くなることを期待しています。",
      ]),
    },
    {
      tone: "polite",
      text: join([
        `${storeName}を利用させていただきました。`,
        point1 ? `${point1}点について、少し気になりました。` : "",
        point2 ? `${point2}点も併せてご検討いただけますと幸いです。` : "",
        commentText,
        "良かった点もございましたので、今後に期待しております。",
      ]),
    },
  ];
}

function join(parts: string[]): string {
  return parts.filter((part) => part && part.trim()).join("");
}
