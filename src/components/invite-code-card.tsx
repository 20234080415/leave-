"use client";

import { useState } from "react";
import { SoftCard } from "@/components/soft-card";
import { markInviteShared } from "@/app/us/actions";

export function InviteCodeCard({
  inviteCode,
  hasPartner,
}: {
  inviteCode: string;
  hasPartner: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyInviteCode() {
    await navigator.clipboard.writeText(inviteCode);
    void markInviteShared().catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <SoftCard className="mt-4">
      <p className="text-sm leading-6 text-ink-muted">
        {hasPartner
          ? "这串字符也留在这里，像你们相遇时的一枚小小书签。"
          : "把这串字符交给想一起记录的人。"}
      </p>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f8f1ee] px-4 py-4">
        <span className="font-mono text-lg tracking-[0.24em] text-ink">
          {inviteCode}
        </span>
        <button
          type="button"
          className="rounded-full bg-white px-3 py-2 text-sm text-rose-deep shadow-sm transition hover:bg-[#fff8f5] hover:shadow-md active:scale-95"
          onClick={copyInviteCode}
        >
          {copied ? "收好了" : "复制"}
        </button>
      </div>
      <p
        className={`mt-3 text-center text-xs text-rose-deep transition ${
          copied ? "opacity-100" : "opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        邀请已经放进剪贴板啦。
      </p>
    </SoftCard>
  );
}
