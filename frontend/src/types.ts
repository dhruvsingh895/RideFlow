export type Role = "passenger" | "driver" | "admin";

export interface DriverProfile {
  id: number;
  vehicle_name: string;
  vehicle_number: string;
  rating: number;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  total_earnings: number;
  rides_completed: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  created_at: string;
  driver: DriverProfile | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export type RideStatus =
  | "requested"
  | "accepted"
  | "started"
  | "completed"
  | "cancelled";

export interface DriverBrief {
  id: number;
  name: string;
  vehicle_name: string;
  vehicle_number: string;
  rating: number;
  lat: number | null;
  lng: number | null;
}

export interface Ride {
  id: number;
  passenger_id: number;
  driver_id: number | null;
  pickup: string;
  destination: string;
  pickup_lat: number;
  pickup_lng: number;
  dest_lat: number;
  dest_lng: number;
  status: RideStatus;
  fare: number;
  payment_method: "cash" | "wallet" | "upi";
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  driver: DriverBrief | null;
  passenger_name: string | null;
}

export interface DriverRidesResponse {
  rides: Ride[];
  total_earnings: number;
  today_earnings: number;
  rides_completed: number;
  is_online: boolean;
  active_ride: Ride | null;
}

export interface AdminStats {
  users_total: number;
  passengers_total: number;
  drivers_total: number;
  drivers_online: number;
  rides_total: number;
  rides_completed: number;
  rides_cancelled: number;
  rides_active: number;
  revenue: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  created_at: string;
}

export interface AdminDriver {
  id: number;
  name: string;
  email: string;
  vehicle_name: string;
  vehicle_number: string;
  rating: number;
  is_online: boolean;
  total_earnings: number;
  rides_completed: number;
}

export interface AdminRide {
  id: number;
  passenger_name: string;
  driver_name: string | null;
  pickup: string;
  destination: string;
  status: RideStatus;
  fare: number;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
}

export interface WsMessage<T = unknown> {
  event: string;
  data: T;
}

export interface Location {
  lat: number;
  lng: number;
}
