import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Car, CircleDollarSign, Clock, MapPin, Radio, Receipt } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { errorMessage } from "../api/client";
import {
  driverRides,
  goOffline,
  goOnline,
  updateLocation,
} from "../api/drivers";
import { acceptRide, completeRide, rejectRide, startRide } from "../api/rides";
import { PageTransition } from "../components/PageTransition";
import { RideCard } from "../components/RideCard";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { StatCard } from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { useSocketEvent } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import { cn, inr } from "../lib/format";

interface RideRequest {
  ride_id: number;
  pickup: string;
  destination: string;
  fare: number;
  payment_method: string;
  passenger: { name: string; phone: string };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function DriverDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [online, setOnline] = useState(user?.driver?.is_online ?? false);
  const [loc, setLoc] = useState({
    lat: user?.driver?.current_lat ?? 3,
    lng: user?.driver?.current_lng ?? 3,
  });
  const [broadcast, setBroadcast] = useState(false);
  const [request, setRequest] = useState<RideRequest | null>(null);
  const [error, setError] = useState("");
  const broadcastRef = useRef(broadcast);
  const onlineRef = useRef(online);
  broadcastRef.current = broadcast;
  onlineRef.current = online;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["driver", "rides"] });

  const { data, isLoading } = useQuery({
    queryKey: ["driver", "rides"],
    queryFn: driverRides,
    refetchInterval: 6000,
  });

  useSocketEvent("ride_request", (data) => {
    setRequest(data as RideRequest);
    setError("");
    toast.info(
      "New ride request",
      `Ride #${(data as RideRequest).ride_id} from ${(data as RideRequest).pickup}`,
      { hideAfter: 6000 }
    );
  });

  useEffect(() => {
    if (!onlineRef.current || !broadcastRef.current) return;
    const interval = setInterval(() => {
      setLoc((prev) => {
        const next = {
          lat: clamp(prev.lat + (Math.random() - 0.5) * 0.6, 0, 20),
          lng: clamp(prev.lng + (Math.random() - 0.5) * 0.6, 0, 20),
        };
        updateLocation(next.lat, next.lng).catch(() => undefined);
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleOnline = async () => {
    setError("");
    if (online) {
      await goOffline();
      setOnline(false);
      toast.info("You are now offline", "New ride requests are paused.");
    } else {
      try {
        await goOnline(loc.lat, loc.lng);
        setOnline(true);
        toast.success("You are now online", "Ride requests will be broadcast to you.");
      } catch (err) {
        setError(errorMessage(err));
      }
    }
    invalidate();
  };

  const sendLocation = async () => {
    try {
      await updateLocation(loc.lat, loc.lng);
      setError("");
      toast.success("Location updated", `Now at (${loc.lat}, ${loc.lng}).`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const accept = useMutation({
    mutationFn: (rideId: number) => acceptRide(rideId),
    onSuccess: () => {
      setRequest(null);
      invalidate();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: (rideId: number) => rejectRide(rideId),
    onSuccess: () => {
      setRequest(null);
      invalidate();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const start = useMutation({
    mutationFn: (rideId: number) => startRide(rideId),
    onSuccess: () => {
      toast.info("Trip started", "Drive safe!");
      invalidate();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const complete = useMutation({
    mutationFn: (rideId: number) => completeRide(rideId),
    onSuccess: () => {
      toast.success("Ride completed", "Fare added to your earnings.");
      invalidate();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const active = data?.active_ride ?? null;

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Driver dashboard"
          subtitle={
            user?.driver
              ? `${user.driver.vehicle_name} · ${user.driver.vehicle_number}`
              : "Welcome back, driver"
          }
          icon={Car}
          action={
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold tracking-wide",
                  online
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-edge bg-surface2 text-muted"
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    online
                      ? "animate-pulse-soft bg-emerald-500"
                      : "bg-muted"
                  )}
                />
                {online ? "ONLINE" : "OFFLINE"}
              </span>
              <Button
                variant={online ? "danger" : "primary"}
                loading={false}
                onClick={toggleOnline}
              >
                {online ? "Go offline" : "Go online"}
              </Button>
            </div>
          }
        />

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total earnings"
            value={data?.total_earnings ?? 0}
            prefix="₹"
            icon={<CircleDollarSign className="h-5 w-5" />}
            accent="emerald"
          />
          <StatCard
            label="Earnings today"
            value={data?.today_earnings ?? 0}
            prefix="₹"
            icon={<Receipt className="h-5 w-5" />}
            accent="blue"
          />
          <StatCard
            label="Rides completed"
            value={data?.rides_completed ?? 0}
            icon={<Car className="h-5 w-5" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader
                title="Live location"
                subtitle="Coordinates of your current position"
                icon={MapPin}
              />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label mb-1.5">Latitude (X)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={20}
                      value={loc.lat}
                      onChange={(e) => setLoc((l) => ({ ...l, lat: Number(e.target.value) }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label mb-1.5">Longitude (Y)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={20}
                      value={loc.lng}
                      onChange={(e) => setLoc((l) => ({ ...l, lng: Number(e.target.value) }))}
                      className="input"
                    />
                  </div>
                </div>

                <Button variant="secondary" className="w-full" onClick={sendLocation}>
                  Update location
                </Button>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-edge bg-surface2/60 px-4 py-3.5 transition hover:border-brand/40">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Radio className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        Broadcast every 2 seconds
                      </p>
                      <p className="text-xs text-muted">
                        Simulates live GPS updates for the passenger
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={broadcast}
                    onChange={(e) => setBroadcast(e.target.checked)}
                    className="h-5 w-5 accent-brand"
                  />
                </label>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Current ride"
                subtitle="Active trip at a glance"
                icon={Clock}
              />
              <CardBody>
                {isLoading ? (
                  <Skeleton className="h-24 rounded-2xl" />
                ) : !active ? (
                  <EmptyState
                    compact
                    icon={<Bell className="h-6 w-6" />}
                    title="No active ride"
                    description={
                      online
                        ? "Waiting for ride requests…"
                        : "Go online to start receiving rides."
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-ink">
                        <MapPin className="h-4 w-4 text-brand" />
                        {active.pickup}
                        <span className="text-muted">→</span>
                        {active.destination}
                      </p>
                      <p className="mt-1.5 text-xs text-muted">
                        Passenger: {active.passenger_name ?? "—"} · {inr(active.fare)} ·{" "}
                        {active.payment_method}
                      </p>
                      <div className="mt-3">
                        <StatusBadge status={active.status} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {active.status === "requested" && (
                        <>
                          <Button
                            variant="outline"
                            loading={reject.isPending}
                            onClick={() => reject.mutate(active.id)}
                          >
                            Reject
                          </Button>
                          <Button
                            loading={accept.isPending}
                            onClick={() => accept.mutate(active.id)}
                          >
                            Accept ride
                          </Button>
                        </>
                      )}
                      {active.status === "accepted" && (
                        <Button
                          className="col-span-2"
                          loading={start.isPending}
                          onClick={() => start.mutate(active.id)}
                        >
                          Start ride
                        </Button>
                      )}
                      {active.status === "started" && (
                        <Button
                          className="col-span-2"
                          loading={complete.isPending}
                          onClick={() => complete.mutate(active.id)}
                        >
                          Complete ride · {inr(active.fare)}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader
                title="Recent rides"
                subtitle={`${data?.rides.length ?? 0} total trips`}
                icon={Receipt}
              />
              <CardBody className="space-y-3">
                {isLoading ? (
                  <Skeleton className="h-20 rounded-2xl" />
                ) : data?.rides.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<Car className="h-6 w-6" />}
                    title="No rides yet"
                    description="Your completed trips will appear here."
                  />
                ) : (
                  <AnimatePresence initial={false}>
                    {data?.rides.slice(0, 8).map((ride, i) => (
                      <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <RideCard ride={ride} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        open={request !== null}
        onClose={() => !accept.isPending && !reject.isPending && setRequest(null)}
        title="New ride request"
        subtitle="A passenger is waiting for you"
        size="sm"
      >
        {request && (
          <div>
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
              </span>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                Ride #{request.ride_id} is waiting
              </p>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Passenger</dt>
                <dd className="font-semibold text-ink">{request.passenger.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Pickup</dt>
                <dd className="text-right font-semibold text-ink">{request.pickup}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Destination</dt>
                <dd className="text-right font-semibold text-ink">
                  {request.destination}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-edge/70 pt-3">
                <dt className="text-muted">Fare</dt>
                <dd className="font-bold text-brand">{inr(request.fare)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Payment</dt>
                <dd className="font-semibold capitalize text-ink">
                  {request.payment_method}
                </dd>
              </div>
            </dl>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="danger"
                loading={reject.isPending}
                onClick={() => reject.mutate(request.ride_id)}
              >
                Reject
              </Button>
              <Button
                loading={accept.isPending}
                onClick={() => accept.mutate(request.ride_id)}
              >
                Accept ride
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
