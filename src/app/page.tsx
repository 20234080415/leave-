import Link from "next/link";
import { SoftCard } from "@/components/soft-card";

export default function Home() {
  return (
    <>
      <header className="mb-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-rose-deep">
              2026 · 06 · 13
            </p>
            <h1 className="mt-3 text-[30px] font-medium tracking-[-0.04em] text-ink">
              在一起第 365 天
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              今天，也轻轻地记下吧。
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-xl text-rose-deep shadow-sm">
            ♡
          </div>
        </div>
      </header>

      <section className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <SoftCard className="min-h-36 bg-[#fff8f7]">
            <div className="flex items-center justify-between">
              <span className="text-2xl">☀</span>
              <span className="h-2 w-2 rounded-full bg-[#dba39e]" />
            </div>
            <p className="mt-4 text-sm text-ink-muted">我的今天</p>
            <p className="mt-1 font-medium leading-6 text-ink">还留着一小片空白</p>
            <Link
              href="/records"
              className="mt-3 inline-block text-xs text-rose-deep"
            >
              去写一点 →
            </Link>
          </SoftCard>
          <SoftCard className="min-h-36 bg-[#fffaf4]">
            <div className="flex items-center justify-between">
              <span className="text-2xl">☁</span>
              <span className="paper-label px-2 py-1">已留下</span>
            </div>
            <p className="mt-4 text-sm text-ink-muted">TA 的今天</p>
            <p className="mt-1 font-medium leading-6 text-ink">
              有一段话留在这里
            </p>
            <p className="mt-3 text-xs text-ink-faint">20:14</p>
          </SoftCard>
        </div>

        <Link href="/records" aria-label="查看今日最新记录">
          <SoftCard>
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d5b6ac] text-xs text-white">
                  白
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">小白</p>
                  <p className="text-[11px] text-ink-faint">今日最新记录</p>
                </div>
              </div>
              <span className="text-xs text-ink-faint">20:14</span>
          </div>
          <p className="mt-5 text-[17px] leading-8 text-ink">
            下班路上看见晚霞，像一封没有写完的信。想把这一刻留给你。
          </p>
            <div className="relative mt-5 h-36 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#eeb8a4] via-[#f3d4c4] to-[#aeb8c6]">
              <div className="absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-[#675d68]/35 to-transparent" />
              <div className="absolute right-8 top-5 h-10 w-10 rounded-full bg-[#fff4d4]/80 blur-[1px]" />
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-ink-muted">
              <span>☁ 多云</span>
              <span>·</span>
              <span>☺ 开心</span>
            </div>
        </SoftCard>
        </Link>

        <Link href="/questions" aria-label="回答今日问题">
          <SoftCard className="border border-white/70 bg-[#f7e9e7]">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.18em] text-rose-deep">
                今日问题
              </p>
              <span className="text-sm text-rose-deep">去回答 →</span>
            </div>
            <h2 className="mt-3 text-xl font-medium leading-8 text-ink">
              最近有什么小事，让你觉得生活很可爱？
            </h2>
            <p className="mt-4 text-sm text-ink-muted">
              答案会在两个人都写下后一起出现
            </p>
          </SoftCard>
        </Link>
      </section>
    </>
  );
}
