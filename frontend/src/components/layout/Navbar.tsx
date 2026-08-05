import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Car,
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { initials, timeAgo } from "../../lib/format";
import { driverRides } from "../../api/drivers";
import { rideHistory } from "../../api/rides";
import { homePath } from "../ProtectedRoute";
import { Logo } from "../ui/Logo";
import { cn } from "../../lib/format";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="btn-focus grid h-10 w-10 place-items-center rounded-xl border border-edge bg-surface text-muted transition hover:bg-surface2 hover:text-ink"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

function useOutsideClick(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick(() => setOpen(false));

  const ridesQuery =
    user?.role === "passenger"
      ? useQuery({ queryKey: ["rides", "history"], queryFn: rideHistory })
      : useQuery({ queryKey: ["driver", "rides"], queryFn: driverRides });

  const rides =
    user?.role === "passenger"
      ? ridesQuery.data?.slice(0, 4) ?? []
      : ridesQuery.data?.rides.slice(0, 4) ?? [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="btn-focus relative grid h-10 w-10 place-items-center rounded-xl border border-edge bg-surface text-muted transition hover:bg-surface2 hover:text-ink"
      >
        <Bell className="h-5 w-5" />
        {rides.length > 0 && (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-bg" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-edge bg-surface shadow-lift"
          >
            <div className="border-b border-edge/70 px-4 py-3">
              <p className="text-sm font-semibold text-ink">Notifications</p>
            </div>
            {rides.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Nothing new yet
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {rides.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => setOpen(false)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-surface2"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                          r.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : r.status === "cancelled"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-blue-500/10 text-blue-500"
                        )}
                      >
                        <Car className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">
                          Ride #{r.id} ·{" "}
                          {r.status === "completed"
                            ? "Trip completed"
                            : r.status === "cancelled"
                              ? "Trip cancelled"
                              : "Trip in progress"}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {r.pickup} → {r.destination}
                        </span>
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted">
                        {timeAgo(r.created_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick(() => setOpen(false));
  const queryClient = useQueryClient();

  if (!user) return null;

  const items: { label: string; to: string; icon: typeof UserIcon }[] = [
    { label: "Dashboard", to: homePath(user.role), icon: LayoutDashboard },
    { label: "Profile", to: "/profile", icon: UserIcon },
    ...(user.role !== "admin"
      ? [
          { label: "Wallet", to: "/wallet", icon: Wallet },
          { label: "Ride History", to: "/history", icon: History },
        ]
      : []),
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  const onLogout = async () => {
    setOpen(false);
    await logout();
    queryClient.clear();
    navigate("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="btn-focus flex items-center gap-2 rounded-xl border border-edge bg-surface py-1.5 pl-1.5 pr-2.5 transition hover:bg-surface2"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden text-sm font-semibold text-ink sm:block">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-edge bg-surface shadow-lift"
          >
            <div className="border-b border-edge/70 px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <ul className="p-1.5">
              {items.map((item) => (
                <li key={item.to}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate(item.to);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface2"
                  >
                    <item.icon className="h-4 w-4 text-muted" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-edge/70 p-1.5">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const items: NavItem[] = [
    ...(user.role === "passenger"
      ? [
          { label: "Dashboard", to: "/passenger", icon: LayoutDashboard },
          { label: "Ride History", to: "/history", icon: History },
          { label: "Wallet", to: "/wallet", icon: Wallet },
        ]
      : user.role === "driver"
        ? [{ label: "Dashboard", to: "/driver", icon: LayoutDashboard }]
        : [{ label: "Dashboard", to: "/admin", icon: LayoutDashboard }]),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(homePath(user.role))}
            aria-label="RideFlow home"
            className="btn-focus rounded-xl"
          >
            <Logo />
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = location.pathname === item.to;
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand/10 text-brand"
                      : "text-muted hover:bg-surface2 hover:text-ink"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <NotificationsBell />
          <UserMenu />
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="btn-focus grid h-10 w-10 place-items-center rounded-xl border border-edge bg-surface text-muted md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-edge bg-surface md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {items.map((item) => (
                <button
                  key={item.to}
                  onClick={() => {
                    setMobileOpen(false);
                    navigate(item.to);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-surface2"
                >
                  <item.icon className="h-4 w-4 text-muted" />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
