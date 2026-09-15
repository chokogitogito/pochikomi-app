# 実装指示書 — 管理画面のページ遷移ラグ解消

- doc_version: `2026-09-16`
- project_id: `18`（ポチコミ / pochikomi-app）
- 実装役: **Antigravity + Gemini Flash**
- 起票: Claude Opus（調査・計画のみ。実装はしていない）
- 対象ブランチ: `main` から `perf/admin-navigation` を切って作業すること（本番稼働中のため main 直編集は禁止）

---

## 0. この指示書の使い方

- **Phase 1 → 計測 → Phase 2 の順に進めること。** Phase 1 だけで体感の7割が解消する見込みのため、Phase 2 の要否は Phase 1 後の実測値で判断する。
- 各 Phase の末尾に「完了条件（計測）」がある。**数値を満たすまで次に進まない。**
- Tier 区分は `AI_REVIEW_POLICY.md` に従う。各タスクに Tier を明記してある。
- 不明点があれば実装を止めて起票者に戻すこと。推測で認証まわりを変更しない。

---

## 1. 現状の計測値（2026-09-16 / 本番 `pochikomi-app.vercel.app` / 各3回の代表値）

| 対象 | TTFB | 内訳の意味 |
|---|---|---|
| `/`、`/api/__nope`（エッジのみで完結） | **60〜85ms** | ネットワーク経路そのものは速い |
| `/api/admin/funnel`（401・Supabaseアクセス無し） | **240ms** | 関数が iad1 にある分の固定オーバーヘッド |
| `/api/stores`（**Supabaseクエリ1回のみ**） | **940ms** | 1クエリで **+700ms** |
| `/api/coupons` | 460〜870ms | |

再現コマンド:

```bash
for i in 1 2 3; do curl -s -o /dev/null -w "ttfb=%{time_starttransfer}s\n" https://pochikomi-app.vercel.app/api/stores; done
```

---

## 2. 原因（確定）

### 原因A：Vercel関数のリージョンと Supabase のリージョンがねじれている ★最大要因

レスポンスヘッダに証拠が出ている。

```
x-vercel-id: hnd1::iad1::ft2vs-...
```

- `hnd1` = 東京エッジ（受け口）
- `iad1` = **米国バージニア**（Serverless Function の実行場所）
- Supabase は東京（`cf-ray: ...-NRT`、手元＝日本からの RTT 30〜80ms）

リポジトリに `vercel.json` が無く、リージョン指定が Vercel デフォルト（`iad1`）のまま。

結果、**日本のユーザー → 米国の関数 → 東京のDB → 米国 → 日本** を毎クエリ往復している。
実測 +700ms は、iad1↔東京の RTT 約170ms × 4往復（TCP + TLS×2 + リクエスト）とほぼ一致する。

`/api/stores` は `getStores()` → `locations` を1回引くだけの処理で、テーブルは3行しかない。**遅さはクエリ内容ではなく純粋に距離。**

### 原因B：ダッシュボードのクエリが多すぎ、かつ直列

店舗3件（`golf` / `golf-a` / `golf-b`）の現状で、`/admin` 1回の表示あたり **約25クエリ・直列13往復**。

| 箇所 | 問題 |
|---|---|
| `middleware.ts:38` と `app/admin/page.tsx:11` | `auth.getUser()` の**二重呼び出し**（middlewareで検証済みなのに関数側でもう一度） |
| `lib/repositories/supabase-repository.ts:549` `getUserManagedLocations` | `profiles` → `organization_members` → `locations` の**3段直列** |
| `lib/repositories/supabase-repository.ts:272` `getMetricsFromSupabase` | 店舗一覧を取得済みなのに `findLocationBySlug` で **locations を引き直す** |
| `app/admin/page.tsx:78` | **3度目の locations 引き直し**（`public_slug` から `id` を再取得） |
| `lib/repositories/funnel-repository.ts:196` | 店舗別集計の後、全店舗合計のために **events を丸ごと再取得**（同じ行を2回引いている） |

原因Aと掛け算になるため、13往復 × 700ms が積み上がる。

### 原因C：events テーブルの全件取得（今は軽微・将来は致命的）

`lib/repositories/supabase-repository.ts:287`：

```ts
const { data: events } = await supabase
  .from("events")
  .select("event_type, metadata")
  .eq("location_id", location.id);
```

**期間フィルタも LIMIT も無し。** 運用が進むほど線形に遅くなる。

加えて既存インデックスは `idx_events_org_loc_type (organization_id, location_id, event_type)`。このクエリは `location_id` 単独で絞っているため**先頭列 `organization_id` が欠けてインデックスが効かない**。

### 原因D：`loading.tsx` が1ファイルも存在しない ★体感の直接原因

```bash
find app -name "loading.tsx"   # → 0件
```

結果が2つ出ている。

1. サーバー処理が終わるまで**画面に一切の反応が返らない**。ユーザーには「押したのに動かない」＝ラグとして体感される。
2. `export const dynamic = "force-dynamic"` のページは **`<Link>` の prefetch も効いていない**。App Router は動的ルートを「最寄りの `loading.tsx` 境界まで」しか先読みしないため、境界が無い＝先読みゼロ。

### 原因E：クライアントページの直列 fetch（中程度）

`app/admin/qr/page.tsx:32,45` — `/api/stores`（940ms）→ `/api/admin/campaigns` を**直列**で呼んでいる。約1.9秒の空白。
（`app/admin/coupons/page.tsx:32` は `Promise.all` になっており問題なし。）

---

## 3. Phase 1 — 即効対応（工数目安30分・効果70%）

### タスク 1-1：Vercel 実行リージョンを東京(hnd1)へ変更 【Tier 3 / インフラ】

**やること（どちらか一方。リポジトリ管理できる前者を推奨）**

リポジトリルートに `vercel.json` を新規作成:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["hnd1"]
}
```

または Vercel ダッシュボード → Project `pochikomi-app` → Settings → Functions → Function Region → `Tokyo, Japan (hnd1)`。

**注意**

- この変更は**デプロイが走る**。デプロイ後の動作確認（下記）まで必ず実施すること。
- ロールバックは Vercel の Instant Rollback で即時に戻せる。
- **前提確認**：Supabase プロジェクト `vbbdidfcgepdektiykgy` のリージョンが本当に `ap-northeast-1 (Tokyo)` であることを Supabase ダッシュボード → Settings → General → Region で目視確認すること。**もし東京でなければ、Vercel を Supabase 側のリージョンに合わせる**（この指示書の `hnd1` を読み替える）。判断がつかない場合は実装を止めて起票者に戻すこと。

**完了条件（計測）**

```bash
# 1. 関数の実行リージョンが hnd1 になっていること
curl -sD - -o /dev/null https://pochikomi-app.vercel.app/api/stores | grep -i x-vercel-id
#   期待: x-vercel-id に iad1 が含まれないこと

# 2. 単一クエリ経路の TTFB
for i in 1 2 3; do curl -s -o /dev/null -w "ttfb=%{time_starttransfer}s\n" https://pochikomi-app.vercel.app/api/stores; done
#   期待: 3回とも 0.300s 未満（現状 0.940s）
```

---

### タスク 1-2：`loading.tsx` を3ファイル追加 【Tier 3 / UI】

既存のデザイントークン（`bg-surface` / `border-border-default` / `shadow-card` / `text-text-tertiary` 等、`app/globals.css:37` の `@theme inline` で定義）に合わせること。**新しい色を定義しない。**

**新規ファイル `app/admin/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="border-b border-border-default pb-4 space-y-2">
        <div className="h-7 w-48 rounded-lg bg-surface-secondary" />
        <div className="h-4 w-80 rounded bg-surface-secondary" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default bg-surface p-6 shadow-card space-y-3"
          >
            <div className="h-3 w-20 rounded bg-surface-secondary" />
            <div className="h-8 w-24 rounded-lg bg-surface-secondary" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border-default bg-surface p-6 shadow-card">
        <div className="h-64 w-full rounded-xl bg-surface-secondary" />
      </div>
    </div>
  );
}
```

**新規ファイル `app/admin/stores/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="border-b border-border-default pb-4 space-y-2">
        <div className="h-7 w-32 rounded-lg bg-surface-secondary" />
        <div className="h-4 w-96 max-w-full rounded bg-surface-secondary" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default bg-surface p-6 shadow-card space-y-3"
          >
            <div className="h-3 w-24 rounded-full bg-surface-secondary" />
            <div className="h-5 w-3/4 rounded bg-surface-secondary" />
            <div className="h-3 w-full rounded bg-surface-secondary" />
            <div className="h-3 w-2/3 rounded bg-surface-secondary" />
            <div className="pt-4 border-t border-border-subtle">
              <div className="h-9 w-full rounded-xl bg-surface-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**新規ファイル `app/admin/reviews/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="border-b border-border-default pb-4 space-y-2">
        <div className="h-7 w-40 rounded-lg bg-surface-secondary" />
        <div className="h-4 w-72 rounded bg-surface-secondary" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default bg-surface p-6 shadow-card space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-surface-secondary" />
              <div className="h-4 w-32 rounded bg-surface-secondary" />
            </div>
            <div className="h-3 w-full rounded bg-surface-secondary" />
            <div className="h-3 w-5/6 rounded bg-surface-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**完了条件**

- サイドバーの「ダッシュボード」「店舗管理」「口コミ返信」をクリックした瞬間にスケルトンへ切り替わること（ブラウザで目視確認）。
- `npm run build` が通ること。

---

### Phase 1 完了後に必ず実施：再計測

```bash
for p in /api/stores /api/coupons; do
  echo "== $p"
  for i in 1 2 3; do curl -s -o /dev/null -w "  ttfb=%{time_starttransfer}s\n" "https://pochikomi-app.vercel.app$p"; done
done
```

**この数値を起票者へ報告すること。** Phase 2 に進むかはこの数値で判断する。
`/api/stores` が 300ms を切っており、管理画面の遷移が体感で気にならなくなっていれば、**Phase 2 は見送ってよい**（特にタスク 2-1 は Tier 1 領域に触るため、必要性が実測で確認できない限り着手しない）。

---

## 4. Phase 2 — 構造改善（工数目安 半日）

> **着手条件**：Phase 1 の再計測後、起票者から「Phase 2 に進む」と明示的な指示があった場合のみ。

### タスク 2-1：`auth.getUser()` の二重呼び出し解消 【Tier 1 — 認証・認可】

> ⚠️ **Tier 1 領域。`AI_REVIEW_POLICY.md` に従い、escalate ゼロでも2段レビューを必ず1回通すこと。**
> ⚠️ **リクエストヘッダで user id を渡す実装は、middleware が対象パス全件で必ず上書きしない限り認証バイパスになる。** 現行 matcher は `"/admin/:path*"` のみで `/api/*` を含まないため、**この方式を安易に API ルートへ広げないこと。**

推奨は次の順で検討する。

1. **第一候補**：Supabase プロジェクトが非対称JWT署名キー（asymmetric signing keys）に移行済みであれば、`app/admin/*/page.tsx` 側の `supabase.auth.getUser()` を `supabase.auth.getClaims()` に置き換える。ローカルでJWT検証が完結しネットワーク往復が消える。
   - **前提確認必須**：Supabase ダッシュボード → Settings → API Keys → JWT Signing Keys が非対称になっているか。対称鍵(HS256)のままだと `getClaims()` は内部で結局ネットワーク検証に落ちるため効果ゼロ。
2. **第二候補**：middleware で検証済みの user id を `x-pochikomi-user-id` としてリクエストヘッダに載せ、ページ側で受け取る。採用する場合は以下を**必ず**守る。
   - middleware の冒頭で、受信リクエストの当該ヘッダを**無条件に削除**してから自前の値を設定する（クライアント偽装の遮断）。
   - matcher に含まれないパスでは絶対に参照しない。
   - `lib/auth/guard.ts` の `verifyAdminAuth`（API ルート用）は**現行のまま変更しない**。
3. 上記いずれも判断がつかない場合は、**このタスクを見送る**。Phase 1 後は往復コストが 700ms → 約50ms に下がっており、費用対効果が小さい。

### タスク 2-2：`getUserManagedLocations` の3段直列を1クエリ化 【Tier 2】

対象：`lib/repositories/supabase-repository.ts:549`

現状 `profiles` → `organization_members` → `locations` の3往復。

- `profiles.is_platform_admin` の判定と `organization_members` の取得は**並列化できる**（互いに依存していない）。まず `Promise.all` にするだけで3往復→2往復。
- さらに詰めるなら、`organization_members` と `locations` を PostgREST の埋め込み選択で1回にまとめる:

```ts
const { data } = await supabase
  .from("organization_members")
  .select("organization_id, organizations!inner(locations(*))")
  .eq("user_id", userId)
  .eq("status", "active");
```

※ 埋め込み選択は既存のリレーション定義に依存する。**動かない場合は無理に寄せず、`Promise.all` による2往復化までで止めてよい。**

**戻り値の型は変更しない**（`Store[]`）。呼び出し側への影響を出さないこと。

### タスク 2-3：locations の重複取得（計2回ぶん）を廃止 【Tier 2】★効果大

現状、同じ `locations` 行を**3回**引いている。

1. `getUserManagedLocations` 内（`lib/repositories/supabase-repository.ts:580`）
2. `getMetricsFromSupabase` → `findLocationBySlug`（`lib/repositories/supabase-repository.ts:274`）
3. `app/admin/page.tsx:78`（`public_slug` → `id` の再取得）

**方針**：1 で取得済みの `location.id` / `organization_id` を持ち回す。

`lib/types.ts` の `Store` 型は**変更しない**（クライアントコンポーネントへ渡る型なので内部UUIDを混ぜない）。代わりにサーバー専用型を追加する:

```ts
// lib/repositories/supabase-repository.ts
export interface StoreWithLocation extends Store {
  locationId: string;
  organizationId: string;
}
```

- `getUserManagedLocations` の戻り値を `StoreWithLocation[]` にする。
- `getMetricsFromSupabase` に `locationId` を直接受け取るオーバーロード（例：`getMetricsByLocationId(locationId, publicSlug)`）を追加し、`app/admin/page.tsx` からはそちらを呼ぶ。`findLocationBySlug` 経路は他の呼び出し元のため残す。
- `app/admin/page.tsx:78` の `locations` 再取得ループを**削除**し、`store.locationId` / `store.organizationId` を使う。

**必須**：`AdminDashboardClient` へ props を渡す直前で `locationId` / `organizationId` を**除去**すること（内部UUIDをブラウザへ送らない）。

```ts
const clientStores: Store[] = stores.map(({ locationId, organizationId, ...s }) => s);
```

### タスク 2-4：`getMultiStoreComparison` の events 二重取得を解消 【Tier 2】

対象：`lib/repositories/funnel-repository.ts:167`

現状は「店舗ごとに `getFunnelMetrics`（sessions + events）」を N 回 ＋「全店舗合計で `getFunnelMetrics`」をもう1回 ＝ **2N+2 クエリ**。合計ぶんは店舗別ぶんと**まったく同じ行を再取得している**。

**方針**：組織全体の `survey_sessions` と `events` を**1回ずつ**取得し、JS側で `location_id` ごとに振り分けて集計する。

```
現状:  locations(1) + 店舗別(N×2) + 合計(2)  = 2N+3  → 店舗3件で 9クエリ
改修後: locations(1) + sessions(1) + events(1) = 3クエリ（固定）
```

**注意（重要）**：合計値を「店舗別の単純合算」で出してはいけない。現行ロジックは `Set` によるユニークセッション排除（`funnel-repository.ts:97-134`）を行っているため、合算するとユニーク性が壊れる。**必ず「全件を1回取得 → 集計関数を店舗別と全体の2通りで回す」形にすること。** 集計ロジック本体（`filteredEvents.forEach` 以降）は純関数に切り出して再利用する。

**回帰確認**：改修前後で `/api/admin/funnel` の返却値（`surveyStarts` / `generatedReviews` / `reviewCopies` / `reviewClicks` / `couponsIssued` と各 rate）が**完全一致**すること。実データで突き合わせること。

### タスク 2-5：`/admin/qr` の直列 fetch を解消 【Tier 3】

対象：`app/admin/qr/page.tsx:32,45`

`/api/stores` → `/api/admin/campaigns` の直列を解消する。いずれかで可。

- **推奨**：`app/admin/qr/page.tsx` をサーバーコンポーネント + 子クライアントコンポーネントに分割し、`stores` と初期 `campaigns` をサーバー側で並列取得して props で渡す（他の admin ページと同じ構成になる）。
- **簡易案**：初期表示店舗が決まっているなら `Promise.all` で両方を同時に投げる。

あわせて `app/admin/qr/loading.tsx` を追加する（構成は 1-2 と同様）。

---

## 5. Phase 3 — 将来の劣化対策（別チケット化して可）

### タスク 3-1：`getMetricsFromSupabase` の events 全件取得を是正 【Tier 2】

対象：`lib/repositories/supabase-repository.ts:287`

1. `organization_id` を WHERE 条件に**必ず**加える（既存インデックス `idx_events_org_loc_type` の先頭列。現状は効いていない）。
2. 期間フィルタを入れる（既定：直近90日。`occurred_at >= now() - interval '90 days'`）。
   - **仕様確認が必要**：ダッシュボードの数値を「全期間累計」として見せているなら、期間を切ると表示値が変わる。**UI 上の見せ方（「直近90日」と明記する等）を含めて起票者の確認を取ってから実装すること。**
3. `select("event_type, metadata")` のうち `metadata` は `rating` しか使っていない。取得列の削減を検討。

### タスク 3-2：日次集計テーブル／マテリアライズドビュー 【Tier 1 — DBマイグレーション】

events の行数が増えた段階で、`location_id × 日付 × event_type` の日次集計テーブルに寄せる。**着手時期は起票者判断。この指示書では設計のみ。**

---

## 6. 検証（全 Phase 共通）

`AI_REVIEW_POLICY.md` の 0段（機械）を green にしてから 1段へ進む。

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

加えて本指示書固有の確認:

- [ ] `x-vercel-id` に `iad1` が含まれない
- [ ] `/api/stores` の TTFB が 300ms 未満（3回連続）
- [ ] `/admin`・`/admin/stores`・`/admin/reviews` の遷移でスケルトンが即座に出る
- [ ] Phase 2-4 実施時：`/api/admin/funnel` の返却値が改修前と完全一致
- [ ] Phase 2-3 実施時：ブラウザの DevTools → Network で RSC ペイロードを確認し、`locationId` / `organizationId` が**含まれていない**こと
- [ ] ログイン → ダッシュボード → 店舗管理 → 口コミ返信 → QR → クーポン → Google連携 を一周し、全ページでデータが正しく表示されること

---

## 7. 補足（実装前に知っておくこと）

- **ローカル `npm run dev` のラグは本件と別要因**。Turbopack のオンデマンドコンパイルによるもので、初回アクセスだけ遅く2回目以降が速いなら正常。本指示書の計測はすべて本番環境に対して行うこと。
- **`.env.local` に Supabase 変数が入っていない**。そのためローカルでは `isSupabaseConfigured()` が false になり `data/db.json` フォールバックで動作する（`lib/db.ts:23`）。**ローカルで速くても本番の検証にはならない。**
- `package.json` の `build` は `next build --webpack`（Turbopack ではない）。ビルド方式は本件では変更しない。
