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
-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: 行レベルセキュリティ (RLS) ポリシー定義
-- ─────────────────────────────────────────────────────────────

-- 全公開テーブルのRLSを有効化
alter table public.organizations enable row level security;
alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.survey_sessions enable row level security;
alter table public.survey_answers enable row level security;
alter table public.review_generations enable row level security;
alter table public.events enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_issues enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_resources enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.gbp_review_cache enable row level security;
alter table public.gbp_performance_cache enable row level security;
alter table public.audit_logs enable row level security;

-- private.integration_tokens もRLS有効化（一般ポリシーは作成せずservice_roleのみアクセス）
alter table private.integration_tokens enable row level security;

-- ─────────────────────────────────────────────────────────────
-- RLSヘルパー関数 (security definer で安全に実行)
-- ─────────────────────────────────────────────────────────────

-- 1. ログインユーザーがアクティブメンバーである組織ID一覧を取得
create or replace function public.auth_user_organization_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
    select organization_id
    from public.organization_members
    where user_id = auth.uid()
      and status = 'active';
$$;

-- 2. ログインユーザーがプラットフォーム管理者かどうかを判定
create or replace function public.auth_is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select coalesce(
        (select is_platform_admin from public.profiles where user_id = auth.uid()),
        false
    );
$$;

-- 3. ログインユーザーが特定組織のownerまたはadminかどうかを判定
create or replace function public.auth_user_is_org_admin(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.organization_members
        where organization_id = org_id
          and user_id = auth.uid()
          and role in ('owner', 'admin')
          and status = 'active'
    ) or public.auth_is_platform_admin();
$$;

-- ─────────────────────────────────────────────────────────────
-- 各テーブルのRLSポリシー
-- ─────────────────────────────────────────────────────────────

-- 1. profiles: 自分のプロフィールのみ参照・更新可能（プラットフォーム管理者は全員参照可）
create policy "profiles_select_own" on public.profiles
    for select to authenticated
    using (user_id = auth.uid() or public.auth_is_platform_admin());

create policy "profiles_update_own" on public.profiles
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- 2. organizations: 所属組織のみ参照可能、owner/adminのみ更新可能
create policy "organizations_select_member" on public.organizations
    for select to authenticated
    using (id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

create policy "organizations_update_admin" on public.organizations
    for update to authenticated
    using (public.auth_user_is_org_admin(id))
    with check (public.auth_user_is_org_admin(id));

-- 3. organization_members: 所属組織のメンバーのみ参照可能、owner/adminのみ変更可能
create policy "org_members_select_member" on public.organization_members
    for select to authenticated
    using (organization_id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

create policy "org_members_modify_admin" on public.organization_members
    for all to authenticated
    using (public.auth_user_is_org_admin(organization_id))
    with check (public.auth_user_is_org_admin(organization_id));

-- 4. locations: 所属組織の店舗のみ参照可能、owner/adminのみ更新・追加可能
create policy "locations_select_member" on public.locations
    for select to authenticated
    using (organization_id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

create policy "locations_modify_admin" on public.locations
    for all to authenticated
    using (public.auth_user_is_org_admin(organization_id))
    with check (public.auth_user_is_org_admin(organization_id));

-- 5. survey_sessions, survey_answers, review_generations, events: 所属組織のデータのみ参照可能
create policy "survey_sessions_select_member" on public.survey_sessions
    for select to authenticated
    using (organization_id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

create policy "survey_answers_select_member" on public.survey_answers
    for select to authenticated
    using (organization_id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

create policy "review_generations_select_member" on public.review_generations
    for select to authenticated
    using (organization_id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

create policy "events_select_member" on public.events
    for select to authenticated
    using (organization_id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

-- 6. coupons: 所属組織のクーポンのみ参照可能、owner/admin/managerが変更可能
create policy "coupons_select_member" on public.coupons
    for select to authenticated
    using (organization_id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

create policy "coupons_modify_admin" on public.coupons
    for all to authenticated
    using (public.auth_user_is_org_admin(organization_id))
    with check (public.auth_user_is_org_admin(organization_id));

create policy "coupon_issues_select_member" on public.coupon_issues
    for select to authenticated
    using (coupon_id in (select id from public.coupons where organization_id in (select public.auth_user_organization_ids())) or public.auth_is_platform_admin());

-- 7. integration_connections, integration_resources, sync_jobs: owner/adminのみ管理可能
create policy "integrations_all_admin" on public.integration_connections
    for all to authenticated
    using (public.auth_user_is_org_admin(organization_id))
    with check (public.auth_user_is_org_admin(organization_id));

create policy "integration_resources_all_admin" on public.integration_resources
    for all to authenticated
    using (connection_id in (select id from public.integration_connections where public.auth_user_is_org_admin(organization_id)))
    with check (connection_id in (select id from public.integration_connections where public.auth_user_is_org_admin(organization_id)));

create policy "sync_jobs_all_admin" on public.sync_jobs
    for all to authenticated
    using (public.auth_user_is_org_admin(organization_id))
    with check (public.auth_user_is_org_admin(organization_id));

-- 8. gbp_review_cache, gbp_performance_cache: 所属組織の店舗のキャッシュのみ閲覧可能
create policy "gbp_review_cache_select_member" on public.gbp_review_cache
    for select to authenticated
    using (location_id in (select id from public.locations where organization_id in (select public.auth_user_organization_ids())) or public.auth_is_platform_admin());

create policy "gbp_perf_cache_select_member" on public.gbp_performance_cache
    for select to authenticated
    using (location_id in (select id from public.locations where organization_id in (select public.auth_user_organization_ids())) or public.auth_is_platform_admin());

-- 9. audit_logs: 所属組織の監査ログのみ閲覧可能（更新・削除は不可）
create policy "audit_logs_select_admin" on public.audit_logs
    for select to authenticated
    using (public.auth_user_is_org_admin(organization_id));
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
-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: シードデータ定義 (冪等投入対応)
-- ─────────────────────────────────────────────────────────────

-- 1. 組織（テナント）シード
-- 実顧客テナント（1社に2店舗）
insert into public.organizations (id, slug, name, plan, status, is_demo)
values (
    'a0000000-0000-0000-0000-000000000001',
    'golf-resort-corp',
    '株式会社ゴルフリゾート（実証実験）',
    'growth',
    'active',
    false
)
on conflict (id) do update set
    name = excluded.name,
    plan = excluded.plan,
    status = excluded.status,
    is_demo = excluded.is_demo;

-- 商談デモテナント
insert into public.organizations (id, slug, name, plan, status, is_demo)
values (
    'a0000000-0000-0000-0000-000000000002',
    'demo-golf-org',
    '商談デモ（ゴルフ場モデル）',
    'growth',
    'active',
    true
)
on conflict (id) do update set
    name = excluded.name,
    plan = excluded.plan,
    status = excluded.status,
    is_demo = excluded.is_demo;

-- 2. 店舗シード
-- ゴルフ場A (golf-a, legacy: classic)
insert into public.locations (
    id,
    organization_id,
    public_slug,
    legacy_slugs,
    name,
    category,
    google_maps_review_url,
    keywords,
    survey_options,
    is_active
)
values (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'golf-a',
    array['classic'],
    'ゴルフ場A（チャンピオンコース）',
    'ゴルフ場・ゴルフコース',
    'https://maps.google.com/?q=golf',
    array['ゴルフ場', 'ゴルフコース', 'カントリークラブ', 'ラウンド', 'コンペ', 'ゴルフ倶楽部'],
    '{
      "sources": [
        "Google検索",
        "Googleマップ",
        "予約サイト（楽天GORA/GDO等）",
        "知人・ゴルフ仲間の紹介",
        "ゴルフコンペでの参加",
        "ホームページ・SNSを見て",
        "以前から利用している",
        "その他"
      ],
      "menus": [
        "レギュラーラウンド（18H）",
        "ハーフプレー（早朝・薄暮）",
        "コンペ利用（団体・プライベート）",
        "プロによるワンポイント指導",
        "練習場（打席・アプローチ）のみ",
        "レストラン（ランチ・食事）のみ",
        "その他"
      ],
      "goodPoints": [
        "コース・グリーンのメンテナンス状態が良い",
        "フェアウェイが広く戦略性のある面白いレイアウト",
        "クラブハウスや設備が清潔・綺麗",
        "レストランの食事・ランチがとても美味しい",
        "スタッフ・キャディ・フロントの接客が親切で丁寧",
        "プレーの進行がスムーズで快適だった",
        "インターチェンジからのアクセスが良い",
        "料金とコース品質のバランス（コスパ）が高い",
        "練習設備（アプローチ・バンカー等）が充実している",
        "雄大な景色・自然のロケーションが素晴らしい"
      ],
      "badPoints": [
        "前後の組との間隔や進行が気になった",
        "グリーンの状態が少し気になった",
        "予約が取りづらいと感じた",
        "クラブハウスの設備で気になる点があった",
        "レストランのメニュー数がもっと欲しい",
        "スタッフの案内に少し分かりにくい点があった",
        "アクセスや案内表示が分かりにくかった",
        "その他"
      ]
    }'::jsonb,
    true
)
on conflict (id) do update set
    public_slug = excluded.public_slug,
    legacy_slugs = excluded.legacy_slugs,
    name = excluded.name,
    survey_options = excluded.survey_options,
    keywords = excluded.keywords;

-- ゴルフ場B (golf-b, legacy: ss-grand)
insert into public.locations (
    id,
    organization_id,
    public_slug,
    legacy_slugs,
    name,
    category,
    google_maps_review_url,
    keywords,
    survey_options,
    is_active
)
values (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'golf-b',
    array['ss-grand'],
    'ゴルフ場B（リゾートコース）',
    'ゴルフ場・リゾートゴルフ',
    'https://maps.google.com/?q=golf',
    array['ゴルフ場', 'リゾートゴルフ', 'ゴルフ倶楽部', 'ショートコース', 'ゴルフレッスン', 'ジュニアゴルフ'],
    '{
      "sources": [
        "Google検索",
        "Googleマップ",
        "予約サイト（楽天GORA/GDO等）",
        "知人・友人の紹介",
        "ホームページ・SNSを見て",
        "提携練習場で見かけて",
        "宿泊・観光を兼ねて",
        "その他"
      ],
      "menus": [
        "通常ラウンド（18ホール）",
        "宿泊パックラウンド",
        "ジュニア・ファミリープレー",
        "初心者向けコースレッスン",
        "ハーフプレー（9ホール）",
        "クラブハウス・レストラン利用",
        "その他"
      ],
      "goodPoints": [
        "リゾート感があり開放的なロケーション",
        "コース整備が行き届いていて気持ちよくプレーできた",
        "初心者や女性・ジュニアでも回りやすい設計",
        "カートの乗り入れや設備が快適だった",
        "レストランの料理やデザートが美味しい",
        "スタッフの笑顔とホスピタリティが素晴らしい",
        "クラブハウスやお風呂が綺麗で清潔",
        "宿泊施設や温泉が併設されていて便利",
        "コストパフォーマンスが非常に高い",
        "周辺観光やインターからの利便性が良い"
      ],
      "badPoints": [
        "混雑時の待ち時間が気になった",
        "コースの起伏や難易度が少し高く感じた",
        "予約の変更手続きが分かりにくかった",
        "練習設備の打席数がもう少し欲しかった",
        "案内や標識が少し見づらかった",
        "その他"
      ]
    }'::jsonb,
    true
)
on conflict (id) do update set
    public_slug = excluded.public_slug,
    legacy_slugs = excluded.legacy_slugs,
    name = excluded.name,
    survey_options = excluded.survey_options,
    keywords = excluded.keywords;

-- ゴルフ場（デモ用） (golf, legacy: demo-golf)
insert into public.locations (
    id,
    organization_id,
    public_slug,
    legacy_slugs,
    name,
    category,
    google_maps_review_url,
    keywords,
    survey_options,
    is_active
)
values (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'golf',
    array['demo-golf'],
    'ゴルフ場（デモ用）',
    'ゴルフ場・カントリークラブ',
    'https://maps.google.com/?q=golf',
    array['ゴルフ場', 'ゴルフコース', 'カントリークラブ', 'ラウンド', 'コンペ'],
    '{
      "sources": [
        "Google検索",
        "Googleマップ",
        "予約サイト（楽天GORA/GDO等）",
        "知人・ゴルフ仲間の紹介",
        "ゴルフコンペでの参加",
        "ホームページ・SNSを見て",
        "以前から利用している",
        "その他"
      ],
      "menus": [
        "レギュラーラウンド（18H）",
        "ハーフプレー（早朝・薄暮）",
        "コンペ利用（団体・プライベート）",
        "プロによるワンポイント指導",
        "練習場（打席・アプローチ）のみ",
        "レストラン（ランチ・食事）のみ",
        "その他"
      ],
      "goodPoints": [
        "コース・グリーンのメンテナンス状態が良い",
        "フェアウェイが広く戦略性のある面白いレイアウト",
        "クラブハウスや設備が清潔・綺麗",
        "レストランの食事・ランチがとても美味しい",
        "スタッフ・キャディ・フロントの接客が親切で丁寧",
        "プレーの進行がスムーズで快適だった",
        "インターチェンジからのアクセスが良い",
        "料金とコース品質のバランス（コスパ）が高い",
        "練習設備（アプローチ・バンカー等）が充実している",
        "雄大な景色・自然のロケーションが素晴らしい"
      ],
      "badPoints": [
        "前後の組との間隔や進行が気になった",
        "グリーンの状態が少し気になった",
        "予約が取りづらいと感じた",
        "クラブハウスの設備で気になる点があった",
        "レストランのメニュー数がもっと欲しい",
        "スタッフの案内に少し分かりにくい点があった",
        "その他"
      ]
    }'::jsonb,
    true
)
on conflict (id) do update set
    public_slug = excluded.public_slug,
    legacy_slugs = excluded.legacy_slugs,
    name = excluded.name,
    survey_options = excluded.survey_options,
    keywords = excluded.keywords;

-- 3. クーポンシード（アンケート回答特典）
insert into public.coupons (
    id,
    organization_id,
    location_id,
    title,
    description,
    badge_text,
    expiry_date,
    is_active
)
values
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'ゴルフ場A アンケートご協力のお礼',
    '次回ラウンド時、またはプロショップ・レストランでご利用いただける特典です。',
    '特典',
    '30日後まで有効',
    true
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'ゴルフ場B アンケートご協力のお礼',
    '次回ラウンド時、またはプロショップ・レストランでご利用いただける特典です。',
    '特典',
    '30日後まで有効',
    true
),
(
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'ゴルフ場 アンケートご協力のお礼',
    '次回ラウンド時にご利用いただける特典です。',
    '特典',
    '30日後まで有効',
    true
)
on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    is_active = excluded.is_active;
