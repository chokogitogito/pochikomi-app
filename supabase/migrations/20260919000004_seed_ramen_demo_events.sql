-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: 商談デモ用「ラーメン店」のファネル実績シード (冪等実行対応)
--
-- 本番のメトリクスは events テーブルからの集計で算出されるため
-- （getMetricsFromSupabase）、デモ拠点にも実績を持たせるにはイベント行が要る。
-- ダッシュボードのKPI・ファネル図・拠点別比較テーブルはすべてこの集計を見るので、
-- イベントを入れておけば表示が自動的に整合する。
--
-- 目標値（月間口コミ+170件に見合う導線実績として設定）:
--   アンケート開始 412 / 口コミ作成 305 / マップ遷移 231 / クーポン発行 88
--   平均満足度 4.3（実店舗の星分布 5★63% 4★20% 3★7% 2★2% 1★8% に合わせる）
--
-- is_demo = true のデモテナント配下のみを対象とし、実顧客のイベントには触れない。
-- ─────────────────────────────────────────────────────────────

-- 冪等化: このデモ拠点の既存イベントを一旦消してから入れ直す
delete from public.events
where location_id = 'b0000000-0000-0000-0000-000000000005';

-- 1. アンケート開始 412件（直近30日に分散）
insert into public.events (organization_id, location_id, event_type, metadata, occurred_at)
select
    'a0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000005',
    'survey_started',
    '{"demo": true}'::jsonb,
    now() - (random() * 30 || ' days')::interval
from generate_series(1, 412);

-- 2. 口コミ文章の作成 305件（星分布を持たせ平均4.3にする）
insert into public.events (organization_id, location_id, event_type, metadata, occurred_at)
select
    'a0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000005',
    'review_generated',
    jsonb_build_object('rating', r.rating, 'demo', true),
    now() - (random() * 30 || ' days')::interval
from (
    values (5, 192), (4, 61), (3, 21), (2, 6), (1, 25)
) as r(rating, cnt)
cross join lateral generate_series(1, r.cnt);

-- 3. Googleマップ遷移 231件
insert into public.events (organization_id, location_id, event_type, metadata, occurred_at)
select
    'a0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000005',
    'review_clicked',
    '{"demo": true}'::jsonb,
    now() - (random() * 30 || ' days')::interval
from generate_series(1, 231);

-- 4. クーポン発行 88件
insert into public.events (organization_id, location_id, event_type, metadata, occurred_at)
select
    'a0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000005',
    'coupon_issued',
    '{"demo": true}'::jsonb,
    now() - (random() * 30 || ' days')::interval
from generate_series(1, 88);
