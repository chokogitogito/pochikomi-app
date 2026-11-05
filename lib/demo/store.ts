import type { Store } from "@/lib/types";

/**
 * 商談デモ専用の固定店舗。
 *
 * 設計上の不変条件:
 * - デモ画面・デモAPIは DB / data/db.json の店舗を一切参照しない。この固定データだけを使う。
 * - id は実在の店舗slug（DBの `ramen` を含む）と衝突しない値にし、
 *   万一ここから実店舗系のAPIへ流れても実データに到達しないようにする。
 * - 実店舗の名前・実績・口コミ・競合名を含めない（tests/unit/demo-isolation.test.ts で検査）。
 */
export const DEMO_STORE_ID = "demo-fixture-ramen";
export const DEMO_STORE_NAME = "サンプルラーメン店";

export const DEMO_STORE: Store = {
  id: DEMO_STORE_ID,
  name: DEMO_STORE_NAME,
  shortName: DEMO_STORE_NAME,
  category: "ラーメン・飲食店",
  plan: "growth",
  status: "active",
  keywords: ["家系ラーメン", "豚骨ラーメン", "駅近", "ランチ"],
  // 実際のGoogleマップへは遷移させない。デモ用の案内画面（/demo/maps-guide）で受ける。
  googleMapsUrl: "",
  monthlyGoal: 100,
  surveyOptions: {
    sources: [
      "Google検索",
      "Googleマップ",
      "SNS（X・Instagram）",
      "知人・友人の紹介",
      "ラーメンまとめサイト",
      "店の前を通りかかって",
      "以前から常連",
      "その他",
    ],
    menus: [
      "ラーメン（並）",
      "ラーメン（大盛）",
      "つけ麺",
      "味玉ラーメン",
      "チャーシューメン",
      "ライス・サイドメニュー",
      "テイクアウト",
      "その他",
    ],
    goodPoints: [
      "スープが濃厚で好みの味だった",
      "麺の硬さを好みに調整してもらえた",
      "トッピングの種類が豊富だった",
      "回転が速く待ち時間が短かった",
      "スタッフの対応が気持ちよかった",
      "店内が清潔で入りやすかった",
      "コスパが良かった",
    ],
    badPoints: [
      "待ち時間が長かった",
      "味が好みと合わなかった",
      "席が狭かった",
      "提供までに時間がかかった",
    ],
  },
};

/** デモの案内画面で使う固定の文言（Googleマップへは遷移させない） */
export const DEMO_MAPS_GUIDE_NOTE =
  "本番ではここでGoogleマップの口コミ投稿画面が開き、コピーした文章を貼り付けて投稿します。商談デモでは実際のGoogleマップへは移動しません。";
