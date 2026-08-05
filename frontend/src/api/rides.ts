import { api } from "./client";

import type { Ride } from "../types";

export interface BookRidePayload {
  pickup: string;
  destination: string;
  pickup_lat: number;
  pickup_lng: number;
  dest_lat: number;
  dest_lng: number;
  payment_method: "cash" | "wallet" | "upi";
}

export const bookRide = (payload: BookRidePayload) =>
  api.post<Ride>("/ride/book", payload).then((r) => r.data);

export const cancelRide = (ride_id: number) =>
  api.post<Ride>("/ride/cancel", { ride_id }).then((r) => r.data);

export const rideHistory = () =>
  api.get<Ride[]>("/ride/history").then((r) => r.data);

export const activeRide = () =>
  api.get<Ride | null>("/rides/active").then((r) => r.data);

export const rideDetail = (ride_id: number) =>
  api.get<Ride>(`/rides/${ride_id}`).then((r) => r.data);

export const acceptRide = (ride_id: number) =>
  api.post<Ride>(`/rides/${ride_id}/accept`).then((r) => r.data);

export const rejectRide = (ride_id: number) =>
  api.post<Ride>(`/rides/${ride_id}/reject`).then((r) => r.data);

export const startRide = (ride_id: number) =>
  api.post<Ride>(`/rides/${ride_id}/start`).then((r) => r.data);

export const completeRide = (ride_id: number) =>
  api.post<Ride>(`/rides/${ride_id}/complete`).then((r) => r.data);
