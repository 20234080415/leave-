import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(withStatus(origin, next, "confirmed"));
    }

    // Mail apps often open the link outside the browser that started PKCE.
    return NextResponse.redirect(
      `${origin}/auth?confirmed=1&handoff=1`,
    );
  }

  return NextResponse.redirect(`${origin}/auth?error=confirmation`);
}

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/onboarding";
}

function withStatus(origin: string, pathname: string, status: string) {
  const url = new URL(pathname, origin);
  url.searchParams.set(status, "1");
  return url;
}
