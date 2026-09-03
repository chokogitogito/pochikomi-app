// 簡易レートリミッター（IP / 店舗ごとの連続リクエスト制御）
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * 簡易スライディングウィンドウレートリミッター
 * @param key 識別キー（IPハッシュやクライアント識別子）
 * @param limit ウィンドウ内の最大リクエスト数（デフォルト: 1分間に10回）
 * @param windowMs ウィンドウ幅（ミリ秒、デフォルト: 60,000ms = 1分）
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = store.get(key);

  // 定期クリーンアップ（メモリリーク防止: 1000件超えたら期限切れを削除）
  if (store.size > 1000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt < now) store.delete(k);
    }
  }

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}
