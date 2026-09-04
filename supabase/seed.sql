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
-- The蔵ssic (golf-a, legacy: classic)
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
    'ゴルフコンディショニングスタジオ宇都宮 The蔵ssic',
    'インドアゴルフスタジオ',
    'https://search.google.com/local/writereview?placeid=ChIJq6cE-5BnH2ARkt6391zxpfE',
    array['宇都宮', 'インドアゴルフ', 'ゴルフレッスン', 'ゴルフスクール', 'コンディショニング', 'スイング診断'],
    '{
      "sources": [
        "Google検索",
        "Googleマップ",
        "YouTubeのレッスン動画",
        "知人・友人の紹介",
        "ホームページを見て",
        "近くを通りかかって",
        "以前から知っていた",
        "その他"
      ],
      "menus": [
        "体験レッスン",
        "レンジレッスン（グループ）",
        "The蔵ssicLab／SAKAizm パーソナルレッスン",
        "ゴルフフィットネス・コンディショニング",
        "レンジ（打席で自主練習）",
        "コースレッスン（屋外）",
        "その他"
      ],
      "goodPoints": [
        "スイングの課題を的確に指摘してもらえた",
        "数値やデータで説明してもらえた",
        "体の使い方から教えてもらえた",
        "初心者にも分かりやすい説明だった",
        "自分に合った練習メニューを組んでもらえた",
        "スコアやショットが実際に良くなった",
        "屋内で天候に左右されず練習できる",
        "設備・トレーニング機器が充実している",
        "予約が取りやすく通いやすい",
        "コーチ・スタッフの雰囲気が良い"
      ],
      "badPoints": [
        "説明が少し分かりにくかった",
        "予約が取りづらいと感じた",
        "料金や会員プランが分かりにくかった",
        "期待していた内容と少し違った",
        "打席や設備の空き状況が気になった",
        "コーチによって指導内容に差を感じた",
        "施設で気になる点があった",
        "連絡や案内が分かりにくかった"
      ]
    }'::jsonb,
    true
)
on conflict (id) do update set
    public_slug = excluded.public_slug,
    legacy_slugs = excluded.legacy_slugs,
    name = excluded.name,
    category = excluded.category,
    google_maps_review_url = excluded.google_maps_review_url,
    survey_options = excluded.survey_options,
    keywords = excluded.keywords;

-- SS.GRAND (golf-b, legacy: ss-grand)
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
    'SS.GRAND（エスエスグランド スクールオブゴルフ）',
    'ゴルフ練習場・ゴルフスクール',
    'https://search.google.com/local/writereview?placeid=ChIJS4v-189cH2ARWAD0JxG0qb8',
    array['宇都宮', 'ゴルフ練習場', 'ゴルフレッスン', 'ゴルフスクール', 'ジュニアレッスン', '筑波ジャンボゴルフセンター'],
    '{
      "sources": [
        "Google検索",
        "Googleマップ",
        "知人・友人の紹介",
        "ホームページを見て",
        "筑波ジャンボゴルフセンターで見かけて",
        "お子さまの習い事を探していて",
        "以前から知っていた",
        "その他"
      ],
      "menus": [
        "体験レッスン",
        "ファーストステップクラス（初級・初心者）",
        "ラーニングクラス（中級〜上級）",
        "アドバンスクラス（コンディショニング・データ分析）",
        "ジュニアクラス（初級Jr／中級Jr／アスリートJr）",
        "コースレッスン（ラウンドキャンプ）",
        "SAKAI塾",
        "打席での練習のみ",
        "その他"
      ],
      "goodPoints": [
        "レベルに合ったクラスを選べた",
        "分かりやすい言葉で教えてもらえた",
        "スイング撮影で自分の動きを確認できた",
        "自分専用のカルテを作ってもらえた",
        "動ける体づくりから取り組めた",
        "子どもが楽しく続けられている",
        "打席が広く練習しやすい",
        "駐車場が停めやすい",
        "振替ができて通いやすい",
        "コーチ・スタッフの雰囲気が良い"
      ],
      "badPoints": [
        "クラスの内容が分かりにくかった",
        "予約や振替がしづらいと感じた",
        "料金が分かりにくかった",
        "打席の空き状況が気になった",
        "期待していた内容と少し違った",
        "コーチによって指導内容に差を感じた",
        "施設で気になる点があった",
        "案内や連絡が分かりにくかった"
      ]
    }'::jsonb,
    true
)
on conflict (id) do update set
    public_slug = excluded.public_slug,
    legacy_slugs = excluded.legacy_slugs,
    name = excluded.name,
    category = excluded.category,
    google_maps_review_url = excluded.google_maps_review_url,
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
    'アンケートご協力のお礼',
    '次回ご来店時にご利用いただけるお礼の特典です。',
    '特典',
    '30日後まで有効',
    true
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'アンケートご協力のお礼',
    '次回ご来店時にご利用いただけるお礼の特典です。',
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
