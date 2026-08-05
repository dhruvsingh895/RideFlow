import { AnimatePresence, motion } from "framer-motion";
import {
  Car,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { cn, initials } from "../../lib/format";
import { Logo } from "../ui/Logo";

export type AdminTab = "overview" | "users" | "drivers" | "rides";

const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "drivers", label: "Drivers", icon: Car },
  { id: "rides", label: "Rides", icon: LayoutDashboard },
];

export function AdminSidebar({
  active,
  onSelect,
}: {
  active: AdminTab;
  onSelect: (t: AdminTab) => void;
}) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const onLogout = async () => {
    await logout();
    queryClient.clear();
    navigate("/login");
  };

  const select = (t: AdminTab) => {
    onSelect(t);
    setDrawer(false);
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-edge px-5">
        <Logo />
        <button
          onClick={() => setDrawer(false)}
          aria-label="Close menu"
          className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface2 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Admin
        </p>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => select(tab.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active === tab.id
                ? "bg-brand/10 text-brand"
                : "text-muted hover:bg-surface2 hover:text-ink"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="space-y-3 border-t border-edge p-4">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-xl border border-edge px-3.5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface2"
        >
          <span className="flex items-center gap-2.5">
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-muted" />
            ) : (
              <Moon className="h-4 w-4 text-muted" />
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </button>
        <div className="flex items-center gap-3 rounded-xl border border-edge p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden h-screen sticky top-0 w-64 shrink-0 border-r border-edge bg-surface md:block">
        {content}
      </div>

      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-edge bg-bg/80 px-4 backdrop-blur-xl md:hidden">
        <Logo />
        <button
          onClick={() => setDrawer(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-xl border border-edge text-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-edge bg-surface md:hidden"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
