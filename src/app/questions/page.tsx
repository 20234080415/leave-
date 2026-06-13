"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";

export default function QuestionsPage() {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (answer.trim()) {
      setSubmitted(true);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="QUESTION 06"
        title="今天，想问你"
        description="答案不急着交换，先听听自己的心。"
      />

      <SoftCard className="relative overflow-hidden bg-[#fff9f7] px-6 py-9">
        <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-[#f4dedb]/70" />
        <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[#f7e9df]/80" />
        <span className="relative text-3xl text-rose">“</span>
        <h2 className="relative mt-3 text-[24px] font-medium leading-[1.65] tracking-[-0.02em] text-ink">
          最近有什么小事，
          <br />
          让你觉得生活很可爱？
        </h2>
        <div className="relative mt-7 flex items-center justify-between">
          <p className="text-sm text-ink-faint">2026.06.13</p>
          <span className="paper-label">第 6 题</span>
        </div>
      </SoftCard>

      {!submitted ? (
        <form
          className="mt-4 rounded-[28px] border border-dashed border-[#dec7c2] bg-white/45 p-5"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between">
            <label htmlFor="answer" className="text-sm font-medium text-ink">
              我的回答
            </label>
            <span className="text-xs text-ink-faint">{answer.length}/300</span>
          </div>
          <textarea
            id="answer"
            rows={6}
            maxLength={300}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="慢慢写，不用急着想好……"
            className="mt-3 w-full resize-none bg-transparent text-[16px] leading-7 text-ink outline-none placeholder:text-ink-faint"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4e8e4] text-xl text-rose-deep"
              aria-label="添加一张图片"
            >
              +
            </button>
            <button
              type="submit"
              disabled={!answer.trim()}
              className="soft-button flex-1 disabled:cursor-not-allowed disabled:bg-[#d8c9c5] disabled:shadow-none"
            >
              轻轻放在这里
            </button>
          </div>
        </form>
      ) : (
        <SoftCard className="mt-4 border border-[#f0e4e0] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f7e7e4] text-2xl text-rose-deep">
            ✓
          </div>
          <h2 className="mt-4 text-lg font-medium text-ink">答案已经留好了</h2>
          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-ink-muted">
            等待对方回答。等两个人都写下后，答案会一起出现。
          </p>
          <button
            type="button"
            className="mt-5 text-sm text-rose-deep"
            onClick={() => setSubmitted(false)}
          >
            修改我的回答
          </button>
        </SoftCard>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">之前的问题</h2>
          <button type="button" className="text-xs text-rose-deep">
            查看全部
          </button>
        </div>
        <div className="grid gap-3">
          <SoftCard className="py-4">
            <p className="text-xs text-ink-faint">昨天 · 已揭晓</p>
            <p className="mt-2 leading-7 text-ink">你最想和我重温哪一天？</p>
          </SoftCard>
          <SoftCard className="py-4">
            <p className="text-xs text-ink-faint">6月11日 · 已揭晓</p>
            <p className="mt-2 leading-7 text-ink">
              最近一次感到被理解，是什么时候？
            </p>
          </SoftCard>
        </div>
      </section>
    </>
  );
}
