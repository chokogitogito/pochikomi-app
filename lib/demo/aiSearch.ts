/**
 * AI検索分析のサンプル観測データと集計ロジック。
 *
 * 初版は「サンプル観測」の固定データ。後から手動で実測を登録できるよう、
 * 観測1件のデータ形式（AiObservation）と検証関数（validateAiObservation）を用意する。
 * 言及率 = 店名が出た回答数 ÷ 取得できた回答数。取得失敗・未観測は分母に含めず別状態で扱う。
 */

export const AI_NAMES = ["ChatGPT", "Gemini", "Claude"] as const;
export type AiName = (typeof AI_NAMES)[number];

export const OBSERVATION_STATUSES = ["mentioned", "not_mentioned", "failed", "unobserved"] as const;
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

export const STATUS_LABELS: Record<ObservationStatus, string> = {
  mentioned: "店名が出た",
  not_mentioned: "回答は取得・店名は出なかった",
  failed: "取得失敗",
  unobserved: "未観測",
};

export type AiSource = { title: string; site: string };

export type AiObservation = {
  aiName: AiName;
  questionId: string;
  question: string;
  region: string;
  language: string;
  /** 観測日 YYYY-MM-DD。未観測は null */
  observedAt: string | null;
  status: ObservationStatus;
  /** 回答内で紹介された順位（店名が出た場合のみ） */
  position: number | null;
  /** 紹介された理由（店名が出た場合のみ） */
  reason: string | null;
  /** 回答抜粋（回答を取得できた場合のみ） */
  excerpt: string | null;
  /** 参照元。回答を取得したのに空なら画面では「参照元なし」と表示する */
  sources: AiSource[];
  /** 取得失敗・未観測の理由 */
  statusNote: string | null;
};

export type AiQuestion = { id: string; label: string; text: string };

export const AI_SEARCH_REGION = "サンプル駅周辺（東京都）";
export const AI_SEARCH_LANGUAGE = "日本語";
export const AI_SEARCH_OBSERVED_AT = "2026-11-02";
export const AI_SEARCH_DATA_LABEL = "サンプル観測";

export const AI_QUESTIONS: AiQuestion[] = [
  { id: "recommend", label: "おすすめ店", text: "この辺でおすすめのラーメン店を教えて" },
  { id: "station", label: "駅近", text: "駅から近いラーメン店を教えて" },
  { id: "first", label: "初めての来店", text: "初めて家系ラーメンを食べるなら、どのお店がいい？" },
  { id: "lunch", label: "ランチ", text: "ランチで入りやすいラーメン店はある？" },
  { id: "late", label: "夜遅く", text: "夜遅くまでやっているラーメン店を知りたい" },
  { id: "family", label: "家族連れ", text: "家族連れでも入りやすいラーメン店は？" },
];

const q = (id: string) => AI_QUESTIONS.find((x) => x.id === id)!;

type ObsInit = Pick<AiObservation, "aiName" | "status"> & Partial<AiObservation> & { questionId: string };

function obs(init: ObsInit): AiObservation {
  const question = q(init.questionId);
  const answered = init.status === "mentioned" || init.status === "not_mentioned";
  return {
    aiName: init.aiName,
    questionId: question.id,
    question: question.text,
    region: AI_SEARCH_REGION,
    language: AI_SEARCH_LANGUAGE,
    observedAt: init.status === "unobserved" ? null : AI_SEARCH_OBSERVED_AT,
    status: init.status,
    position: init.status === "mentioned" ? (init.position ?? null) : null,
    reason: init.status === "mentioned" ? (init.reason ?? null) : null,
    excerpt: answered ? (init.excerpt ?? null) : null,
    sources: answered ? (init.sources ?? []) : [],
    statusNote: init.statusNote ?? null,
  };
}

const guide = (title: string, site: string): AiSource => ({ title, site });

export const AI_OBSERVATIONS: AiObservation[] = [
  // ── おすすめ店 ──
  obs({
    aiName: "ChatGPT", questionId: "recommend", status: "mentioned", position: 2,
    reason: "濃厚な豚骨スープと麺の硬さを選べる点が評価として紹介",
    excerpt: "…定番なら「サンプル家系A店」、次点で「サンプルラーメン店」。濃厚な豚骨醤油と、麺の硬さを選べる点が口コミで多く挙げられています。…",
    sources: [guide("サンプル駅周辺ラーメンまとめ", "sample-ramen-guide.example"), guide("口コミから見るラーメン店ランキング", "sample-review-ranking.example")],
  }),
  obs({
    aiName: "Gemini", questionId: "recommend", status: "mentioned", position: 1,
    reason: "Googleマップの口コミ件数と評価の高さを根拠に最初に紹介",
    excerpt: "…口コミ件数が多く評価も安定している「サンプルラーメン店」がまず候補です。次いで「サンプル家系A店」…",
    sources: [guide("Googleマップの店舗情報（サンプル）", "maps-sample.example")],
  }),
  obs({
    aiName: "Claude", questionId: "recommend", status: "mentioned", position: 3,
    reason: "スープの好みに合わせやすい点を理由に3番目に紹介",
    excerpt: "…「サンプル家系A店」「サンプル家系B店」に続き、「サンプルラーメン店」もスープの濃さを調整できる点で人気です。…",
    sources: [],
  }),
  // ── 駅近 ──
  obs({
    aiName: "ChatGPT", questionId: "station", status: "mentioned", position: 1,
    reason: "駅からの徒歩分数が短いと紹介",
    excerpt: "…駅から徒歩数分の「サンプルラーメン店」が最も行きやすい立地です。…",
    sources: [guide("サンプル駅周辺ラーメンまとめ", "sample-ramen-guide.example")],
  }),
  obs({
    aiName: "Gemini", questionId: "station", status: "mentioned", position: 2,
    reason: "駅近で営業時間が長い点が理由",
    excerpt: "…駅近では「サンプル家系B店」に次いで、「サンプルラーメン店」も昼から夜まで通しで営業しています。…",
    sources: [guide("Googleマップの店舗情報（サンプル）", "maps-sample.example")],
  }),
  obs({
    aiName: "Claude", questionId: "station", status: "not_mentioned",
    excerpt: "…駅近では「サンプル家系B店」「サンプル家系C店」が挙げられます。最新の営業時間は各店舗でご確認ください。…",
    sources: [guide("サンプル駅周辺ラーメンまとめ", "sample-ramen-guide.example")],
  }),
  // ── 初めての来店 ──
  obs({
    aiName: "ChatGPT", questionId: "first", status: "mentioned", position: 3,
    reason: "味の調整（濃さ・麺の硬さ）ができるため初心者向けと紹介",
    excerpt: "…初めてなら味を調整できるお店が安心です。「サンプルラーメン店」は濃さ・麺の硬さ・油の量を選べます。…",
    sources: [guide("家系ラーメン入門ガイド", "sample-beginner-guide.example")],
  }),
  obs({
    aiName: "Gemini", questionId: "first", status: "not_mentioned",
    excerpt: "…初めての方には、トッピングの種類が豊富な「サンプル家系A店」「サンプル家系E店」がおすすめです。…",
    sources: [guide("家系ラーメン入門ガイド", "sample-beginner-guide.example")],
  }),
  obs({
    aiName: "Claude", questionId: "first", status: "mentioned", position: 2,
    reason: "注文方法の案内が分かりやすいという口コミを根拠に紹介",
    excerpt: "…「サンプル家系A店」や「サンプルラーメン店」は注文時に好みを聞いてくれるため、初めてでも安心です。…",
    sources: [],
  }),
  // ── ランチ ──
  obs({
    aiName: "ChatGPT", questionId: "lunch", status: "not_mentioned",
    excerpt: "…ランチは回転の速い「サンプル家系C店」「サンプル家系D店」が入りやすいです。…",
    sources: [guide("サンプル駅周辺ラーメンまとめ", "sample-ramen-guide.example")],
  }),
  obs({
    aiName: "Gemini", questionId: "lunch", status: "mentioned", position: 2,
    reason: "ランチの回転が速いと紹介（参照元の記載なし）",
    excerpt: "…ランチ時間帯でも回転が速く入りやすいのは、「サンプル家系C店」と「サンプルラーメン店」です。…",
    sources: [],
  }),
  obs({
    aiName: "Claude", questionId: "lunch", status: "failed",
    statusNote: "回答の取得がタイムアウトしました（再観測待ち）",
  }),
  // ── 夜遅く ──
  obs({
    aiName: "ChatGPT", questionId: "late", status: "mentioned", position: 4,
    reason: "深夜帯の営業を続けている店として紹介",
    excerpt: "…夜遅くなら「サンプル家系B店」「サンプル家系A店」「サンプル家系E店」、そして「サンプルラーメン店」も遅めの時間まで営業しています。…",
    sources: [guide("深夜営業のラーメン店まとめ", "sample-night-guide.example")],
  }),
  obs({
    aiName: "Gemini", questionId: "late", status: "unobserved",
    statusNote: "この質問は今回の観測対象外（次回の観測で登録予定）",
  }),
  obs({
    aiName: "Claude", questionId: "late", status: "not_mentioned",
    excerpt: "…深夜営業の可否は変わりやすいため、「サンプル家系B店」など候補を挙げた上で、最新の営業時間の確認をおすすめします。…",
    sources: [],
  }),
  // ── 家族連れ ──
  obs({
    aiName: "ChatGPT", questionId: "family", status: "mentioned", position: 2,
    reason: "席数とキッズ向け対応の口コミを根拠に紹介",
    excerpt: "…家族連れなら「サンプル家系E店」、次いで「サンプルラーメン店」。取り分け用の器を貸してくれるという口コミがあります。…",
    sources: [guide("家族で行けるラーメン店", "sample-family-guide.example")],
  }),
  obs({
    aiName: "Gemini", questionId: "family", status: "mentioned", position: 3,
    reason: "店内の清潔さと入りやすさを理由に紹介",
    excerpt: "…「サンプル家系E店」「サンプル家系C店」に加え、店内が清潔で入りやすい「サンプルラーメン店」も候補です。…",
    sources: [guide("Googleマップの店舗情報（サンプル）", "maps-sample.example")],
  }),
  obs({
    aiName: "Claude", questionId: "family", status: "not_mentioned",
    excerpt: "…家族連れには座席にゆとりのある「サンプル家系E店」が挙げられます。…",
    sources: [],
  }),
];

export type AiSummary = {
  aiName: AiName;
  total: number;
  /** 取得できた回答数（店名が出た＋出なかった）= 言及率の分母 */
  answered: number;
  mentioned: number;
  failed: number;
  unobserved: number;
  /** 取得できた回答が0件なら null（0%とは区別する） */
  rate: number | null;
};

export function summarizeByAi(observations: AiObservation[], aiName: AiName): AiSummary {
  const rows = observations.filter((o) => o.aiName === aiName);
  const mentioned = rows.filter((o) => o.status === "mentioned").length;
  const notMentioned = rows.filter((o) => o.status === "not_mentioned").length;
  const answered = mentioned + notMentioned;
  return {
    aiName,
    total: rows.length,
    answered,
    mentioned,
    failed: rows.filter((o) => o.status === "failed").length,
    unobserved: rows.filter((o) => o.status === "unobserved").length,
    rate: answered > 0 ? Math.round((mentioned / answered) * 100) : null,
  };
}

export function findObservation(
  observations: AiObservation[],
  aiName: AiName,
  questionId: string
): AiObservation | undefined {
  return observations.find((o) => o.aiName === aiName && o.questionId === questionId);
}

export type ValidationResult =
  | { ok: true; value: AiObservation }
  | { ok: false; errors: string[] };

/**
 * 手動登録された観測1件を検証する（将来の実測登録用）。
 * 状態ごとに必須項目を縛り、取得失敗・未観測を言及率の分母に混ぜないようにする。
 */
export function validateAiObservation(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { ok: false, errors: ["観測データがオブジェクトではありません"] };
  const r = input as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const aiName = str(r.aiName);
  const status = str(r.status);

  if (!(AI_NAMES as readonly string[]).includes(aiName)) errors.push("aiName が不正です");
  if (!(OBSERVATION_STATUSES as readonly string[]).includes(status)) errors.push("status が不正です");
  if (!str(r.question)) errors.push("question が空です");
  if (!str(r.region)) errors.push("region が空です");
  if (!str(r.language)) errors.push("language が空です");

  const observedAt = r.observedAt == null ? null : str(r.observedAt);
  if (status !== "unobserved") {
    if (!observedAt || !/^\d{4}-\d{2}-\d{2}$/.test(observedAt)) errors.push("observedAt は YYYY-MM-DD で指定してください");
  }

  const answered = status === "mentioned" || status === "not_mentioned";
  const excerpt = r.excerpt == null ? null : str(r.excerpt);
  if (answered && !excerpt) errors.push("回答を取得した観測には excerpt（回答抜粋）が必要です");
  if (!answered && excerpt) errors.push("取得失敗・未観測に excerpt は指定できません");

  const position = r.position == null ? null : Number(r.position);
  if (status === "mentioned") {
    if (position === null || !Number.isInteger(position) || position < 1) errors.push("店名が出た観測には 1 以上の整数の position が必要です");
  } else if (position !== null) {
    errors.push("店名が出ていない観測に position は指定できません");
  }

  const sourcesRaw = r.sources;
  const sources: AiSource[] = [];
  if (sourcesRaw != null) {
    if (!Array.isArray(sourcesRaw)) errors.push("sources は配列で指定してください");
    else
      for (const s of sourcesRaw) {
        const row = s as Record<string, unknown> | null;
        if (row && typeof row === "object" && str(row.title) && str(row.site)) sources.push({ title: str(row.title), site: str(row.site) });
        else errors.push("sources の各要素には title と site が必要です");
      }
  }
  if (!answered && sources.length > 0) errors.push("取得失敗・未観測に sources は指定できません");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      aiName: aiName as AiName,
      questionId: str(r.questionId) || str(r.question),
      question: str(r.question),
      region: str(r.region),
      language: str(r.language),
      observedAt,
      status: status as ObservationStatus,
      position: status === "mentioned" ? position : null,
      reason: status === "mentioned" ? str(r.reason) || null : null,
      excerpt: answered ? excerpt : null,
      sources,
      statusNote: str(r.statusNote) || null,
    },
  };
}
