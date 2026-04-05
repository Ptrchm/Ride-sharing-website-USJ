import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, login as apiLogin, signup as apiSignup, logout as apiLogout, isAuthenticated } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  // Xano may use other fields for the user name
  first_name?: string;
  last_name?: string;
  full_name?: string;
  [key: string]: unknown;
}

function normalizeUser(raw: Record<string, unknown>): User {
  const id = (raw.id as number) ?? (raw.user_id as number) ?? 0;
  const email = (raw.email as string) ?? "";
  const nameFromFields =
    (raw.name as string) ||
    (raw.full_name as string) ||
    ([raw.first_name, raw.last_name].filter(Boolean).join(" ") as string);

  return {
    ...raw,
    id,
    email,
    name: nameFromFields || email || "",
  } as User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMeAndSet = useCallback(async () => {
    const me = await getMe();
    const normalized = normalizeUser(me as Record<string, unknown>);
    setUser(normalized);
    return normalized;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      await fetchMeAndSet();
    } catch {
      apiLogout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchMeAndSet]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    const u = await fetchMeAndSet();
    setLoading(false);
    return u;
  };

  const signup = async (name: string, email: string, password: string) => {
    await apiSignup(name, email, password);
    const u = await fetchMeAndSet();
    setLoading(false);
    return u;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
