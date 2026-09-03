import { describe, it, expect } from 'vitest';

describe('Google Content 30日保持制限 (TTL) ロジック検証', () => {
  it('expires_at が fetched_at + 30日以内であることを判定できること', () => {
    const fetchedAt = new Date('2026-09-01T00:00:00.000Z');
    const validExpiresAt = new Date('2026-09-30T23:59:59.000Z');
    const invalidExpiresAt = new Date('2026-10-05T00:00:00.000Z');

    const maxAllowedTtlMs = 30 * 24 * 60 * 60 * 1000;

    const isValid = (validExpiresAt.getTime() - fetchedAt.getTime()) <= maxAllowedTtlMs;
    const isInvalid = (invalidExpiresAt.getTime() - fetchedAt.getTime()) <= maxAllowedTtlMs;

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  it('期限切れキャッシュの削除フィルタが正しく動作すること', () => {
    const now = new Date('2026-09-04T00:00:00.000Z');

    const cacheEntries = [
      {
        id: '1',
        external_review_id: 'rev-001',
        fetched_at: new Date('2026-08-01T00:00:00.000Z'),
        expires_at: new Date('2026-08-31T00:00:00.000Z'), // 期限切れ
      },
      {
        id: '2',
        external_review_id: 'rev-002',
        fetched_at: new Date('2026-09-01T00:00:00.000Z'),
        expires_at: new Date('2026-09-25T00:00:00.000Z'), // 有効
      },
      {
        id: '3',
        external_review_id: 'rev-003',
        fetched_at: new Date('2026-07-20T00:00:00.000Z'), // 30日以上前
        expires_at: new Date('2026-09-10T00:00:00.000Z'), // expires_atが不正
      },
    ];

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeEntries = cacheEntries.filter(
      (entry) => entry.expires_at > now && entry.fetched_at >= thirtyDaysAgo
    );

    expect(activeEntries).toHaveLength(1);
    expect(activeEntries[0].id).toBe('2');
  });
});
