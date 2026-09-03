import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/rateLimit';

describe('レートリミッター検証', () => {
  it('制限回数内はリクエストを許可すること', () => {
    const key = `test-user-${Date.now()}`;
    const res1 = checkRateLimit(key, 3, 10000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(key, 3, 10000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(key, 3, 10000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4回目は制限される
    const res4 = checkRateLimit(key, 3, 10000);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
  });
});
