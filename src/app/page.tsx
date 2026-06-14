import Link from "next/link";
import { redirect } from "next/navigation";
import { SoftCard } from "@/components/soft-card";
import {
  getDailyQuestionIndex,
  getQuestionDateKey,
} from "@/lib/daily-question";
import { createClient } from "@/lib/supabase/server";

type HomeRecord = {
  id: string;
  author_id: string;
  content: string;
  mood: string | null;
  weather: string | null;
  image_url: string | null;
  created_at: string;
};

type HomeProfile = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export default async function Home() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect("/auth");
  }

  const { data: membership } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const today = new Date();
  const questionDateKey = getQuestionDateKey(today);
  const todayStart = new Date(`${questionDateKey}T00:00:00+08:00`);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const [
    { data: space },
    { data: memberRows },
    { data: todayRecordRows },
    { count: questionCount },
  ] = await Promise.all([
    supabase
      .from("spaces")
      .select("created_at")
      .eq("id", membership.space_id)
      .single(),
    supabase
      .from("space_members")
      .select("user_id")
      .eq("space_id", membership.space_id),
    supabase
      .from("daily_records")
      .select(
        "id, author_id, content, mood, weather, image_url, created_at",
      )
      .eq("space_id", membership.space_id)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("question_bank")
      .select("question_index", { count: "exact", head: true }),
  ]);

  const memberIds = memberRows?.map((member) => member.user_id) ?? [];
  const { data: profileRows } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .in("id", memberIds)
    : { data: [] };
  const profiles = new Map(
    ((profileRows ?? []) as HomeProfile[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );
  const records = (todayRecordRows ?? []) as HomeRecord[];
  const myRecord = records.find((record) => record.author_id === userId);
  const partnerId = memberIds.find((id) => id !== userId);
  const partnerRecord = partnerId
    ? records.find((record) => record.author_id === partnerId)
    : undefined;
  const latestRecord = records[0];
  const latestProfile = latestRecord
    ? profiles.get(latestRecord.author_id)
    : undefined;
  let latestImageUrl: string | null = null;

  if (latestRecord?.image_url) {
    const { data: signedImage } = await supabase.storage
      .from("record-images")
      .createSignedUrl(latestRecord.image_url, 60 * 60);
    latestImageUrl = signedImage?.signedUrl ?? null;
  }

  let question: string | null = null;
  let currentUserAnswered = false;

  if (questionCount) {
    const questionIndex = getDailyQuestionIndex(questionCount, today);
    const [{ data: questionRow }, { data: statusRows }] = await Promise.all([
      supabase
        .from("question_bank")
        .select("question")
        .eq("question_index", questionIndex)
        .single(),
      supabase.rpc("get_question_answer_status", {
        target_question_index: questionIndex,
      }),
    ]);
    question = questionRow?.question ?? null;
    currentUserAnswered = statusRows?.[0]?.current_user_answered ?? false;
  }

  const daysTogether = space
    ? differenceInDays(space.created_at, today) + 1
    : null;

  return (
    <>
      <header className="mb-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-rose-deep">
              {formatToday(today)}
            </p>
            <h1 className="mt-3 text-[30px] font-medium tracking-[-0.04em] text-ink">
              {daysTogether ? `在一起第 ${daysTogether} 天` : "今天也在这里"}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              有想留下的，就写一点。
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-xl text-rose-deep shadow-sm">
            ♡
          </div>
        </div>
      </header>

      <section className="grid gap-4">
        <Link
          href="/records?compose=1"
          className="group flex min-h-[72px] items-center justify-between rounded-[24px] bg-rose-deep px-5 text-white shadow-[0_14px_32px_rgb(169_104_101_/_24%)] transition active:scale-[0.985] active:shadow-[0_8px_20px_rgb(169_104_101_/_18%)]"
          aria-label="写下今天"
        >
          <div>
            <p className="text-lg font-medium">写下今天</p>
            <p className="mt-1 text-xs text-white/70">
              一句话，也可以好好留住此刻
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl transition group-active:translate-x-0.5">
            →
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <TodaySummaryCard
            label="我的今天"
            record={myRecord}
            emptyText="还留着一小片空白"
            composeLink
          />
          <TodaySummaryCard
            label="TA 的今天"
            record={partnerRecord}
            emptyText={
              partnerId ? "今天还没有留下记录" : "这里还留着一个位置"
            }
          />
        </div>

        {latestRecord ? (
          <Link href="/records" aria-label="查看今日最新记录">
            <SoftCard>
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar profile={latestProfile} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {latestProfile?.nickname ?? "留白用户"}
                    </p>
                    <p className="text-[11px] text-ink-faint">今日最新记录</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-ink-faint">
                  {formatTime(latestRecord.created_at)}
                </span>
              </div>
              <p className="mt-5 line-clamp-4 whitespace-pre-wrap text-[17px] leading-8 text-ink">
                {latestRecord.content}
              </p>
              {latestImageUrl ? (
                <div className="mt-5 h-36 overflow-hidden rounded-[20px] bg-[#f3e9e5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={latestImageUrl}
                    alt="今日最新记录中的图片"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              {latestRecord.weather || latestRecord.mood ? (
                <div className="mt-4 flex items-center gap-3 text-xs text-ink-muted">
                  {latestRecord.weather ? (
                    <span>☁ {latestRecord.weather}</span>
                  ) : null}
                  {latestRecord.weather && latestRecord.mood ? <span>·</span> : null}
                  {latestRecord.mood ? <span>☺ {latestRecord.mood}</span> : null}
                </div>
              ) : null}
            </SoftCard>
          </Link>
        ) : (
          <SoftCard className="text-center">
            <p className="text-sm font-medium text-ink">今天还没有新的记录</p>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              页面会在有人写下内容后，显示今天最新的一条。
            </p>
          </SoftCard>
        )}

        <Link href="/questions" aria-label="查看今日问题">
          <SoftCard className="border border-white/70 bg-[#f7e9e7]">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.18em] text-rose-deep">
                今日问题
              </p>
              <span className="text-sm text-rose-deep">
                {currentUserAnswered ? "已经回答 →" : "去回答 →"}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-medium leading-8 text-ink">
              {question ?? "今天的问题还没有准备好。"}
            </h2>
            <p className="mt-4 text-sm text-ink-muted">
              {currentUserAnswered
                ? "你的答案已经安静收好"
                : "答案会在两个人都写下后一起出现"}
            </p>
          </SoftCard>
        </Link>
      </section>
    </>
  );
}

function TodaySummaryCard({
  label,
  record,
  emptyText,
  composeLink = false,
}: {
  label: string;
  record?: HomeRecord;
  emptyText: string;
  composeLink?: boolean;
}) {
  return (
    <SoftCard className="min-h-36 bg-[#fff8f7]">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{record ? "☀" : "○"}</span>
        {record ? (
          <span className="paper-label px-2 py-1">已留下</span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-[#dba39e]" />
        )}
      </div>
      <p className="mt-4 text-sm text-ink-muted">{label}</p>
      <p className="mt-1 line-clamp-2 font-medium leading-6 text-ink">
        {record ? record.content : emptyText}
      </p>
      {record ? (
        <p className="mt-3 text-xs text-ink-faint">
          {formatTime(record.created_at)}
        </p>
      ) : composeLink ? (
        <Link
          href="/records?compose=1"
          className="mt-3 inline-block text-xs text-rose-deep"
        >
          写一点 →
        </Link>
      ) : null}
    </SoftCard>
  );
}

function Avatar({ profile }: { profile?: HomeProfile }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d5b6ac] text-xs text-white">
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={`${profile.nickname}的头像`}
          className="h-full w-full object-cover"
        />
      ) : (
        (profile?.nickname ?? "留").slice(0, 1)
      )}
    </span>
  );
}

function formatToday(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(value)
    .replaceAll("/", " · ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function differenceInDays(startValue: string, end: Date) {
  const startKey = getQuestionDateKey(new Date(startValue));
  const endKey = getQuestionDateKey(end);
  const start = Date.parse(`${startKey}T00:00:00Z`);
  const finish = Date.parse(`${endKey}T00:00:00Z`);

  return Math.max(0, Math.floor((finish - start) / (24 * 60 * 60 * 1000)));
}
