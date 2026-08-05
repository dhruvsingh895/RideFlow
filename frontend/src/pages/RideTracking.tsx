import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  Car,
  CircleCheck,
  Clock,
  CreditCard,
  Flag,
  MapPin,
  Navigation,
  Star,
  Timer,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { errorMessage } from "../api/client";
import { cancelRide, rideDetail } from "../api/rides";
import { PageTransition } from "../components/PageTransition";
import { RideMap } from "../components/RideMap";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { useSocketEvent } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { cn, etaMinutes, inr } from "../lib/format";
import type { Location, Ride, RideStatus } from "../types";

const steps: { key: RideStatus; label: string; icon: typeof Clock }[] = [
  { key: "requested", label: "Finding a driver", icon: Zap },
  { key: "accepted", label: "Driver assigned", icon: Car },
  { key: "started", label: "On the way", icon: Navigation },
  { key: "completed", label: "Completed", icon: CircleCheck },
];

const payIcon = { cash: Wallet, wallet: Wallet, upi: CreditCard };

export function RideTracking() {
  const { id } = useParams<{ id: string }>();
  const rideId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [driverPos, setDriverPos] = useState<Location | null>(null);
  const [error, setError] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ride", rideId] });

  const { data: ride, isLoading } = useQuery({
    queryKey: ["ride", rideId],
    queryFn: () => rideDetail(rideId),
    refetchInterval: 8000,
    enabled: Number.isFinite(rideId),
  });

  useSocketEvent("driver_location", (data) => {
    if (data?.ride_id === rideId) {
      setDriverPos({ lat: data.lat, lng: data.lng });
    }
  });

  useSocketEvent("ride_accepted", (data) => {
    if (data?.ride_id === rideId) {
      const d = data.driver;
      if (d?.lat != null && d?.lng != null) {
        setDriverPos({ lat: d.lat, lng: d.lng });
      }
      toast.success(
        `${d?.name ?? "Your driver"} accepted the ride`,
        `${d?.vehicle_name ?? ""} · ${d?.vehicle_number ?? ""}`.trim()
      );
      invalidate();
    }
  });

  useSocketEvent("ride_started", (data) => {
    if (data?.ride_id === rideId) {
      toast.info("Trip started", "Your driver is on the way to the destination.");
      invalidate();
    }
  });

  useSocketEvent("ride_completed", (data) => {
    if (data?.ride_id === rideId) {
      toast.success("Trip completed", `Fare of ${inr(data?.fare)} charged via ${ride?.payment_method ?? "card"}.`);
      invalidate();
    }
  });

  useSocketEvent("ride_cancelled", (data) => {
    if (data?.ride_id === rideId) invalidate();
  });

  useEffect(() => {
    if (ride?.driver?.lat != null && ride.driver.lng != null && !driverPos) {
      setDriverPos({ lat: ride.driver.lat, lng: ride.driver.lng });
    }
  }, [ride, driverPos]);

  const cancel = useMutation({
    mutationFn: () => cancelRide(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      toast.info("Ride cancelled", "Hope to see you again soon.");
      navigate("/passenger");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const eta = useMemo(() => {
    if (!driverPos || !ride) return null;
    return etaMinutes(
      Math.hypot(driverPos.lat - ride.pickup_lat, driverPos.lng - ride.pickup_lng)
    );
  }, [driverPos, ride]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[420px] rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted">Ride not found.</p>
        <Link to="/passenger" className="mt-4 inline-block text-brand hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const PayIcon = payIcon[ride.payment_method] ?? Wallet;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/passenger")}
              aria-label="Back to dashboard"
              className="btn-focus grid h-10 w-10 place-items-center rounded-xl border border-edge bg-surface text-muted transition hover:bg-surface2 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Ride #{ride.id}
              </h1>
              <p className="text-sm text-muted">
                {new Date(ride.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <StatusBadge status={ride.status} />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="relative">
              <RideMap
                pickup={{ lat: ride.pickup_lat, lng: ride.pickup_lng }}
                destination={{ lat: ride.dest_lat, lng: ride.dest_lng }}
                driver={driverPos}
              />

              <AnimatePresence>
                {ride.status !== "cancelled" && ride.status !== "completed" && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-4 left-4 right-4 sm:right-auto"
                  >
                    <div className="rounded-2xl border border-edge bg-surface/95 p-4 shadow-lift backdrop-blur">
                      {ride.driver ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              <Car className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="text-sm font-bold text-ink">
                                {ride.driver.name}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-muted">
                                {ride.driver.vehicle_name} · {ride.driver.vehicle_number}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {ride.driver.rating.toFixed(1)}
                            </span>
                            {eta !== null && (
                              <span className="flex items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                                <Timer className="h-3.5 w-3.5" />
                                {eta} min away
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 animate-pulse place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
                            <Zap className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              Searching for the nearest driver…
                            </p>
                            <p className="text-xs text-muted">
                              You'll be notified the moment someone accepts.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Card className="mt-6">
              <CardHeader title="Journey" subtitle="Live trip progress" />
              <CardBody>
                <ol className="relative ml-3 space-y-6 border-l border-edge pl-6">
                  {steps.map((step, i) => {
                    const isCancelled = ride.status === "cancelled";
                    const done =
                      isCancelled
                        ? false
                        : steps.findIndex((s) => s.key === ride.status) > i ||
                          (i === 3 && ride.status === "completed");
                    const current = !isCancelled && steps.findIndex((s) => s.key === ride.status) === i;
                    const cancelledStep = isCancelled && i === 0;
                    return (
                      <li key={step.key} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[43px] top-0 grid h-8 w-8 place-items-center rounded-full border transition-all",
                            done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : cancelledStep
                                ? "border-red-500 bg-red-500 text-white"
                                : current
                                  ? "border-brand bg-brand text-white shadow-glow"
                                  : "border-edge bg-surface text-muted"
                          )}
                        >
                          {done ? (
                            <CircleCheck className="h-4 w-4" />
                          ) : cancelledStep ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <step.icon className="h-4 w-4" />
                          )}
                        </span>
                        <div className="pt-1">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              done || current || cancelledStep
                                ? "text-ink"
                                : "text-muted"
                            )}
                          >
                            {cancelledStep ? "Cancelled" : step.label}
                          </p>
                          {current && (
                            <p className="mt-0.5 animate-pulse-soft text-xs text-muted">
                              {step.key === "requested"
                                ? "Matching with online drivers…"
                                : step.key === "accepted"
                                  ? "Driver is heading to your pickup point"
                                  : "Driver is on the road to drop you off"}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Trip details" />
              <CardBody className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Pickup
                    </p>
                    <p className="text-sm font-semibold text-ink">{ride.pickup}</p>
                  </div>
                </div>
                <div className="ml-4 h-6 w-px border-l border-dashed border-edge" />
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-500">
                    <Flag className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Destination
                    </p>
                    <p className="text-sm font-semibold text-ink">{ride.destination}</p>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3 border-t border-edge/70 pt-4">
                  <div className="rounded-xl bg-surface2/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Fare estimate
                    </p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                      {inr(ride.fare)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface2/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Payment
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize text-ink">
                      <PayIcon className="h-4 w-4 text-muted" />
                      {ride.payment_method}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {ride.status === "requested" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
                  Finding your driver
                </p>
                <p className="mt-1.5 text-xs text-amber-600/80 dark:text-amber-200/70">
                  The nearest online driver is being notified right now.
                </p>
              </motion.div>
            )}

            {ride.status === "completed" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-surface"
              >
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-card">
                  <CircleCheck className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-lg font-bold text-ink">Ride completed</h2>
                <p className="mt-1 text-sm text-muted">Thanks for riding with RideFlow.</p>
                <p className="mt-3 text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {inr(ride.fare)}
                </p>
                <p className="mt-0.5 text-xs capitalize text-muted">
                  paid via {ride.payment_method}
                </p>
                <Link to="/passenger" className="mt-5 block">
                  <Button className="w-full">Back to dashboard</Button>
                </Link>
              </motion.div>
            )}

            {ride.status === "cancelled" && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10">
                <Ban className="mx-auto h-8 w-8 text-red-500" />
                <h2 className="mt-3 text-lg font-bold text-ink">Ride cancelled</h2>
                <p className="mt-1 text-sm text-muted">
                  {ride.driver_id
                    ? "The ride was cancelled."
                    : "No drivers were available for this ride."}
                </p>
                <Link to="/passenger" className="mt-5 block">
                  <Button variant="secondary" className="w-full">
                    Back to dashboard
                  </Button>
                </Link>
              </div>
            )}

            {(ride.status === "requested" || ride.status === "accepted") && (
              <div>
                {error && (
                  <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </p>
                )}
                <Button
                  variant="danger"
                  className="w-full"
                  loading={cancel.isPending}
                  onClick={() => cancel.mutate()}
                >
                  <Ban className="h-4 w-4" />
                  Cancel ride
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export type { Ride };
