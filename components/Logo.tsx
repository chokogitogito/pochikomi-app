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
          d="M18 4C10.268 4 4 9.82 4 17C4 20.47 5.534 23.61 8.04 25.84C7.75 28.18 6.78 30.22 6.7 30.38C6.47 30.87 6.84 31.43 7.37 31.35C10.23 30.93 12.89 29.56 14.82 28.51C15.85 28.83 16.91 29 18 29C25.732 29 32 23.18 32 17C32 9.82 25.732 4 18 4Z"
          fill="currentColor"
        />
        <path
          d="M18 10.5L19.7 14.8L24.3 15.2L20.8 18.2L21.8 22.7L18 20.3L14.2 22.7L15.2 18.2L11.7 15.2L16.3 14.8L18 10.5Z"
          fill="white"
        />
      </svg>
    );
  }

  // 横組み（デフォルト）
  const width = size ? size * 4.1 : 140;
  const height = size ? size : 34;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 148 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ポチコミ"
    >
      <g transform="translate(2, 2)">
        <path
          d="M16 2C9.373 2 4 6.989 4 13.143C4 16.117 5.315 18.809 7.463 20.72C7.214 22.726 6.383 24.47 6.314 24.61C6.117 25.03 6.434 25.51 6.888 25.44C9.34 25.08 11.62 23.91 13.27 23.01C14.16 23.28 15.06 23.43 16 23.43C22.627 23.43 28 18.441 28 13.143C28 6.989 22.627 2 16 2Z"
          fill="currentColor"
        />
        <path
          d="M16 7.5L17.45 11.18L21.4 11.52L18.4 14.09L19.26 17.95L16 15.9L12.74 17.95L13.6 14.09L10.6 11.52L14.55 11.18L16 7.5Z"
          fill="white"
        />
      </g>
      <text
        x="38"
        y="22"
        fill="currentColor"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', sans-serif"
        fontSize="19"
        fontWeight="800"
        letterSpacing="-0.02em"
      >
        ポチコミ
      </text>
      <text
        x="39"
        y="31"
        fill="currentColor"
        opacity="0.65"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
        fontSize="7.5"
        fontWeight="600"
        letterSpacing="0.16em"
      >
        POCHIKOMI
      </text>
    </svg>
  );
}
