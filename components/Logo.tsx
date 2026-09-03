import React from "react";

type LogoProps = {
  className?: string;
  variant?: "horizontal" | "icon";
  size?: number;
};

export function Logo({ className = "", variant = "horizontal", size }: LogoProps) {
  if (variant === "icon") {
    const dim = size || 32;
    return (
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="ポチコミ アイコン"
      >
        <path
          d="M18 3C11.373 3 6 8.373 6 15C6 23.2 16.4 32.8 17.2 33.5C17.65 33.9 18.35 33.9 18.8 33.5C19.6 32.8 30 23.2 30 15C30 8.373 24.627 3 18 3Z"
          fill="currentColor"
        />
        <path
          d="M18 8.5L19.85 13.2L24.8 13.6L21 17L22.1 21.9L18 19.2L13.9 21.9L15 17L11.2 13.6L16.15 13.2L18 8.5Z"
          fill="white"
        />
      </svg>
    );
  }

  // 横組み（デフォルト）
  const width = size ? size * 4.2 : 148;
  const height = size ? size : 36;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 156 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ポチコミ"
    >
      {/* Googleマップのピンシルエット */}
      <g transform="translate(3, 2)">
        <path
          d="M16 2C10.477 2 6 6.477 6 12C6 18.8 14.7 26.8 15.3 27.4C15.7 27.8 16.3 27.8 16.7 27.4C17.3 26.8 26 18.8 26 12C26 6.477 21.523 2 16 2Z"
          fill="currentColor"
        />
        <path
          d="M16 6.5L17.5 10.2L21.4 10.5L18.4 13.1L19.3 17L16 14.9L12.7 17L13.6 13.1L10.6 10.5L14.5 10.2L16 6.5Z"
          fill="white"
        />
      </g>
      {/* 太く力強いモダンなロゴタイプ「ポチコミ」 */}
      <text
        x="38"
        y="26"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fontFamily="'Hiragino Maru Gothic ProN', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif"
        fontSize="22"
        fontWeight="900"
        letterSpacing="0.04em"
      >
        ポチコミ
      </text>
      <circle cx="146" cy="11" r="3.2" fill="#e5a93c" />
    </svg>
  );
}
