"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "ログインに失敗しました。認証情報を確認してください。");
      } else if (data.session) {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setErrorMsg("認証サーバーに接続できませんでした。");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setErrorMsg("パスワード再設定用のメールアドレスを入力してください。");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setInfoMsg("パスワード再設定メールを送信しました。メールボックスを確認してください。");
      }
    } catch {
      setErrorMsg("メール送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border-default p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <Logo size={40} />
          </div>
          <h1 className="text-xl font-bold text-text-primary">管理画面ログイン</h1>
          <p className="text-xs text-text-secondary mt-1">ポチコミ 店舗管理者コンソール</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-all disabled:opacity-50 pressable shadow-sm"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={loading}
            className="text-xs text-text-secondary hover:text-brand transition-colors"
          >
            パスワードをお忘れですか？
          </button>
        </div>
      </div>
    </div>
  );
}
