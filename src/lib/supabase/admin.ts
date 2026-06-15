import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Leave Admin is only available in development.");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "缺少 SUPABASE_SERVICE_ROLE_KEY，请仅在本地 .env.local 中配置。",
    );
  }

  const { url } = getSupabaseConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
