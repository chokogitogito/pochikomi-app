/**
 * 口コミ返信デモの固定口コミと、閲覧セッション単位の編集・承認状態。
 *
 * - 口コミ本文はサーバーとクライアントで共有する固定データ（実店舗の口コミは含めない）。
 * - 編集・承認状態はブラウザの sessionStorage（タブ＝閲覧セッション単位）だけに保存し、
 *   DB・実店舗の口コミ管理（review_reply_records 等）には一切書き込まない。
 * - 状態遷移は純関数にして、tests/unit/demo-reply-state.test.ts で検証する。
 */

export type DemoReviewKind = "positive" | "improvement" | "negative";

export type DemoReview = {
  id: string;
  reviewer: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  postedAt: string; // 表示用 YYYY/MM/DD
  kind: DemoReviewKind;
};

export type DemoReplyStatus = "unreplied" | "drafted" | "approved";

/** 下書きの由来。sample=初期サンプル / ai=AI生成 / fallback=AI生成失敗時のサンプル案 / manual=手入力 */
export type DemoDraftSource = "sample" | "ai" | "fallback" | "manual";

export type DemoReplyEntry = {
  status: DemoReplyStatus;
  text: string;
  source: DemoDraftSource | null;
  /** 下書き作成後に担当者が文面を編集したか */
  edited: boolean;
};

export type DemoReplyState = Record<string, DemoReplyEntry>;

export const DEMO_REPLY_SIGNATURE = "サンプルラーメン店 店主";
export const DEMO_REPLY_NG_WORDS = ["割引", "無料", "クーポン", "返金", "サービス券"];
export const DEMO_REPLY_POLICY_NOTE =
  "低評価には事実関係の反論をせず、お詫びと改善姿勢、直接連絡の導線を一言添える。割引・特典の提示はしない。";

export const DEMO_REVIEWS: DemoReview[] = [
  {
    id: "demo-r1",
    reviewer: "お客様A",
    stars: 5,
    comment: "スープが濃厚なのに後味がくどくなく、麺の硬さも好みに合わせてもらえました。店員さんの声かけも気持ちよくて、また来たいです。",
    postedAt: "2026/11/01",
    kind: "positive",
  },
  {
    id: "demo-r2",
    reviewer: "お客様B",
    stars: 4,
    comment: "味は文句なしでした。ただ、昼のピーク時は注文から提供まで20分ほどかかったのが少し残念です。",
    postedAt: "2026/10/30",
    kind: "improvement",
  },
  {
    id: "demo-r3",
    reviewer: "お客様C",
    stars: 2,
    comment: "券売機の使い方が分かりにくく、並んでいる間も案内がなくて戸惑いました。スープも少しぬるかったです。",
    postedAt: "2026/10/29",
    kind: "negative",
  },
  {
    id: "demo-r4",
    reviewer: "お客様D",
    stars: 5,
    comment: "家族で行きました。子どもの分の取り皿を用意してくれて助かりました。チャーシューも柔らかくて大満足です。",
    postedAt: "2026/10/28",
    kind: "positive",
  },
  {
    id: "demo-r5",
    reviewer: "お客様E",
    stars: 3,
    comment: "味は普通においしいです。カウンターの席の間隔が狭めで、荷物の置き場に困りました。",
    postedAt: "2026/10/26",
    kind: "improvement",
  },
  {
    id: "demo-r6",
    reviewer: "お客様F",
    stars: 1,
    comment: "注文したものと違うラーメンが出てきて、伝えたら対応が冷たく感じました。残念でした。",
    postedAt: "2026/10/24",
    kind: "negative",
  },
];

const SAMPLE_APPROVED_R1 =
  "お客様A様、温かいお言葉をありがとうございます。スープと麺の硬さをお好みに合わせられたとのこと、とても嬉しく思います。スタッフにも伝え、励みにいたします。またのご来店を心よりお待ちしております。\n\n" +
  DEMO_REPLY_SIGNATURE;

const SAMPLE_DRAFT_R2 =
  "お客様B様、ご来店とご評価をありがとうございます。昼のピーク時にお待たせしてしまい、申し訳ございません。提供までの時間を短くできるよう、仕込みと人員配置を見直してまいります。またのご来店をお待ちしております。\n\n" +
  DEMO_REPLY_SIGNATURE;

const SAMPLE_DRAFT_R5 =
  "お客様E様、ご来店とご感想をありがとうございます。席の間隔や荷物のご不便についてのお声、真摯に受け止めます。少しでも快適にお過ごしいただけるよう、荷物置きの工夫を検討いたします。\n\n" +
  DEMO_REPLY_SIGNATURE;

const EMPTY: DemoReplyEntry = { status: "unreplied", text: "", source: null, edited: false };

/** 初期状態: 未対応3件・AI下書き（承認待ち）2件・承認済み1件 */
export function initialReplyState(): DemoReplyState {
  const state: DemoReplyState = {};
  for (const r of DEMO_REVIEWS) state[r.id] = { ...EMPTY };
  state["demo-r1"] = { status: "approved", text: SAMPLE_APPROVED_R1, source: "sample", edited: false };
  state["demo-r2"] = { status: "drafted", text: SAMPLE_DRAFT_R2, source: "sample", edited: false };
  state["demo-r5"] = { status: "drafted", text: SAMPLE_DRAFT_R5, source: "sample", edited: false };
  return state;
}

export function isDemoReviewId(id: unknown): id is string {
  return typeof id === "string" && DEMO_REVIEWS.some((r) => r.id === id);
}

export function findDemoReview(id: unknown): DemoReview | undefined {
  return typeof id === "string" ? DEMO_REVIEWS.find((r) => r.id === id) : undefined;
}

export const MAX_REPLY_LENGTH = 1000;

function withEntry(state: DemoReplyState, id: string, next: DemoReplyEntry): DemoReplyState {
  if (!isDemoReviewId(id)) return state;
  return { ...state, [id]: next };
}

/** AI生成（またはフォールバック）の下書きを反映する。承認済みの口コミは上書きしない。 */
export function applyGeneratedDraft(
  state: DemoReplyState,
  id: string,
  text: string,
  source: Extract<DemoDraftSource, "ai" | "fallback">
): DemoReplyState {
  const current = state[id];
  if (!current || current.status === "approved") return state;
  const trimmed = text.slice(0, MAX_REPLY_LENGTH);
  if (!trimmed.trim()) return state;
  return withEntry(state, id, { status: "drafted", text: trimmed, source, edited: false });
}

/** 文面の編集。承認済みは編集できない（先に承認を取り消す）。空にした場合は未対応へ戻す。 */
export function editDraft(state: DemoReplyState, id: string, text: string): DemoReplyState {
  const current = state[id];
  if (!current || current.status === "approved") return state;
  const next = text.slice(0, MAX_REPLY_LENGTH);
  if (!next.trim()) return withEntry(state, id, { ...EMPTY });
  return withEntry(state, id, {
    status: "drafted",
    text: next,
    source: current.source ?? "manual",
    edited: current.source === null ? false : true,
  });
}

/** 承認。下書き（空でない文面）がある場合のみ承認済みになる。 */
export function approveReply(state: DemoReplyState, id: string): DemoReplyState {
  const current = state[id];
  if (!current || current.status !== "drafted" || !current.text.trim()) return state;
  return withEntry(state, id, { ...current, status: "approved" });
}

/** 承認の取り消し（編集に戻す） */
export function revokeApproval(state: DemoReplyState, id: string): DemoReplyState {
  const current = state[id];
  if (!current || current.status !== "approved") return state;
  return withEntry(state, id, { ...current, status: "drafted" });
}

export function countByStatus(state: DemoReplyState): Record<DemoReplyStatus, number> {
  const counts: Record<DemoReplyStatus, number> = { unreplied: 0, drafted: 0, approved: 0 };
  for (const r of DEMO_REVIEWS) counts[state[r.id]?.status ?? "unreplied"] += 1;
  return counts;
}

// ── sessionStorage への保存・復元 ───────────────────────────────

export const DEMO_REPLY_STORAGE_KEY = "pochikomi:demo:reply-state:v1";
const STORAGE_VERSION = 1;

export function serializeReplyState(state: DemoReplyState): string {
  return JSON.stringify({ version: STORAGE_VERSION, entries: state });
}

const STATUSES: DemoReplyStatus[] = ["unreplied", "drafted", "approved"];
const SOURCES: DemoDraftSource[] = ["sample", "ai", "fallback", "manual"];

/**
 * 保存済みの状態を復元する。形式が不正・バージョン違いなら初期状態に戻す。
 * 既知のデモ口コミID以外のキーは取り込まない。
 */
export function parseReplyState(raw: string | null | undefined): DemoReplyState {
  const fallback = initialReplyState();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; entries?: unknown };
    if (!parsed || parsed.version !== STORAGE_VERSION || !parsed.entries || typeof parsed.entries !== "object") return fallback;
    const entries = parsed.entries as Record<string, unknown>;
    const result: DemoReplyState = { ...fallback };
    for (const review of DEMO_REVIEWS) {
      const e = Object.prototype.hasOwnProperty.call(entries, review.id)
        ? (entries[review.id] as Record<string, unknown> | null)
        : null;
      if (!e || typeof e !== "object") continue;
      const status = e.status as DemoReplyStatus;
      const text = typeof e.text === "string" ? e.text.slice(0, MAX_REPLY_LENGTH) : null;
      const source = e.source === null ? null : (e.source as DemoDraftSource);
      if (!STATUSES.includes(status) || text === null) continue;
      if (source !== null && !SOURCES.includes(source)) continue;
      // 下書き・承認済みは本文が必須。未対応は本文を持たない。
      if (status === "unreplied" && text !== "") continue;
      if (status !== "unreplied" && !text.trim()) continue;
      result[review.id] = { status, text, source, edited: e.edited === true };
    }
    return result;
  } catch {
    return fallback;
  }
}
