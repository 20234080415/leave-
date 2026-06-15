import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { InstallAppCard } from "@/components/install-app-card";
import { InviteCodeCard } from "@/components/invite-code-card";
import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";
import { TabletBookLayout } from "@/components/tablet-book-layout";
import { createClient } from "@/lib/supabase/server";
import { getSessionRefreshPath } from "@/lib/supabase/session";

type Profile = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export default async function UsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect(getSessionRefreshPath("/us"));
  }

  const { data: membership } = await supabase
    .from("space_members")
    .select("space_id, joined_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const [
    { data: space },
    { data: memberRows },
    recordCountResult,
    wishCountResult,
    answerCountResult,
  ] = await Promise.all([
    supabase
      .from("spaces")
      .select("id, name, invite_code, created_at, created_by")
      .eq("id", membership.space_id)
      .single(),
    supabase
      .from("space_members")
      .select("user_id, joined_at")
      .eq("space_id", membership.space_id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("daily_records")
      .select("id", { count: "exact", head: true })
      .eq("space_id", membership.space_id),
    supabase
      .from("wishes")
      .select("id", { count: "exact", head: true })
      .eq("space_id", membership.space_id),
    supabase
      .from("question_answers")
      .select("id", { count: "exact", head: true })
      .eq("space_id", membership.space_id),
  ]);

  if (!space) {
    redirect("/onboarding");
  }

  const memberIds = memberRows?.map((member) => member.user_id) ?? [];
  const { data: profileRows } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .in("id", memberIds)
    : { data: [] };

  const profiles = (profileRows ?? []) as Profile[];
  const orderedProfiles = memberIds
    .map((id) => profiles.find((profile) => profile.id === id))
    .filter((profile): profile is Profile => Boolean(profile));
  const hasPartner = memberIds.length === 2;
  const currentProfile = profiles.find((profile) => profile.id === userId);
  const daysTogether = differenceInDays(space.created_at, new Date()) + 1;

  return (
    <TabletBookLayout
      className="us-page-layout"
      left={
        <>
          <PageHeader
            eyebrow="US, TOGETHER"
            title={space.name}
            description="两个人的小小空间，只收藏彼此的日常。"
          />

          <SoftCard className="relative overflow-hidden bg-gradient-to-br from-[#f8e4e1] to-[#fff8f3] py-8 text-center">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/35" />
            <div className="flex items-start justify-center">
              <ProfileAvatar
                profile={orderedProfiles[0]}
                fallbackName="等待你"
                color="#dba9a4"
              />
              <span className="-mx-2 mt-7 flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-deep shadow-sm">
                ♡
              </span>
              <ProfileAvatar
                profile={orderedProfiles[1]}
                fallbackName="等待对方"
                color="#cbb1a7"
              />
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              空间创建于 {formatDate(space.created_at)}
            </p>
            <p className="mt-2 text-2xl font-medium text-ink">
              一起走过 {daysTogether} 天
            </p>
          </SoftCard>

          <section className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard
              value={formatCount(recordCountResult.count, recordCountResult.error)}
              label="留下的记录"
            />
            <StatCard
              value={formatCount(wishCountResult.count, wishCountResult.error)}
              label="一起的愿望"
            />
            <StatCard
              value={formatCount(answerCountResult.count, answerCountResult.error)}
              label="相遇的答案"
            />
          </section>

          <SoftCard className="mt-4 bg-[#fbf5f1]">
            <p className="text-xs tracking-[0.16em] text-rose-deep">
              OUR CHAPTER
            </p>
            <h2 className="mt-3 text-lg font-medium text-ink">
              第 {daysTogether} 页，还在一起写
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink-muted">
              从 {formatDate(space.created_at)} 开始，这里收下了你们的日常、回答和想一起完成的事。
            </p>
          </SoftCard>
        </>
      }
      right={
        <>
          <SoftCard className="text-center">
            <p className="text-xs tracking-[0.16em] text-rose-deep">OUR SPACE</p>
            <h2 className="mt-3 text-lg font-medium text-ink">
              {hasPartner ? "两个人已经在这里相遇" : "这里还留着一个位置"}
            </h2>
            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-ink-muted">
              {hasPartner
                ? "记录不要求回应，只把想留下的日常放在这里。"
                : "不着急。准备好时，把下方邀请码交给想一起留在这里的人。"}
            </p>
          </SoftCard>

          <InviteCodeCard
            inviteCode={space.invite_code}
            hasPartner={hasPartner}
          />

          <InstallAppCard />

          <AccountSettings
            userId={userId}
            nickname={currentProfile?.nickname ?? "留白用户"}
            spaceId={space.id}
            spaceName={space.name}
            hasPartner={hasPartner}
            canEditSpace={space.created_by === userId}
          />
        </>
      }
    />
  );
}

function ProfileAvatar({
  profile,
  fallbackName,
  color,
}: {
  profile?: Profile;
  fallbackName: string;
  color: string;
}) {
  const name = profile?.nickname ?? fallbackName;

  return (
    <div className="relative z-10 w-24">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white text-xl text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={`${name}的头像`}
            className="h-full w-full object-cover"
          />
        ) : (
          name.slice(0, 1)
        )}
      </div>
      <p className="mt-2 truncate text-sm font-medium text-ink">{name}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <SoftCard className="min-w-0 px-1 py-4 text-center shadow-none sm:px-2">
      <p className="text-base font-medium text-ink-muted">{value}</p>
      <p className="mt-1 break-words text-[10px] leading-4 text-ink-muted sm:text-[11px]">
        {label}
      </p>
    </SoftCard>
  );
}

function formatCount(count: number | null, error: unknown) {
  return error ? "—" : String(count ?? 0);
}

function differenceInDays(startValue: string, end: Date) {
  const start = new Date(startValue);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay),
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
