-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: QRキャンペーン & 匿名サーベイセッション・ファネル計測スキーマ
-- ─────────────────────────────────────────────────────────────

-- 1. QRキャンペーンテーブル
create table if not exists public.qr_campaigns (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    location_id uuid not null references public.locations(id) on delete cascade,
    public_id text unique not null,
    name text not null,
    placement text not null default 'table', -- 'table', 'cashier', 'receipt', 'staff_card', etc.
    medium text not null default 'qr', -- 'qr', 'flyer', 'pop', etc.
    staff_label text, -- 任意ラベル（個人情報特定不可のもの）
    start_at timestamptz,
    end_at timestamptz,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. survey_sessions への campaign_id 外部キー追加
alter table public.survey_sessions
    add column if not exists campaign_id uuid references public.qr_campaigns(id) on delete set null;

-- 3. coupon_issues の session_id nullability 整合性
-- (セッション未接続時およびレガシーデータとの後方互換性のため null 許容を許容)
alter table public.coupon_issues
    alter column session_id drop not null;

-- 4. インデックス作成
create index if not exists idx_qr_campaigns_org_loc
    on public.qr_campaigns(organization_id, location_id);

create index if not exists idx_qr_campaigns_public_id
    on public.qr_campaigns(public_id);

create index if not exists idx_survey_sessions_campaign
    on public.survey_sessions(campaign_id);

-- 5. RLS (行レベルセキュリティ) 有効化
alter table public.qr_campaigns enable row level security;

-- 6. RLSポリシー定義
drop policy if exists "qr_campaigns_select_member" on public.qr_campaigns;
create policy "qr_campaigns_select_member" on public.qr_campaigns
    for select to authenticated
    using (organization_id in (select public.auth_user_organization_ids()) or public.auth_is_platform_admin());

drop policy if exists "qr_campaigns_modify_admin" on public.qr_campaigns;
create policy "qr_campaigns_modify_admin" on public.qr_campaigns
    for all to authenticated
    using (public.auth_user_is_org_admin(organization_id))
    with check (public.auth_user_is_org_admin(organization_id));
