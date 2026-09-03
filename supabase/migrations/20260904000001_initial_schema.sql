-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: 初期スキーマ定義 (Multi-tenant SaaS Architecture)
-- ─────────────────────────────────────────────────────────────

-- 拡張機能の有効化
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- private スキーマ（外部・APIから直接アクセス不能な秘密管理用）
create schema if not exists private;

-- 1. 契約組織（テナント）テーブル
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    name text not null,
    plan text not null default 'pro',
    status text not null default 'active' check (status in ('active', 'trial', 'suspended')),
    is_demo boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. 店舗テーブル
create table if not exists public.locations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    public_slug text unique not null,
    legacy_slugs text[] default '{}',
    name text not null,
    category text not null default 'golf',
    google_place_id text,
    google_maps_review_url text not null default '',
    survey_options jsonb not null default '{}'::jsonb,
    keywords text[] default '{}',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. ユーザープロフィールテーブル（auth.users と 1:1 紐付け）
create table if not exists public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    email text,
    display_name text not null default '',
    is_platform_admin boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. 組織メンバー所属・ロールテーブル
create table if not exists public.organization_members (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('owner', 'admin', 'manager', 'viewer')),
    status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(organization_id, user_id)
);

-- 5. アンケートセッションテーブル（匿名回答単位）
create table if not exists public.survey_sessions (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    user_agent text,
    ip_hash text
);

-- 6. アンケート回答明細テーブル
create table if not exists public.survey_answers (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.survey_sessions(id) on delete cascade,
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    rating integer check (rating >= 1 and rating <= 5),
    answers jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- 7. AI口コミ生成履歴テーブル
create table if not exists public.review_generations (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.survey_sessions(id) on delete cascade,
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    prompt_version text not null default 'v1',
    model text not null default 'gemini-3.6-flash',
    generated_reviews jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

-- 8. イベント計測テーブル（ファネル分析用）
create table if not exists public.events (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    session_id uuid references public.survey_sessions(id) on delete set null,
    event_type text not null, -- 'survey_view', 'generate_click', 'copy_click', 'maps_click', 'coupon_view', 'coupon_use'
    metadata jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null default now()
);

-- 9. クーポンマスタテーブル（アンケート回答特典）
create table if not exists public.coupons (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    title text not null,
    description text not null default '',
    badge_text text,
    expiry_date text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 10. クーポン発行・利用履歴テーブル
create table if not exists public.coupon_issues (
    id uuid primary key default gen_random_uuid(),
    coupon_id uuid not null references public.coupons(id) on delete cascade,
    session_id uuid not null references public.survey_sessions(id) on delete cascade,
    code_hash text,
    issued_at timestamptz not null default now(),
    redeemed_at timestamptz
);

-- 11. 外部連携接続テーブル（Google GBP / GA4）
create table if not exists public.integration_connections (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    provider text not null check (provider in ('google_gbp', 'google_ga4')),
    account_id text not null,
    account_name text,
    scopes text[] not null default '{}',
    status text not null default 'active' check (status in ('active', 'expired', 'revoked', 'error')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(organization_id, provider)
);

-- 12. 外部連携暗号化トークン保管テーブル（privateスキーマ）
create table if not exists private.integration_tokens (
    id uuid primary key default gen_random_uuid(),
    connection_id uuid not null references public.integration_connections(id) on delete cascade unique,
    access_token_encrypted text not null,
    refresh_token_encrypted text,
    token_expires_at timestamptz,
    updated_at timestamptz not null default now()
);

-- 13. 店舗と外部リソースのマッピングテーブル
create table if not exists public.integration_resources (
    id uuid primary key default gen_random_uuid(),
    connection_id uuid not null references public.integration_connections(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    resource_type text not null check (resource_type in ('gbp_location', 'ga4_property')),
    external_id text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    unique(connection_id, resource_type, external_id)
);

-- 14. 同期ジョブ管理テーブル
create table if not exists public.sync_jobs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    provider text not null,
    resource_id uuid references public.integration_resources(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
    attempts integer not null default 0,
    last_error text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

-- 15. GBP口コミ一時キャッシュテーブル（Google Content 30日保持制限準拠）
create table if not exists public.gbp_review_cache (
    id uuid primary key default gen_random_uuid(),
    location_id uuid not null references public.locations(id) on delete cascade,
    external_review_id text not null,
    reviewer_name text,
    star_rating integer,
    comment text,
    review_created_at timestamptz,
    fetched_at timestamptz not null default now(),
    expires_at timestamptz not null,
    unique(location_id, external_review_id)
);

-- 16. GBPパフォーマンス一時キャッシュテーブル（Google Content 30日保持制限準拠）
create table if not exists public.gbp_performance_cache (
    id uuid primary key default gen_random_uuid(),
    location_id uuid not null references public.locations(id) on delete cascade,
    date date not null,
    metric_type text not null,
    metric_value integer not null default 0,
    fetched_at timestamptz not null default now(),
    expires_at timestamptz not null,
    unique(location_id, date, metric_type)
);

-- 17. 監査ログテーブル
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    actor_user_id uuid references auth.users(id) on delete set null,
    action text not null,
    target_type text not null,
    target_id text,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- インデックス作成
-- ─────────────────────────────────────────────────────────────
create index if not exists idx_locations_org_id on public.locations(organization_id);
create index if not exists idx_locations_public_slug on public.locations(public_slug);
create index if not exists idx_org_members_user_id on public.organization_members(user_id);
create index if not exists idx_org_members_org_id on public.organization_members(organization_id);
create index if not exists idx_survey_sessions_org_loc on public.survey_sessions(organization_id, location_id);
create index if not exists idx_survey_answers_session on public.survey_answers(session_id);
create index if not exists idx_review_gen_session on public.review_generations(session_id);
create index if not exists idx_events_org_loc_type on public.events(organization_id, location_id, event_type);
create index if not exists idx_events_occurred_at on public.events(occurred_at);
create index if not exists idx_coupons_location on public.coupons(location_id);
create index if not exists idx_gbp_review_expires on public.gbp_review_cache(expires_at);
create index if not exists idx_gbp_perf_expires on public.gbp_performance_cache(expires_at);
create index if not exists idx_sync_jobs_status on public.sync_jobs(status);
