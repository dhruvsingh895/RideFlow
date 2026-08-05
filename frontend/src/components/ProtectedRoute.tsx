import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../context/AuthContext";
import { FullPageLoader } from "./ui/Spinner";
import type { Role } from "../types";

export function homePath(role: Role): string {
  if (role === "driver") return "/driver";
  if (role === "admin") return "/admin";
  return "/passenger";
}

export function ProtectedRoute({
  roles,
  children,
}: {
  roles?: Role[];
  children?: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePath(user.role)} replace />;
  }

  return (
    <>
      {children}
      <Outlet />
    </>
  );
}
