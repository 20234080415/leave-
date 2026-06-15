export type ContentKind = "record" | "wish" | "capsule";

export type AdminMetric = {
  label: string;
  value: number;
  today: number;
  icon: "users" | "spaces" | ContentKind;
};

export type FunnelStep = {
  label: string;
  value: number;
  conversion: number | null;
};

export type GrowthPoint = {
  date: string;
  label: string;
  records: number;
  wishes: number;
  capsules: number;
};

export type ContentComposition = {
  name: string;
  value: number;
  color: string;
};

export type ActiveSpace = {
  id: string;
  name: string;
  memberCount: number;
  recordCount: number;
  wishCount: number;
  capsuleCount: number;
  totalContent: number;
  lastActiveAt: string | null;
};

export type RecentContent = {
  id: string;
  type: ContentKind;
  preview: string;
  spaceName: string;
  createdAt: string;
};

export type HealthSummary = {
  healthy: number;
  silent: number;
  atRisk: number;
};

export type SeedUser = {
  id: string;
  email: string;
  signedUpAt: string;
  spaceName: string | null;
  hasInvited: boolean;
  partnerJoined: boolean;
  totalContent: number;
  lastActiveAt: string | null;
};

export type AdminDashboardData = {
  updatedAt: string;
  metrics: AdminMetric[];
  funnel: FunnelStep[];
  growth: GrowthPoint[];
  composition: ContentComposition[];
  activeSpaces: ActiveSpace[];
  recentContent: RecentContent[];
  health: HealthSummary;
  seedUsers: SeedUser[];
};
