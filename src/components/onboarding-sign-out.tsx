"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { createClient } from "@/lib/supabase/client";

export function OnboardingSignOut() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("暂时没有退出成功，请稍后再试。");
      setPending(false);
      setOpen(false);
      return;
    }

    router.replace("/auth");
    router.refresh();
  }

  return (
    <>
      <div className="mt-7 text-center">
        <button
          type="button"
          className="text-sm text-ink-faint hover:text-ink-muted"
          onClick={() => setOpen(true)}
        >
          退出当前账号
        </button>
        {error ? (
          <p className="mt-3 text-sm text-[#a25550]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={open}
        title="要先离开一会儿吗？"
        description="退出不会改变已经留在这里的内容。"
        confirmLabel="退出登录"
        cancelLabel="留在这里"
        pending={pending}
        onClose={() => setOpen(false)}
        onConfirm={() => void signOut()}
      />
    </>
  );
}
