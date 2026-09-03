import React from "react";
import Image from "next/image";

type LogoProps = {
  className?: string;
  variant?: "horizontal" | "white" | "icon";
  size?: number;
};

export function Logo({ className = "", variant = "horizontal", size }: LogoProps) {
  // 高さをベースにアスペクト比（3660:1162 ≈ 3.15:1）を計算
  const height = size || 32;
  const width = Math.round(height * 3.15);

  if (variant === "white") {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Image
          src="/logo/logo-original-white.png"
          alt="ポチコミ"
          width={width}
          height={height}
          className="object-contain w-auto"
          style={{ height: `${height}px` }}
          priority
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <Image
        src="/logo/logo-original-transparent.png"
        alt="ポチコミ"
        width={width}
        height={height}
        className="object-contain w-auto"
        style={{ height: `${height}px` }}
        priority
      />
    </div>
  );
}
