import React from "react";
import Image from "next/image";

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
    <span
      className={`inline-block relative shrink-0 select-none ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <Image
        src={src}
        alt="ポチコミ"
        width={width}
        height={height}
        className="w-full h-full object-contain block"
        priority
      />
    </span>
  );
}
