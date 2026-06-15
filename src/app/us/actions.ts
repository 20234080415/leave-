"use server";

import { createClient } from "@/lib/supabase/server";

export async function markInviteShared() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims.sub) {
    return;
  }

  await supabase.rpc("mark_invite_shared");
}
