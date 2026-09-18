-- ─────────────────────────────────────────────────────────────
-- 18 ポチコミ: 商談デモ用「ラーメン店」を追加 (冪等実行対応)
--
-- 目的: 商談で「MEO運用がうまくいっている店舗」の完成形を見せるためのデモ拠点。
--       導入前の店舗（HOOKAA Lab等）と並べることで、現状と到達点を対比できる。
--
-- ゴルフ場デモ（a0000000-...-002）とは業種が異なるため、飲食店モデルとして
-- 独立した is_demo = true テナントを作成する。
-- AGENTS.md の「商談デモ用データは is_demo = true の独立テナント」に準拠。
--
-- 注意: 数値は実在店舗の公開インサイトを参考にしたデモ値であり、
--       特定店舗の実績としては扱わないこと。店舗名・住所は登録しない。
-- ─────────────────────────────────────────────────────────────

-- 1. デモテナント（飲食店モデル）
insert into public.organizations (id, slug, name, plan, status, is_demo)
values (
    'a0000000-0000-0000-0000-000000000005',
    'demo-restaurant-org',
    '商談デモ（飲食店モデル）',
    'premium',
    'active',
    true
)
on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    plan = excluded.plan,
    status = excluded.status,
    is_demo = excluded.is_demo,
    updated_at = now();

-- 2. デモ店舗
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
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000005',
    'ramen',
    array[]::text[],
    'ラーメン店（商談デモ用）',
    'ラーメン・飲食店',
    'https://maps.google.com/?q=ramen',
    array['家系ラーメン', '豚骨ラーメン', '中野', '駅近', 'ランチ', '行列店'],
    '{
      "sources": [
        "Google検索",
        "Googleマップ",
        "SNS（X・Instagram）",
        "知人・友人の紹介",
        "食べログ・ラーメンまとめサイト",
        "店の前を通りかかって",
        "以前から常連",
        "その他"
      ],
      "menus": [
        "ラーメン（並）",
        "ラーメン（大盛）",
        "つけ麺",
        "味玉ラーメン",
        "チャーシューメン",
        "ライス・サイドメニュー",
        "テイクアウト",
        "その他"
      ],
      "goodPoints": [
        "スープが濃厚で好みの味だった",
        "麺の硬さを好みに調整してもらえた",
        "トッピングの種類が豊富だった",
        "回転が速く待ち時間が短かった",
        "ライス無料などコスパが良い",
        "店員さんの接客が気持ちよかった",
        "駅から近く立ち寄りやすい",
        "店内が清潔だった",
        "一人でも入りやすい雰囲気",
        "深夜まで営業していて助かる"
      ],
      "badPoints": [
        "待ち時間が長かった",
        "味が好みより濃かった／薄かった",
        "店内が混雑していて窮屈だった",
        "注文から提供まで時間がかかった",
        "店員さんの案内が分かりにくかった",
        "席やテーブルが気になった",
        "価格がやや高いと感じた",
        "メニューが分かりにくかった"
      ]
    }'::jsonb,
    true
)
on conflict (id) do update set
    organization_id = excluded.organization_id,
    public_slug = excluded.public_slug,
    name = excluded.name,
    category = excluded.category,
    google_maps_review_url = excluded.google_maps_review_url,
    keywords = excluded.keywords,
    survey_options = excluded.survey_options,
    is_active = excluded.is_active,
    updated_at = now();

-- 3. クーポン
insert into public.coupons (
    id, organization_id, location_id, title, description, badge_text, expiry_date, is_active
)
values (
    'c0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000005',
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
