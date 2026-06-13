import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SoftCard } from "@/components/soft-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "开始我们的留白",
};

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) {
    return <ConfigurationRequired />;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/auth");
  }

  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from("space_members")
      .select("space_id")
      .eq("user_id", claims.sub)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("nickname")
      .eq("id", claims.sub)
      .maybeSingle(),
  ]);

  if (membership) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col justify-center">
      <header className="mb-8">
        <p className="text-xs tracking-[0.2em] text-rose-deep">
          HELLO, {profile?.nickname ?? "留白用户"}
        </p>
        <h1 className="mt-3 text-[30px] font-medium leading-tight tracking-[-0.04em] text-ink">
          从两个人的空间开始
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-7 text-ink-muted">
          你可以创建一个新的留白空间，或用对方给你的邀请码加入。一个空间最多两个人。
        </p>
      </header>

      <section className="grid gap-4">
        <SoftCard className="relative overflow-hidden bg-[#fff8f6]">
          <span className="absolute -right-4 -top-6 text-8xl text-[#f3ded9]/60">
            +
          </span>
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4dfdc] text-xl text-rose-deep">
              ♡
            </span>
            <h2 className="mt-5 text-xl font-medium text-ink">创建一个空间</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              生成专属邀请码，再把它轻轻交给对方。
            </p>
            <button
              type="button"
              className="soft-button mt-6 w-full opacity-70"
              disabled
            >
              下一阶段开放
            </button>
          </div>
        </SoftCard>

        <SoftCard>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2ece6] text-xl text-[#9d8178]">
            #
          </span>
          <h2 className="mt-5 text-xl font-medium text-ink">加入对方的空间</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            输入 6 位邀请码，找到对方已经准备好的位置。
          </p>
          <div className="mt-6 flex gap-2">
            <input
              aria-label="空间邀请码"
              className="text-field min-w-0 flex-1 uppercase tracking-[0.2em]"
              placeholder="LEAVE6"
              maxLength={6}
              disabled
            />
            <button
              type="button"
              className="rounded-2xl bg-[#e6d8d3] px-4 text-sm text-white"
              disabled
            >
              加入
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            创建与加入逻辑将在第 4 阶段接入。
          </p>
        </SoftCard>
      </section>

      <form action={signOut} className="mt-7 text-center">
        <button type="submit" className="text-sm text-ink-faint">
          退出当前账号
        </button>
      </form>
    </div>
  );
}

async function signOut() {
  "use server";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/auth");
}

function ConfigurationRequired() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center">
      <SoftCard>
        <p className="text-xs tracking-[0.2em] text-rose-deep">SETUP</p>
        <h1 className="mt-3 text-2xl font-medium text-ink">
          还差 Supabase 环境配置
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          请将项目 URL 和 anon/publishable key 填入 `.env.local`，然后重新启动开发服务。
        </p>
      </SoftCard>
    </div>
  );
}
