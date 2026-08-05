import { api, getAccessToken, getRefreshToken } from "./client";

import type { TokenResponse, User } from "../types";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "passenger" | "driver";
  vehicle_name?: string;
  vehicle_number?: string;
}

export const signup = (payload: SignupPayload) =>
  api.post<TokenResponse>("/auth/signup", payload).then((r) => r.data);

export const login = (email: string, password: string) =>
  api
    .post<TokenResponse>("/auth/login", { email, password })
    .then((r) => r.data);

export const profile = () => api.get<User>("/auth/profile").then((r) => r.data);

export const logout = async () => {
  const access = getAccessToken();
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await api.post("/auth/logout", {
        refresh_token: refresh,
        access_token: access ?? "",
      });
    } catch {
      // best effort
    }
  }
};
