"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";

const inviteCode = "LEAVE6";

export default function UsPage() {
  const [copied, setCopied] = useState(false);

  async function copyInviteCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <PageHeader
        eyebrow="US, TOGETHER"
        title="关于我们"
        description="两个人的小小空间，只收藏彼此的日常。"
      />

      <SoftCard className="relative overflow-hidden bg-gradient-to-br from-[#f8e4e1] to-[#fff8f3] py-8 text-center">
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/35" />
        <div className="flex items-center justify-center">
          <ProfileAvatar initial="留" color="#dba9a4" name="小留" />
          <span className="-mx-2 mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-deep shadow-sm">
            ♡
          </span>
          <ProfileAvatar initial="白" color="#cbb1a7" name="小白" />
        </div>
        <p className="mt-6 text-sm text-ink-muted">我们从 2025.06.14 开始</p>
        <p className="mt-2 text-2xl font-medium text-ink">一起走过 365 天</p>
      </SoftCard>

      <SoftCard className="mt-4 text-center">
        <p className="text-xs tracking-[0.16em] text-rose-deep">NEXT DAY</p>
        <h2 className="mt-3 text-lg font-medium text-ink">相识一周年纪念日</h2>
        <div className="mt-5 flex items-end justify-center gap-2">
          <span className="text-5xl font-medium tracking-[-0.05em] text-rose-deep">
            28
          </span>
          <span className="pb-1 text-sm text-ink-muted">天后</span>
        </div>
        <p className="mt-3 text-xs text-ink-faint">2026年7月11日 · 星期六</p>
      </SoftCard>

      <section className="mt-4 grid grid-cols-3 gap-3">
        <StatCard value="42" label="共同记录" />
        <StatCard value="12" label="共同愿望" />
        <StatCard value="18" label="回答问题" />
      </section>

      <SoftCard className="mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">邀请对方加入</p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              邀请码用于加入这个双人空间
            </p>
          </div>
          <span className="paper-label shrink-0">仅限 1 人</span>
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
        <p className="mt-3 text-center text-xs text-ink-faint">
          这串字符只需要轻轻交给对方
        </p>
      </SoftCard>
    </>
  );
}

type ProfileAvatarProps = {
  initial: string;
  color: string;
  name: string;
};

function ProfileAvatar({ initial, color, name }: ProfileAvatarProps) {
  return (
    <div className="relative z-10">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-xl text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>
      <p className="mt-2 text-sm font-medium text-ink">{name}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <SoftCard className="px-2 py-4 text-center">
      <p className="text-xl font-medium text-rose-deep">{value}</p>
      <p className="mt-1 text-[11px] text-ink-muted">{label}</p>
    </SoftCard>
  );
}
