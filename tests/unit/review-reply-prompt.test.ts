import { describe, it, expect } from "vitest";
import {
  buildReplyPrompt,
  parseReplyDrafts,
  checkNgWords,
  buildMockReplyDrafts,
} from "@/lib/replyPrompt";

describe("AI返信下書きプロンプト＆パーサ検証", () => {
  it("星評価に応じて適切な方針（高評価感謝／中立改善／低評価謝罪）がプロンプトに含まれること", () => {
    const highPrompt = buildReplyPrompt({
      storeName: "The蔵ssic",
      starRating: 5,
      reviewerName: "高橋様",
      comment: "素晴らしい施設です",
    });
    expect(highPrompt).toContain("★4〜★5 高評価への返信方針");
    expect(highPrompt).toContain("割引・特典・次回サービスの提示は絶対に禁止です");

    const midPrompt = buildReplyPrompt({
      storeName: "The蔵ssic",
      starRating: 3,
      comment: "普通でした",
    });
    expect(midPrompt).toContain("★3 普通・中立評価への返信方針");

    const lowPrompt = buildReplyPrompt({
      storeName: "The蔵ssic",
      starRating: 1,
      comment: "接客がひどかった",
    });
    expect(lowPrompt).toContain("★1〜★2 低評価・ご不満への返信方針");
    expect(lowPrompt).toContain("事実関係の反論・争いは絶対にしないでください");
  });

  it("NGワードがプロンプトに含まれ、検出関数で正しく検知されること", () => {
    const prompt = buildReplyPrompt({
      storeName: "The蔵ssic",
      starRating: 5,
      ngWords: ["激安", "最安値", "全額返金"],
    });
    expect(prompt).toContain("激安, 最安値, 全額返金");

    const detected = checkNgWords("当店は激安で最高です", ["激安", "最安値"]);
    expect(detected).toEqual(["激安"]);
  });

  it("コードフェンス付きJSON配列を安全にパースできること", () => {
    const raw = `
\`\`\`json
[
  { "tone": "polite", "body": "丁寧な返信です。" },
  { "tone": "standard", "body": "標準の返信です。" },
  { "tone": "friendly", "body": "親しみのある返信です。" }
]
\`\`\`
`;
    const drafts = parseReplyDrafts(raw);
    expect(drafts).toHaveLength(3);
    expect(drafts[0].tone).toBe("polite");
    expect(drafts[0].body).toBe("丁寧な返信です。");
  });

  it("オブジェクト包み（{ drafts: [...] }）形式でも安全にパースできること", () => {
    const raw = JSON.stringify({
      drafts: [
        { tone: "polite", draft: "丁寧な返信案" },
        { tone: "standard", draft: "標準の返信案" },
      ],
    });
    const drafts = parseReplyDrafts(raw);
    expect(drafts).toHaveLength(2);
    expect(drafts[1].tone).toBe("standard");
  });

  it("不正な形式でもクラッシュせず空配列を返すこと", () => {
    const broken = "申し訳ありませんが、返信を生成できませんでした。";
    const drafts = parseReplyDrafts(broken);
    expect(drafts).toEqual([]);
  });

  it("モック返信生成が星評価に応じた3案を生成すること", () => {
    const mockHigh = buildMockReplyDrafts({
      storeName: "The蔵ssic",
      starRating: 5,
      reviewerName: "お客様",
    });
    expect(mockHigh).toHaveLength(3);
    expect(mockHigh[0].tone).toBe("polite");
    expect(mockHigh[1].tone).toBe("standard");
    expect(mockHigh[2].tone).toBe("friendly");
  });
});
