"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { RecordComposer } from "@/components/record-composer";
import { SoftCard } from "@/components/soft-card";
import { TabletBookLayout } from "@/components/tablet-book-layout";
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
  const [recordToDelete, setRecordToDelete] = useState<RecordItem | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const visibleRecords = useMemo(() => {
    if (filter === "mine") {
      return records.filter((record) => record.authorId === userId);
    }

    if (filter === "images") {
      return records.filter((record) => record.imageUrl);
    }

    return records;
  }, [filter, records, userId]);
  const selectedRecord =
    visibleRecords.find((record) => record.id === selectedRecordId) ?? null;

  function openComposer() {
    setEditingRecord(null);
    setComposerOpen(true);
  }

  function editRecord(record: RecordItem) {
    setEditingRecord(record);
    setComposerOpen(true);
  }

  async function deleteRecord(record: RecordItem) {
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
    setRecordToDelete(null);
    router.refresh();
  }

  return (
    <>
      <TabletBookLayout
        left={
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

            <div className="book-desktop-only">
              {visibleRecords.length ? (
                <RecordSelectionList
                  records={visibleRecords}
                  selectedId={selectedRecord?.id ?? null}
                  onSelect={setSelectedRecordId}
                />
              ) : (
                <RecordEmptyState filter={filter} onCompose={openComposer} />
              )}
            </div>
          </>
        }
        right={
          <>
            <div className="book-mobile-only">
              {loadError ? (
                <SoftCard className="border border-[#efd2cd] bg-[#fff7f5]">
                  <p className="text-sm leading-6 text-[#a25550]">
                    {loadError}
                  </p>
                </SoftCard>
              ) : visibleRecords.length ? (
                <RecordTimeline
                  records={visibleRecords}
                  userId={userId}
                  onEdit={editRecord}
                  onDelete={setRecordToDelete}
                />
              ) : (
                <RecordEmptyState filter={filter} onCompose={openComposer} />
              )}
            </div>

            <div className="book-desktop-only">
              {loadError ? (
                <SoftCard className="border border-[#efd2cd] bg-[#fff7f5]">
                  <p className="text-sm leading-6 text-[#a25550]">
                    {loadError}
                  </p>
                </SoftCard>
              ) : selectedRecord ? (
                <RecordDetail
                  record={selectedRecord}
                  userId={userId}
                  onEdit={editRecord}
                  onDelete={setRecordToDelete}
                />
              ) : (
                <SoftCard className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <span className="text-3xl text-rose">“</span>
                  <h2 className="mt-4 text-xl font-medium text-ink">
                    选一段回忆慢慢看
                  </h2>
                  <p className="mt-3 max-w-[260px] text-sm leading-7 text-ink-muted">
                    左边是一起走过的时间，点开一页，右边会安静地为它展开。
                  </p>
                </SoftCard>
              )}
            </div>
          </>
        }
      />

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

      <ConfirmDialog
        open={Boolean(recordToDelete)}
        title="确定要删掉这一天吗？"
        description="删掉后不会恢复。"
        confirmLabel="删除"
        pending={Boolean(deletingId)}
        onClose={() => setRecordToDelete(null)}
        onConfirm={() => {
          if (recordToDelete) {
            void deleteRecord(recordToDelete);
          }
        }}
      />
    </>
  );
}

function RecordEmptyState({
  filter,
  onCompose,
}: {
  filter: Filter;
  onCompose: () => void;
}) {
  return (
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
          onClick={onCompose}
        >
          写下今天
        </button>
      ) : null}
    </SoftCard>
  );
}

function RecordSelectionList({
  records,
  selectedId,
  onSelect,
}: {
  records: RecordItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {records.map((record) => (
        <button
          key={record.id}
          type="button"
          className="book-selection-item rounded-[20px] border border-[#eee1dd] bg-white/65 p-4 text-left shadow-[0_8px_20px_rgb(111_78_70_/_4%)]"
          data-selected={selectedId === record.id}
          onClick={() => onSelect(record.id)}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">
              {record.authorName}
            </span>
            <span className="text-xs text-ink-faint">
              {formatRecordDate(record.createdAt)}
            </span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-muted">
            {record.content}
          </p>
        </button>
      ))}
    </div>
  );
}

function RecordDetail({
  record,
  userId,
  onEdit,
  onDelete,
}: {
  record: RecordItem;
  userId: string;
  onEdit: (record: RecordItem) => void;
  onDelete: (record: RecordItem) => void;
}) {
  return (
    <SoftCard>
      <div className="flex items-start gap-3">
        <Avatar name={record.authorName} url={record.avatarUrl} color="#dba9a4" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">{record.authorName}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {formatRecordDate(record.createdAt)}
          </p>
        </div>
        {record.authorId === userId ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full bg-[#f5ece9] px-3 py-2 text-xs text-ink-muted"
              onClick={() => onEdit(record)}
            >
              编辑
            </button>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-xs text-[#a25550]"
              onClick={() => onDelete(record)}
            >
              删除
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-6 whitespace-pre-wrap text-[17px] leading-8 text-ink-muted">
        {record.content}
      </p>
      {record.imageUrl ? (
        <div className="mt-5 h-64 overflow-hidden rounded-[20px] bg-[#f3e9e5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={record.imageUrl}
            alt="记录中的图片"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="mt-5 flex gap-3 text-xs text-ink-muted">
        {record.weather ? <span>☁ {record.weather}</span> : null}
        {record.mood ? <span>☺ {record.mood}</span> : null}
      </div>
    </SoftCard>
  );
}

function RecordTimeline({
  records,
  userId,
  onEdit,
  onDelete,
}: {
  records: RecordItem[];
  userId: string;
  onEdit: (record: RecordItem) => void;
  onDelete: (record: RecordItem) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <section className="relative grid gap-5 pl-5">
      <div className="absolute bottom-8 left-[5px] top-7 w-px bg-[#e3d4d0]" />
      {records.map((record, index) => (
        <div key={record.id} className="relative">
          <span className="absolute -left-[19px] top-7 h-2.5 w-2.5 rounded-full border-2 border-[#f8f3f0] bg-[#d89b95]" />
          <SoftCard className="relative">
            <div className="flex items-start gap-3">
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
              <div className="flex shrink-0 items-start gap-2">
                <div className="pt-0.5 text-right text-xs leading-5 text-ink-muted">
                  {record.weather ? <p>☁ {record.weather}</p> : null}
                  {record.mood ? <p>☺ {record.mood}</p> : null}
                </div>
                {record.authorId === userId ? (
                  <div className="relative">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg tracking-[0.08em] text-ink-faint transition hover:bg-[#f5ece9] hover:text-ink-muted active:scale-95"
                      aria-label="记录操作"
                      aria-expanded={openMenuId === record.id}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === record.id ? null : record.id,
                        )
                      }
                    >
                      ···
                    </button>
                    {openMenuId === record.id ? (
                      <div className="absolute right-0 top-10 z-10 w-32 overflow-hidden rounded-2xl border border-[#eee1dd] bg-[#fffdfb] p-1.5 shadow-[0_12px_32px_rgb(89_61_54_/_14%)]">
                        <button
                          type="button"
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink-muted transition hover:bg-[#f8f0ed] active:bg-[#f3e5e1]"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEdit(record);
                          }}
                        >
                          编辑记录
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#a25550] transition hover:bg-[#fff0ee] active:bg-[#f9dfdc]"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(record);
                          }}
                        >
                          删除记录
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
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
