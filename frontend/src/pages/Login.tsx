import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Car,
  Eye,
  EyeOff,
  MapPin,
  Navigation,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../api/auth";
import { errorMessage } from "../api/client";
import { PageTransition } from "../components/PageTransition";
import { homePath } from "../components/ProtectedRoute";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const demoAccounts = [
  { role: "Passenger", email: "passenger@rideflow.com" },
  { role: "Driver", email: "driver@rideflow.com" },
  { role: "Admin", email: "admin@rideflow.com" },
];

const bullets = [
  { icon: Navigation, text: "Real-time driver matching & tracking" },
  { icon: Wallet, text: "Mock payments — Cash, Wallet & UPI" },
  { icon: ShieldCheck, text: "Role-based access with JWT refresh" },
];

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = useAuth();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (tokens) => {
      auth.login(tokens);
      toast.success(`Welcome back, ${tokens.user.name.split(" ")[0]}!`);
      navigate(homePath(tokens.user.role));
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate();
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-bg">
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 p-12 lg:flex">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

          <Link to="/" className="relative inline-flex w-fit items-center gap-2.5 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Car className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">RideFlow</span>
          </Link>

          <div className="relative">
            <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
              Your ride is one click away.
            </h2>
            <p className="mt-4 max-w-md text-blue-100">
              Join thousands of riders and drivers moving smarter, faster and safer.
            </p>
            <ul className="mt-10 space-y-4">
              {bullets.map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
                    <b.icon className="h-4 w-4" />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Live tracking every 2 seconds
                </p>
                <p className="text-xs text-blue-100">
                  WebSocket broadcast from driver to passenger
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
              <p className="mt-1.5 text-sm text-muted">
                Log in to book rides, drive or manage the platform.
              </p>

              <form onSubmit={submit} className="mt-8 space-y-5">
                <Field label="Email">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Password">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="rounded-lg p-1 text-muted transition hover:bg-surface2 hover:text-ink"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </Field>

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
                  Log in
                </Button>
              </form>

              <div className="mt-8 rounded-2xl border border-edge bg-surface2/60 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Demo accounts — tap to fill · password: demo1234
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {demoAccounts.map((a) => (
                    <button
                      key={a.email}
                      onClick={() => {
                        setEmail(a.email);
                        setPassword("demo1234");
                        setError("");
                      }}
                      className="btn-focus rounded-xl border border-edge bg-surface px-3 py-2 text-left transition hover:border-brand/40 hover:shadow-soft"
                    >
                      <span className="block text-xs font-bold text-ink">{a.role}</span>
                      <span className="block truncate text-[11px] text-muted">{a.email}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-8 text-center text-sm text-muted">
                New here?{" "}
                <Link to="/signup" className="font-semibold text-brand hover:underline">
                  Create an account
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
