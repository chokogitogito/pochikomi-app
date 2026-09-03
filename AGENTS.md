# AGENTS — AI動作ルール（18 ポチコミ MEO支援ツール）

本ファイルは、本プロジェクトで作業するすべてのAIアシスタントが遵守すべき固有のルールを定義しています。全体ルールは `DOC_ROOT/AGENTS.md` および `DOC_ROOT/00_Development_System/01_ワークスペース共通ルール.md` を参照してください。

- project_id: `18`
- project_name: `ポチコミ`
- code_rel: `02_Apps_Tools/18_ポチコミ_MEO支援ツール/pochikomi-app`
- docs_rel: `02_Projects/03_Dev/02_Apps_Tools/18_ポチコミ`
- repository: `https://github.com/chokogitogito/pochikomi-app.git`
- review_tier: `Tier 1`
- policy_version: `2026-09-06`

作業開始時は、次を順に確認してください。

1. この `AGENTS.md`
2. `PROJECT_CONTEXT.md`
3. `AI_REVIEW_POLICY.md`
4. `docs_rel` が指す最新の `07_引き継ぎ.md`、`04_意思決定ログ.md`、および計画書

AIレビュー基準は `00_Development_System/08_AIレビュー運用基準.md` に従います。レビューは0段（型・lint・テスト・ビルド）、1段（選別役）、2段（判断役）の三段で行い、0段がgreenになるまで1段を起動しません。Tier 1は `escalate` ゼロでも2段を必ず1回通します。Tier 1は最大2回、P1ゼロで終了条件とし、上限後もP1が残る場合は人へエスカレーションします。

---

## 🚨 最重要指示

1. **思考と回答の言語**:
   - 思考プロセス、およびユーザーへの回答はすべて **日本語** で行ってください。
2. **日本語ユーザー向け最適化**:
   - 作成・更新するドキュメント（README、開発ログ、引き継ぎ等）やコメントはすべて日本語で記述してください。
3. **ファイルの物理的分離**:
   - ソースコード、テスト、設定ファイルはすべて `00_DevVault/` 側に配置し、Obsidian同期Vault側にはコードファイルを配置しないでください。
4. **秘密情報の保護**:
   - APIキー、パスワード、OAuthシークレット、DB接続URL、決済情報をチャット・Vault・Gitへ一切記載しないでください。環境変数は `.env.local` 等（Git除外）を使用し、本番環境変数はVercel/Supabaseの公式画面へ直接登録してください。

---

## 🛠️ 技術・実装ルール

1. **Supabase Proマルチテナント & RLS**:
   - 契約企業を `organizations`、店舗を `locations` として管理します。
   - すべてのテナントデータに `organization_id` を付与し、RLSで完全に分離します。
   - クライアントから渡された `organization_id` は信用せず、Supabase Authのセッションとメンバーシップからサーバー側で導出します。
   - `anon` ロールから非公開列、内部UUID、トークン、アンケート回答明細を直接取得できないようにします。
2. **Google Business Profile (GBP) API由来データの30日保持制限**:
   - GBP API由来の口コミ本文、星、投稿者、パフォーマンス値は恒久保存せず、30日以内の一時キャッシュ（`gbp_review_cache`, `gbp_performance_cache`）として管理します。
   - `fetched_at` と `expires_at` を必須とし、日次バッチで期限切れデータを自動削除します。
   - `review_clicked`（Googleマップ遷移数）を「口コミ投稿数」として表示・計上しません。
3. **クーポンの位置づけ**:
   - クーポンはGoogle口コミの投稿対価ではなく、アンケート回答完了特典として提供します（Googleのポリシー準拠）。
4. **商談デモの分離**:
   - 商談デモ用データは `is_demo = true` の独立テナントとし、実顧客データとはRLSとUIの両面で完全に隔離します。
5. **Git運用**:
   - 独立リポジトリ `chokogitogito/pochikomi-app` を使用します。
   - フェーズごとに明確なコミットに分割し、コミット前に変更内容を提示します。
