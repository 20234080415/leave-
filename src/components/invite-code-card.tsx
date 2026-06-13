"use client";

import { useState } from "react";
import { SoftCard } from "@/components/soft-card";

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
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <SoftCard className="mt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">
            {hasPartner ? "我们的空间邀请码" : "邀请对方加入"}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            {hasPartner
              ? "邀请码仍可留作这个空间的纪念"
              : "把这串字符交给想一起记录的人"}
          </p>
        </div>
        <span className="paper-label shrink-0">
          {hasPartner ? "两人已到齐" : "还可加入 1 人"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f8f1ee] px-4 py-4">
        <span className="font-mono text-lg tracking-[0.24em] text-ink">
          {inviteCode}
        </span>
        <button
          type="button"
          className="rounded-full bg-white px-3 py-2 text-sm text-rose-deep shadow-sm"
          onClick={copyInviteCode}
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
    </SoftCard>
  );
}
