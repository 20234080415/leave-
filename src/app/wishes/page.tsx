"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SheetModal } from "@/components/sheet-modal";
import { SoftCard } from "@/components/soft-card";

type Wish = {
  id: number;
  title: string;
  status: "想想中" | "准备中" | "进行中" | "已完成";
  completedSteps: number;
  totalSteps: number;
  targetDate?: string;
};

const initialWishes: Wish[] = [
  {
    id: 1,
    title: "一起去海边看一次日出",
    status: "准备中",
    completedSteps: 2,
    totalSteps: 3,
    targetDate: "今年秋天",
  },
  {
    id: 2,
    title: "做一本属于我们的相册",
    status: "进行中",
    completedSteps: 2,
    totalSteps: 5,
  },
  {
    id: 3,
    title: "学会一道对方喜欢的菜",
    status: "想想中",
    completedSteps: 0,
    totalSteps: 3,
  },
  {
    id: 4,
    title: "在陌生城市散步一整天",
    status: "已完成",
    completedSteps: 4,
    totalSteps: 4,
    targetDate: "2026.05.20",
  },
];

export default function WishesPage() {
  const [wishes, setWishes] = useState(initialWishes);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    setWishes((current) => [
      {
        id: Date.now(),
        title: title.trim(),
        status: "想想中",
        completedSteps: 0,
        totalSteps: 3,
        targetDate: targetDate || undefined,
      },
      ...current,
    ]);
    setTitle("");
    setDescription("");
    setTargetDate("");
    setIsOpen(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="SOMEDAY"
        title="想一起完成的事"
        description="愿望不设期限，想起来时就向前一点。"
        action={
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-deep text-2xl font-light text-white shadow-[0_8px_20px_rgb(169_104_101_/_22%)]"
            aria-label="新建愿望"
            onClick={() => setIsOpen(true)}
          >
            +
          </button>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {["全部 12", "想想中", "进行中", "已完成"].map((filter, index) => (
          <button
            key={filter}
            type="button"
            className="choice-chip shrink-0"
            data-selected={index === 0}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="grid gap-4">
        {wishes.map((wish, index) => {
          const progress = Math.round(
            (wish.completedSteps / wish.totalSteps) * 100,
          );

          return (
            <SoftCard key={wish.id}>
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7e8e5] text-lg text-rose-deep">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-medium leading-6 text-ink">
                      {wish.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-[#f7e9e6] px-2.5 py-1 text-[11px] text-rose-deep">
                      {wish.status}
                    </span>
                  </div>
                  {wish.targetDate ? (
                    <p className="mt-2 text-xs text-ink-faint">
                      {wish.targetDate}
                    </p>
                  ) : null}
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#efe6e3]">
                    <div
                      className="h-full rounded-full bg-[#dba39e]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
                    <span>
                      {wish.completedSteps}/{wish.totalSteps} 个步骤
                    </span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            </SoftCard>
          );
        })}
      </section>

      <SheetModal
        open={isOpen}
        title="新建一个愿望"
        description="先记下想法，什么时候出发都可以。"
        onClose={() => setIsOpen(false)}
      >
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="wish-title" className="field-label">
              愿望标题
            </label>
            <input
              id="wish-title"
              className="text-field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：一起去海边看日出"
            />
          </div>
          <div>
            <label htmlFor="wish-description" className="field-label">
              想补充的话
            </label>
            <textarea
              id="wish-description"
              className="text-field min-h-24 resize-none leading-7"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="为什么想一起完成这件事？"
            />
          </div>
          <div>
            <label htmlFor="wish-date" className="field-label">
              期待的日期
              <span className="ml-2 font-normal text-ink-faint">选填</span>
            </label>
            <input
              id="wish-date"
              type="date"
              className="text-field"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </div>
          <div>
            <span className="field-label">愿望封面</span>
            <div className="flex min-h-24 items-center justify-center rounded-[20px] border border-dashed border-[#dfc8c3] bg-[#faf3f0] text-center">
              <div>
                <p className="text-sm text-ink-muted">封面图位置</p>
                <p className="mt-1 text-xs text-ink-faint">
                  完成卡片功能将在后续版本加入
                </p>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={!title.trim()}
            className="soft-button w-full disabled:cursor-not-allowed disabled:bg-[#d8c9c5] disabled:shadow-none"
          >
            收进愿望清单
          </button>
        </form>
      </SheetModal>
    </>
  );
}
