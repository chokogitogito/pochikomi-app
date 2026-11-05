/**
 * 競合散布図（評価 × 口コミ件数）の軸とラベル配置の計算。
 * 描画から切り離した純関数にして、軸の上限・ラベルの重なりをテストできるようにする。
 */

/** 軸の上限を切りのよい値へ丸める（1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 × 10^n） */
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const n = value / base;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((x) => n <= x) ?? 10;
  return step * base;
}

export type XAxis = { max: number; step: number; ticks: number[] };

/**
 * 横軸（口コミ件数）。表示対象の最大件数から上限と目盛りを決める。
 * 例: 最大1,989件 → 0〜2,500（500刻み） / 最大68件 → 0〜75（15刻み）
 */
export function computeXAxis(reviewCounts: number[]): XAxis {
  const maxReviews = Math.max(0, ...reviewCounts.filter((n) => Number.isFinite(n)));
  const raw = Math.max(maxReviews * 1.08, 5);
  const step = Math.max(1, niceCeil(raw / 5));
  const max = Math.ceil(raw / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Math.round(v));
  return { max, step, ticks };
}

export type YAxis = { min: number; max: number; ticks: number[] };

/** 縦軸（星評価）。通常は3.5〜5.2。低評価の店舗があれば下限を広げる */
export function computeYAxis(ratings: number[]): YAxis {
  const lowest = Math.min(5, ...ratings.filter((n) => Number.isFinite(n)));
  const min = lowest < 3.7 ? Math.max(1, Math.floor((lowest - 0.3) * 2) / 2) : 3.5;
  const max = 5.2;
  const ticks: number[] = [];
  for (let v = Math.ceil(min * 2) / 2; v <= 5.0 + 1e-9; v += 0.5) ticks.push(Math.round(v * 10) / 10);
  return { min, max, ticks };
}

/** 偶数番目＝中央値。競合（自社以外）の口コミ件数の中央値 */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export type PlotPoint = { cx: number; cy: number; text: string; isOwn: boolean };
export type Bounds = { left: number; top: number; right: number; bottom: number };
export type LabelBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** ラベル枠の中で、点に最も近い辺の中点（引出線の終点） */
  anchorX: number;
  anchorY: number;
};

const LABEL_HEIGHT = 18;
const POINT_CLEARANCE = 9;

/** 日本語は全角幅、ASCIIは半角幅として概算する */
export function estimateTextWidth(text: string, fontSize = 9.5): number {
  let w = 0;
  for (const ch of text) w += ch.charCodeAt(0) > 0x7f ? fontSize : fontSize * 0.6;
  return Math.ceil(w) + 12;
}

type Rect = { x: number; y: number; width: number; height: number };

function overlaps(a: Rect, b: Rect, margin = 2): boolean {
  return (
    a.x < b.x + b.width + margin &&
    a.x + a.width + margin > b.x &&
    a.y < b.y + b.height + margin &&
    a.y + a.height + margin > b.y
  );
}

function inside(r: Rect, b: Bounds): boolean {
  return r.x >= b.left && r.y >= b.top && r.x + r.width <= b.right && r.y + r.height <= b.bottom;
}

function coversPoint(r: Rect, p: { cx: number; cy: number }): boolean {
  return (
    p.cx > r.x - POINT_CLEARANCE &&
    p.cx < r.x + r.width + POINT_CLEARANCE &&
    p.cy > r.y - POINT_CLEARANCE &&
    p.cy < r.y + r.height + POINT_CLEARANCE
  );
}

/**
 * 各点のラベル位置を決める。端に寄った点は内側へ、近い点同士は重ならない候補位置を選ぶ。
 * 自社を最優先で配置し、続けて画面下（cyが大きい）から順に置く。
 * 戻り値は points と同じ並び。
 */
export function placeLabels(points: PlotPoint[], bounds: Bounds, fontSize = 9.5): LabelBox[] {
  const order = points
    .map((p, i) => ({ p, i }))
    .sort((a, b) => Number(b.p.isOwn) - Number(a.p.isOwn) || a.p.cy - b.p.cy);

  const placed: Rect[] = [];
  const result: LabelBox[] = new Array(points.length);

  for (const { p, i } of order) {
    const width = estimateTextWidth(p.text, fontSize);
    const height = LABEL_HEIGHT;
    const gap = 10;

    // 候補位置: 点の左右それぞれに、縦方向のずらし幅を変えて並べる。上下中央寄せも加える。
    const offsets = [-height - 4, 6, -height / 2, -height * 2 - 8, height + 10, -height * 3 - 12, height * 2 + 14];
    const candidates: Rect[] = [];
    for (const side of ["right", "left"] as const) {
      for (const dy of offsets) {
        candidates.push({
          x: side === "right" ? p.cx + gap : p.cx - gap - width,
          y: p.cy + dy,
          width,
          height,
        });
      }
    }
    candidates.push(
      { x: p.cx - width / 2, y: p.cy - gap - height - 2, width, height },
      { x: p.cx - width / 2, y: p.cy + gap + 2, width, height }
    );

    const others = points.filter((_, j) => j !== i);

    // 重なり・他の点への被り・枠外を点数化し、最も良い候補を選ぶ（同点なら先に挙げた候補＝点に近い位置）
    const score = (r: Rect): number => {
      let penalty = 0;
      if (!inside(r, bounds)) {
        const overflowX = Math.max(0, bounds.left - r.x, r.x + r.width - bounds.right);
        const overflowY = Math.max(0, bounds.top - r.y, r.y + r.height - bounds.bottom);
        penalty += 10000 + (overflowX + overflowY) * 10;
      }
      penalty += placed.filter((q) => overlaps(r, q)).length * 1000;
      penalty += others.filter((o) => coversPoint(r, o)).length * 100;
      // 点から離れるほどわずかに減点
      const cxr = r.x + r.width / 2;
      const cyr = r.y + r.height / 2;
      penalty += Math.hypot(cxr - p.cx, cyr - p.cy) / 100;
      return penalty;
    };

    let chosen = candidates[0];
    let best = Infinity;
    for (const c of candidates) {
      const sc = score(c);
      if (sc < best) {
        best = sc;
        chosen = c;
      }
    }

    // 枠外にはみ出す場合は枠内へ押し込む
    chosen = {
      ...chosen,
      x: Math.min(Math.max(chosen.x, bounds.left), Math.max(bounds.left, bounds.right - width)),
      y: Math.min(Math.max(chosen.y, bounds.top), Math.max(bounds.top, bounds.bottom - height)),
    };

    placed.push(chosen);
    // 引出線の終点: 点に最も近い枠上の位置
    const anchorX = Math.min(Math.max(p.cx, chosen.x), chosen.x + chosen.width);
    const anchorY = Math.min(Math.max(p.cy, chosen.y), chosen.y + chosen.height);
    result[i] = { ...chosen, anchorX, anchorY };
  }

  return result;
}

/** 口コミ件数・評価の順位（同値は同順位）。比較結果の文言を固定文でなくデータから作るために使う */
export function rankCompetitor<T extends { rating: number; reviews: number }>(competitors: T[], target: T) {
  const reviewRank = 1 + competitors.filter((c) => c.reviews > target.reviews).length;
  const ratingRank = 1 + competitors.filter((c) => c.rating > target.rating).length;
  return { reviewRank, ratingRank, total: competitors.length };
}
