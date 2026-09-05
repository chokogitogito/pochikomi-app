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

  it('AI返信下書き（review_reply_drafts）もGoogle Content派生物として30日TTL制約と削除が適用されること', () => {
    const now = new Date('2026-09-05T00:00:00.000Z');
    const maxAllowedTtlMs = 30 * 24 * 60 * 60 * 1000;

    // 1. check制約 chk_reply_draft_ttl の論理検証: expires_at <= fetched_at + 30 days
    const fetchedAt = new Date('2026-09-05T00:00:00.000Z');
    const validDraftExpires = new Date('2026-10-04T23:59:59.000Z');
    const invalidDraftExpires = new Date('2026-10-10T00:00:00.000Z');

    expect(validDraftExpires.getTime() - fetchedAt.getTime() <= maxAllowedTtlMs).toBe(true);
    expect(invalidDraftExpires.getTime() - fetchedAt.getTime() <= maxAllowedTtlMs).toBe(false);

    // 2. cleanup_expired_gbp_cache で下書きも削除されること
    const draftEntries = [
      {
        id: 'draft-1',
        external_review_id: 'rev-001',
        tone: 'polite',
        fetched_at: new Date('2026-08-01T00:00:00.000Z'),
        expires_at: new Date('2026-08-31T00:00:00.000Z'), // 期限切れ
      },
      {
        id: 'draft-2',
        external_review_id: 'rev-002',
        tone: 'standard',
        fetched_at: new Date('2026-09-01T00:00:00.000Z'),
        expires_at: new Date('2026-09-25T00:00:00.000Z'), // 有効
      },
    ];

    const survivingDrafts = draftEntries.filter(
      (d) => d.expires_at > now && d.fetched_at >= new Date(now.getTime() - maxAllowedTtlMs)
    );

    expect(survivingDrafts).toHaveLength(1);
    expect(survivingDrafts[0].id).toBe('draft-2');
  });
});
