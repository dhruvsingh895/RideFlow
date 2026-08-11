import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Ban,
  CalendarDays,
  CircleCheck,
  History,
  IndianRupee,
  MapPin,
  Navigation,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { errorMessage } from "../api/client";
import { activeRide, bookRide, rideHistory } from "../api/rides";
import { PageTransition } from "../components/PageTransition";
import { RideCard } from "../components/RideCard";
import { RideMap } from "../components/RideMap";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Field } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { SkeletonRows } from "../components/ui/Skeleton";
import { StatCard } from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { useSocketEvent } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { inr } from "../lib/format";

export function PassengerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    pickup_lat: 2,
    pickup_lng: 3,
    dest_lat: 8,
    dest_lng: 12,
    payment_method: "cash" as "cash" | "wallet" | "upi",
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["rides"] });

  useSocketEvent("ride_accepted", invalidate);
  useSocketEvent("ride_started", invalidate);
  useSocketEvent("ride_completed", invalidate);
  useSocketEvent("ride_cancelled", invalidate);

  const { data: active } = useQuery({
    queryKey: ["rides", "active"],
    queryFn: activeRide,
    refetchInterval: 8000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["rides", "history"],
    queryFn: rideHistory,
  });

  const stats = useMemo(() => {
    const rides = history ?? [];
    return {
      total: rides.length,
      completed: rides.filter((r) => r.status === "completed").length,
      cancelled: rides.filter((r) => r.status === "cancelled").length,
      spent: rides
        .filter((r) => r.status === "completed")
        .reduce((acc, r) => acc + r.fare, 0),
    };
  }, [history]);

  const booking = useMutation({
    mutationFn: () =>
      bookRide({
        pickup: `Point (${form.pickup_lat}, ${form.pickup_lng})`,
        destination: `Point (${form.dest_lat}, ${form.dest_lng})`,
        pickup_lat: form.pickup_lat,
        pickup_lng: form.pickup_lng,
        dest_lat: form.dest_lat,
        dest_lng: form.dest_lng,
        payment_method: form.payment_method,
      }),
    onSuccess: (ride) => {
      if (ride.status === "cancelled") {
        setError("No drivers available right now. Try again in a moment.");
        return;
      }
      toast.success("Ride requested!", "Matching you with the nearest driver.");
      navigate(`/track/${ride.id}`);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const numInput = (key: "pickup_lat" | "pickup_lng" | "dest_lat" | "dest_lng") => ({
    value: form[key],
    min: 0,
    max: 20,
    step: 0.5,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: Number(e.target.value) })),
  });

  return (
    <PageTransition>
      <div className="space-y-8">
        <PageHeader
          title={`Hey ${user?.name.split(" ")[0]} 👋`}
          subtitle={`${new Date().toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })} · Ready to ride?`}
        />

        {active && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-soft dark:border-blue-500/30 dark:from-blue-500/10 dark:to-surface"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Navigation className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">
                    Ride #{active.id} · {active.pickup} → {active.destination}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {active.driver
                      ? `${active.driver.name} · ${active.driver.vehicle_name} is on the way`
                      : "Searching for the nearest driver…"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={active.status} />
                <Link to={`/track/${active.id}`}>
                  <Button size="sm">Track ride</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total trips"
            value={stats.total}
            icon={<CalendarDays className="h-5 w-5" />}
            accent="brand"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={<CircleCheck className="h-5 w-5" />}
            accent="emerald"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            icon={<Ban className="h-5 w-5" />}
            accent="red"
          />
          <StatCard
            label="Total spent"
            value={stats.spent}
            prefix="₹"
            icon={<IndianRupee className="h-5 w-5" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader
                title="Book a ride"
                subtitle="Pickup and drop-off on the 20×20 grid"
              />
              <CardBody>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError("");
                    booking.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Pickup X">
                      <input type="number" required className="input" {...numInput("pickup_lat")} />
                    </Field>
                    <Field label="Pickup Y">
                      <input type="number" required className="input" {...numInput("pickup_lng")} />
                    </Field>
                    <Field label="Drop-off X">
                      <input type="number" required className="input" {...numInput("dest_lat")} />
                    </Field>
                    <Field label="Drop-off Y">
                      <input type="number" required className="input" {...numInput("dest_lng")} />
                    </Field>
                  </div>

                  <Field label="Payment method">
                    <Select
                      value={form.payment_method}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          payment_method: e.target.value as "cash" | "wallet" | "upi",
                        }))
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="wallet">Wallet</option>
                      <option value="upi">UPI</option>
                    </Select>
                  </Field>

                  {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      {error}
                    </p>
                  )}

                  <Button type="submit" loading={booking.isPending} className="w-full" size="lg">
                    <MapPin className="h-4 w-4" />
                    Book ride
                  </Button>
                </form>
              </CardBody>
            </Card>

            <RideMap
              pickup={{ lat: form.pickup_lat, lng: form.pickup_lng }}
              destination={{ lat: form.dest_lat, lng: form.dest_lng }}
            />
          </div>

          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader
                title="Recent rides"
                subtitle="Your latest trips at a glance"
                action={
                  <Link
                    to="/history"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:underline"
                  >
                    View all
                    <History className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              {historyLoading ? (
                <SkeletonRows rows={4} />
              ) : history && history.length > 0 ? (
                <div className="space-y-3 p-5">
                  {history.slice(0, 6).map((ride) => (
                    <RideCard
                      key={ride.id}
                      ride={ride}
                      onClick={() => navigate(`/track/${ride.id}`)}
                      showDriver
                    />
                  ))}
                </div>
              ) : (
                <div className="p-5">
                  <EmptyState
                    compact
                    icon={<MapPin className="h-6 w-6" />}
                    title="No rides yet"
                    description="Book your first ride and it will show up here."
                  />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
