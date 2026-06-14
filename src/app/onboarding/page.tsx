import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingSignOut } from "@/components/onboarding-sign-out";
import { SpaceOnboarding } from "@/components/space-onboarding";
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

      <SpaceOnboarding />

      <OnboardingSignOut />
    </div>
  );
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
