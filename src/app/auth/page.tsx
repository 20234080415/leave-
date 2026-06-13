import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "登录",
};

export default function AuthPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col justify-center">
      <header className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5dfdc] text-2xl text-rose-deep shadow-sm">
          ♡
        </div>
        <p className="mt-6 text-xs tracking-[0.24em] text-rose-deep">
          留白 LEAVE
        </p>
        <h1 className="mt-3 text-[30px] font-medium tracking-[-0.04em] text-ink">
          欢迎回到这里
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          登录或创建账号，开始两个人的安静记录。
        </p>
      </header>

      {!configured ? (
        <div className="mb-4 rounded-[22px] border border-[#ead2cd] bg-[#fff7f5] p-4 text-sm leading-6 text-ink-muted">
          Supabase 尚未配置。请先在 `.env.local` 中填写项目 URL 和
          anon/publishable key。
        </div>
      ) : null}

      <AuthForm configured={configured} />
    </div>
  );
}
