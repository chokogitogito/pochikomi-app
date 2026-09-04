"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg("パスワードは8文字以上で設定してください。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("パスワードが一致しません。もう一度ご確認ください。");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message || "パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。");
      } else {
        setSuccess(true);
      }
    } catch {
      setErrorMsg("通信エラーが発生しました。");
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
          <h1 className="text-xl font-bold text-text-primary">新しいパスワードの設定</h1>
          <p className="text-xs text-text-secondary mt-1">ポチコミ 管理者アカウント</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700">
              パスワードの再設定が完了しました。新しいパスワードでログインしてください。
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-all pressable shadow-sm"
            >
              管理画面へ進む
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                新しいパスワード（8文字以上）
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                パスワード確認用
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-canvas text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-all disabled:opacity-50 pressable shadow-sm"
            >
              {loading ? "更新中..." : "パスワードを更新する"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="text-xs text-text-secondary hover:text-brand transition-colors"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
