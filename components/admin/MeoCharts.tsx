"use client";

import React from "react";

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
  views: number;
  directions: number;
};

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
 * カラーコーディング、文字重なり防止オフセット、インタラクティブ凡例・ツールチップ完備
 */
export function CompetitorScatterChart({ competitors }: { competitors: Competitor[] }) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);

  const width = 580;
  const height = 310;
  const padding = { top: 35, right: 40, bottom: 45, left: 45 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // X軸: 口コミ数 (0 〜 80)
  const maxX = 80;
  const scaleX = (val: number) => padding.left + (val / maxX) * innerW;

  // Y軸: 評価 (3.5 〜 5.2)
  const minY = 3.5;
  const maxY = 5.2;
  const scaleY = (val: number) => padding.top + innerH - ((val - minY) / (maxY - minY)) * innerH;

  // 重なりを避けるための各プロットごとのラベルオフセット設計
  const getLabelOffset = (idx: number, item: Competitor) => {
    // The蔵ssic (7件, 5.0) -> 上側に配置
    if (item.name.includes("The蔵ssic") || (item.isOwn && idx === 0)) {
      return { dx: 12, dy: -12, anchor: "start" as const };
    }
    // SS.GRAND (1件, 5.0) -> 下側に配置してThe蔵ssicと重ならないようにする
    if (item.name.includes("SS.GRAND") || (item.isOwn && idx === 1)) {
      return { dx: 12, dy: 16, anchor: "start" as const };
    }
    // Lounge Range (57件, 4.9) -> 上側に配置
    if (item.name.includes("Lounge") || idx === 2) {
      return { dx: -8, dy: -14, anchor: "end" as const };
    }
    // SWING24/7 (56件, 4.9) -> 下側に配置してLounge Rangeと重ならないようにする
    if (item.name.includes("SWING") || idx === 3) {
      return { dx: 8, dy: 22, anchor: "start" as const };
    }
    // 雀宮練習場 (68件, 4.0) -> 右側に配置
    return { dx: 12, dy: 4, anchor: "start" as const };
  };

  const activeItem = activeIdx !== null ? competitors[activeIdx] : null;
  const activeColor = activeIdx !== null ? STORE_COLORS[activeIdx % STORE_COLORS.length] : null;

  return (
    <div className="space-y-4">
      {/* 散布図本体 */}
      <div className="w-full overflow-x-auto no-scrollbar relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[520px] h-auto font-sans select-none"
        >
          <defs>
            <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 理想ゾーン（高評価・高口コミエリア）背景ハイライト */}
          <rect
            x={scaleX(35)}
            y={scaleY(5.15)}
            width={innerW - (scaleX(35) - padding.left)}
            height={scaleY(4.5) - scaleY(5.15)}
            fill="#10b981"
            fillOpacity="0.05"
            rx="10"
          />
          <text
            x={width - padding.right - 10}
            y={scaleY(5.08)}
            fill="#059669"
            fontSize="10"
            fontWeight="bold"
            textAnchor="end"
            opacity="0.8"
          >
            目指すポジション（MEO地域上位表示圏）
          </text>

          {/* 課題ゾーン（自社2店舗の現在地） */}
          <rect
            x={scaleX(0) - 6}
            y={scaleY(5.18)}
            width={scaleX(16) - scaleX(0) + 12}
            height={scaleY(4.75) - scaleY(5.18)}
            fill="#f59e0b"
            fillOpacity="0.06"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            rx="10"
          />
          <text
            x={scaleX(2)}
            y={scaleY(5.13)}
            fill="#d97706"
            fontSize="9.5"
            fontWeight="bold"
          >
            評価最高水準・口コミ数不足
          </text>

          {/* Y軸グリッド線とラベル */}
          {[4.0, 4.5, 5.0].map((r) => {
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
          {[0, 20, 40, 60, 80].map((c) => {
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
                  {c}件
                </text>
              </g>
            );
          })}

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
            const isHovered = activeIdx === idx;
            const offset = getLabelOffset(idx, item);

            return (
              <g
                key={idx}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
              >
                {/* 自社店舗のパルス外リング */}
                {item.isOwn && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? "18" : "13"}
                    fill={color.fill}
                    fillOpacity={isHovered ? "0.3" : "0.16"}
                    className="animate-pulse"
                  />
                )}

                {/* ホバー時の拡大ハイライトリング */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="15"
                    fill={color.fill}
                    fillOpacity="0.2"
                  />
                )}

                {/* メインプロット円 */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? "9" : item.isOwn ? "7.5" : "6"}
                  fill={color.fill}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? "3" : "2"}
                  filter={isHovered ? "url(#glowEffect)" : undefined}
                />

                {/* 引出線（近接店舗のラベル用） */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + offset.dx}
                  y2={cy + offset.dy}
                  stroke={color.stroke}
                  strokeWidth="1"
                  strokeOpacity={isHovered ? "0.9" : "0.4"}
                />

                {/* グラフ上常時表示のスマートラベル */}
                <g transform={`translate(${cx + offset.dx}, ${cy + offset.dy})`}>
                  <rect
                    x={offset.anchor === "end" ? -110 : -4}
                    y="-11"
                    width={114}
                    height="18"
                    rx="4"
                    fill={isHovered ? color.fill : "#ffffff"}
                    stroke={color.stroke}
                    strokeWidth={isHovered ? "1.5" : "1"}
                    fillOpacity={isHovered ? "1" : "0.92"}
                    className="shadow-xs transition-colors"
                  />
                  <text
                    x={offset.anchor === "end" ? -6 : 3}
                    y="2"
                    textAnchor={offset.anchor}
                    fill={isHovered ? "#ffffff" : "#1e293b"}
                    fontSize="9.5"
                    fontWeight={isHovered || item.isOwn ? "bold" : "600"}
                  >
                    {item.name.replace(/（自社）/, "")} ★{item.rating} ({item.reviews}件)
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* インタラクティブ凡例リスト（各店舗ごとの色分けカード） */}
      <div className="pt-3 border-t border-border-subtle">
        <p className="text-[11px] font-bold text-text-tertiary mb-2">
          店舗一覧（クリックまたはカーソルを合わせるとグラフ上でハイライトされます）
        </p>
        <div className="flex flex-wrap gap-2">
          {competitors.map((item, idx) => {
            const color = STORE_COLORS[idx % STORE_COLORS.length];
            const isSelected = activeIdx === idx;

            return (
              <button
                key={idx}
                onClick={() => setActiveIdx(isSelected ? null : idx)}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
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
                  ★{item.rating} ({item.reviews}件)
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

      {/* 選択店舗のハイライト詳細カード（タップ/ホバー時に展開） */}
      {activeItem && activeColor && (
        <div className="p-3 rounded-xl bg-surface border border-border-default shadow-sm flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: activeColor.fill }}
            />
            <div>
              <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                {activeItem.name}
                <span className="text-[10px] font-medium text-text-tertiary">
                  （{activeItem.category}）
                </span>
              </p>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Googleマップ評価: <strong>★{activeItem.rating}</strong> / 口コミ数: <strong>{activeItem.reviews}件</strong>
                {activeItem.isOwn
                  ? " — 評価は最高水準。ポチコミで口コミ件数を増やすことで地域No.1表示へ。"
                  : " — 近隣の主要競合店舗。"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveIdx(null)}
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
export function GbpTrendChart({ trends }: { trends: Trend[] }) {
  const width = 560;
  const height = 240;
  const padding = { top: 25, right: 45, bottom: 40, left: 40 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const stepX = innerW / (trends.length - 1);
  const getX = (idx: number) => padding.left + idx * stepX;

  const maxDir = 200;
  const scaleDir = (val: number) => padding.top + innerH - (val / maxDir) * innerH;

  const maxRev = 25;
  const scaleRev = (val: number) => padding.top + innerH - (val / maxRev) * innerH;

  const pathD = trends
    .map((t, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${scaleDir(t.directions)}`)
    .join(" ");

  const areaD = `${pathD} L ${getX(trends.length - 1)} ${padding.top + innerH} L ${getX(0)} ${padding.top + innerH} Z`;

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[480px] h-auto font-sans"
      >
        <defs>
          <linearGradient id="trendArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1b5e3b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1b5e3b" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[50, 100, 150, 200].map((val) => {
          const y = scaleDir(val);
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
                {val}
              </text>
            </g>
          );
        })}

        {trends.map((t, idx) => {
          const x = getX(idx) - 10;
          const y = scaleRev(t.reviews);
          const barH = padding.top + innerH - y;
          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width="20"
                height={Math.max(0, barH)}
                fill="#2d8a56"
                fillOpacity="0.28"
                rx="3"
              />
              <text
                x={x + 10}
                y={y - 4}
                textAnchor="middle"
                fill="#2d8a56"
                fontSize="10"
                fontWeight="bold"
              >
                {t.reviews > 0 ? `+${t.reviews}` : ""}
              </text>
            </g>
          );
        })}

        <path d={areaD} fill="url(#trendArea)" />
        <path d={pathD} fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" />

        {trends.map((t, idx) => {
          const cx = getX(idx);
          const cy = scaleDir(t.directions);
          return (
            <g key={idx}>
              <circle cx={cx} cy={cy} r="4.5" fill="#ffffff" stroke="#1b5e3b" strokeWidth="2.5" />
              <text
                x={cx}
                y={cy - 9}
                textAnchor="middle"
                className="fill-text-primary font-bold"
                fontSize="10"
              >
                {t.directions}件
              </text>
              <text
                x={cx}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className="fill-text-secondary font-medium"
                fontSize="11"
              >
                {t.month}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${width - padding.right - 180}, ${padding.top - 8})`}>
          <rect x="0" y="0" width="12" height="8" fill="#2d8a56" fillOpacity="0.4" rx="2" />
          <text x="16" y="8" className="fill-text-secondary" fontSize="10">口コミ獲得数</text>

          <line x1="85" y1="4" x2="105" y2="4" stroke="#1b5e3b" strokeWidth="2.5" />
          <circle cx="95" cy="4" r="2.5" fill="#ffffff" stroke="#1b5e3b" strokeWidth="1.5" />
          <text x="112" y="8" className="fill-text-secondary" fontSize="10">ルート検索数</text>
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
