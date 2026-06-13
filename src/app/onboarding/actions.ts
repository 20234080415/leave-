"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SpaceActionState = {
  error?: string;
};

export async function createSpace(
  _previousState: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    return { error: "登录状态已失效，请重新登录。" };
  }

  const { error } = await supabase.rpc("create_space", {
    space_name: name || "我们的留白",
  });

  if (error) {
    return { error: getSpaceErrorMessage(error.message) };
  }

  redirect("/");
}

export async function joinSpace(
  _previousState: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  const inviteCode = String(formData.get("inviteCode") ?? "")
    .trim()
    .toUpperCase();

  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(inviteCode)) {
    return { error: "请输入正确的 6 位邀请码。" };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims.sub) {
    return { error: "登录状态已失效，请重新登录。" };
  }

  const { error } = await supabase.rpc("join_space", {
    invite_code_input: inviteCode,
  });

  if (error) {
    return { error: getSpaceErrorMessage(error.message) };
  }

  redirect("/");
}

function getSpaceErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already belong")) {
    return "你已经加入了一个空间。";
  }

  if (normalized.includes("not found") || normalized.includes("invalid invite")) {
    return "没有找到这个邀请码，请和对方确认后再试。";
  }

  if (normalized.includes("already has two members")) {
    return "这个空间已经有两个人了。";
  }

  if (
    normalized.includes("create_space") ||
    normalized.includes("join_space") ||
    normalized.includes("schema cache")
  ) {
    return "空间功能尚未部署，请先执行最新的 Supabase migration。";
  }

  return "暂时没有连接成功，请稍后再试。";
}
