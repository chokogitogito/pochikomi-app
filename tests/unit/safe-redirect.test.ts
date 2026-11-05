import { describe, it, expect } from "vitest";
import { resolveLoginRedirect } from "@/lib/auth/safeRedirect";

describe("ログイン後のリダイレクト先", () => {
  it.each(["/demo", "/demo/ai-search", "/demo/survey?x=1", "/admin", "/admin/reviews?storeId=a"])("%s は許可される", (path) => {
    expect(resolveLoginRedirect(path)).toBe(path);
  });

  it("正規化後も /demo・/admin 配下に収まるものは正規化したパスで返す", () => {
    expect(resolveLoginRedirect("/demo/./ai-search")).toBe("/demo/ai-search");
    expect(resolveLoginRedirect("/demo/survey/../reviews")).toBe("/demo/reviews");
    expect(resolveLoginRedirect("/demo/reviews#frag")).toBe("/demo/reviews");
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.example/demo",
    "//evil.example/demo",
    "/\\evil.example",
    "/demonstration",
    "/administrator",
    "/api/reviews",
    "demo",
    "/demo\n/../etc",
    "/demo/../api/reviews",
    "/demo/%2e%2e/api/reviews",
    "/demo/%2E%2E/api/reviews",
    "/admin/../../etc/passwd",
    "/demo/./../../api",
  ])("%j は /admin へフォールバックする", (path) => {
    expect(resolveLoginRedirect(path as string | null | undefined)).toBe("/admin");
  });
});
