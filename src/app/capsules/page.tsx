import { redirect } from "next/navigation";
import {
  CapsulesView,
  type TimeCapsuleItem,
} from "@/components/capsules-view";
import { createClient } from "@/lib/supabase/server";
import { getSessionRefreshPath } from "@/lib/supabase/session";

type TimeCapsuleRow = {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  unlock_at: string;
  opened_at: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  nickname: string;
};

export default async function CapsulesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect(getSessionRefreshPath("/capsules"));
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
    .from("time_capsules")
    .select(
      "id, author_id, content, image_url, unlock_at, opened_at, created_at",
    )
    .eq("space_id", membership.space_id)
    .order("unlock_at", { ascending: true });

  const rows = (data ?? []) as TimeCapsuleRow[];
  const now = await getCurrentTime();
  const authorIds = [...new Set(rows.map((capsule) => capsule.author_id))];
  const unlockedImagePaths = rows
    .filter((capsule) => Date.parse(capsule.unlock_at) <= now)
    .map((capsule) => capsule.image_url)
    .filter((path): path is string => Boolean(path));

  const [profileResult, imageResult] = await Promise.all([
    authorIds.length
      ? supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", authorIds)
      : Promise.resolve({ data: [] }),
    unlockedImagePaths.length
      ? supabase.storage
          .from("time-capsule-images")
          .createSignedUrls(unlockedImagePaths, 60 * 60)
      : Promise.resolve({ data: [] }),
  ]);

  const profiles = new Map(
    ((profileResult.data ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile.nickname,
    ]),
  );
  const signedImages = new Map(
    (imageResult.data ?? []).map((image) => [image.path, image.signedUrl]),
  );

  const capsules: TimeCapsuleItem[] = rows.map((capsule) => {
    const isUnlocked = Date.parse(capsule.unlock_at) <= now;

    return {
      id: capsule.id,
      authorId: capsule.author_id,
      authorName: profiles.get(capsule.author_id) ?? "留白用户",
      content: isUnlocked ? capsule.content : null,
      imageUrl:
        isUnlocked && capsule.image_url
          ? signedImages.get(capsule.image_url) ?? null
          : null,
      unlockAt: capsule.unlock_at,
      openedAt: capsule.opened_at,
      createdAt: capsule.created_at,
    };
  });

  return (
    <CapsulesView
      capsules={capsules}
      userId={userId}
      spaceId={membership.space_id}
      loadError={
        error
          ? "时间胶囊还在准备中，请先应用最新的 Supabase migration。"
          : null
      }
    />
  );
}

async function getCurrentTime() {
  return Date.now();
}
