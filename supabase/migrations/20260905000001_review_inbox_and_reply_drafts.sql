-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: 口コミ受信箱・AI返信下書き機能 スキーマ & RLS & TTL関数拡張
-- ─────────────────────────────────────────────────────────────

-- 1. 既存テーブル gbp_review_cache の拡張
alter table public.gbp_review_cache
    add column if not exists source text not null default 'gbp'
        check (source in ('gbp', 'places', 'manual', 'fixture')),
    add column if not exists updated_at timestamptz not null default now();

-- 2. 新規テーブル: review_reply_drafts (30日TTL一時保存・Google Content派生物)
create table if not exists public.review_reply_drafts (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    external_review_id text not null,
    tone text not null check (tone in ('polite', 'standard', 'friendly')),
    draft_text text not null,
    model text not null default 'gemini-3.6-flash',
    prompt_version text not null default 'reply-v1',
    generated_by uuid references auth.users(id) on delete set null,
    fetched_at timestamptz not null default now(),
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    unique(location_id, external_review_id, tone),
    constraint chk_reply_draft_ttl check (expires_at <= fetched_at + interval '30 days')
);

create index if not exists idx_reply_drafts_loc_review
    on public.review_reply_drafts(location_id, external_review_id);
create index if not exists idx_reply_drafts_expires
    on public.review_reply_drafts(expires_at);

-- 3. 新規テーブル: review_reply_records (恒久・運用記録のみ・Google Content非保持)
create table if not exists public.review_reply_records (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    review_ref_hash text not null,
    status text not null default 'unreplied'
        check (status in ('unreplied', 'drafted', 'replied', 'ignored')),
    first_seen_at timestamptz not null default now(),
    seen_at timestamptz,
    replied_at timestamptz,
    updated_at timestamptz not null default now(),
    unique(location_id, review_ref_hash)
);

create index if not exists idx_reply_records_status
    on public.review_reply_records(location_id, status);

-- 4. 新規テーブル: review_reply_settings (恒久・店舗別設定)
create table if not exists public.review_reply_settings (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade unique,
    store_call_name text not null default '',
    signature text not null default '',
    tone_default text not null default 'polite'
        check (tone_default in ('polite', 'standard', 'friendly')),
    ng_words text[] not null default '{}',
    policy_note text not null default '',
    review_source text not null default 'manual'
        check (review_source in ('fixture', 'manual', 'places', 'gbp')),
    updated_at timestamptz not null default now()
);

-- 5. RLS (行レベルセキュリティ) 有効化
alter table public.review_reply_drafts enable row level security;
alter table public.review_reply_records enable row level security;
alter table public.review_reply_settings enable row level security;

-- review_reply_drafts ポリシー
create policy "review_reply_drafts_select" on public.review_reply_drafts
    for select to authenticated
    using (
        organization_id in (select public.auth_user_organization_ids())
        or public.auth_is_platform_admin()
    );

create policy "review_reply_drafts_insert" on public.review_reply_drafts
    for insert to authenticated
    with check (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

create policy "review_reply_drafts_update" on public.review_reply_drafts
    for update to authenticated
    using (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    )
    with check (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

create policy "review_reply_drafts_delete" on public.review_reply_drafts
    for delete to authenticated
    using (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

-- review_reply_records ポリシー
create policy "review_reply_records_select" on public.review_reply_records
    for select to authenticated
    using (
        organization_id in (select public.auth_user_organization_ids())
        or public.auth_is_platform_admin()
    );

create policy "review_reply_records_insert" on public.review_reply_records
    for insert to authenticated
    with check (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

create policy "review_reply_records_update" on public.review_reply_records
    for update to authenticated
    using (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    )
    with check (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

create policy "review_reply_records_delete" on public.review_reply_records
    for delete to authenticated
    using (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

-- review_reply_settings ポリシー
create policy "review_reply_settings_select" on public.review_reply_settings
    for select to authenticated
    using (
        organization_id in (select public.auth_user_organization_ids())
        or public.auth_is_platform_admin()
    );

create policy "review_reply_settings_insert" on public.review_reply_settings
    for insert to authenticated
    with check (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

create policy "review_reply_settings_update" on public.review_reply_settings
    for update to authenticated
    using (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    )
    with check (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

create policy "review_reply_settings_delete" on public.review_reply_settings
    for delete to authenticated
    using (
        public.auth_user_is_org_admin(organization_id)
        or public.auth_is_platform_admin()
    );

-- 6. cleanup_expired_gbp_cache() 関数の拡張 (review_reply_drafts の30日削除を追加)
create or replace function public.cleanup_expired_gbp_cache()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    deleted_reviews integer := 0;
    deleted_perfs integer := 0;
    deleted_drafts integer := 0;
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

    -- 30日超過または期限切れの返信下書きを削除 (Google Content 派生物の30日保持制約)
    delete from public.review_reply_drafts
    where expires_at <= now()
       or fetched_at < (now() - interval '30 days');
    get diagnostics deleted_drafts = row_count;

    return jsonb_build_object(
        'deleted_reviews', deleted_reviews,
        'deleted_performance_metrics', deleted_perfs,
        'deleted_reply_drafts', deleted_drafts,
        'executed_at', now()
    );
end;
$$;
