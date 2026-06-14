import { redirect } from "next/navigation";
import { RecordsView, type RecordItem } from "@/components/records-view";
import { createClient } from "@/lib/supabase/server";
import { getSessionRefreshPath } from "@/lib/supabase/session";

type DailyRecordRow = {
  id: string;
  author_id: string;
  content: string;
  mood: string | null;
  weather: string | null;
  image_url: string | null;
  visibility: "shared" | "private";
  created_at: string;
};

type ProfileRow = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string }>;
}) {
  const { compose } = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect(
      getSessionRefreshPath(compose === "1" ? "/records?compose=1" : "/records"),
    );
  }

  const { data: membership } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data, error } = await supabase
    .from("daily_records")
    .select(
      "id, author_id, content, mood, weather, image_url, visibility, created_at",
    )
    .eq("space_id", membership.space_id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as DailyRecordRow[];
  const authorIds = [...new Set(rows.map((record) => record.author_id))];
  const imagePaths = rows
    .map((record) => record.image_url)
    .filter((path): path is string => Boolean(path));
  const [profileResult, signedImageResult] = await Promise.all([
    authorIds.length
      ? supabase
          .from("profiles")
          .select("id, nickname, avatar_url")
          .in("id", authorIds)
      : Promise.resolve({ data: [] }),
    imagePaths.length
      ? supabase.storage
          .from("record-images")
          .createSignedUrls(imagePaths, 60 * 60)
      : Promise.resolve({ data: [] }),
  ]);
  const profileData = profileResult.data;
  const signedImages = new Map(
    (signedImageResult.data ?? []).map((image) => [
      image.path,
      image.signedUrl,
    ]),
  );

  const profiles = new Map(
    ((profileData ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  const records: RecordItem[] = rows.map((record) => {
      const profile = profiles.get(record.author_id);

      return {
        id: record.id,
        authorId: record.author_id,
        authorName: profile?.nickname ?? "留白用户",
        avatarUrl: profile?.avatar_url ?? null,
        content: record.content,
        mood: record.mood,
        weather: record.weather,
        imageUrl: record.image_url
          ? signedImages.get(record.image_url) ?? null
          : null,
        imagePath: record.image_url,
        visibility: record.visibility,
        createdAt: record.created_at,
      };
    });

  return (
    <RecordsView
      records={records}
      userId={userId}
      spaceId={membership.space_id}
      initialComposerOpen={compose === "1"}
      loadError={
        error
          ? "记录功能尚未部署，请先执行最新的 Supabase migration。"
          : null
      }
    />
  );
}
