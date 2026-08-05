import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Ride } from "../types";
import { Card, CardBody, CardHeader } from "./ui/Card";

const tooltipStyle = {
  background: "rgb(var(--surface))",
  border: "1px solid rgb(var(--edge))",
  borderRadius: "12px",
  fontSize: "12px",
  color: "rgb(var(--ink))",
  boxShadow: "0 12px 32px -12px rgb(15 23 42 / 0.25)",
};

const axisTick = { fill: "rgb(var(--muted))", fontSize: 11 };

const statusColors: Record<string, string> = {
  completed: "#10B981",
  cancelled: "#EF4444",
  active: "#2563EB",
};

export function RideStatusDonut({ rides }: { rides: Ride[] }) {
  const data = useMemo(() => {
    const counts = { completed: 0, cancelled: 0, active: 0 };
    rides.forEach((r) => {
      if (r.status === "completed") counts.completed += 1;
      else if (r.status === "cancelled") counts.cancelled += 1;
      else counts.active += 1;
    });
    return [
      { name: "Completed", value: counts.completed, color: statusColors.completed },
      { name: "Cancelled", value: counts.cancelled, color: statusColors.cancelled },
      { name: "Active", value: counts.active, color: statusColors.active },
    ].filter((d) => d.value > 0);
  }, [rides]);

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">No rides yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={88}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RidesLastWeek({ rides }: { rides: Ride[] }) {
  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        total: 0,
        completed: 0,
        cancelled: 0,
      };
    });
    rides.forEach((r) => {
      const day = new Date(r.created_at);
      const key = day.toLocaleDateString(undefined, { weekday: "short" });
      const entry = days.find((d) => d.label === key);
      if (entry) {
        entry.total += 1;
        if (r.status === "completed") entry.completed += 1;
        else if (r.status === "cancelled") entry.cancelled += 1;
      }
    });
    return days;
  }, [rides]);

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--edge))" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgb(var(--surface-2))", opacity: 0.6 }} />
        <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[5, 5, 0, 0]} />
        <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EarningsChart({ rides }: { rides: Ride[] }) {
  const data = useMemo(() => {
    const completed = rides
      .filter((r) => r.status === "completed")
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    let acc = 0;
    return completed.map((r) => {
      acc += r.fare;
      return {
        label: new Date(r.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        earnings: Math.round(acc * 100) / 100,
      };
    });
  }, [rides]);

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">No completed rides yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--edge))" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="earnings"
          name="Earnings"
          stroke="#2563EB"
          strokeWidth={2.5}
          fill="url(#earn)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>{children}</CardBody>
    </Card>
  );
}
