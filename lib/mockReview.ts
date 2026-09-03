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
  const commentClean = comment.trim()
    ? (/[。！？!?]$/.test(comment.trim()) ? comment.trim() : `${comment.trim()}。`)
    : "";

  if (isPositive) {
    return [
      {
        tone: "friendly",
        text: [
          sourceText ? `${sourceText}で見つけて${storeName}に行ってきました！⛳️` : `${storeName}に行ってきました！⛳️`,
          menuText ? `今回は${menuText}をお願いしました。` : "",
          "",
          point1 ? `${point1}のが本当に良かったです✨` : "",
          point2 ? `${point2}のも感動でした！` : "",
          commentClean ? commentClean.replace(/。$/, "！") : "",
          "",
          area ? `${area}で良いゴルフ場を探している人にはすごくおすすめです😊` : "ゴルフ仲間にもぜひおすすめしたいです😊",
        ]
          .filter((line, i, arr) => line !== "" || (i > 0 && i < arr.length - 1 && arr[i - 1] !== ""))
          .join("\n"),
      },
      {
        tone: "standard",
        text: [
          sourceText ? `${sourceText}をきっかけに${storeName}を利用しました。` : `${storeName}を利用しました。`,
          menuText ? `今回は${menuText}を受けています。` : "",
          "",
          point1 ? `${point1}点が特に印象に残っています。` : "",
          point2 ? `${point2}ところも分かりやすくて良かったです！` : "",
          commentClean,
          "",
          area ? `${area}でゴルフ場をお探しの方にぜひおすすめしたいです！` : "またぜひラウンドに伺いたいと思います！",
        ]
          .filter((line, i, arr) => line !== "" || (i > 0 && i < arr.length - 1 && arr[i - 1] !== ""))
          .join("\n"),
      },
      {
        tone: "polite",
        text: [
          sourceText ? `${sourceText}にて拝見し、${storeName}を利用させていただきました。` : `${storeName}を利用させていただきました。`,
          menuText ? `今回は${menuText}をお願いいたしました。` : "",
          "",
          point1 ? `${point1}点が大変ありがたく、参考になりました。` : "",
          point2 ? `${point2}ところにも深い安心感がございます。` : "",
          commentClean,
          "",
          "今後ともぜひ利用させていただきたいと考えております。",
        ]
          .filter((line, i, arr) => line !== "" || (i > 0 && i < arr.length - 1 && arr[i - 1] !== ""))
          .join("\n"),
      },
    ];
  }

  return [
    {
      tone: "friendly",
      text: [
        `${storeName}を利用しました。`,
        menuText ? `${menuText}をお願いしました。` : "",
        "",
        point1 ? `${point1}のが少し気になりました。` : "",
        point2 ? `${point2}のも改善されるとうれしいです。` : "",
        commentClean,
        "",
        "設備や雰囲気は良かったので、また様子を見て伺いたいです！",
      ]
        .filter((line, i, arr) => line !== "" || (i > 0 && i < arr.length - 1 && arr[i - 1] !== ""))
        .join("\n"),
    },
    {
      tone: "standard",
      text: [
        `${storeName}を利用しました。`,
        menuText ? `今回は${menuText}を受けました。` : "",
        "",
        "全体として悪い印象ではありませんでしたが、",
        point1 ? `${point1}点が少し気になりました。` : "",
        point2 ? `また、${point2}点も改善されるとより利用しやすいと感じます。` : "",
        commentClean,
        "",
        "今後のさらなるサービス向上に期待しています。",
      ]
        .filter((line, i, arr) => line !== "" || (i > 0 && i < arr.length - 1 && arr[i - 1] !== ""))
        .join("\n"),
    },
    {
      tone: "polite",
      text: [
        `${storeName}を利用させていただきました。`,
        menuText ? `今回は${menuText}をお願いいたしました。` : "",
        "",
        point1 ? `${point1}点につきまして、少々気になりました。` : "",
        point2 ? `${point2}点も併せて改善をご検討いただけますと幸甚に存じます。` : "",
        commentClean,
        "",
        "指導内容や施設など良い点もございましたので、今後に期待しております。",
      ]
        .filter((line, i, arr) => line !== "" || (i > 0 && i < arr.length - 1 && arr[i - 1] !== ""))
        .join("\n"),
    },
  ];
}
