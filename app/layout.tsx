import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ポチコミ - 口コミ獲得支援",
  description: "QRコードからアンケート、口コミ文章作成、Googleマップ投稿導線までを支援します。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
