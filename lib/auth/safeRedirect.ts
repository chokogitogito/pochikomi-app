/**
 * ログイン後の遷移先として許可するパスだけを返す（オープンリダイレクト対策）。
 * 許可: 正規化後に /admin 配下または /demo 配下になる同一オリジンの相対パス。それ以外は /admin。
 * （`/demo/../api/x` や `/demo/%2e%2e/api/x` のようなドットセグメントは、正規化した結果で判定する）
 */
const ALLOWED_BASES = ["/admin", "/demo"];
const ORIGIN_PROBE = "http://redirect-probe.invalid";

export function resolveLoginRedirect(raw: string | null | undefined): string {
  const fallback = "/admin";
  if (!raw || typeof raw !== "string") return fallback;
  // 先頭が単一の "/" で始まる相対パスのみ（"//evil.com" や "/\evil.com"、スキーム付きは拒否）
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f]/.test(raw)) return fallback;

  let url: URL;
  try {
    url = new URL(raw, ORIGIN_PROBE);
  } catch {
    return fallback;
  }
  if (url.origin !== ORIGIN_PROBE) return fallback;

  const pathname = url.pathname;
  const ok = ALLOWED_BASES.some((base) => pathname === base || pathname.startsWith(`${base}/`));
  if (!ok) return fallback;

  // 正規化後のパス＋クエリを返す（ハッシュは引き継がない）
  return `${pathname}${url.search}`;
}
