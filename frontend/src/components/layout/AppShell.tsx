import { Outlet } from "react-router-dom";

import { Navbar } from "./Navbar";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-edge py-5">
        <p className="text-center text-xs text-muted">
          RideFlow · local ride-hailing demo · runs entirely on Docker
        </p>
      </footer>
    </div>
  );
}
