// 店舗設定ファイル
// 各店舗の情報をここで管理します。
// 将来的にはデータベースに移行しますが、MVPではここで定義します。

export type Store = {
  id: string;
  name: string;
  category: string; // 業種（例：外壁塗装、美容室、歯科など）
  keywords: string[]; // AIが口コミ文章に含めるキーワード
  googleMapsUrl: string; // GoogleマップのレビューページURL（Place IDを使ったもの）
  surveyOptions: {
    sources: string[]; // 来店経緯の選択肢
    goodPoints: string[]; // 良かった点の選択肢
  };
};

export const stores: Record<string, Store> = {
  "test-store": {
    id: "test-store",
    name: "テスト工務店",
    category: "外壁塗装・リフォーム",
    keywords: ["外壁塗装", "丁寧な施工", "高品質", "アフターサポート"],
    // ※ 実際のPlace IDに差し替えてください
    googleMapsUrl: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    surveyOptions: {
      sources: [
        "Google検索",
        "Instagram・SNS",
        "友人・知人の紹介",
        "チラシ・看板",
        "以前も利用したことがある",
        "その他",
      ],
      goodPoints: [
        "スタッフの対応が丁寧だった",
        "仕上がりがとても良かった",
        "説明がわかりやすかった",
        "清潔感があった",
        "価格が適正だった",
        "対応・工期が速かった",
        "アフターフォローが充実していた",
        "提案内容が的確だった",
      ],
    },
  },
};

export function getStore(storeId: string): Store | null {
  return stores[storeId] ?? null;
}
