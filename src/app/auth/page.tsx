import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "登录",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{
    confirmed?: string;
    handoff?: string;
    error?: string;
  }>;
}) {
  const configured = isSupabaseConfigured();
  const params = await searchParams;
  const notice = getAuthNotice(params);

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

      <AuthForm
        configured={configured}
        initialMessage={notice?.message}
        initialError={notice?.isError}
      />
    </div>
  );
}

function getAuthNotice(params: {
  confirmed?: string;
  handoff?: string;
  error?: string;
}) {
  if (params.confirmed === "1" && params.handoff === "1") {
    return {
      message:
        "邮箱已经确认。QQ 邮箱可能在另一个页面打开了链接，请回到刚才的浏览器，直接登录就好。",
      isError: false,
    };
  }

  if (params.confirmed === "1") {
    return {
      message: "邮箱已经确认，可以登录了。",
      isError: false,
    };
  }

  if (params.error === "confirmation") {
    return {
      message: "这个确认链接没有接上。可以回到邮箱重新打开，或直接试试登录。",
      isError: true,
    };
  }

  return null;
}
