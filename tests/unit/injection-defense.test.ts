import { describe, it, expect } from "vitest";
import { validateAndNormalizeSlug } from "@/lib/repositories/supabase-repository";

describe("PostgRESTインジェクション・テナント越境防御テスト (P1対策)", () => {
  it("正常なslugを正しく検証・マッピングすること", () => {
    expect(validateAndNormalizeSlug("golf-a")).toBe("golf-a");
    expect(validateAndNormalizeSlug("golf-b")).toBe("golf-b");
    expect(validateAndNormalizeSlug("golf")).toBe("golf");
    // レガシーエイリアス
    expect(validateAndNormalizeSlug("classic")).toBe("golf-a");
    expect(validateAndNormalizeSlug("ss-grand")).toBe("golf-b");
    expect(validateAndNormalizeSlug("demo-golf")).toBe("golf");
  });

  it("カンマやPostgREST構文を含むインジェクション攻撃文字列を拒絶すること", () => {
    // Claudeレビューで指摘されたインジェクション再現パターン
    const attack1 = "x,id.neq.00000000-0000-0000-0000-000000000000";
    expect(validateAndNormalizeSlug(attack1)).toBeNull();

    // カンマ区切りの条件注入
    const attack2 = "golf-a,public_slug.eq.golf-b";
    expect(validateAndNormalizeSlug(attack2)).toBeNull();

    // 括弧やピリオドを含む構文
    const attack3 = "golf-a) or (id.is.not.null";
    expect(validateAndNormalizeSlug(attack3)).toBeNull();

    // 波括弧や配列構文
    const attack4 = "{x,y,z}";
    expect(validateAndNormalizeSlug(attack4)).toBeNull();

    // SQLコメント
    const attack5 = "golf-a'--";
    expect(validateAndNormalizeSlug(attack5)).toBeNull();
  });
});
