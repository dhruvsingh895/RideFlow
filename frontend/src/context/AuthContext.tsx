import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { logout as apiLogout, profile } from "../api/auth";
import { clearTokens, getAccessToken, setTokens } from "../api/client";
import type { TokenResponse, User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (tokens: TokenResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    profile()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = (tokens: TokenResponse) => {
    setTokens(tokens);
    setUser(tokens.user);
  };

  const logout = async () => {
    await apiLogout();
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
