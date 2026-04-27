# ポチコミ セットアップガイド

このガイドに沿って進めると、ポチコミをインターネット上に公開できます。

---

## ステップ1：Gemini APIキーを取得する

1. [Google AI Studio](https://aistudio.google.com) を開く
2. Googleアカウントでログイン
3. 左メニューの「Get API key」をクリック
4. 「Create API key」でキーを発行
5. 表示された文字列（`AIza...`で始まる）をコピーして保存しておく

---

## ステップ2：GitHubにコードをアップロードする

1. [GitHub](https://github.com) でアカウント作成（まだの場合）
2. 右上の「＋」→「New repository」をクリック
3. Repository name に `pochikomi-app` と入力
4. 「Create repository」をクリック
5. 表示されたコマンドをターミナルで実行してコードをアップロード

---

## ステップ3：Vercelにデプロイする

1. [Vercel](https://vercel.com) でGitHubアカウントを使ってログイン
2. 「Add New Project」→ GitHubの `pochikomi-app` リポジトリを選択
3. 「Deploy」をクリック
4. デプロイが完了したら「Environment Variables」に以下を追加：

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | ステップ1で取得したAPIキー |
| `NEXT_PUBLIC_APP_URL` | VercelのURL（例：https://pochikomi.vercel.app） |

5. 「Redeploy」で反映

---

## ステップ4：店舗を追加する

`lib/stores.ts` ファイルを編集して店舗を追加します。

```typescript
"新しい店舗ID": {
  id: "新しい店舗ID",
  name: "店舗名",
  category: "業種",
  keywords: ["キーワード1", "キーワード2"],
  googleMapsUrl: "GoogleマップのレビューURL",  // 下記参照
  surveyOptions: {
    sources: ["Google検索", "Instagram・SNS", "友人・知人の紹介", "その他"],
    goodPoints: ["対応が丁寧だった", "仕上がりが良かった", ...],
  },
},
```

### GoogleマップのレビューURLの調べ方
1. Googleマップで店舗を検索
2. 「クチコミを書く」ボタンを右クリック→「リンクをコピー」
3. または：`https://search.google.com/local/writereview?placeid=【Place ID】`
   - Place IDはGoogleマップのURLから取得できます

---

## ステップ5：QRコードを印刷する

1. デプロイ後、`https://あなたのURL/admin/qr` を開く
2. 店舗を選択してQRコードを表示
3. 「印刷する」ボタンで印刷
4. 店舗に設置する

---

## 現在の画面構成

| URL | 内容 |
|-----|------|
| `/` | トップページ |
| `/survey/【店舗ID】` | お客様用アンケート画面 |
| `/admin/qr` | QRコード管理ページ |

---

## よくある質問

**Q: AIの文章が英語で出てくる**
→ `app/api/generate/route.ts` のプロンプトに「日本語で出力してください」を追加してください。

**Q: 新しい店舗を追加したのに反映されない**
→ Vercelで「Redeploy」を実行してください。

**Q: Gemini APIの料金は？**
→ 無料枠（1分間に15リクエスト）があり、MVP段階では無料で使えます。
