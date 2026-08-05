import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  Ban,
  Car,
  CircleCheck,
  CircleDollarSign,
  Route,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { adminDrivers, adminRides, adminStats, adminUsers } from "../api/admin";
import { PageTransition } from "../components/PageTransition";
import { ChartCard, EarningsChart, RidesLastWeek, RideStatusDonut } from "../components/charts";
import { StatusBadge } from "../components/StatusBadge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchInput } from "../components/ui/SearchInput";
import { Skeleton } from "../components/ui/Skeleton";
import { StatCard } from "../components/ui/StatCard";
import { cn, fmtDateTime, inr } from "../lib/format";
import type { AdminDriver, AdminRide, AdminUser, Ride } from "../types";
import type { AdminTab } from "../components/layout/AdminSidebar";

const PAGE_SIZE = 8;

function useTable<T>(rows: T[], key: (row: T) => string, pageSize = PAGE_SIZE) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => key(r).toLowerCase().includes(q));
  }, [rows, query, key]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  return {
    query,
    setQuery: (v: string) => {
      setQuery(v);
      setPage(1);
    },
    rows: filtered.slice((current - 1) * pageSize, current * pageSize),
    pageCount,
    page: current,
    setPage,
  };
}

function roleChip(role: string) {
  const tone =
    role === "admin"
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : role === "driver"
        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
        : "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", tone)}>
      {role}
    </span>
  );
}

function Overview({ stats, rides }: { stats: AdminStats | undefined; rides: AdminRide[] | undefined }) {
  const rideShape = rides as unknown as Ride[] | undefined;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={stats?.revenue ?? 0}
          prefix="₹"
          sub="from completed rides"
          icon={<CircleDollarSign className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          label="Total rides"
          value={stats?.rides_total ?? 0}
          icon={<Route className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Completed"
          value={stats?.rides_completed ?? 0}
          sub={`${stats?.rides_cancelled ?? 0} cancelled`}
          icon={<CircleCheck className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          label="Active right now"
          value={stats?.rides_active ?? 0}
          icon={<Activity className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="Users"
          value={stats?.users_total ?? 0}
          icon={<Users className="h-5 w-5" />}
          accent="violet"
        />
        <StatCard
          label="Passengers"
          value={stats?.passengers_total ?? 0}
          icon={<UserRound className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Drivers"
          value={stats?.drivers_total ?? 0}
          sub={`${stats?.drivers_online ?? 0} online now`}
          icon={<Car className="h-5 w-5" />}
          accent="violet"
        />
        <StatCard
          label="Cancelled"
          value={stats?.rides_cancelled ?? 0}
          icon={<Ban className="h-5 w-5" />}
          accent="red"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Earnings" subtitle="Cumulative revenue from completed rides">
          <EarningsChart rides={rideShape ?? []} />
        </ChartCard>
        <ChartCard title="Rides this week" subtitle="Completed vs cancelled by day">
          <RidesLastWeek rides={rideShape ?? []} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Ride status split" subtitle="Share of all rides">
          <RideStatusDonut rides={rideShape ?? []} />
        </ChartCard>
        <Card>
          <CardHeader title="Quick facts" subtitle="Platform health at a glance" />
          <CardBody className="grid grid-cols-2 gap-3">
            {[
              { label: "Completion rate", value: stats?.rides_total ? `${Math.round(((stats.rides_completed ?? 0) / stats.rides_total) * 100)}%` : "—" },
              { label: "Drivers online", value: `${stats?.drivers_online ?? 0}/${stats?.drivers_total ?? 0}` },
              { label: "Avg fare", value: stats?.rides_completed ? inr((stats.revenue ?? 0) / stats.rides_completed) : "—" },
              { label: "Live rides", value: stats?.rides_active ?? 0 },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-edge bg-surface2/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {f.label}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-ink">{f.value}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function UsersTable({ users }: { users: AdminUser[] | undefined }) {
  const t = useTable(users ?? [], (u) => `${u.name} ${u.email} ${u.phone} ${u.role}`);
  return (
    <Card>
      <CardHeader
        title="Users"
        subtitle={`${users?.length ?? 0} registered accounts`}
        action={
          <SearchInput
            value={t.query}
            onChange={t.setQuery}
            placeholder="Search users…"
            className="w-56"
          />
        }
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Role</th>
                <th className="th">Joined</th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((u) => (
                <tr key={u.id} className="group transition hover:bg-surface2/50">
                  <td className="td">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
                      {u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span className="ml-3 font-semibold text-ink">{u.name}</span>
                  </td>
                  <td className="td text-muted">{u.email}</td>
                  <td className="td text-muted">{u.phone}</td>
                  <td className="td">{roleChip(u.role)}</td>
                  <td className="td text-muted">{fmtDateTime(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {t.rows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">No users found.</p>
          )}
        </div>
        {t.pageCount > 1 && (
          <div className="border-t border-edge/70 px-4 py-3">
            <Pagination page={t.page} pageCount={t.pageCount} onChange={t.setPage} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function DriversTable({ drivers }: { drivers: AdminDriver[] | undefined }) {
  const t = useTable(
    drivers ?? [],
    (d) => `${d.name} ${d.email} ${d.vehicle_name} ${d.vehicle_number}`
  );
  return (
    <Card>
      <CardHeader
        title="Drivers"
        subtitle={`${drivers?.length ?? 0} verified drivers`}
        action={
          <SearchInput
            value={t.query}
            onChange={t.setQuery}
            placeholder="Search drivers…"
            className="w-56"
          />
        }
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="th">Driver</th>
                <th className="th">Vehicle</th>
                <th className="th">Rating</th>
                <th className="th">Status</th>
                <th className="th text-right">Rides</th>
                <th className="th text-right">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((d) => (
                <tr key={d.id} className="group transition hover:bg-surface2/50">
                  <td className="td">
                    <p className="font-semibold text-ink">{d.name}</p>
                    <p className="text-xs text-muted">{d.email}</p>
                  </td>
                  <td className="td">
                    <p className="text-ink">{d.vehicle_name}</p>
                    <p className="text-xs text-muted">{d.vehicle_number}</p>
                  </td>
                  <td className="td">
                    <span className="flex w-fit items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <Star className="h-3 w-3 fill-current" />
                      {d.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="td">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        d.is_online
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-edge bg-surface2 text-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          d.is_online ? "animate-pulse-soft bg-emerald-500" : "bg-muted"
                        )}
                      />
                      {d.is_online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="td text-right font-semibold text-ink">
                    {d.rides_completed}
                  </td>
                  <td className="td text-right font-bold text-ink">{inr(d.total_earnings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {t.rows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">No drivers found.</p>
          )}
        </div>
        {t.pageCount > 1 && (
          <div className="border-t border-edge/70 px-4 py-3">
            <Pagination page={t.page} pageCount={t.pageCount} onChange={t.setPage} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function RidesTable({ rides }: { rides: AdminRide[] | undefined }) {
  const t = useTable(
    rides ?? [],
    (r) =>
      `${r.id} ${r.passenger_name} ${r.driver_name ?? ""} ${r.pickup} ${r.destination} ${r.payment_method} ${r.status}`
  );
  return (
    <Card>
      <CardHeader
        title="Rides"
        subtitle={`${rides?.length ?? 0} total rides`}
        action={
          <SearchInput
            value={t.query}
            onChange={t.setQuery}
            placeholder="Search rides…"
            className="w-56"
          />
        }
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="th">#</th>
                <th className="th">Passenger</th>
                <th className="th">Driver</th>
                <th className="th">Route</th>
                <th className="th">Payment</th>
                <th className="th text-right">Fare</th>
                <th className="th text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r) => (
                <tr key={r.id} className="group transition hover:bg-surface2/50">
                  <td className="td font-mono text-xs text-muted">#{r.id}</td>
                  <td className="td font-semibold text-ink">{r.passenger_name}</td>
                  <td className="td text-muted">{r.driver_name ?? "—"}</td>
                  <td className="td max-w-[220px] truncate text-muted">
                    {r.pickup} → {r.destination}
                  </td>
                  <td className="td capitalize text-muted">{r.payment_method}</td>
                  <td className="td text-right font-bold text-ink">{inr(r.fare)}</td>
                  <td className="td text-right">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {t.rows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">No rides found.</p>
          )}
        </div>
        {t.pageCount > 1 && (
          <div className="border-t border-edge/70 px-4 py-3">
            <Pagination page={t.page} pageCount={t.pageCount} onChange={t.setPage} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function AdminDashboard({ tab }: { tab: AdminTab }) {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminStats,
    refetchInterval: 10000,
  });
  const { data: users } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminUsers,
    refetchInterval: 15000,
  });
  const { data: drivers } = useQuery({
    queryKey: ["admin", "drivers"],
    queryFn: adminDrivers,
    refetchInterval: 10000,
  });
  const { data: rides } = useQuery({
    queryKey: ["admin", "rides"],
    queryFn: adminRides,
    refetchInterval: 10000,
  });

  const titles: Record<AdminTab, { title: string; subtitle: string }> = {
    overview: { title: "Overview", subtitle: "Platform performance at a glance" },
    users: { title: "Users", subtitle: "Everyone registered on RideFlow" },
    drivers: { title: "Drivers", subtitle: "Driver fleet and availability" },
    rides: { title: "Rides", subtitle: "All trips across the platform" },
  };

  return (
    <PageTransition>
      <PageHeader
        title={titles[tab].title}
        subtitle={titles[tab].subtitle}
        icon={tab === "overview" ? Activity : tab === "users" ? Users : tab === "drivers" ? Car : Route}
      />

      {!stats ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          {tab === "overview" && <Overview stats={stats} rides={rides} />}
          {tab === "users" && <UsersTable users={users} />}
          {tab === "drivers" && <DriversTable drivers={drivers} />}
          {tab === "rides" && <RidesTable rides={rides} />}
        </motion.div>
      )}

      {(tab === "users" || tab === "drivers" || tab === "rides") && (
        <div className="mt-6">
          {tab === "users" && users === undefined && <Skeleton className="h-64 rounded-3xl" />}
          {tab === "drivers" && drivers === undefined && <Skeleton className="h-64 rounded-3xl" />}
          {tab === "rides" && rides === undefined && <Skeleton className="h-64 rounded-3xl" />}
        </div>
      )}
    </PageTransition>
  );
}
