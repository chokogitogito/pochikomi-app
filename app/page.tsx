export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">ポチコミ</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          お店のQRコードを読み取ることで、<br />
          かんたんに口コミを投稿できます。
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-sm">
            店舗のQRコードをスキャンしてください
          </p>
        </div>
        {/* 開発用テストリンク */}
        <div className="mt-8">
          <p className="text-xs text-gray-300 mb-2">── 開発用テスト ──</p>
          <a
            href="/survey/test-store"
            className="inline-block text-sm text-orange-400 underline"
          >
            テスト店舗のアンケートを開く
          </a>
        </div>
      </div>
    </div>
  );
}
