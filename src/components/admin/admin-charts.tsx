"use client";

import {
  Area,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ContentComposition,
  GrowthPoint,
} from "@/lib/admin/types";

const tooltipStyle = {
  border: "1px solid #eee1dd",
  borderRadius: 16,
  background: "rgba(255, 253, 251, 0.96)",
  boxShadow: "0 12px 30px rgb(111 78 70 / 10%)",
  color: "#4b403d",
  fontSize: 12,
};

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <div className="h-[280px] w-full sm:h-[330px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="recordGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#b77772" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#b77772" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eee4e0" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9b8e89", fontSize: 11 }}
            minTickGap={22}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9b8e89", fontSize: 11 }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            iconType="circle"
            wrapperStyle={{ color: "#776965", fontSize: 12, paddingTop: 12 }}
          />
          <Area
            type="monotone"
            dataKey="records"
            stroke="none"
            fill="url(#recordGlow)"
            legendType="none"
            tooltipType="none"
          />
          <Line
            type="monotone"
            dataKey="records"
            name="记录"
            stroke="#b77772"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="wishes"
            name="愿望"
            stroke="#d8a66d"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="capsules"
            name="时间胶囊"
            stroke="#8f9fc0"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompositionChart({
  data,
}: {
  data: ContentComposition[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-ink-muted">
        还没有内容，第一条记录出现后会在这里形成构成。
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="48%"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={3}
            cornerRadius={8}
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            iconType="circle"
            formatter={(value, entry) => {
              const item = entry.payload as ContentComposition;
              return `${value} ${Math.round((item.value / total) * 100)}%`;
            }}
            wrapperStyle={{ color: "#776965", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
