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

/**
 * 競合散布図（評価 × 口コミ数）
 * 評価最高水準なのに口コミ数が2桁足りない現状を一目で示す
 */
export function CompetitorScatterChart({ competitors }: { competitors: Competitor[] }) {
  const width = 560;
  const height = 280;
  const padding = { top: 30, right: 35, bottom: 45, left: 45 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // X軸: 口コミ数 (0 〜 75)
  const maxX = 75;
  const scaleX = (val: number) => padding.left + (val / maxX) * innerW;

  // Y軸: 評価 (3.5 〜 5.2)
  const minY = 3.5;
  const maxY = 5.2;
  const scaleY = (val: number) => padding.top + innerH - ((val - minY) / (maxY - minY)) * innerH;

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[480px] h-auto font-sans"
      >
        <defs>
          <linearGradient id="ownHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1b5e3b" />
            <stop offset="100%" stopColor="#2d8a56" />
          </linearGradient>
          <filter id="shadowPoint" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" floodColor="#1b5e3b" />
          </filter>
        </defs>

        {/* 理想ゾーン（高評価・高口コミエリア）背景ハイライト */}
        <rect
          x={scaleX(35)}
          y={scaleY(5.1)}
          width={innerW - (scaleX(35) - padding.left)}
          height={scaleY(4.5) - scaleY(5.1)}
          fill="#1b5e3b"
          fillOpacity="0.04"
          rx="8"
        />
        <text
          x={width - padding.right - 10}
          y={scaleY(5.05)}
          fill="#1b5e3b"
          fontSize="10"
          fontWeight="bold"
          textAnchor="end"
          opacity="0.6"
        >
          目指すポジション（MEO上位表示圏）
        </text>

        {/* 課題ゾーン（自社2店舗の現在地） */}
        <rect
          x={scaleX(0) - 5}
          y={scaleY(5.15)}
          width={scaleX(15) - scaleX(0) + 10}
          height={scaleY(4.8) - scaleY(5.15)}
          fill="#f59e0b"
          fillOpacity="0.08"
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="3 3"
          rx="8"
        />
        <text
          x={scaleX(1)}
          y={scaleY(5.12)}
          fill="#d97706"
          fontSize="9.5"
          fontWeight="bold"
        >
          評価最高・口コミ不足
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
        {[0, 20, 40, 60].map((c) => {
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
          y={height - padding.bottom + 34}
          textAnchor="end"
          className="fill-text-secondary"
          fontSize="11"
          fontWeight="600"
        >
          Google口コミ数 →
        </text>
        <text
          x={padding.left}
          y={padding.top - 12}
          textAnchor="start"
          className="fill-text-secondary"
          fontSize="11"
          fontWeight="600"
        >
          ↑ 評価（平均星）
        </text>

        {/* データプロット */}
        {competitors.map((item, idx) => {
          const cx = scaleX(item.reviews);
          const cy = scaleY(item.rating);

          if (item.isOwn) {
            return (
              <g key={idx} filter="url(#shadowPoint)">
                <circle cx={cx} cy={cy} r="14" fill="#1b5e3b" fillOpacity="0.18" className="animate-pulse" />
                <circle cx={cx} cy={cy} r="7" fill="url(#ownHighlight)" stroke="#ffffff" strokeWidth="2.5" />
                <rect
                  x={cx + 10}
                  y={item.reviews < 5 ? cy - 20 : cy - 10}
                  width={item.name.length * 11 + 46}
                  height="22"
                  rx="6"
                  fill="#1b5e3b"
                />
                <text
                  x={cx + 16}
                  y={item.reviews < 5 ? cy - 5 : cy + 5}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {item.name} ★{item.rating} ({item.reviews}件)
                </text>
              </g>
            );
          }

          return (
            <g key={idx}>
              <circle
                cx={cx}
                cy={cy}
                r="6"
                className="fill-surface stroke-text-quaternary"
                strokeWidth="2"
              />
              <text
                x={cx}
                y={cy + 17}
                textAnchor="middle"
                className="fill-text-secondary font-medium"
                fontSize="10.5"
              >
                {item.name}
              </text>
              <text
                x={cx}
                y={cy + 29}
                textAnchor="middle"
                className="fill-text-tertiary"
                fontSize="9.5"
              >
                ★{item.rating} ({item.reviews}件)
              </text>
            </g>
          );
        })}
      </svg>
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
