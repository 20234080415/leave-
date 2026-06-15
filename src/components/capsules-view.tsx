"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { SheetModal } from "@/components/sheet-modal";
import { SoftCard } from "@/components/soft-card";
import { TabletBookLayout } from "@/components/tablet-book-layout";
import { createClient } from "@/lib/supabase/client";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export type TimeCapsuleItem = {
  id: string;
  authorId: string;
  authorName: string;
  content: string | null;
  imageUrl: string | null;
  unlockAt: string;
  openedAt: string | null;
  createdAt: string;
};

type CapsuleState = "sleeping" | "ready" | "opened";
type UnlockChoice = "30" | "100" | "365" | "custom";

export function CapsulesView({
  capsules,
  userId,
  spaceId,
  loadError,
}: {
  capsules: TimeCapsuleItem[];
  userId: string;
  spaceId: string;
  loadError: string | null;
}) {
  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(false);
  const [capsuleToOpen, setCapsuleToOpen] =
    useState<TimeCapsuleItem | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [renderedAt] = useState(() => Date.now());

  const orderedCapsules = useMemo(
    () =>
      [...capsules].sort((a, b) => {
        const stateOrder: Record<CapsuleState, number> = {
          ready: 0,
          sleeping: 1,
          opened: 2,
        };
        const aState = getCapsuleState(a, openedIds, renderedAt);
        const bState = getCapsuleState(b, openedIds, renderedAt);

        if (stateOrder[aState] !== stateOrder[bState]) {
          return stateOrder[aState] - stateOrder[bState];
        }

        return Date.parse(a.unlockAt) - Date.parse(b.unlockAt);
      }),
    [capsules, openedIds, renderedAt],
  );

  async function openCapsule() {
    if (!capsuleToOpen) {
      return;
    }

    setOpeningId(capsuleToOpen.id);
    setActionMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("time_capsules")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", capsuleToOpen.id);

    if (error) {
      setActionMessage("这颗胶囊还没有顺利打开，请稍后再试。");
      setOpeningId(null);
      setCapsuleToOpen(null);
      return;
    }

    setOpenedIds((current) => [...current, capsuleToOpen.id]);
    setOpeningId(null);
    setCapsuleToOpen(null);
    router.refresh();
  }

  const list = loadError ? (
    <SoftCard className="border border-[#efd2cd] bg-[#fff7f5]">
      <p className="text-sm leading-6 text-[#a25550]">{loadError}</p>
    </SoftCard>
  ) : orderedCapsules.length ? (
    <section className="grid gap-4">
      {orderedCapsules.map((capsule) => (
        <CapsuleCard
          key={capsule.id}
          capsule={capsule}
          state={getCapsuleState(capsule, openedIds, renderedAt)}
          currentUserId={userId}
          onOpen={() => setCapsuleToOpen(capsule)}
        />
      ))}
    </section>
  ) : (
    <CapsuleEmptyState onCreate={() => setComposerOpen(true)} />
  );

  return (
    <>
      <TabletBookLayout
        left={
          <>
            <PageHeader
              eyebrow="FOR THE FUTURE"
              title="时间胶囊"
              description="把今天的话，留给未来的我们。"
              action={
                <button
                  type="button"
                  className="soft-button shrink-0 px-4"
                  onClick={() => setComposerOpen(true)}
                >
                  写给未来
                </button>
              }
            />

            <SoftCard className="mb-4 overflow-hidden bg-gradient-to-br from-[#f7e5e2] to-[#fff9f5]">
              <p className="text-xs tracking-[0.18em] text-rose-deep">
                A QUIET PROMISE
              </p>
              <p className="mt-4 text-lg leading-8 text-ink">
                今天不必得到回答。等未来某一天，再一起把这页轻轻翻开。
              </p>
            </SoftCard>

            {actionMessage ? (
              <p
                role="alert"
                className="mb-4 rounded-2xl bg-[#fff0ee] px-4 py-3 text-sm leading-6 text-[#a25550]"
              >
                {actionMessage}
              </p>
            ) : null}

          </>
        }
        right={list}
      />

      <CapsuleComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        spaceId={spaceId}
        userId={userId}
      />

      <ConfirmDialog
        open={Boolean(capsuleToOpen)}
        title="要打开这颗胶囊吗？"
        description="这是过去的你，轻轻放到今天的话。"
        cancelLabel="再等等"
        confirmLabel="打开看看"
        pending={Boolean(openingId)}
        onClose={() => setCapsuleToOpen(null)}
        onConfirm={() => void openCapsule()}
      />
    </>
  );
}

function CapsuleCard({
  capsule,
  state,
  currentUserId,
  onOpen,
}: {
  capsule: TimeCapsuleItem;
  state: CapsuleState;
  currentUserId: string;
  onOpen: () => void;
}) {
  if (state === "sleeping") {
    return (
      <SoftCard className="relative overflow-hidden border border-white/80 bg-[#fffaf7]">
        <CapsuleDecoration />
        <p className="paper-label">封存中</p>
        <h2 className="mt-5 text-lg font-medium text-ink">
          胶囊正在沉睡...
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          还有 {getRemainingDays(capsule.unlockAt)} 天
        </p>
        <p className="mt-5 text-xs text-ink-faint">
          {capsule.authorId === currentUserId ? "由你" : `由 ${capsule.authorName}`}{" "}
          封存于 {formatDate(capsule.createdAt)}
        </p>
      </SoftCard>
    );
  }

  if (state === "ready") {
    return (
      <SoftCard className="relative overflow-hidden border border-[#ebc9c4] bg-gradient-to-br from-[#fff8f5] to-[#f8e4e1]">
        <CapsuleDecoration />
        <p className="paper-label bg-white/70">今天可以打开</p>
        <h2 className="mt-5 text-lg font-medium text-ink">
          你在过去留下了一段话
        </h2>
        <p className="mt-2 text-sm text-ink-muted">是否打开？</p>
        <button type="button" className="soft-button mt-6" onClick={onOpen}>
          打开看看
        </button>
      </SoftCard>
    );
  }

  return (
    <SoftCard className="capsule-reveal border border-white/80 bg-[#fffdfb]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.16em] text-rose-deep">
            OPENED CAPSULE
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {capsule.authorName} 写给未来的我们
          </p>
        </div>
        <span className="paper-label shrink-0">已打开</span>
      </div>
      <p className="mt-6 whitespace-pre-wrap text-[17px] leading-8 text-ink">
        {capsule.content}
      </p>
      {capsule.imageUrl ? (
        <div className="mt-5 overflow-hidden rounded-[22px] bg-[#f3e9e5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capsule.imageUrl}
            alt="时间胶囊中的照片"
            className="max-h-[420px] w-full object-cover"
          />
        </div>
      ) : null}
      <div className="mt-6 grid gap-1 border-t border-[#eee3df] pt-4 text-xs text-ink-faint">
        <p>封存于 {formatDate(capsule.createdAt)}</p>
        <p>
          打开于 {formatDate(capsule.openedAt ?? new Date().toISOString())}
        </p>
      </div>
    </SoftCard>
  );
}

function CapsuleDecoration() {
  return (
    <>
      <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#f1d6d2]/55" />
      <span className="absolute right-8 top-7 h-3 w-3 rounded-full bg-white/80" />
    </>
  );
}

function CapsuleEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <SoftCard className="py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f6e6e3] text-2xl text-rose-deep">
        ◯
      </div>
      <h2 className="mt-5 text-lg font-medium text-ink">还没有胶囊。</h2>
      <p className="mt-2 text-sm leading-7 text-ink-muted">
        写一句话，留给未来的某一天吧。
      </p>
      <button type="button" className="soft-button mt-6" onClick={onCreate}>
        写给未来
      </button>
    </SoftCard>
  );
}

function CapsuleComposer({
  open,
  onClose,
  spaceId,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  spaceId: string;
  userId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [choice, setChoice] = useState<UnlockChoice>("30");
  const [customDate, setCustomDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setMessage(null);

    if (!selectedFile) {
      return;
    }

    const validationMessage = validateImage(selectedFile);
    if (validationMessage) {
      setMessage(validationMessage);
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  function removeImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedContent = content.trim();
    const unlockAt = getUnlockAt(choice, customDate);

    if (!normalizedContent) {
      setMessage("先写下一点想交给未来的话吧。");
      return;
    }

    if (!unlockAt) {
      setMessage("请选择一个未来的日期。");
      return;
    }

    if (file) {
      const validationMessage = validateImage(file);
      if (validationMessage) {
        setMessage(validationMessage);
        return;
      }
    }

    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    let imagePath: string | null = null;

    if (file) {
      imagePath = buildImagePath(spaceId, userId, file);
      const { error: uploadError } = await supabase.storage
        .from("time-capsule-images")
        .upload(imagePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setMessage("照片还没有放进去，请稍后再试。");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("time_capsules").insert({
      space_id: spaceId,
      author_id: userId,
      content: normalizedContent,
      image_url: imagePath,
      unlock_at: unlockAt.toISOString(),
    });

    if (error) {
      if (imagePath) {
        await supabase.storage
          .from("time-capsule-images")
          .remove([imagePath]);
      }
      setMessage(
        error.message.toLowerCase().includes("time_capsules")
          ? "时间胶囊还在准备中，请先应用最新的 Supabase migration。"
          : "这段话还没有封存好，请稍后再试。",
      );
      setSaving(false);
      return;
    }

    setContent("");
    setChoice("30");
    setCustomDate("");
    removeImage();
    setMessage("这段话已经交给未来。");
    setSaving(false);
    router.refresh();

    window.setTimeout(() => {
      setMessage(null);
      onClose();
    }, 900);
  }

  return (
    <SheetModal
      open={open}
      title="写给未来"
      description="把今天想说的话安静地收好，到约定的那天再打开。"
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="capsule-content" className="field-label">
            想留下的话
          </label>
          <textarea
            id="capsule-content"
            className="text-field min-h-32 resize-none leading-7"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="想对未来的我们说些什么？"
            maxLength={5000}
            required
            disabled={saving}
          />
        </div>

        <fieldset disabled={saving}>
          <legend className="field-label">什么时候打开</legend>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "30" as const, label: "30天" },
              { value: "100" as const, label: "100天" },
              { value: "365" as const, label: "365天" },
              { value: "custom" as const, label: "自定义日期" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className="choice-chip"
                data-selected={choice === option.value}
                onClick={() => setChoice(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        {choice === "custom" ? (
          <div>
            <label htmlFor="capsule-date" className="field-label">
              未来的某一天
            </label>
            <input
              id="capsule-date"
              type="date"
              className="text-field"
              min={getTomorrowDateInput()}
              value={customDate}
              onChange={(event) => setCustomDate(event.target.value)}
              required
              disabled={saving}
            />
          </div>
        ) : null}

        <div>
          <span className="field-label">
            一张照片
            <span className="ml-2 font-normal text-ink-faint">选填</span>
          </span>
          {previewUrl ? (
            <div className="relative h-48 overflow-hidden rounded-[20px] bg-[#f3e9e5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="所选照片预览"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white"
                onClick={removeImage}
                disabled={saving}
              >
                移除
              </button>
            </div>
          ) : (
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-[#dcbfba] bg-white/50 text-center">
              <span className="text-2xl text-rose-deep">＋</span>
              <span className="mt-2 text-sm text-ink-muted">
                选一张想交给未来的照片
              </span>
              <span className="mt-1 text-xs text-ink-faint">
                JPEG、PNG、WebP 或 GIF，小于 5MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleImageChange}
                disabled={saving}
              />
            </label>
          )}
        </div>

        {message ? (
          <p
            role="status"
            className="rounded-2xl bg-[#f8ece9] px-4 py-3 text-sm leading-6 text-rose-deep"
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          className="soft-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "正在交给未来..." : "轻轻封存"}
        </button>
      </form>
    </SheetModal>
  );
}

function getCapsuleState(
  capsule: TimeCapsuleItem,
  openedIds: string[],
  now: number,
): CapsuleState {
  if (capsule.openedAt || openedIds.includes(capsule.id)) {
    return "opened";
  }

  return Date.parse(capsule.unlockAt) <= now ? "ready" : "sleeping";
}

function getRemainingDays(unlockAt: string) {
  return Math.max(1, Math.ceil((Date.parse(unlockAt) - Date.now()) / DAY_IN_MS));
}

function getUnlockAt(choice: UnlockChoice, customDate: string) {
  if (choice === "custom") {
    if (!customDate) {
      return null;
    }

    const date = new Date(`${customDate}T09:00:00+08:00`);
    return date.getTime() > Date.now() ? date : null;
  }

  return new Date(Date.now() + Number(choice) * DAY_IN_MS);
}

function getTomorrowDateInput() {
  const tomorrow = new Date(Date.now() + DAY_IN_MS);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function validateImage(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    return "请选择 JPEG、PNG、WebP 或 GIF 图片。";
  }

  if (file.size >= MAX_IMAGE_SIZE) {
    return "照片需要小于 5MB，请压缩后再试。";
  }

  return null;
}

function buildImagePath(spaceId: string, userId: string, file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return `${spaceId}/${userId}/${crypto.randomUUID()}.${extensions[file.type]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
