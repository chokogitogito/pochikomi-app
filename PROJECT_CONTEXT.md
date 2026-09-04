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
- 004計画（The蔵ssic／SS.GRAND本番運用化）の全フェーズ完了。
- 本番Supabase DBに実店舗データ復元（The蔵ssic, SS.GRAND）、管理者認可ガード（`lib/auth/guard.ts`）によるAPI保護、動的ダッシュボード（所属店舗のみ表示・実測メトリクス集計）、パスワード再設定画面（`/admin/reset-password`）を実装。
- AIレビュー運用基準（Tier 1: 0段機械検証グリーン、1段選別役agy、2段判断役Claude）の二往復検証を通過し P1ゼロ（PASS）達成。
- 本番Vercel反映および実地疎通検証（200/307/401）すべて完了。
- Git HEAD: `9631ea8`

## 作業ルール
- 設計・仕様・タスクの正本は `docs_path`（Obsidian側）を参照・更新する。
- 開発作業は本ディレクトリ内で実施する。
- 003計画を最新正本とし、GBP Contentの30日一時cache制約を徹底する。
