import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminLayout } from "./components/layout/AdminLayout";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FullPageLoader } from "./components/ui/Spinner";

const Landing = lazy(() => import("./pages/Landing").then((m) => ({ default: m.Landing })));
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const Signup = lazy(() => import("./pages/Signup").then((m) => ({ default: m.Signup })));
const PassengerDashboard = lazy(() =>
  import("./pages/PassengerDashboard").then((m) => ({ default: m.PassengerDashboard }))
);
const RideTracking = lazy(() =>
  import("./pages/RideTracking").then((m) => ({ default: m.RideTracking }))
);
const RideHistory = lazy(() =>
  import("./pages/RideHistory").then((m) => ({ default: m.RideHistory }))
);
const DriverDashboard = lazy(() =>
  import("./pages/DriverDashboard").then((m) => ({ default: m.DriverDashboard }))
);
const AdminDashboard = lazy(() =>
  import("./pages/AdminDashboard").then((m) => ({ default: m.AdminDashboard }))
);
const Wallet = lazy(() => import("./pages/Wallet").then((m) => ({ default: m.Wallet })));
const Profile = lazy(() => import("./pages/Profile").then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<FullPageLoader />}>{element}</Suspense>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Routes>
        <Route path="/" element={withSuspense(<Landing />)} />
        <Route path="/login" element={withSuspense(<Login />)} />
        <Route path="/signup" element={withSuspense(<Signup />)} />

        <Route
          element={
            <ProtectedRoute roles={["passenger", "driver", "admin"]}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/passenger"
            element={withSuspense(
              <ProtectedRoute roles={["passenger"]}>
                <PassengerDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/track/:id"
            element={withSuspense(
              <ProtectedRoute roles={["passenger"]}>
                <RideTracking />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/history"
            element={withSuspense(
              <ProtectedRoute roles={["passenger"]}>
                <RideHistory />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/driver"
            element={withSuspense(
              <ProtectedRoute roles={["driver"]}>
                <DriverDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/wallet"
            element={withSuspense(
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/profile"
            element={withSuspense(
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            element={withSuspense(
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            )}
          />
        </Route>

        <Route
          path="/admin"
          element={withSuspense(
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
