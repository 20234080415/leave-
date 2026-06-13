import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";

export default function UsPage() {
  return (
    <>
      <PageHeader
        eyebrow="US, TOGETHER"
        title="关于我们"
        description="两个人的小小空间，只收藏彼此的日常。"
      />

      <SoftCard className="bg-gradient-to-br from-[#f8e4e1] to-[#fff8f3] py-8 text-center">
        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#dba9a4] text-xl text-white shadow-sm">
            留
          </div>
          <span className="-mx-2 mt-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-deep shadow-sm">
            ♡
          </span>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#cbb1a7] text-xl text-white shadow-sm">
            白
          </div>
        </div>
        <p className="mt-5 text-lg font-medium text-ink">小留 & 小白</p>
        <p className="mt-1 text-sm text-ink-muted">一起走过 365 天</p>
      </SoftCard>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <SoftCard className="text-center">
          <p className="text-xs text-ink-faint">下一个纪念日</p>
          <p className="mt-3 text-2xl font-medium text-rose-deep">28</p>
          <p className="mt-1 text-xs text-ink-muted">天后</p>
        </SoftCard>
        <SoftCard className="text-center">
          <p className="text-xs text-ink-faint">共同愿望</p>
          <p className="mt-3 text-2xl font-medium text-rose-deep">12</p>
          <p className="mt-1 text-xs text-ink-muted">件小事</p>
        </SoftCard>
      </section>

      <SoftCard className="mt-4">
        <p className="text-sm text-ink-muted">我们的空间邀请码</p>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#f8f1ee] px-4 py-3">
          <span className="font-mono text-lg tracking-[0.24em] text-ink">
            LEAVE6
          </span>
          <button className="text-sm text-rose-deep">复制</button>
        </div>
      </SoftCard>
    </>
  );
}
