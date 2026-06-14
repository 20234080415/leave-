import { notFound, redirect } from "next/navigation";
import {
  WishDetail,
  type WishDetailData,
  type WishStep,
} from "@/components/wish-detail";
import { createClient } from "@/lib/supabase/server";
import { getSessionRefreshPath } from "@/lib/supabase/session";

type WishRow = {
  id: string;
  title: string;
  description: string | null;
  status: WishDetailData["status"];
  target_date: string | null;
  created_at: string;
  wish_steps: WishStep[];
};

export default async function WishDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims.sub) {
    redirect(getSessionRefreshPath(`/wishes/${encodeURIComponent(id)}`));
  }

  const { data, error } = await supabase
    .from("wishes")
    .select(
      "id, title, description, status, target_date, created_at, wish_steps(id, wish_id, content, is_done, order_index)",
    )
    .eq("id", id)
    .order("order_index", {
      referencedTable: "wish_steps",
      ascending: true,
    })
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const wish = data as WishRow;

  return (
    <WishDetail
      wish={{
        id: wish.id,
        title: wish.title,
        description: wish.description,
        status: wish.status,
        targetDate: wish.target_date,
        createdAt: wish.created_at,
        steps: wish.wish_steps ?? [],
      }}
    />
  );
}
