import { describe, it, expect } from "vitest";
import {
  DEMO_REVIEWS,
  MAX_REPLY_LENGTH,
  applyGeneratedDraft,
  approveReply,
  countByStatus,
  editDraft,
  findDemoReview,
  initialReplyState,
  isDemoReviewId,
  parseReplyState,
  revokeApproval,
  serializeReplyState,
} from "@/lib/demo/reviews";

describe("口コミ返信デモ: 初期状態", () => {
  it("好意的・改善要望・低評価の口コミがあり、初期表示で3つの状態が見える", () => {
    expect(new Set(DEMO_REVIEWS.map((r) => r.kind))).toEqual(new Set(["positive", "improvement", "negative"]));
    expect(countByStatus(initialReplyState())).toEqual({ unreplied: 3, drafted: 2, approved: 1 });
  });

  it("承認待ちにはサンプル下書きがあり、未対応には本文がない", () => {
    const s = initialReplyState();
    for (const r of DEMO_REVIEWS) {
      const e = s[r.id];
      if (e.status === "unreplied") expect(e.text).toBe("");
      else expect(e.text.length).toBeGreaterThan(20);
    }
    expect(s["demo-r2"].source).toBe("sample");
  });

  it("返信案に割引・特典の文言が含まれない", () => {
    const s = initialReplyState();
    for (const e of Object.values(s)) expect(e.text).not.toMatch(/割引|無料|クーポン|返金/);
  });

  it("口コミIDの照合は固定データの完全一致のみ", () => {
    expect(isDemoReviewId("demo-r1")).toBe(true);
    for (const bad of ["golf-a", "__proto__", "constructor", "", null, undefined, 1, {}]) {
      expect(isDemoReviewId(bad)).toBe(false);
      expect(findDemoReview(bad)).toBeUndefined();
    }
  });
});

describe("口コミ返信デモ: 生成・編集・承認・リセット", () => {
  it("未対応 → AI生成 → 編集 → 承認 の流れで状態が進み、最終文面が残る", () => {
    let s = initialReplyState();
    s = applyGeneratedDraft(s, "demo-r3", "お詫びの返信案です。", "ai");
    expect(s["demo-r3"]).toMatchObject({ status: "drafted", source: "ai", edited: false });

    s = editDraft(s, "demo-r3", "お詫びの返信案です。ご連絡をお待ちしています。");
    expect(s["demo-r3"]).toMatchObject({ status: "drafted", edited: true });

    s = approveReply(s, "demo-r3");
    expect(s["demo-r3"].status).toBe("approved");
    expect(s["demo-r3"].text).toBe("お詫びの返信案です。ご連絡をお待ちしています。");
    expect(countByStatus(s)).toEqual({ unreplied: 2, drafted: 2, approved: 2 });
  });

  it("AI生成失敗時のサンプル案は fallback として区別される", () => {
    const s = applyGeneratedDraft(initialReplyState(), "demo-r6", "サンプル案", "fallback");
    expect(s["demo-r6"].source).toBe("fallback");
  });

  it("下書きのない口コミ（未対応）は承認できない", () => {
    const s = initialReplyState();
    expect(approveReply(s, "demo-r3")).toBe(s);
  });

  it("承認済みは編集・再生成で上書きされない。承認を取り消すと編集に戻る", () => {
    const s = initialReplyState();
    expect(editDraft(s, "demo-r1", "書き換え")).toBe(s);
    expect(applyGeneratedDraft(s, "demo-r1", "別案", "ai")).toBe(s);
    const revoked = revokeApproval(s, "demo-r1");
    expect(revoked["demo-r1"].status).toBe("drafted");
    expect(editDraft(revoked, "demo-r1", "編集後")["demo-r1"].text).toBe("編集後");
  });

  it("本文を空にすると未対応に戻り、承認できなくなる", () => {
    let s = initialReplyState();
    s = editDraft(s, "demo-r2", "   ");
    expect(s["demo-r2"]).toMatchObject({ status: "unreplied", text: "" });
    expect(approveReply(s, "demo-r2")["demo-r2"].status).toBe("unreplied");
  });

  it("未知のIDへの操作は状態を変えない", () => {
    const s = initialReplyState();
    expect(applyGeneratedDraft(s, "golf-a", "x", "ai")).toBe(s);
    expect(editDraft(s, "golf-a", "x")).toBe(s);
    expect(approveReply(s, "golf-a")).toBe(s);
    expect(Object.keys(s).sort()).toEqual(DEMO_REVIEWS.map((r) => r.id).sort());
  });

  it("本文は最大文字数に切り詰められる", () => {
    const s = editDraft(initialReplyState(), "demo-r3", "あ".repeat(MAX_REPLY_LENGTH + 500));
    expect(s["demo-r3"].text).toHaveLength(MAX_REPLY_LENGTH);
  });
});

describe("口コミ返信デモ: セッション保存の復元", () => {
  it("保存した状態は再読み込み後（parse）も同じに復元される", () => {
    let s = applyGeneratedDraft(initialReplyState(), "demo-r3", "返信案", "ai");
    s = approveReply(s, "demo-r3");
    const restored = parseReplyState(serializeReplyState(s));
    expect(restored["demo-r3"]).toMatchObject({ status: "approved", text: "返信案", source: "ai" });
    expect(restored).toEqual(s);
  });

  it("保存なし・壊れたデータ・バージョン違いは初期状態に戻る（リセット相当）", () => {
    const initial = initialReplyState();
    expect(parseReplyState(null)).toEqual(initial);
    expect(parseReplyState("{broken")).toEqual(initial);
    expect(parseReplyState(JSON.stringify({ version: 99, entries: {} }))).toEqual(initial);
    expect(parseReplyState(JSON.stringify([1, 2]))).toEqual(initial);
  });

  it("不正なエントリは無視して初期値を使い、未知のキーは取り込まない", () => {
    const raw = JSON.stringify({
      version: 1,
      entries: {
        "demo-r3": { status: "approved", text: "", source: "ai", edited: false }, // 承認済みなのに本文なし
        "demo-r4": { status: "hacked", text: "x", source: null, edited: false },
        "demo-r6": { status: "drafted", text: "有効な下書き", source: "manual", edited: false },
        "golf-a": { status: "approved", text: "実店舗への返信", source: "ai", edited: false },
        __proto__: { status: "approved", text: "x", source: "ai", edited: false },
      },
    });
    const s = parseReplyState(raw);
    const initial = initialReplyState();
    expect(s["demo-r3"]).toEqual(initial["demo-r3"]);
    expect(s["demo-r4"]).toEqual(initial["demo-r4"]);
    expect(s["demo-r6"]).toMatchObject({ status: "drafted", text: "有効な下書き" });
    expect(Object.keys(s)).not.toContain("golf-a");
    expect(Object.keys(s).sort()).toEqual(DEMO_REVIEWS.map((r) => r.id).sort());
  });
});
