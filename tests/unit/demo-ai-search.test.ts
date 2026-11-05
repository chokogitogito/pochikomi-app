import { describe, it, expect } from "vitest";
import {
  AI_NAMES,
  AI_OBSERVATIONS,
  AI_QUESTIONS,
  findObservation,
  summarizeByAi,
  validateAiObservation,
  type AiObservation,
} from "@/lib/demo/aiSearch";

describe("AI検索分析: サンプル観測と言及率", () => {
  it("3つのAIが同じ質問セットで観測されている（ChatGPT・Gemini・Claude）", () => {
    expect([...AI_NAMES]).toEqual(["ChatGPT", "Gemini", "Claude"]);
    for (const q of AI_QUESTIONS) {
      for (const name of AI_NAMES) {
        expect(findObservation(AI_OBSERVATIONS, name, q.id), `${name}/${q.id}`).toBeDefined();
      }
    }
    expect(AI_OBSERVATIONS).toHaveLength(AI_QUESTIONS.length * AI_NAMES.length);
  });

  it("「おすすめ店」「駅近」「初めての来店」の質問を含む", () => {
    const labels = AI_QUESTIONS.map((q) => q.label);
    expect(labels).toEqual(expect.arrayContaining(["おすすめ店", "駅近", "初めての来店"]));
  });

  it("言及率 = 店名が出た回答数 ÷ 取得できた回答数。取得失敗・未観測は分母に含めない", () => {
    const chatgpt = summarizeByAi(AI_OBSERVATIONS, "ChatGPT");
    expect(chatgpt).toMatchObject({ total: 6, answered: 6, mentioned: 5, failed: 0, unobserved: 0 });
    expect(chatgpt.rate).toBe(83);

    const claude = summarizeByAi(AI_OBSERVATIONS, "Claude");
    expect(claude).toMatchObject({ total: 6, answered: 5, failed: 1, unobserved: 0 });
    expect(claude.mentioned).toBe(2);
    expect(claude.rate).toBe(40);

    const gemini = summarizeByAi(AI_OBSERVATIONS, "Gemini");
    expect(gemini).toMatchObject({ total: 6, answered: 5, failed: 0, unobserved: 1 });
    expect(gemini.mentioned).toBe(4);
    expect(gemini.rate).toBe(80);
  });

  it("取得できた回答が0件のときは0%ではなく null（算出不可）", () => {
    const onlyFailed: AiObservation[] = AI_OBSERVATIONS.filter((o) => o.aiName === "Claude" && o.status === "failed");
    const s = summarizeByAi(onlyFailed, "Claude");
    expect(s.answered).toBe(0);
    expect(s.rate).toBeNull();
  });

  it("状態ごとの項目整合: 店名が出た観測のみ順位・理由を持ち、回答なしの観測は抜粋・参照元を持たない", () => {
    for (const o of AI_OBSERVATIONS) {
      if (o.status === "mentioned") {
        expect(o.position).toBeGreaterThanOrEqual(1);
        expect(o.reason).toBeTruthy();
        expect(o.excerpt).toBeTruthy();
      } else {
        expect(o.position).toBeNull();
        expect(o.reason).toBeNull();
      }
      if (o.status === "failed" || o.status === "unobserved") {
        expect(o.excerpt).toBeNull();
        expect(o.sources).toHaveLength(0);
        expect(o.statusNote).toBeTruthy();
      }
      if (o.status === "unobserved") expect(o.observedAt).toBeNull();
      else expect(o.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("3状態＋取得失敗＋未観測＋参照元なしの回答がサンプルに含まれる", () => {
    const statuses = new Set(AI_OBSERVATIONS.map((o) => o.status));
    expect(statuses).toEqual(new Set(["mentioned", "not_mentioned", "failed", "unobserved"]));
    const noSource = AI_OBSERVATIONS.filter((o) => (o.status === "mentioned" || o.status === "not_mentioned") && o.sources.length === 0);
    expect(noSource.length).toBeGreaterThan(0);
  });
});

describe("AI検索分析: 手動登録データの検証", () => {
  const valid = {
    aiName: "Gemini",
    question: "この辺でおすすめのラーメン店を教えて",
    region: "サンプル駅周辺（東京都）",
    language: "日本語",
    observedAt: "2026-11-10",
    status: "mentioned",
    position: 1,
    reason: "口コミ件数が多い",
    excerpt: "…サンプルラーメン店がおすすめです…",
    sources: [{ title: "ガイド", site: "example.test" }],
  };

  it("正しい観測は受理される", () => {
    const r = validateAiObservation(valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.position).toBe(1);
  });

  it.each([
    ["AI名が不正", { ...valid, aiName: "Bing" }],
    ["状態が不正", { ...valid, status: "maybe" }],
    ["観測日の形式が不正", { ...valid, observedAt: "2026/11/10" }],
    ["店名が出たのに順位がない", { ...valid, position: null }],
    ["店名が出ていないのに順位がある", { ...valid, status: "not_mentioned", position: 2 }],
    ["回答ありなのに抜粋がない", { ...valid, excerpt: "" }],
    ["取得失敗に抜粋がある", { ...valid, status: "failed", position: null, observedAt: "2026-11-10" }],
    ["取得失敗に参照元がある", { ...valid, status: "failed", position: null, excerpt: null }],
    ["参照元の形式が不正", { ...valid, sources: [{ title: "x" }] }],
  ])("不正な観測は拒否される: %s", (_label, input) => {
    expect(validateAiObservation(input).ok).toBe(false);
  });

  it("未観測は観測日なしで登録できる", () => {
    const r = validateAiObservation({
      aiName: "Claude",
      question: "q",
      region: "r",
      language: "日本語",
      observedAt: null,
      status: "unobserved",
    });
    expect(r.ok).toBe(true);
  });

  it("オブジェクトでない入力は拒否される", () => {
    expect(validateAiObservation(null).ok).toBe(false);
    expect(validateAiObservation("x").ok).toBe(false);
  });
});
