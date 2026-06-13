"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SheetModal } from "@/components/sheet-modal";
import { SoftCard } from "@/components/soft-card";
import { createClient } from "@/lib/supabase/client";

export type WishStatus = "想想中" | "准备中" | "进行中" | "已完成";

export type WishListItem = {
  id: string;
  title: string;
  description: string | null;
  status: WishStatus;
  targetDate: string | null;
  completedSteps: number;
  totalSteps: number;
};

type Filter = "全部" | WishStatus;

export function WishesView({
  wishes,
  spaceId,
  loadError,
}: {
  wishes: WishListItem[];
  spaceId: string;
  loadError: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("全部");
  const visibleWishes = useMemo(
    () =>
      filter === "全部"
        ? wishes
        : wishes.filter((wish) => wish.status === filter),
    [filter, wishes],
  );

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
        {(["全部", "想想中", "准备中", "进行中", "已完成"] as Filter[]).map(
          (item) => (
            <button
              key={item}
              type="button"
              className="choice-chip shrink-0"
              data-selected={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}
              {item === "全部" ? ` ${wishes.length}` : ""}
            </button>
          ),
        )}
      </div>

      {loadError ? (
        <SoftCard className="border border-[#efd2cd] bg-[#fff7f5]">
          <p className="text-sm leading-6 text-[#a25550]">{loadError}</p>
        </SoftCard>
      ) : visibleWishes.length ? (
        <section className="grid gap-4">
          {visibleWishes.map((wish, index) => (
            <WishCard key={wish.id} wish={wish} index={index} />
          ))}
        </section>
      ) : (
        <SoftCard className="py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6e6e3] text-2xl text-rose-deep">
            ☆
          </div>
          <h2 className="mt-4 text-lg font-medium text-ink">
            这里还留着一些可能
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            想到想一起做的事，就先把它放进来。
          </p>
          <button
            type="button"
            className="soft-button mt-6"
            onClick={() => setIsOpen(true)}
          >
            新建愿望
          </button>
        </SoftCard>
      )}

      <CreateWishModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        spaceId={spaceId}
      />
    </>
  );
}

function WishCard({
  wish,
  index,
}: {
  wish: WishListItem;
  index: number;
}) {
  const progress = wish.totalSteps
    ? Math.round((wish.completedSteps / wish.totalSteps) * 100)
    : 0;

  return (
    <Link href={`/wishes/${wish.id}`} aria-label={`查看愿望：${wish.title}`}>
      <SoftCard>
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7e8e5] text-lg text-rose-deep">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-medium leading-6 text-ink">{wish.title}</h2>
              <span className="shrink-0 rounded-full bg-[#f7e9e6] px-2.5 py-1 text-[11px] text-rose-deep">
                {wish.status}
              </span>
            </div>
            {wish.targetDate ? (
              <p className="mt-2 text-xs text-ink-faint">
                期待日期 · {formatDate(wish.targetDate)}
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
    </Link>
  );
}

function CreateWishModal({
  open,
  onClose,
  spaceId,
}: {
  open: boolean;
  onClose: () => void;
  spaceId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError("先写下愿望的名字吧。");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("wishes").insert({
      space_id: spaceId,
      title: normalizedTitle,
      description: description.trim() || null,
      target_date: targetDate || null,
      status: "想想中",
    });

    if (insertError) {
      setError(getWishErrorMessage(insertError.message));
      setSaving(false);
      return;
    }

    setTitle("");
    setDescription("");
    setTargetDate("");
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <SheetModal
      open={open}
      title="新建一个愿望"
      description="先记下想法，什么时候出发都可以。"
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
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
            maxLength={100}
            required
            disabled={saving}
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
            maxLength={2000}
            disabled={saving}
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
            disabled={saving}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-[#fff0ee] px-4 py-3 text-sm leading-6 text-[#a25550]"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="soft-button w-full disabled:cursor-not-allowed disabled:bg-[#d8c9c5] disabled:shadow-none"
        >
          {saving ? "正在收进清单…" : "收进愿望清单"}
        </button>
      </form>
    </SheetModal>
  );
}

function getWishErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("wishes") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist")
  ) {
    return "愿望清单尚未部署，请先执行最新的 Supabase migration。";
  }

  return "愿望暂时没有保存成功，请稍后再试。";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
