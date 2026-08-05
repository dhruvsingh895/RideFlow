import { useState } from "react";

import { AdminDashboard } from "../../pages/AdminDashboard";
import { AdminSidebar } from "./AdminSidebar";
import type { AdminTab } from "./AdminSidebar";

export function AdminLayout() {
  const [tab, setTab] = useState<AdminTab>("overview");

  return (
    <div className="flex min-h-screen bg-bg">
      <AdminSidebar active={tab} onSelect={setTab} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <AdminDashboard tab={tab} />
        </div>
      </main>
    </div>
  );
}
