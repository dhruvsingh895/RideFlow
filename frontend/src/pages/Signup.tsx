import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Car, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signup } from "../api/auth";
import type { SignupPayload } from "../api/auth";
import { errorMessage } from "../api/client";
import { PageTransition } from "../components/PageTransition";
import { homePath } from "../components/ProtectedRoute";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { cn } from "../lib/format";

export function Signup() {
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    vehicle_name: "",
    vehicle_number: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = useAuth();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (payload: SignupPayload) => signup(payload),
    onSuccess: (tokens) => {
      auth.login(tokens);
      toast.success("Account created!", "Welcome to RideFlow.");
      navigate(homePath(tokens.user.role));
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload: SignupPayload = {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      role,
    };
    if (role === "driver") {
      payload.vehicle_name = form.vehicle_name;
      payload.vehicle_number = form.vehicle_number;
    }
    mutation.mutate(payload);
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
        <div className="w-full max-w-lg">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-edge bg-surface p-8 shadow-card"
          >
            <Logo className="mb-8" />
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Join as a passenger or driver — you can always switch later.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              {(
                [
                  { id: "passenger", label: "Passenger", desc: "Book & track rides", icon: User },
                  { id: "driver", label: "Driver", desc: "Earn by driving", icon: Car },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  aria-pressed={role === r.id}
                  className={cn(
                    "btn-focus rounded-2xl border-2 p-4 text-left transition-all duration-200",
                    role === r.id
                      ? "border-brand bg-brand/5 shadow-glow"
                      : "border-edge bg-surface2/50 hover:border-muted/40"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl transition",
                      role === r.id
                        ? "bg-brand text-white"
                        : "bg-surface text-muted"
                    )}
                  >
                    <r.icon className="h-5 w-5" />
                  </span>
                  <span className="mt-2.5 block text-sm font-semibold text-ink">
                    {r.label}
                  </span>
                  <span className="block text-xs text-muted">{r.desc}</span>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-7 space-y-5">
              <Field label="Full name">
                <Input
                  required
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    required
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                  />
                </Field>
              </div>
              <Field label="Password" hint="At least 6 characters">
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>

              <AnimatePresence>
                {role === "driver" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Vehicle details
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Vehicle name">
                          <Input
                            required
                            value={form.vehicle_name}
                            onChange={set("vehicle_name")}
                            placeholder="Honda City"
                          />
                        </Field>
                        <Field label="Vehicle number">
                          <Input
                            required
                            value={form.vehicle_number}
                            onChange={set("vehicle_number")}
                            placeholder="DL01AB1234"
                          />
                        </Field>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <Button type="submit" loading={mutation.isPending} className="w-full" size="lg">
                Create account
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-brand hover:underline">
                Log in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
