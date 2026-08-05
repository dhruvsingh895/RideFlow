import { motion } from "framer-motion";
import {
  ArrowRight,
  Car,
  CircleCheck,
  Clock,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { fadeInUp } from "../components/PageTransition";
import { RideMap } from "../components/RideMap";
import { Logo } from "../components/ui/Logo";

const features = [
  {
    icon: Zap,
    title: "Real-time matching",
    desc: "Ride requests are matched to the nearest online driver in milliseconds using Redis-backed locations.",
  },
  {
    icon: Navigation,
    title: "Live driver tracking",
    desc: "Drivers broadcast their position every 2 seconds over WebSockets. Watch the car move on your map.",
  },
  {
    icon: Wallet,
    title: "Mock payments",
    desc: "Cash, Wallet and UPI — simulated end-to-end. No payment gateway, no setup, zero risk.",
  },
  {
    icon: ShieldCheck,
    title: "Secure JWT auth",
    desc: "Role-based access for passengers, drivers and admins with access & refresh token rotation.",
  },
  {
    icon: Clock,
    title: "Full ride lifecycle",
    desc: "Book → match → accept → start → complete. Every state transitions in real time on both sides.",
  },
  {
    icon: Car,
    title: "Built with Docker",
    desc: "React + FastAPI + PostgreSQL + Redis. One command, four services, zero local installs.",
  },
];

const steps = [
  { n: "01", title: "Book a ride", desc: "Enter pickup and destination coordinates on the 20×20 grid." },
  { n: "02", title: "Get matched", desc: "The nearest online driver receives your request instantly." },
  { n: "03", title: "Ride & track", desc: "Watch the live map as your driver picks you up and drops you off." },
];

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-emerald-400/10 blur-3xl" />
        <div className="absolute right-[-160px] top-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-120px] h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="btn-focus rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:bg-surface2 hover:text-ink"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="btn-focus rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-hover hover:shadow-card"
            >
              Get started
            </Link>
          </nav>
        </header>

        <section className="grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <motion.div {...fadeInUp(0)}>
              <span className="chip border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                Runs 100% locally with Docker
              </span>
            </motion.div>
            <motion.h1
              {...fadeInUp(0.06)}
              className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl"
            >
              Ride hailing for your{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
                local machine
              </span>
            </motion.h1>
            <motion.p
              {...fadeInUp(0.12)}
              className="mt-6 max-w-lg text-lg leading-relaxed text-muted"
            >
              An Uber-style platform with real-time matching, live tracking and a full
              admin console — every piece running on your own hardware, ready to
              showcase.
            </motion.p>
            <motion.div {...fadeInUp(0.18)} className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="btn-focus inline-flex h-12 items-center gap-2 rounded-2xl bg-brand px-7 text-[15px] font-semibold text-white shadow-glow transition hover:bg-brand-hover"
              >
                Book your first ride
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="btn-focus inline-flex h-12 items-center rounded-2xl border border-edge bg-surface px-7 text-[15px] font-semibold text-ink shadow-soft transition hover:bg-surface2"
              >
                I'm a driver
              </Link>
            </motion.div>

            <motion.div {...fadeInUp(0.24)} className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[
                ["2,400+", "Rides completed"],
                ["98.6%", "Completion rate"],
                ["4.9 ★", "Avg. rating"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="text-2xl font-bold tabular-nums text-ink">{v}</p>
                  <p className="mt-0.5 text-xs text-muted">{l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="animate-float rounded-3xl border border-edge bg-surface p-4 shadow-lift">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="chip border-edge bg-surface2 text-muted">
                  <Navigation className="h-3 w-3 text-brand" />
                  Live tracking
                </span>
              </div>
              <RideMap
                pickup={{ lat: 2, lng: 3 }}
                destination={{ lat: 8, lng: 12 }}
                driver={{ lat: 4.6, lng: 6.4 }}
              />
              <div className="mt-4 flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Car className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">Rahul · Honda City</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3 text-emerald-500" /> 3 min away
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-ink">₹18.22</p>
                  <p className="text-[11px] text-muted">UPI · estimate</p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute -left-4 top-1/3 hidden rounded-2xl border border-edge bg-surface p-3 shadow-lift sm:block"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CircleCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-ink">Driver matched</p>
                  <p className="text-[11px] text-muted">0.4s via Redis</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="py-16">
          <motion.div {...fadeInUp()} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Everything you need,{" "}
              <span className="text-brand">nothing you don't</span>
            </h2>
            <p className="mt-4 text-muted">
              A complete ride-hailing stack — passenger app, driver app and admin
              console — running from a single compose file.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                className="group rounded-2xl border border-edge bg-surface p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-card"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <motion.div {...fadeInUp()} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              How it works
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative rounded-2xl border border-edge bg-surface p-6 shadow-soft"
              >
                <span className="text-4xl font-extrabold tracking-tight text-brand/15">
                  {s.n}
                </span>
                <h3 className="mt-2 font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-16 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-center shadow-lift sm:p-16"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-300/10 blur-2xl" />
            <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to hit the road?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Sign up as a passenger or driver and experience real-time ride matching
              on your own machine.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-7 text-[15px] font-semibold text-blue-700 shadow-card transition hover:bg-blue-50"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 items-center rounded-2xl border border-white/30 px-7 text-[15px] font-semibold text-white transition hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </motion.div>
        </section>

        <footer className="border-t border-edge py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo />
            <p className="text-xs text-muted">
              RideFlow · local ride-hailing demo · Docker Compose powered
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
