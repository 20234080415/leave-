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
    <div className="admin-page fixed inset-0 z-[100] overflow-y-auto bg-[#f7f7f8] text-[#27272a]">
      <div className="mx-auto min-h-full w-full max-w-[1600px] px-4 pb-16 pt-[max(24px,env(safe-area-inset-top))] sm:px-8 lg:px-10 xl:px-12">
        <header className="flex flex-col gap-5 border-b border-[#e4e4e7] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#65a30d]" />
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#71717a]">
                Development environment
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Leave Admin
            </h1>
            <div className="mt-2 flex flex-col gap-1 text-sm text-[#71717a] sm:flex-row sm:items-center sm:gap-3">
              <span>观察留白是否真的在被使用</span>
              <span className="hidden text-[#d4d4d8] sm:inline">•</span>
              <span>更新于 {formatDateTime(data.updatedAt)}</span>
            </div>
          </div>
          <RefreshButton />
        </header>

        <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {data.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Panel
            eyebrow="Conversion"
            title="用户漏斗"
            description="快速定位关键行为的流失位置"
          >
            <Funnel data={data.funnel} />
          </Panel>

          <Panel
            eyebrow="Last 30 days"
            title="内容增长趋势"
            description="记录、愿望与时间胶囊的每日新增"
          >
            <GrowthChart data={data.growth} />
          </Panel>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(360px,0.7fr)_minmax(0,1.3fr)]">
          <Panel
            eyebrow="Content mix"
            title="内容构成"
            description="用户偏爱的内容类型"
          >
            <CompositionChart data={data.composition} />
          </Panel>

          <Panel
            eyebrow="Space health"
            title="健康度监控"
            description="根据最近 7 天的内容行为自动判断"
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
          </Panel>
        </div>

        <section className="mt-5">
          <Panel
            eyebrow="Top spaces"
            title="活跃空间排行榜"
            description="按记录、愿望和时间胶囊总量排序"
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e4e4e7] bg-[#fafafa] text-xs font-medium text-[#71717a]">
                    <TableHead className="w-16">排名</TableHead>
                    <TableHead>空间</TableHead>
                    <TableHead align="right">成员</TableHead>
                    <TableHead align="right">记录</TableHead>
                    <TableHead align="right">愿望</TableHead>
                    <TableHead align="right">胶囊</TableHead>
                    <TableHead align="right">内容总量</TableHead>
                    <TableHead>最近活跃</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {data.activeSpaces.map((space, index) => (
                    <tr
                      key={space.id}
                      className="border-b border-[#eeeeef] last:border-0 hover:bg-[#fafafa]"
                    >
                      <TableCell className="font-medium text-[#a1a1aa]">
                        {index + 1}
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate font-medium text-[#27272a]">
                        {space.name}
                      </TableCell>
                      <TableCell align="right">{space.memberCount}</TableCell>
                      <TableCell align="right">{space.recordCount}</TableCell>
                      <TableCell align="right">{space.wishCount}</TableCell>
                      <TableCell align="right">{space.capsuleCount}</TableCell>
                      <TableCell align="right">
                        <strong>{space.totalContent}</strong>
                      </TableCell>
                      <TableCell className="text-[#71717a]">
                        {space.lastActiveAt
                          ? formatRelativeTime(space.lastActiveAt)
                          : "尚未产生内容"}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.activeSpaces.length === 0 ? (
                <EmptyTable text="还没有空间数据" />
              ) : null}
            </div>
          </Panel>
        </section>

        <section className="mt-5">
          <Panel
            eyebrow="Latest content"
            title="最近新增内容"
            description="最新 20 条记录、愿望与时间胶囊"
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e4e4e7] bg-[#fafafa] text-xs font-medium text-[#71717a]">
                    <TableHead className="w-32">类型</TableHead>
                    <TableHead>内容预览</TableHead>
                    <TableHead className="w-64">空间</TableHead>
                    <TableHead className="w-44">创建时间</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {data.recentContent.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#eeeeef] last:border-0 hover:bg-[#fafafa]"
                    >
                      <TableCell>
                        <ContentBadge type={item.type} />
                      </TableCell>
                      <TableCell className="max-w-[600px] truncate font-medium text-[#3f3f46]">
                        {item.preview}
                      </TableCell>
                      <TableCell className="max-w-64 truncate text-[#71717a]">
                        {item.spaceName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[#71717a]">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.recentContent.length === 0 ? (
                <EmptyTable text="还没有新增内容" />
              ) : null}
            </div>
          </Panel>
        </section>

        <section className="mt-5">
          <Panel
            eyebrow="Seed users"
            title="种子用户追踪"
            description="逐个观察内测用户是否完成关键动作"
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e4e4e7] bg-[#fafafa] text-xs font-medium text-[#71717a]">
                    <TableHead>邮箱</TableHead>
                    <TableHead align="right">空间数</TableHead>
                    <TableHead align="right">内容数</TableHead>
                    <TableHead>邀请状态</TableHead>
                    <TableHead>对象状态</TableHead>
                    <TableHead>最后活跃</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {data.seedUsers.map((user) => (
                    <SeedUserRow key={user.id} user={user} />
                  ))}
                </tbody>
              </table>
              {data.seedUsers.length === 0 ? (
                <EmptyTable text="还没有注册用户" />
              ) : null}
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: AdminMetric }) {
  const Icon = metricIcons[metric.icon];

  return (
    <article className="flex h-[120px] min-w-0 flex-col justify-between rounded-xl border border-[#e4e4e7] bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0_/_3%)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[#52525b]">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <span className="rounded-full bg-[#f0fdf4] px-2 py-1 text-[11px] font-medium text-[#3f7d44]">
          +{metric.today} today
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-medium text-[#71717a]">{metric.label}</p>
        <strong className="text-3xl font-semibold tracking-[-0.04em] text-[#18181b]">
          {metric.value}
        </strong>
      </div>
    </article>
  );
}

function Funnel({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminDashboardData>>["funnel"];
}) {
  const maximum = Math.max(data[0]?.value ?? 0, 1);

  return (
    <div className="mt-6 grid min-h-[320px] content-center gap-2">
      {data.map((step, index) => {
        const width = Math.max(36, (step.value / maximum) * 100);

        return (
          <div key={step.label}>
            <div
              className="rounded-lg border border-[#e4e4e7] bg-[#fafafa] px-4 py-3"
              style={{ width: `${width}%` }}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{step.label}</span>
                <strong>{step.value}</strong>
              </div>
            </div>
            {index < data.length - 1 ? (
              <div className="flex h-6 items-center gap-2 pl-3 text-[11px] text-[#a1a1aa]">
                <span>↓</span>
                <span>{data[index + 1]?.conversion ?? 0}% 转化</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
  flush = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-[0_1px_2px_rgb(0_0_0_/_3%)]">
      <div className="border-b border-[#eeeeef] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a1a1aa]">
          {eyebrow}
        </p>
        <div className="mt-1 flex flex-col gap-1 lg:flex-row lg:items-baseline lg:justify-between lg:gap-4">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
          <p className="text-xs text-[#71717a]">{description}</p>
        </div>
      </div>
      <div className={flush ? "" : "px-5 pb-5"}>{children}</div>
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
    green: "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]",
    yellow: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
    red: "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
  };

  return (
    <article className={`flex min-h-[150px] flex-col rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-auto text-4xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-2 text-xs opacity-70">{description}</p>
    </article>
  );
}

function SeedUserRow({ user }: { user: SeedUser }) {
  return (
    <tr className="border-b border-[#eeeeef] last:border-0 hover:bg-[#fafafa]">
      <TableCell>
        <p className="max-w-[360px] truncate font-medium text-[#3f3f46]">
          {user.email}
        </p>
        <p className="mt-1 text-[11px] text-[#a1a1aa]">
          注册于 {formatDate(user.signedUpAt)}
        </p>
      </TableCell>
      <TableCell align="right">{user.spaceName ? 1 : 0}</TableCell>
      <TableCell align="right">
        <strong>{user.totalContent}</strong>
      </TableCell>
      <TableCell>
        <StatusBadge
          active={user.hasInvited}
          activeText="已邀请"
          inactiveText="未邀请"
        />
      </TableCell>
      <TableCell>
        <StatusBadge
          active={user.partnerJoined}
          activeText="已加入"
          inactiveText="未加入"
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-[#71717a]">
        {user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : "暂无行为"}
      </TableCell>
    </tr>
  );
}

function TableHead({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3 font-medium ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`px-5 py-3.5 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

function ContentBadge({ type }: { type: ContentKind }) {
  const labels = {
    record: "记录",
    wish: "愿望",
    capsule: "时间胶囊",
  };
  const styles = {
    record: "border-[#fecdd3] bg-[#fff1f2] text-[#9f1239]",
    wish: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
    capsule: "border-[#c7d2fe] bg-[#eef2ff] text-[#4338ca]",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

function StatusBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${
        active
          ? "bg-[#f0fdf4] text-[#166534]"
          : "bg-[#f4f4f5] text-[#71717a]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-[#22c55e]" : "bg-[#a1a1aa]"
        }`}
      />
      {active ? activeText : inactiveText}
    </span>
  );
}

function EmptyTable({ text }: { text: string }) {
  return (
    <div className="px-5 py-12 text-center text-sm text-[#71717a]">{text}</div>
  );
}

function AdminConfigurationError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "读取数据失败";

  return (
    <div className="admin-page fixed inset-0 z-[100] flex items-center justify-center bg-[#f7f7f8] p-5">
      <div className="w-full max-w-lg rounded-xl border border-[#e4e4e7] bg-white p-7 shadow-lg">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#71717a]">
          Leave Admin
        </p>
        <h1 className="mt-3 text-2xl font-semibold">后台暂时无法读取数据</h1>
        <p className="mt-3 text-sm leading-7 text-[#71717a]">{message}</p>
        <div className="mt-5 rounded-lg bg-[#f4f4f5] p-4 text-sm leading-6 text-[#52525b]">
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

  if (absolute < 60 * 1000) return "刚刚";
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
