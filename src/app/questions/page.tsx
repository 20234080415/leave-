import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";

export default function QuestionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="QUESTION 06"
        title="今天，想问你"
        description="答案不急着交换，先听听自己的心。"
      />

      <SoftCard className="relative overflow-hidden bg-[#fff9f7] px-6 py-9">
        <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-[#f4dedb]/70" />
        <span className="relative text-3xl text-rose">“</span>
        <h2 className="relative mt-3 text-[24px] font-medium leading-[1.65] tracking-[-0.02em] text-ink">
          最近有什么小事，
          <br />
          让你觉得生活很可爱？
        </h2>
        <p className="relative mt-7 text-sm text-ink-faint">2026.06.13</p>
      </SoftCard>

      <div className="mt-4 rounded-[28px] border border-dashed border-[#dec7c2] bg-white/45 p-5">
        <label htmlFor="answer" className="text-sm font-medium text-ink">
          我的回答
        </label>
        <textarea
          id="answer"
          rows={5}
          placeholder="慢慢写，不用急着想好……"
          className="mt-3 w-full resize-none bg-transparent text-[16px] leading-7 text-ink outline-none placeholder:text-ink-faint"
        />
        <button className="mt-3 w-full rounded-2xl bg-[#e8bbb6] py-3.5 text-sm font-medium text-white">
          轻轻放在这里
        </button>
      </div>
    </>
  );
}
