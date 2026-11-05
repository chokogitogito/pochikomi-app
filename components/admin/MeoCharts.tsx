"use client";

import React from "react";
import { computeXAxis, computeYAxis, median, niceCeil, placeLabels, rankCompetitor } from "@/lib/charts/scatter";

type Competitor = {
  name: string;
  rating: number;
  reviews: number;
  isOwn: boolean;
  category: string;
};

type Trend = {
  month: string;
  reviews: number;
  views?: number;
  directions?: number;
};

/** 棒グラフ上に縦の目印（例: 「導入」）を付ける月 */
export type TrendMarker = { month: string; label: string };

const STORE_COLORS = [
  { stroke: "#1b5e3b", fill: "#1b5e3b", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" }, // The蔵ssic
  { stroke: "#0d9488", fill: "#0d9488", bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },       // SS.GRAND
  { stroke: "#3b82f6", fill: "#3b82f6", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },       // 競合A (Lounge Range)
  { stroke: "#8b5cf6", fill: "#8b5cf6", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },   // 競合B (SWING24/7)
  { stroke: "#f59e0b", fill: "#f59e0b", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },     // 競合C (雀宮練習場)
  { stroke: "#ec4899", fill: "#ec4899", bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200" },
  { stroke: "#06b6d4", fill: "#06b6d4", bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
];

/**
 * 競合散布図（評価 × 口コミ数）
 * 軸の上限は表示対象の最大口コミ件数から決め、ラベルは端・近接点でも重ならないよう自動配置する。
 * 点が近くて読みにくい場合は、下の店舗一覧から店舗を選んで位置・星評価・件数を確認できる。
 */
export function CompetitorScatterChart({ competitors }: { competitors: Competitor[] }) {
  // 選択（クリックで固定）とホバー（一時的な強調）を分ける。一覧のボタン上でカーソルが外れても選択は残る。
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const focusIdx = hoverIdx ?? selectedIdx;

  const width = 580;
  const height = 320;
  const padding = { top: 35, right: 40, bottom: 45, left: 45 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // X軸: 口コミ数。表示対象の最大件数から上限と目盛りを決める
  const xAxis = React.useMemo(() => computeXAxis(competitors.map((c) => c.reviews)), [competitors]);
  const scaleX = (val: number) => padding.left + (val / xAxis.max) * innerW;

  // Y軸: 評価
  const yAxis = React.useMemo(() => computeYAxis(competitors.map((c) => c.rating)), [competitors]);
  const scaleY = (val: number) => padding.top + innerH - ((val - yAxis.min) / (yAxis.max - yAxis.min)) * innerH;

  const rivalMedian = median(competitors.filter((c) => !c.isOwn).map((c) => c.reviews));

  const labels = React.useMemo(
    () =>
      placeLabels(
        competitors.map((c) => ({
          cx: scaleX(c.reviews),
          cy: scaleY(c.rating),
          text: `${c.name.replace(/（自社）/, "")} ★${c.rating.toFixed(1)} (${c.reviews.toLocaleString()}件)`,
          isOwn: c.isOwn,
        })),
        { left: padding.left + 2, top: padding.top - 6, right: width - 4, bottom: height - padding.bottom - 2 }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competitors, xAxis.max, yAxis.min]
  );

  const selectedItem = selectedIdx !== null ? competitors[selectedIdx] : null;
  const selectedColor = selectedIdx !== null ? STORE_COLORS[selectedIdx % STORE_COLORS.length] : null;
  const selectedRank = selectedItem ? rankCompetitor(competitors, selectedItem) : null;

  return (
    <div className="space-y-4">
      {/* 散布図本体 */}
      <div className="w-full overflow-x-auto no-scrollbar relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[520px] h-auto font-sans select-none"
          role="img"
          aria-label="競合店舗の星評価と口コミ件数の散布図"
        >
          <defs>
            <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Y軸グリッド線とラベル */}
          {yAxis.ticks.map((r) => {
            const y = scaleY(r);
            return (
              <g key={r}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-border-subtle"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-text-tertiary"
                  fontSize="11"
                  fontWeight="500"
                >
                  ★{r.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* X軸グリッド線とラベル */}
          {xAxis.ticks.map((c) => {
            const x = scaleX(c);
            return (
              <g key={c}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="currentColor"
                  className="text-border-subtle"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="fill-text-tertiary"
                  fontSize="11"
                  fontWeight="500"
                >
                  {c.toLocaleString()}件
                </text>
              </g>
            );
          })}

          {/* 近隣競合（自社以外）の口コミ件数の中央値。固定ゾーンではなくデータから算出 */}
          {rivalMedian !== null && (
            <line
              x1={scaleX(rivalMedian)}
              y1={padding.top}
              x2={scaleX(rivalMedian)}
              y2={height - padding.bottom}
              stroke="#64748b"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.7"
            />
          )}

          {/* 軸タイトル */}
          <text
            x={width - padding.right}
            y={height - padding.bottom + 36}
            textAnchor="end"
            className="fill-text-secondary"
            fontSize="11"
            fontWeight="600"
          >
            Google口コミ件数 →
          </text>
          <text
            x={padding.left}
            y={padding.top - 14}
            textAnchor="start"
            className="fill-text-secondary"
            fontSize="11"
            fontWeight="600"
          >
            ↑ 平均星評価
          </text>

          {/* データプロット */}
          {competitors.map((item, idx) => {
            const cx = scaleX(item.reviews);
            const cy = scaleY(item.rating);
            const color = STORE_COLORS[idx % STORE_COLORS.length];
            const isFocused = focusIdx === idx;
            const label = labels[idx];

            return (
              <g
                key={idx}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
              >
                {/* 自社店舗のパルス外リング */}
                {item.isOwn && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isFocused ? "18" : "13"}
                    fill={color.fill}
                    fillOpacity={isFocused ? "0.3" : "0.16"}
                    className="animate-pulse"
                  />
                )}

                {/* 強調時の拡大ハイライトリング */}
                {isFocused && (
                  <circle cx={cx} cy={cy} r="15" fill={color.fill} fillOpacity="0.2" />
                )}

                {/* 引出線 */}
                {label && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={label.anchorX}
                    y2={label.anchorY}
                    stroke={color.stroke}
                    strokeWidth="1"
                    strokeOpacity={isFocused ? "0.9" : "0.4"}
                  />
                )}

                {/* メインプロット円 */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isFocused ? "9" : item.isOwn ? "7.5" : "6"}
                  fill={color.fill}
                  stroke="#ffffff"
                  strokeWidth={isFocused ? "3" : "2"}
                  filter={isFocused ? "url(#glowEffect)" : undefined}
                />

                {/* ラベル（重ならない位置へ自動配置） */}
                {label && (
                  <g>
                    <rect
                      x={label.x}
                      y={label.y}
                      width={label.width}
                      height={label.height}
                      rx="4"
                      fill={isFocused ? color.fill : "#ffffff"}
                      stroke={color.stroke}
                      strokeWidth={isFocused ? "1.5" : "1"}
                      fillOpacity={isFocused ? "1" : "0.94"}
                    />
                    <text
                      x={label.x + 6}
                      y={label.y + 12.5}
                      fill={isFocused ? "#ffffff" : "#1e293b"}
                      fontSize="9.5"
                      fontWeight={isFocused || item.isOwn ? "bold" : "600"}
                    >
                      {item.name.replace(/（自社）/, "")} ★{item.rating.toFixed(1)} ({item.reviews.toLocaleString()}件)
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {rivalMedian !== null && (
        <p className="text-[11px] text-text-tertiary">
          <span className="inline-block w-5 border-t-2 border-dashed border-slate-500 align-middle mr-1.5" />
          点線は近隣の競合店舗（自社を除く）の口コミ件数の中央値（{rivalMedian.toLocaleString()}件）です。
        </p>
      )}

      {/* 店舗一覧（点が近くて読みにくい場合も、ここから選んで確認できる） */}
      <div className="pt-3 border-t border-border-subtle">
        <p className="text-[11px] font-bold text-text-tertiary mb-2">
          店舗一覧（選択すると、グラフ上で強調され位置・星評価・件数を確認できます）
        </p>
        <div className="flex flex-wrap gap-2">
          {competitors.map((item, idx) => {
            const color = STORE_COLORS[idx % STORE_COLORS.length];
            const isSelected = selectedIdx === idx;

            return (
              <button
                key={idx}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold pressable transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-surface shadow-sm ring-2 ring-brand scale-105 border-transparent"
                    : `${color.bg} ${color.border} ${color.text} hover:opacity-90`
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: color.fill }}
                />
                <span className="font-bold">{item.name}</span>
                <span className="opacity-75 text-[11px]">
                  ★{item.rating.toFixed(1)} ({item.reviews.toLocaleString()}件)
                </span>
                {item.isOwn && (
                  <span className="text-[10px] font-bold bg-brand text-white px-1.5 py-0.2 rounded-full">
                    自社
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 選択店舗の詳細カード（固定の文言ではなく、データから順位を算出して表示） */}
      {selectedItem && selectedColor && selectedRank && (
        <div className="p-3 rounded-xl bg-surface border border-border-default shadow-sm flex items-center justify-between text-xs animate-fade-in" data-testid="scatter-detail">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: selectedColor.fill }}
            />
            <div>
              <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                {selectedItem.name}
                <span className="text-[10px] font-medium text-text-tertiary">
                  （{selectedItem.category}）
                </span>
              </p>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Googleマップ評価: <strong>★{selectedItem.rating.toFixed(1)}</strong>（{selectedRank.total}店舗中{selectedRank.ratingRank}位） / 口コミ数:{" "}
                <strong>{selectedItem.reviews.toLocaleString()}件</strong>（{selectedRank.total}店舗中{selectedRank.reviewRank}位）
                {selectedItem.isOwn ? " — 自社" : " — 近隣の競合店舗"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIdx(null)}
            className="text-[11px] text-text-tertiary hover:text-text-primary px-2 py-1"
          >
            ✕ 閉じる
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 口コミ獲得とGoogleマップ集客（ルート検索・表示数）の相関推移グラフ
 */
export function GbpTrendChart({
  trends,
  showDirections = true,
  markers = [],
  ariaLabel,
}: {
  trends: Trend[];
  /** ルート検索の折れ線を出すか。falseなら口コミ獲得数のみの単系列グラフになる */
  showDirections?: boolean;
  /** 指定した月に縦の目印とラベル（例: 「導入」）を付ける */
  markers?: TrendMarker[];
  ariaLabel?: string;
}) {
  const count = Math.max(trends.length, 2);
  // 期間が長いほど横に伸ばし、月ラベルとバーが潰れないようにする
  const width = Math.max(560, 44 * count);
  const height = 240;
  const padding = { top: 25, right: 45, bottom: 40, left: 48 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const stepX = innerW / (count - 1);
  const getX = (idx: number) => padding.left + idx * stepX;

  // 軸はデータから算出する（店舗によって桁が2桁以上違うため固定値にしない）
  const maxDir = niceCeil(Math.max(...trends.map((t) => t.directions ?? 0), 1) * 1.15);
  const scaleDir = (val: number) => padding.top + innerH - (val / maxDir) * innerH;

  // 単系列のときは口コミがグラフ全体を使えるよう、余白を詰める
  const maxRev = niceCeil(Math.max(...trends.map((t) => t.reviews), 1) * (showDirections ? 1.35 : 1.12));
  const scaleRev = (val: number) => padding.top + innerH - (val / maxRev) * innerH;

  // 点数が多いときはラベルを間引く
  const labelEvery = count <= 9 ? 1 : count <= 18 ? 2 : count <= 26 ? 3 : 4;
  // 単系列なら値ラベルを出せる本数が増える
  const showPointValues = count <= (showDirections ? 8 : 18);
  // 点数が少ないときは棒を太くして増加が一目で読めるようにする
  const barWidth = Math.max(6, Math.min(count <= 6 ? 56 : 20, stepX * (count <= 6 ? 0.45 : 0.55)));
  // グリッドは実際に軸として使う系列に合わせる
  const gridBase = showDirections ? maxDir : maxRev;
  const gridLines = [0.25, 0.5, 0.75, 1].map((r) => Math.round(gridBase * r));

  const pathD = trends
    .map((t, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${scaleDir(t.directions ?? 0)}`)
    .join(" ");

  const areaD = `${pathD} L ${getX(trends.length - 1)} ${padding.top + innerH} L ${getX(0)} ${padding.top + innerH} Z`;

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[480px] h-auto font-sans"
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id="trendArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1b5e3b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1b5e3b" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {gridLines.map((val) => {
          // 目盛りの値と位置は同じ系列のスケールで揃える
          const y = showDirections ? scaleDir(val) : scaleRev(val);
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-border-subtle"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-text-tertiary"
                fontSize="10"
              >
                {val.toLocaleString()}
              </text>
            </g>
          );
        })}

        {trends.map((t, idx) => {
          const x = getX(idx) - barWidth / 2;
          const y = scaleRev(t.reviews);
          const barH = padding.top + innerH - y;
          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(0, barH)}
                fill="#2d8a56"
                fillOpacity="0.28"
                rx="3"
              />
              {showPointValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fill="#2d8a56"
                  fontSize={count > 12 ? 9 : 10}
                  fontWeight="bold"
                >
                  {t.reviews > 0 ? `+${t.reviews}` : ""}
                </text>
              )}
            </g>
          );
        })}

        {markers.map((m) => {
          const idx = trends.findIndex((t) => t.month === m.month);
          if (idx < 0) return null;
          const mx = getX(idx);
          const labelW = m.label.length * 11 + 16;
          return (
            <g key={`marker-${m.month}`} data-testid="trend-marker">
              <line
                x1={mx}
                y1={padding.top - 2}
                x2={mx}
                y2={padding.top + innerH}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <rect x={mx - labelW / 2} y={padding.top - 20} width={labelW} height="17" rx="8.5" fill="#d97706" />
              <text x={mx} y={padding.top - 8} textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="bold">
                {m.label}
              </text>
            </g>
          );
        })}

        {showDirections && (
          <>
            <path d={areaD} fill="url(#trendArea)" />
            <path d={pathD} fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {trends.map((t, idx) => {
          const cx = getX(idx);
          const cy = scaleDir(t.directions ?? 0);
          return (
            <g key={idx}>
              {showDirections && (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={showPointValues ? 4.5 : 3}
                    fill="#ffffff"
                    stroke="#1b5e3b"
                    strokeWidth="2.5"
                  />
                  {showPointValues && (
                    <text
                      x={cx}
                      y={cy - 9}
                      textAnchor="middle"
                      className="fill-text-primary font-bold"
                      fontSize="10"
                    >
                      {(t.directions ?? 0).toLocaleString()}件
                    </text>
                  )}
                </>
              )}
              {/* 末尾を基準に間引く。先頭起点だと最終ラベルが直前と重なる */}
              {(trends.length - 1 - idx) % labelEvery === 0 && (
                <text
                  x={cx}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="fill-text-secondary font-medium"
                  fontSize={count > 16 ? 10 : 11}
                >
                  {t.month}
                </text>
              )}
            </g>
          );
        })}

        <g transform={`translate(${width - padding.right - (showDirections ? 180 : 80)}, ${padding.top - 8})`}>
          <rect x="0" y="0" width="12" height="8" fill="#2d8a56" fillOpacity="0.4" rx="2" />
          <text x="16" y="8" className="fill-text-secondary" fontSize="10">口コミ獲得数</text>

          {showDirections && (
            <>
              <line x1="85" y1="4" x2="105" y2="4" stroke="#1b5e3b" strokeWidth="2.5" />
              <circle cx="95" cy="4" r="2.5" fill="#ffffff" stroke="#1b5e3b" strokeWidth="1.5" />
              <text x="112" y="8" className="fill-text-secondary" fontSize="10">ルート検索数</text>
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

/**
 * 口コミ投稿率ファネル
 */
export function FunnelChart({
  starts,
  generated,
  clicks,
}: {
  starts: number;
  generated: number;
  clicks: number;
}) {
  const steps = [
    { label: "アンケート開始", count: starts, rate: "100%" },
    { label: "口コミ文作成", count: generated, rate: starts > 0 ? `${Math.round((generated / starts) * 100)}%` : "0%" },
    { label: "Googleマップ遷移", count: clicks, rate: starts > 0 ? `${Math.round((clicks / starts) * 100)}%` : "0%" },
  ];

  return (
    <div className="space-y-3">
      {steps.map((s, idx) => {
        const pct = starts > 0 ? Math.max(12, Math.round((s.count / starts) * 100)) : 10;
        return (
          <div key={idx}>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-text-primary">{s.label}</span>
              <span className="text-text-secondary">
                {s.count.toLocaleString()}件 ({s.rate})
              </span>
            </div>
            <div className="h-4 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
              <div
                className="h-full bg-brand transition-all duration-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
