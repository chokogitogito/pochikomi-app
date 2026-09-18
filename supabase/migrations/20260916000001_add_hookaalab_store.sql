-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: HOOKAA Lab（フーカーラボ）アカウント追加 (冪等実行対応)
--
-- 対象店舗: HOOKAA Lab（フーカーラボ） カフェ&シーシャバー
--   所在地   : 栃木県宇都宮市伝馬町3-19（ユニオン通り／東武宇都宮駅 徒歩約4分）
--   業態     : シーシャバー・カフェバー（2025年11月2日オープン）
--   Place ID : ChIJI7yD17BnH2AR7W7ndVyQScE
--              （Googleマップ短縮URL https://maps.app.goo.gl/rgBW5jvvpdMC9nXEA の
--                FTID 0x601f67b0d783bc23:0xc149905c75e76eed から導出し、
--                place_id 指定でHOOKAA Labに解決することを確認済み）
--
-- ゴルフ2店舗とは別事業者のため、独立した organization として作成する。
-- 実店舗の実アカウントのため is_demo = false。
-- ─────────────────────────────────────────────────────────────

-- 1. 契約組織（テナント）
insert into public.organizations (id, slug, name, plan, status, is_demo)
values (
    'a0000000-0000-0000-0000-000000000003',
    'hookaalab',
    'HOOKAA Lab（フーカーラボ）',
    'starter',
    'active',
    false
)
on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    plan = excluded.plan,
    status = excluded.status,
    is_demo = excluded.is_demo,
    updated_at = now();

-- 2. 店舗（locations）
insert into public.locations (
    id,
    organization_id,
    public_slug,
    legacy_slugs,
    name,
    category,
    google_place_id,
    google_maps_review_url,
    keywords,
    survey_options,
    is_active
)
values (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'hookaalab',
    array[]::text[],
    'HOOKAA Lab（フーカーラボ） カフェ&シーシャバー',
    'シーシャバー・カフェバー',
    'ChIJI7yD17BnH2AR7W7ndVyQScE',
    'https://search.google.com/local/writereview?placeid=ChIJI7yD17BnH2AR7W7ndVyQScE',
    array['宇都宮', 'シーシャ', 'シーシャバー', '水タバコ', 'ユニオン通り', '東武宇都宮駅', 'シーシャ初心者'],
    '{
      "sources": [
        "Google検索",
        "Googleマップ",
        "Instagram",
        "知人・友人の紹介",
        "ユニオン通りを通りかかって",
        "飲んだあとの2軒目に",
        "以前から知っていた",
        "その他"
      ],
      "menus": [
        "シーシャ（2時間・1台）",
        "シーシャ＋延長／フレーバーチェンジ",
        "昼シーシャ（アフタヌーンフーカー）",
        "お酒・カクテル",
        "ノンアルコール・カフェメニュー（珈琲／ラテ）",
        "フード（フランクソーセージなど）",
        "貸切・グループ利用",
        "スポーツ観戦・イベント参加",
        "その他"
      ],
      "goodPoints": [
        "初めてでも吸い方を丁寧に教えてもらえた",
        "好みを聞いてフレーバーを選んでもらえた",
        "フレーバーの種類が豊富だった",
        "煙が柔らかく味わいが良かった",
        "換気が良く空気がきれいで過ごしやすかった",
        "隠れ家のような落ち着いた雰囲気だった",
        "スタッフが気さくで話しやすかった",
        "珈琲やラテなどドリンクが充実していた",
        "一人でもゆっくり過ごせた",
        "看板亀のヨキチに癒された"
      ],
      "badPoints": [
        "席が空いておらず待つことになった",
        "料金や時間の仕組みが分かりにくかった",
        "煙や匂いが少し気になった",
        "営業時間や定休日が分かりにくかった",
        "駐車場がなく困った",
        "提供までに少し時間がかかった",
        "フレーバー選びに迷ってしまった",
        "店内が少し狭く感じた"
      ]
    }'::jsonb,
    true
)
on conflict (id) do update set
    organization_id = excluded.organization_id,
    public_slug = excluded.public_slug,
    legacy_slugs = excluded.legacy_slugs,
    name = excluded.name,
    category = excluded.category,
    google_place_id = excluded.google_place_id,
    google_maps_review_url = excluded.google_maps_review_url,
    keywords = excluded.keywords,
    survey_options = excluded.survey_options,
    is_active = excluded.is_active,
    updated_at = now();

-- 3. クーポン（アンケート回答完了特典。Google口コミ投稿の対価ではない）
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
values (
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000004',
    'アンケートご協力のお礼',
    '次回ご来店時にご利用いただけるお礼の特典です。',
    '特典',
    '30日後まで有効',
    true
)
on conflict (id) do update set
    organization_id = excluded.organization_id,
    location_id = excluded.location_id,
    title = excluded.title,
    description = excluded.description,
    badge_text = excluded.badge_text,
    expiry_date = excluded.expiry_date,
    is_active = excluded.is_active,
    updated_at = now();
