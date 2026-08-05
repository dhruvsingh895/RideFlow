import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, Car, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { driverRides } from "../api/drivers";
import { rideHistory } from "../api/rides";
import { PageTransition } from "../components/PageTransition";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { cn, fmtDate, initials, inr } from "../lib/format";

const PROFILE_KEY = "rf_profile";

function loadLocal(): { name: string; phone: string } | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as { name: string; phone: string }) : null;
  } catch {
    return null;
  }
}

export function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const local = loadLocal();
  const [name, setName] = useState(local?.name ?? user?.name ?? "");
  const [phone, setPhone] = useState(local?.phone ?? user?.phone ?? "");
  const [saved, setSaved] = useState(Boolean(local));

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.name, user?.phone]);

  const isDriver = user?.role === "driver";
  const { data: driver } = useQuery({
    queryKey: ["driver", "rides"],
    queryFn: driverRides,
    enabled: isDriver,
  });
  const { data: rides } = useQuery({
    queryKey: ["rides", "history"],
    queryFn: rideHistory,
    enabled: !isDriver,
  });

  const completed = isDriver
    ? driver?.rides_completed ?? 0
    : (rides ?? []).filter((r) => r.status === "completed").length;
  const earnings = isDriver ? driver?.total_earnings ?? 0 : 0;

  const save = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({ name: name.trim(), phone: phone.trim() })
      );
    } catch {
      // ignore
    }
    setSaved(true);
    toast.success("Profile updated", "Saved locally on this device.");
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Profile"
          subtitle="Your account and preferences"
          icon={UserRound}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardBody className="text-center">
                <span className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-700 text-3xl font-extrabold text-white shadow-card">
                  {initials(name)}
                </span>
                <h2 className="mt-4 text-xl font-bold text-ink">{name}</h2>
                <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </p>
                <div className="mt-4 flex justify-center">
                  <Badge variant={user?.role === "admin" ? "danger" : user?.role === "driver" ? "violet" : "brand"}>
                    {user?.role}
                  </Badge>
                </div>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Member since {fmtDate(user?.created_at ?? "")}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Stats" />
              <CardBody className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface2/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Rides
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
                    {completed}
                  </p>
                </div>
                {isDriver ? (
                  <div className="rounded-xl bg-surface2/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Earnings
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {inr(earnings)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-surface2/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Role
                    </p>
                    <p className="mt-1 text-2xl font-bold capitalize text-ink">
                      {user?.role}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader
                title="Personal information"
                subtitle="Changes are saved on this device only"
              />
              <CardBody className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label mb-1.5">Full name</label>
                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSaved(false);
                      }}
                      icon={<UserRound className="h-4 w-4" />}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="label mb-1.5">Phone</label>
                    <Input
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setSaved(false);
                      }}
                      icon={<Phone className="h-4 w-4" />}
                      placeholder="Your phone"
                    />
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5">Email</label>
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    icon={<Mail className="h-4 w-4" />}
                  />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={save} disabled={!name.trim()}>
                    Save changes
                  </Button>
                  {saved && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <BadgeCheck className="h-4 w-4" />
                      Saved
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>

            {isDriver && user?.driver && (
              <Card>
                <CardHeader title="Vehicle" subtitle="Your registered ride details" />
                <CardBody>
                  <div className="flex items-center gap-4 rounded-2xl border border-edge bg-surface2/50 p-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Car className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-ink">
                        {user.driver.vehicle_name}
                      </p>
                      <p className="text-xs text-muted">
                        {user.driver.vehicle_number} · {user.driver.rating.toFixed(1)} ★
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-bold",
                        user.driver.is_online
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-edge bg-surface text-muted"
                      )}
                    >
                      {user.driver.is_online ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    Current position: ({user.driver.current_lat ?? "—"},{" "}
                    {user.driver.current_lng ?? "—"})
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
