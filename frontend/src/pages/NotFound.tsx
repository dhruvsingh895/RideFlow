import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Logo } from "../components/ui/Logo";

export function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative text-center"
      >
        <div className="mx-auto mb-8 w-fit">
          <Logo />
        </div>
        <p className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-[7rem] font-black leading-none tracking-tighter text-transparent sm:text-[10rem]">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
          This road doesn't exist
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          The page you're looking for may have moved, been renamed, or never
          existed. Let's get you back on track.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/">
            <Button>
              <Compass className="h-4 w-4" />
              Go home
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost">Back to login</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
