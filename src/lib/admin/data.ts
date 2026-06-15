import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type {
  ActiveSpace,
  AdminDashboardData,
  ContentKind,
  GrowthPoint,
  RecentContent,
  SeedUser,
} from "@/lib/admin/types";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  created_at: string;
};

type SpaceRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  invite_shared_at: string | null;
};

type MemberRow = {
  space_id: string;
  user_id: string;
  joined_at: string;
};

type ContentRow = {
  id: string;
  space_id: string;
  created_at: string;
  content?: string;
  title?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createAdminClient();
  const [
    profiles,
    spaces,
    members,
    records,
    wishes,
    capsules,
    authUsers,
  ] = await Promise.all([
    fetchAll<ProfileRow>(supabase, "profiles", "id, created_at"),
    fetchAll<SpaceRow>(
      supabase,
      "spaces",
      "id, name, created_by, created_at, invite_shared_at",
    ),
    fetchAll<MemberRow>(
      supabase,
      "space_members",
      "space_id, user_id, joined_at",
    ),
    fetchAll<ContentRow>(
      supabase,
      "daily_records",
      "id, space_id, content, created_at",
    ),
    fetchAll<ContentRow>(
      supabase,
      "wishes",
      "id, space_id, title, created_at",
    ),
    fetchAll<ContentRow>(
      supabase,
      "time_capsules",
      "id, space_id, content, created_at",
    ),
    fetchAllAuthUsers(supabase),
  ]);

  const now = new Date();
  const todayStart = startOfShanghaiDay(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const spaceById = new Map(spaces.map((space) => [space.id, space]));
  const membersBySpace = groupBy(members, (member) => member.space_id);
  const contentBySpace = new Map<
    string,
    { records: ContentRow[]; wishes: ContentRow[]; capsules: ContentRow[] }
  >();

  for (const space of spaces) {
    contentBySpace.set(space.id, {
      records: [],
      wishes: [],
      capsules: [],
    });
  }

  addContentToSpaces(contentBySpace, "records", records);
  addContentToSpaces(contentBySpace, "wishes", wishes);
  addContentToSpaces(contentBySpace, "capsules", capsules);

  const activeSpaces: ActiveSpace[] = spaces
    .map((space) => {
      const content = contentBySpace.get(space.id) ?? {
        records: [],
        wishes: [],
        capsules: [],
      };
      const allContent = [
        ...content.records,
        ...content.wishes,
        ...content.capsules,
      ];

      return {
        id: space.id,
        name: space.name,
        memberCount: membersBySpace.get(space.id)?.length ?? 0,
        recordCount: content.records.length,
        wishCount: content.wishes.length,
        capsuleCount: content.capsules.length,
        totalContent: allContent.length,
        lastActiveAt: latestDate(allContent.map((item) => item.created_at)),
      };
    })
    .sort(
      (left, right) =>
        right.totalContent - left.totalContent ||
        compareDates(right.lastActiveAt, left.lastActiveAt),
    );

  const spacesWithContent = activeSpaces.filter(
    (space) => space.totalContent > 0,
  ).length;
  const invitedSpaces = spaces.filter(
    (space) => space.invite_shared_at !== null,
  ).length;
  const joinedSpaces = spaces.filter(
    (space) => (membersBySpace.get(space.id)?.length ?? 0) >= 2,
  ).length;
  const recentContent = buildRecentContent(
    spaceById,
    records,
    wishes,
    capsules,
  );
  const growth = buildGrowth(now, records, wishes, capsules);
  const seedUsers = buildSeedUsers({
    authUsers,
    profiles,
    spaces,
    members,
    activeSpaces,
  });

  return {
    updatedAt: now.toISOString(),
    metrics: [
      {
        label: "总用户",
        value: profiles.length,
        today: countSince(profiles, todayStart),
        icon: "users",
      },
      {
        label: "总空间",
        value: spaces.length,
        today: countSince(spaces, todayStart),
        icon: "spaces",
      },
      {
        label: "总记录",
        value: records.length,
        today: countSince(records, todayStart),
        icon: "record",
      },
      {
        label: "总愿望",
        value: wishes.length,
        today: countSince(wishes, todayStart),
        icon: "wish",
      },
      {
        label: "总时间胶囊",
        value: capsules.length,
        today: countSince(capsules, todayStart),
        icon: "capsule",
      },
    ],
    funnel: [
      { label: "注册用户", value: profiles.length, conversion: null },
      {
        label: "创建空间",
        value: spaces.length,
        conversion: rate(spaces.length, profiles.length),
      },
      {
        label: "邀请对象",
        value: invitedSpaces,
        conversion: rate(invitedSpaces, spaces.length),
      },
      {
        label: "双方加入成功",
        value: joinedSpaces,
        conversion: rate(joinedSpaces, invitedSpaces),
      },
      {
        label: "产生内容",
        value: spacesWithContent,
        conversion: rate(spacesWithContent, joinedSpaces),
      },
    ],
    growth,
    composition: [
      { name: "记录", value: records.length, color: "#b77772" },
      { name: "愿望", value: wishes.length, color: "#d8a66d" },
      { name: "时间胶囊", value: capsules.length, color: "#8f9fc0" },
    ],
    activeSpaces: activeSpaces.slice(0, 10),
    recentContent,
    health: {
      healthy: activeSpaces.filter((space) => {
        const content = contentBySpace.get(space.id);
        return countRecentContent(content, sevenDaysAgo) >= 5;
      }).length,
      silent: activeSpaces.filter((space) => {
        const content = contentBySpace.get(space.id);
        return space.totalContent > 0 && countRecentContent(content, sevenDaysAgo) === 0;
      }).length,
      atRisk: activeSpaces.filter((space) => space.totalContent === 0).length,
    },
    seedUsers,
  };
}

async function fetchAll<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
) {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    const page = (data ?? []) as T[];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

async function fetchAllAuthUsers(supabase: SupabaseClient) {
  const users: User[] = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw new Error(`auth.users: ${error.message}`);
    }

    users.push(...data.users);

    if (data.users.length < PAGE_SIZE) {
      return users;
    }
  }
}

function buildGrowth(
  now: Date,
  records: ContentRow[],
  wishes: ContentRow[],
  capsules: ContentRow[],
) {
  const points = new Map<string, GrowthPoint>();

  for (let index = 29; index >= 0; index -= 1) {
    const day = new Date(now.getTime() - index * DAY_MS);
    const date = shanghaiDateKey(day);
    points.set(date, {
      date,
      label: new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        month: "numeric",
        day: "numeric",
      }).format(day),
      records: 0,
      wishes: 0,
      capsules: 0,
    });
  }

  incrementGrowth(points, "records", records);
  incrementGrowth(points, "wishes", wishes);
  incrementGrowth(points, "capsules", capsules);

  return [...points.values()];
}

function incrementGrowth(
  points: Map<string, GrowthPoint>,
  key: "records" | "wishes" | "capsules",
  rows: ContentRow[],
) {
  for (const row of rows) {
    const point = points.get(shanghaiDateKey(new Date(row.created_at)));
    if (point) {
      point[key] += 1;
    }
  }
}

function buildRecentContent(
  spaceById: Map<string, SpaceRow>,
  records: ContentRow[],
  wishes: ContentRow[],
  capsules: ContentRow[],
) {
  return [
    ...toRecentContent(spaceById, "record", records),
    ...toRecentContent(spaceById, "wish", wishes),
    ...toRecentContent(spaceById, "capsule", capsules),
  ]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, 20);
}

function toRecentContent(
  spaceById: Map<string, SpaceRow>,
  type: ContentKind,
  rows: ContentRow[],
): RecentContent[] {
  return rows.map((row) => ({
    id: `${type}-${row.id}`,
    type,
    preview: normalizePreview(row.content ?? row.title ?? "未命名内容"),
    spaceName: spaceById.get(row.space_id)?.name ?? "已删除空间",
    createdAt: row.created_at,
  }));
}

function buildSeedUsers({
  authUsers,
  profiles,
  spaces,
  members,
  activeSpaces,
}: {
  authUsers: User[];
  profiles: ProfileRow[];
  spaces: SpaceRow[];
  members: MemberRow[];
  activeSpaces: ActiveSpace[];
}) {
  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const membershipByUser = new Map(
    members.map((member) => [member.user_id, member]),
  );
  const spaceById = new Map(spaces.map((space) => [space.id, space]));
  const activityBySpace = new Map(
    activeSpaces.map((space) => [space.id, space]),
  );
  const membersBySpace = groupBy(members, (member) => member.space_id);

  return profiles
    .map((profile): SeedUser => {
      const membership = membershipByUser.get(profile.id);
      const space = membership ? spaceById.get(membership.space_id) : undefined;
      const activity = space ? activityBySpace.get(space.id) : undefined;

      return {
        id: profile.id,
        email: authById.get(profile.id)?.email ?? "未提供邮箱",
        signedUpAt: authById.get(profile.id)?.created_at ?? profile.created_at,
        spaceName: space?.name ?? null,
        hasInvited: space?.invite_shared_at !== null && Boolean(space),
        partnerJoined: space
          ? (membersBySpace.get(space.id)?.length ?? 0) >= 2
          : false,
        totalContent: activity?.totalContent ?? 0,
        lastActiveAt: activity?.lastActiveAt ?? membership?.joined_at ?? null,
      };
    })
    .sort(
      (left, right) =>
        compareDates(right.lastActiveAt, left.lastActiveAt) ||
        new Date(right.signedUpAt).getTime() -
          new Date(left.signedUpAt).getTime(),
    );
}

function addContentToSpaces(
  target: Map<
    string,
    { records: ContentRow[]; wishes: ContentRow[]; capsules: ContentRow[] }
  >,
  key: "records" | "wishes" | "capsules",
  rows: ContentRow[],
) {
  for (const row of rows) {
    target.get(row.space_id)?.[key].push(row);
  }
}

function countRecentContent(
  content:
    | { records: ContentRow[]; wishes: ContentRow[]; capsules: ContentRow[] }
    | undefined,
  since: Date,
) {
  if (!content) {
    return 0;
  }

  return [...content.records, ...content.wishes, ...content.capsules].filter(
    (item) => new Date(item.created_at) >= since,
  ).length;
}

function groupBy<T>(
  rows: T[],
  getKey: (row: T) => string,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const key = getKey(row);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return grouped;
}

function countSince(rows: { created_at: string }[], since: Date) {
  return rows.filter((row) => new Date(row.created_at) >= since).length;
}

function rate(value: number, previous: number) {
  return previous === 0 ? 0 : Math.round((value / previous) * 100);
}

function latestDate(values: string[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((latest, value) =>
    new Date(value) > new Date(latest) ? value : latest,
  );
}

function compareDates(
  left: string | null,
  right: string | null,
) {
  return new Date(left ?? 0).getTime() - new Date(right ?? 0).getTime();
}

function normalizePreview(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 80 ? `${compact.slice(0, 80)}…` : compact;
}

function shanghaiDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function startOfShanghaiDay(value: Date) {
  return new Date(`${shanghaiDateKey(value)}T00:00:00+08:00`);
}
