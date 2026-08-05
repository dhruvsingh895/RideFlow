import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Plus,
  Wallet as WalletIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { rideHistory } from "../api/rides";
import { PageTransition } from "../components/PageTransition";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../context/ToastContext";
import { inr } from "../lib/format";

const TOPUP_KEY = "rf_wallet_topups";

function loadTopups(): number[] {
  try {
    const raw = localStorage.getItem(TOPUP_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

interface Txn {
  id: string;
  kind: "topup" | "ride";
  label: string;
  amount: number;
  when: number;
}

export function Wallet() {
  const toast = useToast();
  const [topups, setTopups] = useState<number[]>(loadTopups);
  const [modal, setModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const { data: rides, isLoading } = useQuery({
    queryKey: ["rides", "history"],
    queryFn: rideHistory,
  });

  const spent = useMemo(
    () =>
      (rides ?? [])
        .filter((r) => r.status === "completed")
        .reduce((a, r) => a + r.fare, 0),
    [rides]
  );
  const topupTotal = topups.reduce((a, b) => a + b, 0);
  const balance = Math.max(0, topupTotal - spent);

  const addTopup = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    const next = [...topups, value];
    setTopups(next);
    try {
      localStorage.setItem(TOPUP_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setModal(false);
    setAmount("");
    setError("");
    toast.success("Money added", `${inr(value)} credited to your wallet.`);
  };

  const txns: Txn[] = useMemo(() => {
    const rideTxns: Txn[] = (rides ?? [])
      .filter((r) => r.status === "completed")
      .map((r) => ({
        id: `ride-${r.id}`,
        kind: "ride",
        label: `${r.pickup} → ${r.destination}`,
        amount: -r.fare,
        when: new Date(r.created_at).getTime(),
      }));
    const topupTxns: Txn[] = topups.map((t, i) => ({
      id: `topup-${i}`,
      kind: "topup",
      label: "Added to wallet",
      amount: t,
      when: Date.now() - (topups.length - i) * 60000,
    }));
    return [...rideTxns, ...topupTxns].sort((a, b) => b.when - a.when);
  }, [rides, topups]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Wallet"
          subtitle="Demo balance from completed rides and top-ups"
          icon={WalletIcon}
          action={
            <Button onClick={() => setModal(true)}>
              <Plus className="h-4 w-4" />
              Add money
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-white shadow-glow">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-indigo-300/20 blur-2xl" />
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-100/80">
                Available balance
              </p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums tracking-tight">
                {inr(balance)}
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-blue-100/80">
                <CreditCard className="h-4 w-4" />
                RideFlow · {topupTotal > 0 ? `${topups.length} top-up${topups.length === 1 ? "" : "s"}` : "No top-ups yet"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-edge bg-surface p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Spent on rides
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-ink">{inr(spent)}</p>
              </div>
              <div className="rounded-2xl border border-edge bg-surface p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Added
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {inr(topupTotal)}
                </p>
              </div>
            </div>
          </div>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Transactions"
              subtitle="Top-ups and ride payments (demo data, stored locally)"
            />
            <CardBody>
              {isLoading ? (
                <Skeleton className="h-64 rounded-2xl" />
              ) : txns.length === 0 ? (
                <div className="py-12 text-center">
                  <Banknote className="mx-auto h-10 w-10 text-muted/50" />
                  <p className="mt-3 text-sm text-muted">
                    No transactions yet. Complete a ride or add money.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-edge/70">
                  <AnimatePresence initial={false}>
                    {txns.slice(0, 12).map((t) => (
                      <motion.li
                        key={t.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 py-3.5"
                      >
                        <span
                          className={
                            t.amount >= 0
                              ? "grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400"
                          }
                        >
                          {t.amount >= 0 ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {t.label}
                          </p>
                          <p className="text-xs text-muted">
                            {t.kind === "topup" ? "Wallet top-up" : "Ride payment"} ·{" "}
                            {new Date(t.when).toLocaleString()}
                          </p>
                        </div>
                        <p
                          className={
                            t.amount >= 0
                              ? "text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
                              : "text-sm font-bold tabular-nums text-ink"
                          }
                        >
                          {t.amount >= 0 ? "+" : "−"}
                          {inr(Math.abs(t.amount))}
                        </p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => {
          setModal(false);
          setError("");
          setAmount("");
        }}
        title="Add money"
        subtitle="Demo top-up — stored only in your browser"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[100, 250, 500].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="rounded-xl border border-edge bg-surface2/60 py-2.5 text-sm font-bold text-ink transition hover:border-brand/50 hover:bg-brand/5"
              >
                ₹{v}
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            placeholder="Custom amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            invalid={!!error}
            hint={error}
            icon={<Banknote className="h-4 w-4" />}
          />
          <Button className="w-full" onClick={addTopup}>
            <Plus className="h-4 w-4" />
            Add {amount ? inr(Number(amount)) : "money"}
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
