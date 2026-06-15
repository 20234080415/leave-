import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { SVGProps } from "react";
import {
  CompositionChart,
  GrowthChart,
} from "@/components/admin/admin-charts";
import { RefreshButton } from "@/components/admin/refresh-button";
import { getAdminDashboardData } from "@/lib/admin/data";
import type {
  AdminMetric,
  ContentKind,
  SeedUser,
} from "@/lib/admin/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leave Admin",
  description: "观察留白是否真的在被使用",
};

export default async function AdminPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  let data;

  try {
    data = await getAdminDashboardData();
  } catch (error) {
    return <AdminConfigurationError error={error} />;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f7f2ef] text-ink">
      <div className="mx-auto min-h-full max-w-[1440px] px-4 pb-16 pt-[max(24px,env(safe-area-inset-top))] sm:px-6 lg:px-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-rose-deep">
              DEVELOPMENT ONLY
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Leave Admin
            </h1>
            <p className="mt-2 text-sm text-ink-muted sm:text-base">
              观察留白是否真的在被使用
            </p>
            <p className="mt-3 text-xs text-ink-faint">
              最后更新：{formatDateTime(data.updatedAt)}
            </p>
          </div>
          <RefreshButton />
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {data.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <SectionCard
            eyebrow="CONVERSION"
            title="用户漏斗"
            description="快速看见用户在哪一步停了下来"
          >
            <div className="mt-6 space-y-3">
              {data.funnel.map((step, index) => {
                const max = Math.max(data.funnel[0]?.value ?? 0, 1);
                const width = Math.max(28, (step.value / max) * 100);

                return (
                  <div key={step.label}>
                    <div
                      className="mx-auto rounded-2xl border border-[#eadedb] bg-gradient-to-r from-[#fff8f6] to-[#f5e5e2] px-4 py-3"
                      style={{ width: `${width}%` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{step.label}</span>
                        <span className="text-lg font-semibold">{step.value}</span>
                      </div>
                    </div>
                    {index < data.funnel.length - 1 ? (
                      <div className="flex h-8 items-center justify-center gap-2 text-xs text-ink-faint">
                        <span>↓</span>
                        <span>
                          {data.funnel[index + 1]?.conversion ?? 0}% 转化
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="LAST 30 DAYS"
            title="内容增长趋势"
            description="记录、愿望与时间胶囊的每日新增"
          >
            <div className="mt-4">
              <GrowthChart data={data.growth} />
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <SectionCard
            eyebrow="CONTENT MIX"
            title="内容构成"
            description="用户真正偏爱的表达方式"
          >
            <CompositionChart data={data.composition} />
          </SectionCard>

          <SectionCard
            eyebrow="SPACE HEALTH"
            title="健康度监控"
            description="按最近 7 天内容行为自动判断"
          >
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HealthCard
                label="健康空间"
                value={data.health.healthy}
                description="7天内内容 ≥ 5条"
                tone="green"
              />
              <HealthCard
                label="沉默空间"
                value={data.health.silent}
                description="7天内没有新内容"
                tone="yellow"
              />
              <HealthCard
                label="危险空间"
                value={data.health.atRisk}
                description="创建后从未产生内容"
                tone="red"
              />
            </div>
          </SectionCard>
        </div>

        <section className="mt-6">
          <SectionCard
            eyebrow="TOP SPACES"
            title="活跃空间排行榜"
            description="按记录、愿望和胶囊总量排序"
          >
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {data.activeSpaces.length ? (
                data.activeSpaces.map((space, index) => (
                  <article
                    key={space.id}
                    className="rounded-[22px] border border-[#eee3df] bg-white/65 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-rose-deep">#{index + 1}</p>
                        <h3 className="mt-1 truncate font-medium">
                          {space.name}
                        </h3>
                      </div>
                      <span className="rounded-full bg-[#f3e5e2] px-3 py-1 text-xs text-rose-deep">
                        {space.totalContent} 条内容
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      <MiniStat label="成员" value={space.memberCount} />
                      <MiniStat label="记录" value={space.recordCount} />
                      <MiniStat label="愿望" value={space.wishCount} />
                      <MiniStat label="胶囊" value={space.capsuleCount} />
                    </div>
                    <p className="mt-4 text-xs text-ink-faint">
                      最近活跃：
                      {space.lastActiveAt
                        ? formatRelativeTime(space.lastActiveAt)
                        : "尚未产生内容"}
                    </p>
                  </article>
                ))
              ) : (
                <EmptyState text="还没有空间数据" />
              )}
            </div>
          </SectionCard>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <SectionCard
            eyebrow="LATEST CONTENT"
            title="最近新增内容"
            description="最新 20 条记录、愿望与胶囊"
          >
            <div className="mt-5 space-y-3">
              {data.recentContent.length ? (
                data.recentContent.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[20px] border border-[#eee3df] bg-white/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <ContentBadge type={item.type} />
                      <time className="text-xs text-ink-faint">
                        {formatRelativeTime(item.createdAt)}
                      </time>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6">
                      {item.preview}
                    </p>
                    <p className="mt-2 truncate text-xs text-ink-muted">
                      {item.spaceName}
                    </p>
                  </article>
                ))
              ) : (
                <EmptyState text="还没有新增内容" />
              )}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="SEED USERS"
            title="种子用户追踪"
            description="方便逐个观察内测用户是否完成关键动作"
          >
            <div className="mt-5 space-y-3">
              {data.seedUsers.length ? (
                data.seedUsers.map((user) => (
                  <SeedUserCard key={user.id} user={user} />
                ))
              ) : (
                <EmptyState text="还没有注册用户" />
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: AdminMetric }) {
  const Icon = metricIcons[metric.icon];

  return (
    <article className="rounded-[24px] border border-white/80 bg-[rgb(255_253_251_/_88%)] p-4 shadow-[0_16px_40px_rgb(111_78_70_/_7%)] sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4e4e1] text-rose-deep">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-xs text-ink-muted">{metric.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <strong className="text-3xl font-semibold tracking-[-0.04em]">
          {metric.value}
        </strong>
        <span className="pb-1 text-xs text-[#648267]">
          +{metric.today} today
        </span>
      </div>
    </article>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/80 bg-[rgb(255_253_251_/_88%)] p-5 shadow-[0_18px_45px_rgb(111_78_70_/_7%)] sm:p-6">
      <p className="text-[11px] font-medium tracking-[0.18em] text-rose-deep">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
      {children}
    </section>
  );
}

function HealthCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  tone: "green" | "yellow" | "red";
}) {
  const tones = {
    green: "border-[#dce9dc] bg-[#f2f8f2] text-[#56745a]",
    yellow: "border-[#eee1bd] bg-[#fbf7e8] text-[#8a7138]",
    red: "border-[#efd8d5] bg-[#fbefed] text-[#a15e59]",
  };

  return (
    <article className={`rounded-[22px] border p-5 ${tones[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-2 text-xs opacity-75">{description}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#f8f2ef] px-2 py-2">
      <p className="text-sm font-medium">{value}</p>
      <p className="mt-0.5 text-[10px] text-ink-faint">{label}</p>
    </div>
  );
}

function ContentBadge({ type }: { type: ContentKind }) {
  const labels = {
    record: "记录",
    wish: "愿望",
    capsule: "时间胶囊",
  };
  const styles = {
    record: "bg-[#f5e2df] text-[#9b5f5b]",
    wish: "bg-[#f8eddc] text-[#9a733f]",
    capsule: "bg-[#e8ebf4] text-[#67769a]",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function SeedUserCard({ user }: { user: SeedUser }) {
  return (
    <article className="rounded-[20px] border border-[#eee3df] bg-white/60 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="truncate text-sm font-medium">{user.email}</p>
        <span className="text-xs text-ink-faint">
          注册于 {formatDate(user.signedUpAt)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatusPill label="创建空间" active={Boolean(user.spaceName)} />
        <StatusPill label="邀请对象" active={user.hasInvited} />
        <StatusPill label="对象加入" active={user.partnerJoined} />
        <div className="rounded-xl bg-[#f8f2ef] px-3 py-2 text-xs">
          内容 <strong className="ml-1">{user.totalContent}</strong>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1 text-xs text-ink-muted sm:flex-row sm:justify-between">
        <span className="truncate">{user.spaceName ?? "尚未创建或加入空间"}</span>
        <span>
          最后活跃：
          {user.lastActiveAt
            ? formatRelativeTime(user.lastActiveAt)
            : "暂无行为"}
        </span>
      </div>
    </article>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-xs ${
        active
          ? "bg-[#edf5ed] text-[#5f7d63]"
          : "bg-[#f5f0ed] text-ink-faint"
      }`}
    >
      {active ? "✓" : "—"} {label}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#e5d6d1] px-4 py-10 text-center text-sm text-ink-muted">
      {text}
    </div>
  );
}

function AdminConfigurationError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "读取数据失败";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f7f2ef] p-5">
      <div className="w-full max-w-lg rounded-[28px] bg-[#fffdfb] p-7 shadow-[0_20px_60px_rgb(111_78_70_/_10%)]">
        <p className="text-xs tracking-[0.18em] text-rose-deep">
          LEAVE ADMIN
        </p>
        <h1 className="mt-3 text-2xl font-semibold">后台暂时无法读取数据</h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">{message}</p>
        <div className="mt-5 rounded-2xl bg-[#f8f1ee] p-4 text-sm leading-6 text-ink-muted">
          请确认本地 `.env.local` 已配置 `SUPABASE_SERVICE_ROLE_KEY`，并已执行最新
          Supabase migration。服务角色密钥不会发送到浏览器。
        </div>
      </div>
    </div>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

const metricIcons = {
  users: UsersIcon,
  spaces: SpacesIcon,
  record: RecordIcon,
  wish: WishIcon,
  capsule: CapsuleIcon,
};

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8" />
    </IconBase>
  );
}

function SpacesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </IconBase>
  );
}

function RecordIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 3.5h9.5A2.5 2.5 0 0 1 18 6v14H8.5A2.5 2.5 0 0 1 6 17.5v-14Z" />
      <path d="M6 17.5A2.5 2.5 0 0 1 8.5 15H18M9 8h6" />
    </IconBase>
  );
}

function WishIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 2.7 5.4 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 3Z" />
    </IconBase>
  );
}

function CapsuleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.3 4.6a5 5 0 0 1 7.1 7.1l-3.7 3.7a5 5 0 0 1-7.1-7.1l3.7-3.7Z" />
      <path d="m7.2 12.8 4-4" />
    </IconBase>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatRelativeTime(value: string) {
  const difference = new Date(value).getTime() - Date.now();
  const absolute = Math.abs(difference);
  const formatter = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });

  if (absolute < 60 * 1000) {
    return "刚刚";
  }

  if (absolute < 60 * 60 * 1000) {
    return formatter.format(Math.round(difference / (60 * 1000)), "minute");
  }

  if (absolute < 24 * 60 * 60 * 1000) {
    return formatter.format(
      Math.round(difference / (60 * 60 * 1000)),
      "hour",
    );
  }

  if (absolute < 7 * 24 * 60 * 60 * 1000) {
    return formatter.format(
      Math.round(difference / (24 * 60 * 60 * 1000)),
      "day",
    );
  }

  return formatDate(value);
}
