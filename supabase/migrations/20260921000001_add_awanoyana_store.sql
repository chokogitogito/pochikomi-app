-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: 粟野町観光やな アカウント追加 (冪等実行対応)
--
-- 対象店舗: 粟野町観光やな（有限会社粟野町観光やな）
--   所在地   : 栃木県鹿沼市深程870-3（思川／通称・小倉川 沿い）
--   業種     : 観光漁業・郷土料理（鮎の炭火焼き専門）
--   営業     : 6月上旬〜10月末の季節営業／11:00〜15:00（最終入店14:00）
--   特記     : 現金のみ・予約優先・つかみ取りは非実施（座敷でゆっくり食べる施設）
--   Place ID : ChIJO2XYT9xqH2ARlpYYZbJnRwA
--              （案件フォルダ記載の共有URLからFTID 0x601f6adc4fd8653b:0x4767b265189696
--                を取得し変換。place_id指定で当該店舗へ解決することを確認済み）
--
-- 他クライアントとは別事業者のため、独立した organization として作成する。
-- 実店舗の実アカウントのため is_demo = false。
-- ─────────────────────────────────────────────────────────────

-- 1. 契約組織（テナント）
insert into public.organizations (id, slug, name, plan, status, is_demo)
values (
    'a0000000-0000-0000-0000-000000000006',
    'awanoyana',
    '有限会社粟野町観光やな',
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

-- 2. 店舗
insert into public.locations (
    id,
    organization_id,
    public_slug,
    legacy_slugs,
    name,
    short_name,
    monthly_goal,
    category,
    google_place_id,
    google_maps_review_url,
    keywords,
    survey_options,
    is_active
)
values (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000006',
    'awanoyana',
    array[]::text[],
    '粟野町観光やな',
    '粟野町観光やな',
    20,
    '鮎料理・観光やな',
    'ChIJO2XYT9xqH2ARlpYYZbJnRwA',
    'https://search.google.com/local/writereview?placeid=ChIJO2XYT9xqH2ARlpYYZbJnRwA',
    array['鹿沼', '鮎', '鮎料理', '観光やな', '炭火焼き', '思川', '座敷'],
    '{
      "sources": [
        "Google検索",
        "Googleマップ",
        "知人・友人の紹介",
        "観光協会・観光サイトを見て",
        "近くを通りかかって",
        "鮎釣りのついでに",
        "毎年来ている",
        "その他"
      ],
      "menus": [
        "鮎の塩焼き（2匹）",
        "鮎の塩焼き（3匹）",
        "稚鮎（アイソ）の唐揚げ",
        "うなぎ料理",
        "ごはん・鮎入り味噌汁のセット",
        "焼きそば",
        "テイクアウト",
        "おとり鮎の購入",
        "その他"
      ],
      "goodPoints": [
        "炭火で焼いた鮎が香ばしかった",
        "身がふっくらしていて美味しかった",
        "稚鮎の唐揚げがサクサクだった",
        "川のせせらぎを聞きながら食事できた",
        "座敷でゆっくり過ごせた",
        "子ども連れでも気兼ねなく過ごせた",
        "値段に納得できた",
        "店員さんの対応が親切だった",
        "駐車場が停めやすかった",
        "建物や店内がきれいだった"
      ],
      "badPoints": [
        "待ち時間が長かった",
        "混雑していて落ち着かなかった",
        "冷房がなく暑かった",
        "現金のみで戸惑った",
        "営業時間や営業期間が分かりにくかった",
        "予約が必要と知らずに行った",
        "メニューや価格が分かりにくかった",
        "道順が分かりにくかった"
      ]
    }'::jsonb,
    true
)
on conflict (id) do update set
    organization_id = excluded.organization_id,
    public_slug = excluded.public_slug,
    name = excluded.name,
    short_name = excluded.short_name,
    monthly_goal = excluded.monthly_goal,
    category = excluded.category,
    google_place_id = excluded.google_place_id,
    google_maps_review_url = excluded.google_maps_review_url,
    keywords = excluded.keywords,
    survey_options = excluded.survey_options,
    is_active = excluded.is_active,
    updated_at = now();

-- 3. クーポン（アンケート回答完了特典。Google口コミ投稿の対価ではない）
insert into public.coupons (
    id, organization_id, location_id, title, description, badge_text, expiry_date, is_active
)
values (
    'c0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000006',
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
