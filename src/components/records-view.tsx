"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RecordComposer } from "@/components/record-composer";
import { SoftCard } from "@/components/soft-card";
import { createClient } from "@/lib/supabase/client";

export type RecordItem = {
  id: string;
  authorId: string;
  authorName: string;
  avatarUrl: string | null;
  content: string;
  mood: string | null;
  weather: string | null;
  imageUrl: string | null;
  imagePath: string | null;
  visibility: "shared" | "private";
  createdAt: string;
};

type Filter = "all" | "mine" | "images";

export function RecordsView({
  records,
  userId,
  spaceId,
  initialComposerOpen = false,
  loadError,
}: {
  records: RecordItem[];
  userId: string;
  spaceId: string;
  initialComposerOpen?: boolean;
  loadError: string | null;
}) {
  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(initialComposerOpen);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const visibleRecords = useMemo(() => {
    if (filter === "mine") {
      return records.filter((record) => record.authorId === userId);
    }

    if (filter === "images") {
      return records.filter((record) => record.imageUrl);
    }

    return records;
  }, [filter, records, userId]);

  function openComposer() {
    setEditingRecord(null);
    setComposerOpen(true);
  }

  function editRecord(record: RecordItem) {
    setEditingRecord(record);
    setComposerOpen(true);
  }

  async function deleteRecord(record: RecordItem) {
    if (!window.confirm("确定删除这条记录吗？删除后无法恢复。")) {
      return;
    }

    setDeletingId(record.id);
    setActionError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("daily_records")
      .delete()
      .eq("id", record.id);

    if (error) {
      setActionError("这条记录暂时没有删除成功，请稍后再试。");
      setDeletingId(null);
      return;
    }

    if (record.imagePath) {
      const { error: storageError } = await supabase.storage
        .from("record-images")
        .remove([record.imagePath]);

      if (storageError) {
        setActionError("记录已删除，但图片清理没有完成。");
      }
    }

    setDeletingId(null);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="OUR DAYS"
        title="我们留下的日子"
        description="不必每天都写，有想记住的时刻再来。"
        action={
          <button
            type="button"
            className="soft-button shrink-0 px-4"
            onClick={openComposer}
          >
            写下今天
          </button>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "all" as const, label: "全部" },
          { value: "mine" as const, label: "我的记录" },
          { value: "images" as const, label: "有图片" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            className="choice-chip shrink-0"
            data-selected={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-2xl bg-[#fff0ee] px-4 py-3 text-sm leading-6 text-[#a25550]"
        >
          {actionError}
        </p>
      ) : null}

      {loadError ? (
        <SoftCard className="border border-[#efd2cd] bg-[#fff7f5]">
          <p className="text-sm leading-6 text-[#a25550]">{loadError}</p>
        </SoftCard>
      ) : visibleRecords.length ? (
        <RecordTimeline
          records={visibleRecords}
          userId={userId}
          deletingId={deletingId}
          onEdit={editRecord}
          onDelete={deleteRecord}
        />
      ) : (
        <SoftCard className="py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6e6e3] text-2xl text-rose-deep">
            ✎
          </div>
          <h2 className="mt-4 text-lg font-medium text-ink">
            {filter === "all"
              ? "这里还安静地空着"
              : filter === "mine"
                ? "你还没有留下自己的记录"
                : "还没有带图片的记录"}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {filter === "all"
              ? "不用特意准备，想起什么时再来写一点。"
              : filter === "mine"
                ? "不着急，哪天有想记住的瞬间再写。"
                : "文字本身也很好，照片可以以后再慢慢添。"}
          </p>
          {filter === "all" ? (
            <button
              type="button"
              className="soft-button mt-6"
              onClick={openComposer}
            >
              写下今天
            </button>
          ) : null}
        </SoftCard>
      )}

      {composerOpen ? (
        <RecordComposer
          key={editingRecord?.id ?? "new"}
          open
          onClose={() => setComposerOpen(false)}
          spaceId={spaceId}
          userId={userId}
          record={editingRecord}
        />
      ) : null}
    </>
  );
}

function RecordTimeline({
  records,
  userId,
  deletingId,
  onEdit,
  onDelete,
}: {
  records: RecordItem[];
  userId: string;
  deletingId: string | null;
  onEdit: (record: RecordItem) => void;
  onDelete: (record: RecordItem) => void;
}) {
  return (
    <section className="relative grid gap-5 pl-5">
      <div className="absolute bottom-8 left-[5px] top-7 w-px bg-[#e3d4d0]" />
      {records.map((record, index) => (
        <div key={record.id} className="relative">
          <span className="absolute -left-[19px] top-7 h-2.5 w-2.5 rounded-full border-2 border-[#f8f3f0] bg-[#d89b95]" />
          <SoftCard>
            <div className="flex items-center gap-3">
              <Avatar
                name={record.authorName}
                url={record.avatarUrl}
                color={index % 2 ? "#dba9a4" : "#cbb1a7"}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-ink">
                    {record.authorName}
                  </p>
                  {record.visibility === "private" ? (
                    <span className="rounded-full bg-[#f3ece9] px-2 py-0.5 text-[10px] text-ink-muted">
                      仅自己
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {formatRecordDate(record.createdAt)}
                  {record.authorId === userId ? " · 我" : ""}
                </p>
              </div>
              <div className="text-right text-xs leading-5 text-ink-muted">
                {record.weather ? <p>☁ {record.weather}</p> : null}
                {record.mood ? <p>☺ {record.mood}</p> : null}
              </div>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-[16px] leading-8 text-ink-muted">
              {record.content}
            </p>
            {record.imageUrl ? (
              <div className="mt-4 h-52 overflow-hidden rounded-[20px] bg-[#f3e9e5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={record.imageUrl}
                  alt="记录中的图片"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            {record.authorId === userId ? (
              <div className="mt-5 flex justify-end gap-2 border-t border-[#eee3df] pt-4">
                <button
                  type="button"
                  className="rounded-full bg-[#f5ece9] px-4 py-2 text-xs text-ink-muted"
                  onClick={() => onEdit(record)}
                  disabled={deletingId === record.id}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-xs text-[#a25550]"
                  onClick={() => onDelete(record)}
                  disabled={deletingId === record.id}
                >
                  {deletingId === record.id ? "正在删除…" : "删除"}
                </button>
              </div>
            ) : null}
          </SoftCard>
        </div>
      ))}
    </section>
  );
}

function Avatar({
  name,
  url,
  color,
}: {
  name: string;
  url: string | null;
  color: string;
}) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm text-white"
      style={{ backgroundColor: color }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${name}的头像`} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}

function formatRecordDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  if (isToday) {
    return `今天 · ${time}`;
  }

  return `${new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
  }).format(date)} · ${time}`;
}
