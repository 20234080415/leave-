import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";

export default function Home() {
  return (
    <>
      <PageHeader
        eyebrow="留白 Leave"
        title="今天，也轻轻地记下吧"
        description="在一起的第 365 天"
      />

      <section className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <SoftCard className="min-h-32 bg-[#fff8f7]">
            <span className="text-2xl">☀</span>
            <p className="mt-4 text-sm text-ink-muted">我的今天</p>
            <p className="mt-1 font-medium text-ink">还留着一小片空白</p>
          </SoftCard>
          <SoftCard className="min-h-32 bg-[#fffaf4]">
            <span className="text-2xl">☁</span>
            <p className="mt-4 text-sm text-ink-muted">TA 的今天</p>
            <p className="mt-1 font-medium text-ink">有一段话留在这里</p>
          </SoftCard>
        </div>

        <SoftCard>
          <div className="flex items-center justify-between">
            <span className="paper-label">今日一页</span>
            <span className="text-xs text-ink-faint">20:14</span>
          </div>
          <p className="mt-5 text-[17px] leading-8 text-ink">
            下班路上看见晚霞，像一封没有写完的信。想把这一刻留给你。
          </p>
          <div className="mt-5 h-32 rounded-[20px] bg-gradient-to-br from-[#f7d9d4] via-[#f8e9dc] to-[#efe4df]" />
        </SoftCard>

        <SoftCard className="border border-white/70 bg-[#f7e9e7]">
          <p className="text-xs tracking-[0.18em] text-rose-deep">今日问题</p>
          <h2 className="mt-3 text-xl font-medium leading-8 text-ink">
            最近有什么小事，让你觉得生活很可爱？
          </h2>
          <p className="mt-4 text-sm text-ink-muted">
            答案会在两个人都写下后一起出现
          </p>
        </SoftCard>
      </section>
    </>
  );
}
