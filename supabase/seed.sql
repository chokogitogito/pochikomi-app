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
