# AI Review Policy — 18 ポチコミ MEO支援ツール

- policy_version: `2026-09-06`
- project_id: `18`
- canonical_policy: `DOC_ROOT/00_Development_System/08_AIレビュー運用基準.md`

## Project defaults

- default_tier: `Tier 1`
- tier_1_areas:
  - DBマイグレーション（スキーマ定義、外部キー、一意制約、インデックス）
  - 認証・認可（Supabase Auth、セッション検証、管理者招待、パスワードリセット）
  - 行レベルセキュリティ（全テーブルのRLSポリシー、`organization_id` による完全分離、anonアクセス制限）
  - テナント境界・データ隔離（実顧客データと `is_demo` テナントの完全分離）
  - Google OAuthトークン管理（privateスキーマでの暗号化保存、リフレッシュ・失効処理）
  - Google Content 30日保持制限（GBP API由来口コミ・パフォーマンス値の30日TTL cacheおよび日次自動削除）
  - 本番データ移行（`data/db.json` からの冪等import、本番seed）
- required_checks:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run test:e2e`
  - `npm run build`
- rollback_owner:
  - Vercel: コミット `4963561` へのInstant Rollback
  - Supabase: Pro日次自動バックアップからの復元、またはロールバックマイグレーションスクリプト
- 役割の割り当て:
  - 実装役: Antigravity + Gemini Flash
  - 選別役: `agy --print` (Gemini 3.5 Flash Low) / フォールバック: `codex exec`
  - 判断役: Codex または Claude Opus（実装役と別ベンダー枠）

## 三段レビュー

- 0段（機械）: 型チェック、lint、単体/統合テスト、E2Eテスト、ビルド。greenになるまで1段を起動しない
- 1段（選別）: 選別役へレビューパケットと0段のログだけを渡し、ok / fix / escalate の三値を得る。探索させない
- 2段（判断）: escalate があるか、Tier 1に該当する場合に実行する
- escalate は分野で決めない。P1成立条件6点を示せる指摘は分野を問わず escalate する
- Tierを段より先に確定する。差分規模による2段の省略はTier 2・3にのみ適用する
- Tier 1は escalate ゼロでも2段を必ず1回通す。Tier 2・3は escalate ゼロなら2段を省略してよい
- 選別役が使えない場合の低推論フォールバックは、2段の回数に数えない

## Review contract

- Tier 1は最大2回、Tier 2・3は原則1回
- P1ゼロで終了し、P2だけのために再レビューしない
- 上限後にP1が残る場合はHUMAN_ESCALATION
- レビュー前に変更範囲と直接依存を調べ、結果を依頼文へ含める
- Tier 1では関連スキーマ、RLS、直接の呼び出し先、関連統合テストを未変更でも添付する
- 未追跡ファイルは git status --porcelain で確認し、対象パスだけ git add -N <path> で加える。一括追加はしない
- 指摘形式は severity / location / issue / invariant / repro / causality / minimal-fix
- P1に件数上限を設けない。件数上限はP2にのみ適用する（最大5件）
- 打ち切る場合は truncated: true を明示させ、残件確認まで BLOCKED_P1 を維持する
