"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SheetModal } from "@/components/sheet-modal";
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
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepContent, setEditingStepContent] = useState("");
  const [editOpen, setEditOpen] = useState(false);
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
    if (!window.confirm("确定删除这个步骤吗？")) {
      return;
    }

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

  async function editStep(event: FormEvent<HTMLFormElement>, stepId: string) {
    event.preventDefault();
    const content = editingStepContent.trim();

    if (!content) {
      return;
    }

    setPendingId(stepId);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("wish_steps")
      .update({ content })
      .eq("id", stepId);

    if (updateError) {
      setError(getWishErrorMessage(updateError.message));
    } else {
      setSteps((current) =>
        current.map((step) =>
          step.id === stepId ? { ...step, content } : step,
        ),
      );
      setEditingStepId(null);
      setEditingStepContent("");
      router.refresh();
    }
    setPendingId(null);
  }

  async function deleteWish() {
    if (!window.confirm("确定删除这个愿望吗？其中的步骤也会一起删除。")) {
      return;
    }

    setPendingId("delete-wish");
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("wishes")
      .delete()
      .eq("id", wish.id);

    if (deleteError) {
      setError(getWishErrorMessage(deleteError.message));
      setPendingId(null);
      return;
    }

    router.push("/wishes");
    router.refresh();
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
        <div className="mt-7 flex items-center justify-between gap-3">
          <p className="text-xs tracking-[0.2em] text-rose-deep">
            WISH DETAIL
          </p>
          <button
            type="button"
            className="rounded-full bg-[#f5ece9] px-4 py-2 text-xs text-ink-muted"
            onClick={() => setEditOpen(true)}
          >
            编辑愿望
          </button>
        </div>
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
              className="rounded-[18px] bg-[#faf5f2] p-3"
            >
              {editingStepId === step.id ? (
                <form
                  className="flex gap-2"
                  onSubmit={(event) => editStep(event, step.id)}
                >
                  <input
                    className="text-field min-w-0 flex-1 py-2"
                    value={editingStepContent}
                    onChange={(event) =>
                      setEditingStepContent(event.target.value)
                    }
                    maxLength={300}
                    autoFocus
                    disabled={pendingId === step.id}
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#d99d97] px-3 text-xs text-white"
                    disabled={
                      !editingStepContent.trim() || pendingId === step.id
                    }
                  >
                    保存
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3">
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
                    className="px-1 text-xs text-ink-faint"
                    onClick={() => {
                      setEditingStepId(step.id);
                      setEditingStepContent(step.content);
                    }}
                    disabled={pendingId === step.id}
                  >
                    编辑
                  </button>
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
              )}
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

      <SoftCard className="mt-4 border border-[#f0dfdb] bg-white/55">
        <p className="text-sm font-medium text-ink">管理这个愿望</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          删除后，愿望和其中的全部步骤都无法恢复。
        </p>
        <button
          type="button"
          className="mt-4 text-sm text-[#a25550]"
          onClick={deleteWish}
          disabled={pendingId === "delete-wish"}
        >
          {pendingId === "delete-wish" ? "正在删除…" : "删除这个愿望"}
        </button>
      </SoftCard>

      {editOpen ? (
        <EditWishModal
          wish={wish}
          onClose={() => setEditOpen(false)}
          onError={setError}
        />
      ) : null}
    </>
  );
}

function EditWishModal({
  wish,
  onClose,
  onError,
}: {
  wish: WishDetailData;
  onClose: () => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(wish.title);
  const [description, setDescription] = useState(wish.description ?? "");
  const [targetDate, setTargetDate] = useState(wish.targetDate ?? "");
  const [saving, setSaving] = useState(false);

  async function saveWish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      onError("愿望标题不能为空。");
      return;
    }

    setSaving(true);
    onError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("wishes")
      .update({
        title: normalizedTitle,
        description: description.trim() || null,
        target_date: targetDate || null,
      })
      .eq("id", wish.id);

    if (error) {
      onError(getWishErrorMessage(error.message));
      setSaving(false);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <SheetModal
      open
      title="编辑愿望"
      description="调整想法和日期，不会影响已有步骤。"
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <form className="grid gap-5" onSubmit={saveWish}>
        <div>
          <label htmlFor="edit-wish-title" className="field-label">
            愿望标题
          </label>
          <input
            id="edit-wish-title"
            className="text-field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            disabled={saving}
            required
          />
        </div>
        <div>
          <label htmlFor="edit-wish-description" className="field-label">
            想补充的话
          </label>
          <textarea
            id="edit-wish-description"
            className="text-field min-h-24 resize-none leading-7"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="edit-wish-date" className="field-label">
            期待的日期
            <span className="ml-2 font-normal text-ink-faint">选填</span>
          </label>
          <input
            id="edit-wish-date"
            type="date"
            className="text-field"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            disabled={saving}
          />
        </div>
        <button
          type="submit"
          className="soft-button w-full disabled:opacity-60"
          disabled={saving || !title.trim()}
        >
          {saving ? "正在保存…" : "保存修改"}
        </button>
      </form>
    </SheetModal>
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
