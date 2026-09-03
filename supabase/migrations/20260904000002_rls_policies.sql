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
