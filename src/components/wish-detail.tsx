"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SoftCard } from "@/components/soft-card";
import { createClient } from "@/lib/supabase/client";
import type { WishStatus } from "@/components/wishes-view";

export type WishStep = {
  id: string;
  wish_id: string;
  content: string;
  is_done: boolean;
  order_index: number;
};

export type WishDetailData = {
  id: string;
  title: string;
  description: string | null;
  status: WishStatus;
  targetDate: string | null;
  createdAt: string;
  steps: WishStep[];
};

const statuses: WishStatus[] = ["想想中", "准备中", "进行中", "已完成"];

export function WishDetail({ wish }: { wish: WishDetailData }) {
  const router = useRouter();
  const [steps, setSteps] = useState(wish.steps);
  const [status, setStatus] = useState(wish.status);
  const [newStep, setNewStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const completedSteps = steps.filter((step) => step.is_done).length;
  const allStepsDone = steps.length > 0 && completedSteps === steps.length;
  const progress = steps.length
    ? Math.round((completedSteps / steps.length) * 100)
    : 0;
  async function addStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = newStep.trim();
    if (!content) {
      return;
    }

    setPendingId("new");
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .rpc("create_wish_step", {
        target_wish_id: wish.id,
        step_content: content,
      })
      .single();

    if (insertError) {
      setError(getWishErrorMessage(insertError.message));
    } else {
      setSteps((current) => [...current, data as WishStep]);
      setNewStep("");
      router.refresh();
    }
    setPendingId(null);
  }

  async function toggleStep(step: WishStep) {
    setPendingId(step.id);
    setError(null);
    const nextDone = !step.is_done;
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("wish_steps")
      .update({ is_done: nextDone })
      .eq("id", step.id);

    if (updateError) {
      setError(getWishErrorMessage(updateError.message));
    } else {
      setSteps((current) =>
        current.map((item) =>
          item.id === step.id ? { ...item, is_done: nextDone } : item,
        ),
      );
      router.refresh();
    }
    setPendingId(null);
  }

  async function deleteStep(stepId: string) {
    setPendingId(stepId);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("wish_steps")
      .delete()
      .eq("id", stepId);

    if (deleteError) {
      setError(getWishErrorMessage(deleteError.message));
    } else {
      setSteps((current) => current.filter((step) => step.id !== stepId));
      router.refresh();
    }
    setPendingId(null);
  }

  async function changeStatus(nextStatus: WishStatus) {
    if (nextStatus === status) {
      return;
    }

    setPendingId("status");
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("wishes")
      .update({ status: nextStatus })
      .eq("id", wish.id);

    if (updateError) {
      setError(getWishErrorMessage(updateError.message));
    } else {
      setStatus(nextStatus);
      router.refresh();
    }
    setPendingId(null);
  }

  return (
    <>
      <header className="mb-6">
        <Link
          href="/wishes"
          className="inline-flex items-center gap-1 text-sm text-ink-muted"
        >
          ← 返回愿望清单
        </Link>
        <p className="mt-7 text-xs tracking-[0.2em] text-rose-deep">
          WISH DETAIL
        </p>
        <h1 className="mt-3 text-[28px] font-medium leading-tight tracking-[-0.03em] text-ink">
          {wish.title}
        </h1>
        {wish.description ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-muted">
            {wish.description}
          </p>
        ) : null}
        {wish.targetDate ? (
          <p className="mt-3 text-xs text-ink-faint">
            期待日期 · {formatDate(wish.targetDate)}
          </p>
        ) : null}
      </header>

      <SoftCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">当前状态</p>
            <p className="mt-1 text-xs text-ink-muted">
              可以随时调整，不必赶进度。
            </p>
          </div>
          <span className="paper-label">{status}</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              type="button"
              className="choice-chip"
              data-selected={status === item}
              onClick={() => changeStatus(item)}
              disabled={pendingId === "status"}
            >
              {item}
            </button>
          ))}
        </div>
      </SoftCard>

      <SoftCard className="mt-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-ink">一起完成的小步骤</p>
            <p className="mt-1 text-xs text-ink-muted">
              {completedSteps}/{steps.length} 已完成
            </p>
          </div>
          <span className="text-lg font-medium text-rose-deep">{progress}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#efe6e3]">
          <div
            className="h-full rounded-full bg-[#dba39e] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 grid gap-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 rounded-[18px] bg-[#faf5f2] p-3"
            >
              <button
                type="button"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                  step.is_done
                    ? "border-[#d59a94] bg-[#d59a94] text-white"
                    : "border-[#d9c9c4] bg-white text-transparent"
                }`}
                aria-label={step.is_done ? "标记为未完成" : "标记为已完成"}
                onClick={() => toggleStep(step)}
                disabled={pendingId === step.id}
              >
                ✓
              </button>
              <span
                className={`min-w-0 flex-1 text-sm leading-6 ${
                  step.is_done
                    ? "text-ink-faint line-through"
                    : "text-ink-muted"
                }`}
              >
                {step.content}
              </span>
              <button
                type="button"
                className="px-1 text-lg text-ink-faint"
                aria-label={`删除步骤：${step.content}`}
                onClick={() => deleteStep(step.id)}
                disabled={pendingId === step.id}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {steps.length === 0 ? (
          <p className="mt-6 text-center text-sm leading-6 text-ink-faint">
            暂时不拆成步骤也没关系，想清楚一点时再慢慢添加。
          </p>
        ) : null}

        <form className="mt-5 flex gap-2" onSubmit={addStep}>
          <label htmlFor="new-step" className="sr-only">
            新步骤
          </label>
          <input
            id="new-step"
            className="text-field min-w-0 flex-1"
            value={newStep}
            onChange={(event) => setNewStep(event.target.value)}
            placeholder="添加一个小步骤"
            maxLength={300}
            disabled={pendingId === "new"}
          />
          <button
            type="submit"
            className="rounded-2xl bg-[#e5b4af] px-4 text-sm text-white"
            disabled={!newStep.trim() || pendingId === "new"}
          >
            添加
          </button>
        </form>
      </SoftCard>

      {allStepsDone && status !== "已完成" ? (
        <SoftCard className="mt-4 border border-[#ead4cf] bg-[#fff8f5] text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4dfdc] text-xl text-rose-deep">
            ✓
          </div>
          <h2 className="mt-4 text-lg font-medium text-ink">
            所有步骤都完成了
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            可以把它标记为“已完成”，也可以先让它在这里停一会儿。
          </p>
          <button
            type="button"
            className="soft-button mt-5"
            onClick={() => changeStatus("已完成")}
            disabled={pendingId === "status"}
          >
            确认完成
          </button>
        </SoftCard>
      ) : null}

      {status === "已完成" ? (
        <SoftCard className="mt-4 bg-[#f7ebe8] text-center">
          <p className="text-sm font-medium text-rose-deep">
            这个愿望已经被好好完成了
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            完成回忆卡片将在 v1.1 加入。
          </p>
        </SoftCard>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-[#fff0ee] px-4 py-3 text-sm leading-6 text-[#a25550]"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}

function getWishErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("wish_steps") ||
    normalized.includes("wishes") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist")
  ) {
    return "愿望功能尚未部署，请先执行最新的 Supabase migration。";
  }

  if (normalized.includes("duplicate") || normalized.includes("unique")) {
    return "步骤顺序发生冲突，请刷新页面后再试。";
  }

  return "这次修改没有保存成功，请稍后再试。";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
