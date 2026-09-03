# CLAUDE.md - ポチコミ (pochikomi-app)

## プロジェクト概要
店舗向けMEO（Googleマップ口コミ獲得）支援Webアプリケーション。
Next.js 16 + React 19 + Tailwind CSS v4 + Google Gemini API (gemini-2.0-flash)。

## ドキュメント正本（Obsidian）
- 資料パス: `/Users/yamadanaoyuki/Documents/01_Obsidian/01_Obsidian Vault/02_Projects/03_Dev/02_Apps_Tools/18_ポチコミ`
- 仕様書: `01_仕様・要件.md`
- タスク一覧: `03_タスク・ロードマップ.md`
- 開発ログ: `05_開発ログ/`

## 開発コマンド
- 依存インストール: `npm install`
- 開発サーバー起動: `npm run dev` (http://localhost:3000)
- ビルド: `npm run build`
- 本番起動: `npm run start`
- リント: `npm run lint`

## 主要ディレクトリ構造
- `app/` : Next.js App Router
  - `page.tsx` : トップページ
  - `survey/[storeId]/page.tsx` : お客様用アンケート＆口コミ生成画面
  - `admin/` : 管理画面（ダッシュボード、QR発行、店舗管理、クーポン管理）
  - `api/generate/route.ts` : Gemini API 口コミ文章自動生成エンドポイント
  - `api/stores/` : 店舗データAPI
  - `api/coupons/` : クーポンデータAPI
  - `api/events/` : メトリクス・イベント記録API
- `lib/` : ユーティリティ、型定義 (`types.ts`)、データアクセス層 (`db.ts`)
- `data/` : ローカルデータストア (`db.json`)
