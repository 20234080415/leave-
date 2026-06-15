import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExportPdfButton } from "@/components/memory-book/export-pdf-button";
import { MemoryBookChapter } from "@/components/memory-book/memory-book-chapter";
import { MemoryBookCover } from "@/components/memory-book/memory-book-cover";
import { MemoryBookSummary } from "@/components/memory-book/memory-book-summary";
import type {
  MemoryBookChapterData,
  MemoryBookRecord,
  MemoryBookWish,
} from "@/components/memory-book/types";
import { createClient } from "@/lib/supabase/server";
import { getSessionRefreshPath } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "回忆书",
  description: "把一起走过的日子，装订成一本书。",
};

type RecordRow = {
  id: string;
  author_id: string;
  content: string;
  mood: string | null;
  weather: string | null;
  image_url: string | null;
  created_at: string;
};

type WishRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_date: string | null;
  created_at: string;
  wish_steps: {
    id: string;
    content: string;
    is_done: boolean;
    order_index: number;
  }[];
};

type ProfileRow = {
  id: string;
  nickname: string;
};

const seasons: {
  id: MemoryBookChapterData["id"];
  title: string;
  subtitle: string;
  months: readonly number[];
}[] = [
  {
    id: "spring",
    title: "春天",
    subtitle: "三月到五月，风开始变得柔软。",
    months: [3, 4, 5],
  },
  {
    id: "summer",
    title: "夏天",
    subtitle: "六月到八月，把明亮的日子收进书里。",
    months: [6, 7, 8],
  },
  {
    id: "autumn",
    title: "秋天",
    subtitle: "九月到十一月，适合记住靠近的温度。",
    months: [9, 10, 11],
  },
  {
    id: "winter",
    title: "冬天",
    subtitle: "十二月到二月，在安静里继续陪伴。",
    months: [12, 1, 2],
  },
];

export default async function MemoryBookPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect(getSessionRefreshPath("/memory-book"));
  }

  const { data: membership } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const year = getShanghaiYear(new Date());
  const yearStart = new Date(`${year}-01-01T00:00:00+08:00`).toISOString();
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00+08:00`).toISOString();
  const [
    { data: space },
    { data: memberRows },
    { data: recordRows },
    { data: wishRows },
  ] = await Promise.all([
    supabase
      .from("spaces")
      .select("id, name, created_at")
      .eq("id", membership.space_id)
      .single(),
    supabase
      .from("space_members")
      .select("user_id, joined_at")
      .eq("space_id", membership.space_id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("daily_records")
      .select(
        "id, author_id, content, mood, weather, image_url, created_at",
      )
      .eq("space_id", membership.space_id)
      .gte("created_at", yearStart)
      .lt("created_at", yearEnd)
      .order("created_at", { ascending: true }),
    supabase
      .from("wishes")
      .select(
        "id, title, description, status, target_date, created_at, wish_steps(id, content, is_done, order_index)",
      )
      .eq("space_id", membership.space_id)
      .order("created_at", { ascending: true }),
  ]);

  if (!space) {
    redirect("/onboarding");
  }

  const members = memberRows ?? [];
  const memberIds = members.map((member) => member.user_id);
  const records = (recordRows ?? []) as RecordRow[];
  const wishes = (wishRows ?? []) as WishRow[];
  const imagePaths = records
    .map((record) => record.image_url)
    .filter((path): path is string => Boolean(path));
  const [profileResult, signedImageResult] = await Promise.all([
    memberIds.length
      ? supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", memberIds)
      : Promise.resolve({ data: [] }),
    imagePaths.length
      ? supabase.storage
          .from("record-images")
          .createSignedUrls(imagePaths, 60 * 60)
      : Promise.resolve({ data: [] }),
  ]);
  const profiles = new Map(
    ((profileResult.data ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile.nickname,
    ]),
  );
  const signedImages = new Map(
    (signedImageResult.data ?? []).map((image) => [
      image.path,
      image.signedUrl,
    ]),
  );
  const memoryRecords: MemoryBookRecord[] = records.map((record) => ({
    id: record.id,
    authorName: profiles.get(record.author_id) ?? "留白用户",
    content: record.content,
    mood: record.mood,
    weather: record.weather,
    imageUrl: record.image_url
      ? signedImages.get(record.image_url) ?? null
      : null,
    createdAt: record.created_at,
  }));
  const completedWishes: MemoryBookWish[] = wishes
    .filter((wish) => wish.status === "已完成")
    .map((wish) => ({
      id: wish.id,
      title: wish.title,
      description: wish.description,
      date: wish.target_date
        ? `${wish.target_date}T12:00:00+08:00`
        : wish.created_at,
      steps: [...wish.wish_steps]
        .sort((left, right) => left.order_index - right.order_index)
        .map((step) => ({
          id: step.id,
          content: step.content,
          isDone: step.is_done,
        })),
    }));
  const chapters: MemoryBookChapterData[] = seasons.map((season) => {
    const seasonalRecords = memoryRecords.filter((record) =>
      season.months.includes(getShanghaiMonth(record.createdAt)),
    );
    const seasonalWishes = completedWishes.filter((wish) =>
      season.months.includes(getShanghaiMonth(wish.date)),
    );

    return {
      id: season.id,
      title: season.title,
      subtitle: season.subtitle,
      records: seasonalRecords,
      wishes: seasonalWishes,
      photos: seasonalRecords
        .filter(
          (record): record is MemoryBookRecord & { imageUrl: string } =>
            Boolean(record.imageUrl),
        )
        .map((record) => ({
          id: record.id,
          url: record.imageUrl,
          caption: `${formatDate(record.createdAt)} 的照片`,
        })),
    };
  });
  const photoCount = memoryRecords.filter((record) => record.imageUrl).length;
  const coverImageUrl =
    [...memoryRecords].reverse().find((record) => record.imageUrl)?.imageUrl ??
    null;
  const daysTogether = differenceInDays(space.created_at, new Date()) + 1;
  const memberNames = memberIds
    .map((id) => profiles.get(id))
    .filter((name): name is string => Boolean(name));
  const hasEnoughMemories =
    memoryRecords.length > 0 || completedWishes.length > 0 || photoCount > 0;

  return (
    <div className="memory-book-page">
      <header
        data-export-hide
        className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <Link href="/us" className="text-xs text-rose-deep">
            ← 回到我们
          </Link>
          <h1 className="mt-4 text-[30px] font-medium tracking-[-0.04em] text-ink">
            回忆书
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            把一起走过的日子，装订成一本书。
          </p>
        </div>
        <ExportPdfButton year={year} />
      </header>

      <main id="memory-book-content" className="grid gap-8">
        <MemoryBookCover
          year={year}
          spaceName={space.name}
          createdAt={space.created_at}
          daysTogether={daysTogether}
          recordCount={memoryRecords.length}
          wishCount={wishes.length}
          photoCount={photoCount}
          coverImageUrl={coverImageUrl}
          memberNames={memberNames}
        />

        {hasEnoughMemories ? (
          chapters.map((chapter, index) => (
            <MemoryBookChapter
              key={chapter.id}
              chapter={chapter}
              chapterNumber={index + 1}
            />
          ))
        ) : (
          <section
            data-memory-book-page
            className="memory-book-paper flex min-h-[620px] items-center justify-center rounded-[30px] bg-[#fffdfb] p-8 text-center shadow-[0_22px_60px_rgb(101_68_61_/_9%)]"
          >
            <div>
              <span className="text-4xl text-rose">♡</span>
              <h2 className="mt-5 text-2xl font-medium text-ink">
                还没有足够的回忆。
              </h2>
              <p className="mt-3 text-base leading-8 text-ink-muted">
                先慢慢写下今天吧。
              </p>
              <Link href="/records?compose=1" className="soft-button mt-7">
                写下今天
              </Link>
            </div>
          </section>
        )}

        <MemoryBookSummary
          year={year}
          recordCount={memoryRecords.length}
          wishCount={wishes.length}
          photoCount={photoCount}
          daysTogether={daysTogether}
          memberNames={memberNames}
        />
      </main>
    </div>
  );
}

function getShanghaiYear(value: Date) {
  return Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
    }).format(value),
  );
}

function getShanghaiMonth(value: string) {
  return Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Shanghai",
      month: "numeric",
    }).format(new Date(value)),
  );
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
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
