import { redirect } from "next/navigation";
import { RecordsView, type RecordItem } from "@/components/records-view";
import { createClient } from "@/lib/supabase/server";

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

export default async function RecordsPage() {
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
  const { data: profileData } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .in("id", authorIds)
    : { data: [] };

  const profiles = new Map(
    ((profileData ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  const records: RecordItem[] = await Promise.all(
    rows.map(async (record) => {
      const profile = profiles.get(record.author_id);
      let imageUrl: string | null = null;

      if (record.image_url) {
        const { data: signedImage } = await supabase.storage
          .from("record-images")
          .createSignedUrl(record.image_url, 60 * 60);
        imageUrl = signedImage?.signedUrl ?? null;
      }

      return {
        id: record.id,
        authorId: record.author_id,
        authorName: profile?.nickname ?? "留白用户",
        avatarUrl: profile?.avatar_url ?? null,
        content: record.content,
        mood: record.mood,
        weather: record.weather,
        imageUrl,
        visibility: record.visibility,
        createdAt: record.created_at,
      };
    }),
  );

  return (
    <RecordsView
      records={records}
      userId={userId}
      spaceId={membership.space_id}
      loadError={
        error
          ? "记录功能尚未部署，请先执行最新的 Supabase migration。"
          : null
      }
    />
  );
}
