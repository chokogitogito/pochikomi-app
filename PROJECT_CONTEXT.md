# PROJECT_CONTEXT — 18 ポチコミ MEO支援ツール

## 基本情報
- project_id: 18
- project_name: ポチコミ（MEO支援ツール）
- status: production-active (Supabase Pro本番稼働完了)
- code_rel: `02_Apps_Tools/18_ポチコミ_MEO支援ツール/pochikomi-app`
- code_path: `/Users/yamadanaoyuki/Documents/01_Obsidian/00_DevVault/02_Apps_Tools/18_ポチコミ_MEO支援ツール/pochikomi-app`
- docs_rel: `02_Projects/03_Dev/02_Apps_Tools/18_ポチコミ`
- docs_path: `/Users/yamadanaoyuki/Documents/01_Obsidian/01_Obsidian Vault/02_Projects/03_Dev/02_Apps_Tools/18_ポチコミ`
- repository: `https://github.com/chokogitogito/pochikomi-app.git`
- production_url: `https://pochikomi-app.vercel.app` (第一候補独自ドメイン: `https://pochikomi.com`)
- review_tier: Tier 1
- policy_version: `2026-09-06`

## AIレビュー役割分担
- 実装役: Antigravity + Gemini Flash
- 選別役: agy --print (Gemini 3.5 Flash Low) / フォールバック: codex exec
- 判断役: Codex または Claude Opus（実装役と別ベンダー枠）

## 最新の現在地 (2026-09-04)
- 003計画（Pro契約先行・本番稼働までの実装計画）の全フェーズ完了。
- Supabase Pro本番プロジェクト（`pochikomi-prod`）稼働、全テーブルRLS、30日TTL cache、Auth保護、Vercel環境変数設定、実地通信検証すべて完了。
- Git HEAD: `f868a79`

## 作業ルール
- 設計・仕様・タスクの正本は `docs_path`（Obsidian側）を参照・更新する。
- 開発作業は本ディレクトリ内で実施する。
- 003計画を最新正本とし、GBP Contentの30日一時cache制約を徹底する。
