import { redirect } from "next/navigation";
import { WishesView, type WishListItem } from "@/components/wishes-view";
import { createClient } from "@/lib/supabase/server";
import { getSessionRefreshPath } from "@/lib/supabase/session";

type WishRow = {
  id: string;
  title: string;
  description: string | null;
  status: WishListItem["status"];
  target_date: string | null;
  created_at: string;
  wish_steps: {
    id: string;
    content: string;
    is_done: boolean;
    order_index: number;
  }[];
};

export default async function WishesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect(getSessionRefreshPath("/wishes"));
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
    .from("wishes")
    .select(
      "id, title, description, status, target_date, created_at, wish_steps(id, content, is_done, order_index)",
    )
    .eq("space_id", membership.space_id)
    .order("created_at", { ascending: false });

  const wishes: WishListItem[] = ((data ?? []) as WishRow[]).map((wish) => ({
    id: wish.id,
    title: wish.title,
    description: wish.description,
    status: wish.status,
    targetDate: wish.target_date,
    completedSteps: wish.wish_steps.filter((step) => step.is_done).length,
    totalSteps: wish.wish_steps.length,
    steps: [...wish.wish_steps]
      .sort((a, b) => a.order_index - b.order_index)
      .map((step) => ({
        id: step.id,
        content: step.content,
        isDone: step.is_done,
        orderIndex: step.order_index,
      })),
  }));

  return (
    <WishesView
      wishes={wishes}
      spaceId={membership.space_id}
      loadError={
        error
          ? "愿望清单尚未部署，请先执行最新的 Supabase migration。"
          : null
      }
    />
  );
}
