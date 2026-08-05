import { api } from "./client";

import type { DriverRidesResponse } from "../types";

export const goOnline = (lat?: number, lng?: number) =>
  api
    .post("/driver/online", lat !== undefined && lng !== undefined ? { lat, lng } : {})
    .then((r) => r.data);

export const goOffline = () =>
  api.post("/driver/offline").then((r) => r.data);

export const updateLocation = (lat: number, lng: number) =>
  api.post("/driver/location", { lat, lng }).then((r) => r.data);

export const driverRides = () =>
  api.get<DriverRidesResponse>("/driver/rides").then((r) => r.data);
