import { describe, it, expect } from "vitest";
import { computeXAxis, computeYAxis, placeLabels, type Bounds, type PlotPoint } from "@/lib/charts/scatter";
import { DEMO_COMPETITORS } from "@/lib/demo/dashboard";

// MeoCharts.tsx の CompetitorScatterChart と同じ寸法
const width = 580;
const height = 320;
const padding = { top: 35, right: 40, bottom: 45, left: 45 };
const innerW = width - padding.left - padding.right;
const innerH = height - padding.top - padding.bottom;
const bounds: Bounds = { left: padding.left + 2, top: padding.top - 6, right: width - 4, bottom: height - padding.bottom - 2 };

function toPoints(data: Array<{ name: string; rating: number; reviews: number; isOwn: boolean }>): PlotPoint[] {
  const x = computeXAxis(data.map((d) => d.reviews));
  const y = computeYAxis(data.map((d) => d.rating));
  return data.map((d) => ({
    cx: padding.left + (d.reviews / x.max) * innerW,
    cy: padding.top + innerH - ((d.rating - y.min) / (y.max - y.min)) * innerH,
    text: `${d.name} ★${d.rating.toFixed(1)} (${d.reviews.toLocaleString()}件)`,
    isOwn: d.isOwn,
  }));
}

function overlap(a: { x: number; y: number; width: number; height: number }, b: typeof a) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function expectNoOverflowOrOverlap(points: PlotPoint[]) {
  const labels = placeLabels(points, bounds);
  expect(labels).toHaveLength(points.length);
  labels.forEach((l) => {
    expect(l.x).toBeGreaterThanOrEqual(bounds.left);
    expect(l.y).toBeGreaterThanOrEqual(bounds.top);
    expect(l.x + l.width).toBeLessThanOrEqual(bounds.right);
    expect(l.y + l.height).toBeLessThanOrEqual(bounds.bottom);
  });
  // 他の店舗の点がラベルに隠れない
  labels.forEach((l, i) => {
    points.forEach((p, j) => {
      if (i === j) return;
      const hidden = p.cx >= l.x && p.cx <= l.x + l.width && p.cy >= l.y && p.cy <= l.y + l.height;
      expect(hidden, `点${j}がラベル${i}に隠れています`).toBe(false);
    });
  });
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      expect(overlap(labels[i], labels[j]), `ラベル${i}と${j}が重なっています`).toBe(false);
    }
  }
}

describe("競合散布図のラベル配置", () => {
  it("ラーメン店モデルの6点（右端の自社・近接する2点を含む）でラベルが枠内に収まり重ならない", () => {
    expectNoOverflowOrOverlap(toPoints(DEMO_COMPETITORS));
  });

  it("右端に寄った自社のラベルは点の左側（内側）に置かれる", () => {
    const points = toPoints(DEMO_COMPETITORS);
    const labels = placeLabels(points, bounds);
    const own = points.findIndex((p) => p.isOwn);
    expect(labels[own].x + labels[own].width).toBeLessThanOrEqual(bounds.right);
    expect(labels[own].x).toBeLessThan(points[own].cx);
  });

  it("少件数で点が密集する店舗データでも重ならない", () => {
    expectNoOverflowOrOverlap(
      toPoints([
        { name: "自店A", rating: 5.0, reviews: 7, isOwn: true },
        { name: "自店B", rating: 5.0, reviews: 1, isOwn: true },
        { name: "競合1", rating: 4.9, reviews: 57, isOwn: false },
        { name: "競合2", rating: 4.9, reviews: 56, isOwn: false },
        { name: "競合3", rating: 4.0, reviews: 68, isOwn: false },
      ])
    );
  });

  it("まったく同じ位置の点が複数あってもラベルは枠内に収まる", () => {
    const labels = placeLabels(
      [
        { cx: 300, cy: 120, text: "同位置A ★4.0 (100件)", isOwn: true },
        { cx: 300, cy: 120, text: "同位置B ★4.0 (100件)", isOwn: false },
      ],
      bounds
    );
    labels.forEach((l) => {
      expect(l.x).toBeGreaterThanOrEqual(bounds.left);
      expect(l.x + l.width).toBeLessThanOrEqual(bounds.right);
    });
  });
});
