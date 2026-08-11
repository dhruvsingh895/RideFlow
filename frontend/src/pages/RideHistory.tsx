import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { rideHistory } from "../api/rides";
import { PageTransition } from "../components/PageTransition";
import { RideCard } from "../components/RideCard";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchInput } from "../components/ui/SearchInput";
import { SkeletonCards } from "../components/ui/Skeleton";
import { inr } from "../lib/format";
import type { RideStatus } from "../types";

const statuses: { key: RideStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "started", label: "Active" },
];

export function RideHistory() {
  const { data: rides, isLoading } = useQuery({
    queryKey: ["rides", "history"],
    queryFn: rideHistory,
  });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RideStatus | "all">("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(() => {
    if (!rides) return [];
    const q = query.trim().toLowerCase();
    return rides.filter((ride) => {
      if (status !== "all" && ride.status !== status) return false;
      if (!q) return true;
      return (
        ride.pickup.toLowerCase().includes(q) ||
        ride.destination.toLowerCase().includes(q)
      );
    });
  }, [rides, query, status]);

  const totals = useMemo(() => {
    const done = (rides ?? []).filter((r) => r.status === "completed");
    return {
      count: done.length,
      sum: done.reduce((a, r) => a + r.fare, 0),
    };
  }, [rides]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Ride history"
          subtitle={`${totals.count} completed · ${inr(totals.sum)} spent`}
          icon={History}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1 rounded-xl border border-edge bg-surface p-1">
            {statuses.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setStatus(s.key);
                  setPage(1);
                }}
                className={[
                  "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition",
                  status === s.key
                    ? "bg-ink text-bg shadow-sm dark:bg-white dark:text-ink"
                    : "text-muted hover:text-ink",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search pickup or destination…"
            className="sm:w-72"
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <motion.div layout className="space-y-3">
          {isLoading ? (
            <SkeletonCards count={4} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title={query || status !== "all" ? "No matching rides" : "No rides yet"}
              description={
                query || status !== "all"
                  ? "Try adjusting your search or filters."
                  : "Book your first ride and it will appear here."
              }
              action={
                query || status !== "all" ? undefined : (
                  <Link to="/passenger">
                    <span className="text-sm font-semibold text-brand hover:underline">
                      Book a ride →
                    </span>
                  </Link>
                )
              }
            />
          ) : (
            <>
              {rows.map((ride, i) => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <RideCard ride={ride} />
                </motion.div>
              ))}

              {filtered.length > pageSize && (
                <Pagination
                  page={current}
                  pageCount={pageCount}
                  onChange={setPage}
                  className="pt-2"
                />
              )}
            </>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
