import React from "react";

type LogoProps = {
  className?: string;
  variant?: "horizontal" | "white" | "icon";
  size?: number;
};

export function Logo({ className = "", variant = "horizontal", size }: LogoProps) {
  // 元画像のアスペクト比（3660:1162 ≈ 3.15:1）
  const height = size || 32;
  const width = Math.round(height * 3.15);

  const src =
    variant === "white"
      ? "/logo/logo-original-white.png"
      : "/logo/logo-original-transparent.png";

  return (
    // 素のimgタグを使用し、Next.jsの画像プロキシやハイドレーションによる遅延・非表示を完全に防止
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="ポチコミ"
      width={width}
      height={height}
      className={`inline-block object-contain select-none shrink-0 ${className}`}
      style={{ height: `${height}px`, width: `${width}px`, minWidth: `${width}px` }}
      loading="eager"
      decoding="sync"
    />
  );
}
