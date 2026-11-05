import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: () => getUser() } }),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

function req(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

beforeEach(() => {
  getUser.mockReset();
});

describe("ミドルウェア: /demo の認証", () => {
  it.each(["/demo", "/demo/ai-search", "/demo/survey", "/demo/reviews", "/demo/maps-guide"])(
    "未認証の %s はログインへ誘導される",
    async (path) => {
      getUser.mockResolvedValue({ data: { user: null } });
      const { middleware } = await import("@/middleware");
      const res = await middleware(req(path));
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/admin/login");
      expect(location.searchParams.get("redirect")).toBe(path);
    }
  );

  it("リダイレクト先には元のクエリ（?storeId=…）を引き継がない", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { middleware } = await import("@/middleware");
    const res = await middleware(req("/demo/survey?storeId=golf-a&c=abc"));
    const location = new URL(res.headers.get("location")!);
    expect(location.search).toBe("?redirect=%2Fdemo%2Fsurvey");
  });

  it("ログイン済みなら /demo は通過する", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const { middleware } = await import("@/middleware");
    const res = await middleware(req("/demo"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("/demo と紛らわしいパス（/demonstration）はこの保護の対象外", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { middleware } = await import("@/middleware");
    const res = await middleware(req("/demonstration"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("matcher に /demo 配下が含まれる", async () => {
    const { config } = await import("@/middleware");
    expect(config.matcher).toContain("/demo/:path*");
    expect(config.matcher).toContain("/admin/:path*");
  });

  it("既存の /admin の保護は変わらない（未認証は /admin/login へ、ログイン画面自体はそのまま）", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { middleware } = await import("@/middleware");
    const res = await middleware(req("/admin/reviews"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
    const login = await middleware(req("/admin/login"));
    expect(login.headers.get("location")).toBeNull();
  });
});
