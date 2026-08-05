import { api } from "./client";

import type { AdminDriver, AdminRide, AdminStats, AdminUser } from "../types";

export const adminStats = () =>
  api.get<AdminStats>("/admin/stats").then((r) => r.data);

export const adminUsers = () =>
  api.get<AdminUser[]>("/admin/users").then((r) => r.data);

export const adminDrivers = () =>
  api.get<AdminDriver[]>("/admin/drivers").then((r) => r.data);

export const adminRides = () =>
  api.get<AdminRide[]>("/admin/rides").then((r) => r.data);
