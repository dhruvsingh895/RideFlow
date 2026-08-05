import { Bell, LogOut, Moon, Paintbrush, Shield, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { PageTransition } from "../components/PageTransition";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { cn } from "../lib/format";

const PREFS_KEY = "rf_prefs";

interface Prefs {
  email_alerts: boolean;
  sms_alerts: boolean;
  sound: boolean;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...(JSON.parse(raw) as Prefs) };
  } catch {
    // ignore
  }
  return defaultPrefs;
}

const defaultPrefs: Prefs = { email_alerts: true, sms_alerts: false, sound: true };

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-brand" : "bg-edge"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

export function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  const updatePrefs = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const clearWallet = () => {
    try {
      localStorage.removeItem("rf_wallet_topups");
    } catch {
      // ignore
    }
    toast.info("Wallet data cleared", "Top-up history was removed from this device.");
  };

  const onLogout = async () => {
    await logout();
    queryClient.clear();
    navigate("/login");
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Appearance, notifications and data" icon={Paintbrush} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Appearance" subtitle="Choose how RideFlow looks" />
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    theme === "light"
                      ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                      : "border-edge hover:border-brand/40"
                  )}
                >
                  <Sun className={cn("h-5 w-5", theme === "light" ? "text-brand" : "text-muted")} />
                  <p className="mt-2 text-sm font-bold text-ink">Light</p>
                  <p className="text-xs text-muted">Clean and bright</p>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    theme === "dark"
                      ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                      : "border-edge hover:border-brand/40"
                  )}
                >
                  <Moon className={cn("h-5 w-5", theme === "dark" ? "text-brand" : "text-muted")} />
                  <p className="mt-2 text-sm font-bold text-ink">Dark</p>
                  <p className="text-xs text-muted">Easy on the eyes</p>
                </button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notifications" subtitle="Ride alerts and updates" />
            <CardBody className="space-y-1">
              {(
                [
                  ["email_alerts", "Email updates", "Ride receipts and promotions"],
                  ["sms_alerts", "SMS alerts", "Booking confirmations and OTPs"],
                  ["sound", "Sound effects", "Chimes for ride events"],
                ] as const
              ).map(([key, label, desc]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-xl px-2 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{label}</p>
                      <p className="text-xs text-muted">{desc}</p>
                    </div>
                  </div>
                  <Toggle
                    checked={prefs[key]}
                    onChange={(v) => updatePrefs({ [key]: v })}
                  />
                </div>
              ))}
              <p className="mt-2 flex items-center gap-1.5 px-2 text-xs text-muted">
                <Shield className="h-3.5 w-3.5" />
                Preferences are stored on this device only.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Data" subtitle="Local demo data on this browser" />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-surface2/60 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Wallet top-ups</p>
                  <p className="text-xs text-muted">Removes the demo balance history</p>
                </div>
                <Button variant="outline" size="sm" onClick={clearWallet}>
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
              <p className="text-xs text-muted">
                Signed in as <span className="font-semibold text-ink">{user?.email}</span> (
                {user?.role}).
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Account" subtitle="Session management" />
            <CardBody>
              <Button variant="danger" className="w-full" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Log out of RideFlow
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
