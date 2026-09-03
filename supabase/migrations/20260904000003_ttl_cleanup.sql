-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: Google Content 30日保持制限 (TTL) 保証 & 削除関数
-- ─────────────────────────────────────────────────────────────

-- 1. expires_at が fetched_at + 30日 を超えないことを強制する制約
alter table public.gbp_review_cache
    add constraint chk_gbp_review_ttl
    check (expires_at <= fetched_at + interval '30 days');

alter table public.gbp_performance_cache
    add constraint chk_gbp_perf_ttl
    check (expires_at <= fetched_at + interval '30 days');

-- 2. 期限切れキャッシュ自動クリーンアップ関数
create or replace function public.cleanup_expired_gbp_cache()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    deleted_reviews integer := 0;
    deleted_perfs integer := 0;
begin
    -- 30日超過または期限切れの口コミキャッシュを削除
    delete from public.gbp_review_cache
    where expires_at <= now()
       or fetched_at < (now() - interval '30 days');
    get diagnostics deleted_reviews = row_count;

    -- 30日超過または期限切れのパフォーマンスキャッシュを削除
    delete from public.gbp_performance_cache
    where expires_at <= now()
       or fetched_at < (now() - interval '30 days');
    get diagnostics deleted_perfs = row_count;

    return jsonb_build_object(
        'deleted_reviews', deleted_reviews,
        'deleted_performance_metrics', deleted_perfs,
        'executed_at', now()
    );
end;
$$;
