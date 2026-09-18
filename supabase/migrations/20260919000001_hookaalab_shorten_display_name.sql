-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: HOOKAA Lab の表示名を短縮（暫定対処）
--
-- 【背景】
-- public.locations に short_name 列が存在せず、Supabase→Store の変換でも
-- shortName をマッピングしていないため、本番では全店舗で shortName が失われる。
-- その結果 buildPrompt / buildMockDrafts が store.name（正式名称フル）に
-- フォールバックし、生成される口コミ文が以下のように不自然になる。
--
--   × 「HOOKAA Lab（フーカーラボ） カフェ&シーシャバーに行ってきました」
--   ○ 「HOOKAA Labに行ってきました」
--
-- 実際のお客様がGoogleマップへ投稿する文面に直接影響するため、
-- 商談デモに間に合わせる暫定対処として name 自体を短縮する。
--
-- 【恒久対処（別タスク）】
-- locations に short_name 列を追加し、supabase-repository でマッピングする。
-- それが入った時点で、本マイグレーションは巻き戻して
--   name       = 'HOOKAA Lab（フーカーラボ） カフェ&シーシャバー'
--   short_name = 'HOOKAA Lab'
-- とするのが正しい姿。ゴルフ2店舗も同じ症状のため、恒久対処で一括解消する。
-- ─────────────────────────────────────────────────────────────

update public.locations
set
    name = 'HOOKAA Lab',
    updated_at = now()
where id = 'b0000000-0000-0000-0000-000000000004';
