import { SoftCard } from "@/components/soft-card";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

export type CapsuleState = "sleeping" | "ready" | "opened";

export function CapsuleCard({
  capsule,
  state,
  currentUserId,
  renderedAt,
  onOpen,
}: {
  capsule: TimeCapsuleItem;
  state: CapsuleState;
  currentUserId: string;
  renderedAt: number;
  onOpen: () => void;
}) {
  if (state === "sleeping") {
    return (
      <SoftCard className="relative overflow-hidden border border-white/80 bg-[#fffaf7]">
        <CapsuleDecoration />
        <p className="paper-label">封存中</p>
        <h2 className="mt-5 text-lg font-medium text-ink">胶囊正在沉睡</h2>
        <p className="mt-2 text-sm text-ink-muted">
          还有 {getRemainingDays(capsule.unlockAt, renderedAt)} 天
        </p>
        <p className="mt-5 text-xs text-ink-faint">
          {capsule.authorId === currentUserId
            ? "由你"
            : `由 ${capsule.authorName}`}{" "}
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
        <span className="paper-label shrink-0">已解锁</span>
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
        <p>创建日期 {formatDate(capsule.createdAt)}</p>
        <p>
          解锁日期 {formatDate(capsule.openedAt ?? capsule.unlockAt)}
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

function getRemainingDays(unlockAt: string, renderedAt: number) {
  return Math.max(
    1,
    Math.ceil((Date.parse(unlockAt) - renderedAt) / DAY_IN_MS),
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
