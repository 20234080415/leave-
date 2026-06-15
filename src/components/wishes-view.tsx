"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SheetModal } from "@/components/sheet-modal";
import { SoftCard } from "@/components/soft-card";
import { TabletBookLayout } from "@/components/tablet-book-layout";
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
  steps: {
    id: string;
    content: string;
    isDone: boolean;
    orderIndex: number;
  }[];
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
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);
  const visibleWishes = useMemo(
    () =>
      filter === "全部"
        ? wishes
        : wishes.filter((wish) => wish.status === filter),
    [filter, wishes],
  );
  const selectedWish =
    visibleWishes.find((wish) => wish.id === selectedWishId) ?? null;

  return (
    <>
      <TabletBookLayout
        left={
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
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    index={index}
                    selected={selectedWish?.id === wish.id}
                    onSelect={() => setSelectedWishId(wish.id)}
                  />
                ))}
                {filter === "全部" && wishes.length <= 2 ? (
                  <SoftCard className="book-mobile-only mt-1 border border-white/70 bg-[#fbf4f1] py-8 text-center shadow-none">
                    <p className="text-base font-medium text-ink">
                      愿望不用很多。
                    </p>
                    <p className="mx-auto mt-3 max-w-[260px] whitespace-pre-line text-sm leading-7 text-ink-muted">
                      {"一个想一起完成的小事，\n也值得被认真放在这里。"}
                    </p>
                  </SoftCard>
                ) : null}
              </section>
            ) : (
              <WishEmptyState filter={filter} onCreate={() => setIsOpen(true)} />
            )}
          </>
        }
        right={
          <div className="book-desktop-only">
            {selectedWish ? (
              <WishPreview wish={selectedWish} />
            ) : (
              <SoftCard className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="text-3xl text-rose">☆</span>
                <h2 className="mt-4 text-xl font-medium text-ink">
                  选一个愿望慢慢展开
                </h2>
                <p className="mt-3 max-w-[260px] text-sm leading-7 text-ink-muted">
                  左页收着想一起完成的事，右页留给细节和一步一步的靠近。
                </p>
              </SoftCard>
            )}
          </div>
        }
      />

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
  selected,
  onSelect,
}: {
  wish: WishListItem;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const progress = wish.totalSteps
    ? Math.round((wish.completedSteps / wish.totalSteps) * 100)
    : 0;

  const content = (
    <SoftCard className={selected ? "border border-[#dfb7b2] bg-[#fff9f7]" : ""}>
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
  );

  return (
    <>
      <Link
        href={`/wishes/${wish.id}`}
        aria-label={`查看愿望：${wish.title}`}
        className="book-mobile-only"
      >
        {content}
      </Link>
      <div
        className="book-desktop-only w-full cursor-pointer text-left"
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        {content}
      </div>
    </>
  );
}

function WishPreview({ wish }: { wish: WishListItem }) {
  const progress = wish.totalSteps
    ? Math.round((wish.completedSteps / wish.totalSteps) * 100)
    : 0;

  return (
    <>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] text-rose-deep">WISH DETAIL</p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h2 className="text-[27px] font-medium leading-tight text-ink">
            {wish.title}
          </h2>
          <span className="paper-label shrink-0">{wish.status}</span>
        </div>
        {wish.description ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-muted">
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
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-ink">一起完成的小步骤</p>
            <p className="mt-1 text-xs text-ink-muted">
              {wish.completedSteps}/{wish.totalSteps} 已完成
            </p>
          </div>
          <span className="text-lg font-medium text-rose-deep">{progress}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#efe6e3]">
          <div
            className="h-full rounded-full bg-[#dba39e]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-6 grid gap-3">
          {wish.steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 rounded-[18px] bg-[#faf5f2] p-3"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                  step.isDone
                    ? "border-[#d59a94] bg-[#d59a94] text-white"
                    : "border-[#d9c9c4] bg-white text-transparent"
                }`}
              >
                ✓
              </span>
              <span
                className={`text-sm leading-6 ${
                  step.isDone ? "text-ink-faint line-through" : "text-ink-muted"
                }`}
              >
                {step.content}
              </span>
            </div>
          ))}
          {!wish.steps.length ? (
            <p className="py-6 text-center text-sm leading-6 text-ink-faint">
              还没有拆成小步骤，先把愿望放在心里也很好。
            </p>
          ) : null}
        </div>
        <Link
          href={`/wishes/${wish.id}`}
          className="soft-button mt-6 w-full"
        >
          打开愿望并编辑
        </Link>
      </SoftCard>
    </>
  );
}

function WishEmptyState({
  filter,
  onCreate,
}: {
  filter: Filter;
  onCreate: () => void;
}) {
  return (
    <SoftCard className="py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6e6e3] text-2xl text-rose-deep">
        ☆
      </div>
      <h2 className="mt-4 text-lg font-medium text-ink">
        {filter === "全部" ? "这里还留着一些可能" : `还没有“${filter}”的愿望`}
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        {filter === "全部"
          ? "想到想一起做的事，就轻轻放在这里。"
          : "愿望慢慢走到哪里都可以，不需要赶进度。"}
      </p>
      {filter === "全部" ? (
        <button
          type="button"
          className="soft-button mt-6"
          onClick={onCreate}
        >
          记下一个愿望
        </button>
      ) : null}
    </SoftCard>
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
