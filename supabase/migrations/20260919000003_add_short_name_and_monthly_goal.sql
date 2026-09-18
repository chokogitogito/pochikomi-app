-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: locations に short_name / monthly_goal を追加（恒久対処）
--
-- 【背景】
-- locations に short_name・monthly_goal 列が無く、mapLocationToStore が
--   shortName    → 未設定（= 正式名称フルにフォールバック）
--   monthlyGoal  → 20 固定
-- としていたため、本番では全店舗で以下の不具合が出ていた。
--
--   1. 生成される口コミ文に店舗の正式名称がフルで入り不自然になる
--      × 「HOOKAA Lab（フーカーラボ） カフェ&シーシャバーに行ってきました」
--      ○ 「HOOKAA Labに行ってきました」
--   2. 月間目標がどの店舗でも20件になり、目標達成率が正しく出ない
--
-- 20260919000001 で HOOKAA Lab の name を短縮した暫定対処は、本マイグレーションで
-- 巻き戻し、name を正式名称へ戻したうえで short_name を設定する。
--
-- あわせてデモ拠点の名称から「（デモ用）」「（商談デモ用）」の表記を外す。
-- 商談画面にそのまま表示されるため。デモ判定は organizations.is_demo で行う。
-- ─────────────────────────────────────────────────────────────

alter table public.locations
    add column if not exists short_name text,
    add column if not exists monthly_goal integer not null default 20;

comment on column public.locations.short_name is '口コミ文中で使う略称。未設定なら name を使う';
comment on column public.locations.monthly_goal is '月間の口コミ獲得目標件数';

-- The蔵ssic
update public.locations
set short_name = 'The蔵ssic', monthly_goal = 20, updated_at = now()
where id = 'b0000000-0000-0000-0000-000000000001';

-- SS.GRAND
update public.locations
set short_name = 'SS.GRAND', monthly_goal = 20, updated_at = now()
where id = 'b0000000-0000-0000-0000-000000000002';

-- ゴルフ場デモ（「（デモ用）」表記を削除）
update public.locations
set name = 'ゴルフ場', short_name = 'ゴルフ場', monthly_goal = 20, updated_at = now()
where id = 'b0000000-0000-0000-0000-000000000003';

-- HOOKAA Lab（20260919000001の暫定短縮を巻き戻し、正式名称＋略称の正しい形へ）
update public.locations
set
    name = 'HOOKAA Lab（フーカーラボ） カフェ&シーシャバー',
    short_name = 'HOOKAA Lab',
    monthly_goal = 15,
    updated_at = now()
where id = 'b0000000-0000-0000-0000-000000000004';

-- ラーメン店デモ（「（商談デモ用）」表記を削除）
update public.locations
set name = 'ラーメン店', short_name = 'ラーメン店', monthly_goal = 150, updated_at = now()
where id = 'b0000000-0000-0000-0000-000000000005';
