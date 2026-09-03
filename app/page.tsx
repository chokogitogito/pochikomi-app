import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo/logo-v2.png"
            alt="ポチコミ"
            width={280}
            height={100}
            className="object-contain"
            priority
          />
        </div>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          お店のQRコードから、かんたんなアンケートと<br />
          口コミ投稿のサポートを利用できます。
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm">
            店舗のQRコードをスキャンしてください
          </p>
        </div>
        {/* 開発用テストリンク。NEXT_PUBLIC_SHOW_DEV_LINKS=true のときだけ表示する */}
        {process.env.NEXT_PUBLIC_SHOW_DEV_LINKS === "true" && (
          <div className="mt-8">
            <p className="text-xs text-gray-300 mb-2">開発用テスト</p>
            <Link
              href="/survey/classic"
              className="inline-block text-sm text-green-500 underline"
            >
              The蔵ssicのアンケートを開く
            </Link>
            <div className="mt-4">
              <Link
                href="/admin"
                className="inline-block text-sm text-gray-500 underline"
              >
                管理画面を開く
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
