import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { DEMO_STORE, DEMO_STORE_ID, DEMO_STORE_NAME, DEMO_MAPS_GUIDE_NOTE } from "@/lib/demo/store";
import { DEMO_COMPETITORS, DEMO_TREND, DEMO_FUNNEL, DEMO_MAPS_METRICS } from "@/lib/demo/dashboard";
import { AI_OBSERVATIONS, AI_QUESTIONS } from "@/lib/demo/aiSearch";
import { DEMO_REVIEWS, initialReplyState, DEMO_REPLY_POLICY_NOTE } from "@/lib/demo/reviews";

/**
 * Tier 1: 商談デモと実店舗データの分離。
 * デモの固定データに、運用店舗の名前・ID・実績・口コミ・競合名が含まれないことを検査する。
 */
const REAL_IDENTIFIERS = [
  "The蔵ssic",
  "蔵ssic",
  "SS.GRAND",
  "SS GRAND",
  "HOOKAA",
  "hookaalab",
  "粟野町",
  "観光やな",
  "golf-a",
  "golf-b",
  "classic",
  "ss-grand",
  "awanoyana",
  // 実店舗モデル（meo-diagnosis.json）の競合名。デモでは必ずサンプル名に置き換える
  "Lounge Range",
  "SWING24",
  "雀宮",
  "二代目武道家",
  "武蔵家",
  "五丁目ハウス",
  "輝道家",
  "中野家",
  "中野",
  // 実テナントのID
  "a0000000-",
  "b0000000-",
];

const demoFixtures = {
  DEMO_STORE,
  DEMO_MAPS_GUIDE_NOTE,
  DEMO_COMPETITORS,
  DEMO_TREND,
  DEMO_FUNNEL,
  DEMO_MAPS_METRICS,
  AI_QUESTIONS,
  AI_OBSERVATIONS,
  DEMO_REVIEWS,
  DEMO_REPLY_POLICY_NOTE,
  initialReplyState: initialReplyState(),
};

describe("商談デモ: 実店舗データとの分離（固定データの検査）", () => {
  const serialized = JSON.stringify(demoFixtures);

  it.each(REAL_IDENTIFIERS)("デモの固定データに実店舗の識別子「%s」が含まれない", (word) => {
    expect(serialized).not.toContain(word);
  });

  it("デモ店舗IDは data/db.json の実店舗IDと衝突せず、DBの `ramen` スラッグとも別である", () => {
    const db = JSON.parse(readFileSync(path.join(process.cwd(), "data", "db.json"), "utf8")) as {
      stores: Array<{ id: string; name: string }>;
    };
    const realIds = db.stores.map((s) => s.id);
    expect(realIds).not.toContain(DEMO_STORE_ID);
    expect(DEMO_STORE_ID).not.toBe("ramen");
    expect(DEMO_STORE.id).toBe(DEMO_STORE_ID);
  });

  it("実店舗の名称（data/db.json）がデモの固定データに現れない（汎用語は除く）", () => {
    const db = JSON.parse(readFileSync(path.join(process.cwd(), "data", "db.json"), "utf8")) as {
      stores: Array<{ id: string; name: string; shortName?: string }>;
    };
    const generic = new Set(["ラーメン店"]);
    for (const store of db.stores) {
      for (const name of [store.name, store.shortName]) {
        if (!name || generic.has(name)) continue;
        expect(serialized, `実店舗名「${name}」がデモ固定データに含まれています`).not.toContain(name);
      }
    }
  });

  it("競合名はすべてサンプル名で、自社はちょうど1件", () => {
    expect(DEMO_COMPETITORS).toHaveLength(6);
    expect(DEMO_COMPETITORS.filter((c) => c.isOwn)).toHaveLength(1);
    for (const c of DEMO_COMPETITORS) expect(c.name.startsWith("サンプル")).toBe(true);
    expect(DEMO_COMPETITORS.find((c) => c.isOwn)?.name).toBe(DEMO_STORE_NAME);
  });

  it("デモのGoogleマップURLは空で、実際のGoogleマップへは遷移しない", () => {
    expect(DEMO_STORE.googleMapsUrl).toBe("");
    expect(serialized).not.toMatch(/maps\.google|google\.com\/maps|goo\.gl/);
  });
});
