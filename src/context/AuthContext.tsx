import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/data/api";
import { getToken, setChatJwt, setToken } from "@/data/client";
import type { User } from "@/data/types";

export const GUEST_USER: User = {
  id: "",
  username: "guest",
  name: "مهمان",
  bio: "",
  followers: 0,
  following: 0,
  resultsCount: 0,
  savedRecipeIds: [],
  level: "cook",
};

interface AuthContextValue {
  ready: boolean;
  isLoggedIn: boolean;
  user: User;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (name: string, bio: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User>(GUEST_USER);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setChatJwt(null);
      setUser(GUEST_USER);
      return;
    }
    try {
      const me = await api.me();
      setChatJwt(me.chatJwt ?? null);
      setUser(me);
    } catch {
      setToken(null);
      setChatJwt(null);
      setUser(GUEST_USER);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await api.login(email, password);
    setToken(session.token);
    setChatJwt(session.user.chatJwt ?? null);
    setUser(session.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const session = await api.register(name, email, password);
    setToken(session.token);
    setChatJwt(session.user.chatJwt ?? null);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* token may already be invalid */
    }
    setToken(null);
    setChatJwt(null);
    setUser(GUEST_USER);
  }, []);

  const updateProfile = useCallback(async (name: string, bio: string) => {
    const next = await api.updateProfile(name, bio);
    setUser(next);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const next = await api.uploadAvatar(file);
    setUser(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isLoggedIn: Boolean(user.id),
      user,
      login,
      register,
      logout,
      refresh,
      updateProfile,
      uploadAvatar,
    }),
    [ready, user, login, register, logout, refresh, updateProfile, uploadAvatar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
