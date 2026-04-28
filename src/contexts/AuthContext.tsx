import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, setOnAuthExpired } from "@/lib/query-client";
import { setUser as setSentryUser, clearUser as clearSentryUser } from "@/lib/sentry";
import { setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from "@/lib/token-store";

const CACHED_USER_KEY = "auth:cachedUser";

interface AuthUser {
  id: string;
  username: string;
  avatar: string;
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  streak: number;
  bestStreak: number;
  rank: number;
  favoriteLeagues: string[];
  joinedAt: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const NETWORK_PATTERNS = [
  "ConnectException",
  "Failed to connect",
  "Network request failed",
  "timeout",
  "Can't reach",
  "ECONNREFUSED",
  "ERR_CONNECTION",
];

function isNetworkError(msg: string): boolean {
  return NETWORK_PATTERNS.some((p) => msg.includes(p));
}

export type AuthErrorKey =
  | "networkError"
  | "wrongCredentials"
  | "usernameTaken"
  | "tooManyAttempts"
  | "loginFailed"
  | "registerFailed"
  | "generic";

function toErrorKey(error: unknown, action: "login" | "register"): AuthErrorKey {
  const raw = error instanceof Error ? error.message : String(error);

  if (isNetworkError(raw)) return "networkError";
  if (raw.includes("401")) return "wrongCredentials";
  if (raw.includes("409")) return "usernameTaken";
  if (raw.includes("429")) return "tooManyAttempts";
  if (raw.includes("422") || raw.includes("validation")) return "generic";

  return action === "login" ? "loginFailed" : "registerFailed";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Register auth-expiry callback so the API client can force logout
  useEffect(() => {
    setOnAuthExpired(() => {
      setUser(null);
      AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
      clearTokens().catch(() => {});
    });
    return () => setOnAuthExpired(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    (async () => {
      try {
        // 1. Check if we have a refresh token — no token means no valid session
        const hasRefreshToken = await getRefreshToken();
        if (!hasRefreshToken) {
          // No JWT tokens — clear any stale cache from session-based era
          if (!cancelled) {
            setUser(null);
            await AsyncStorage.removeItem(CACHED_USER_KEY);
            setIsLoading(false);
          }
          return;
        }

        // 2. We have tokens — show cached user for instant UI while we validate
        const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
        if (cached && !cancelled) {
          const cachedUser = JSON.parse(cached) as AuthUser;
          setUser(cachedUser);
          setIsLoading(false);
        }

        // 3. Validate with server in background (auto-refresh handles token rotation)
        try {
          const res = await apiRequest("GET", "/api/auth/me");
          if (controller.signal.aborted) return;
          const data = await res.json();
          if (!cancelled) {
            setUser(data.user);
            await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
          }
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          // Server says unauthorized or error — clear everything
          if (!cancelled) {
            setUser(null);
            await AsyncStorage.removeItem(CACHED_USER_KEY);
            await clearTokens();
          }
        }
      } catch {
        // Cache/token read failed — non-fatal
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await res.json();

      // Store tokens securely
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);

      // Cache user for instant startup
      setUser(data.user);
      setSentryUser({ id: data.user.id, username: data.user.username });
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    } catch (error) {
      const key = toErrorKey(error, "login");
      const err = new Error(key);
      (err as any).errorKey = key;
      throw err;
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", { username, password });
      const data = await res.json();

      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);

      setUser(data.user);
      setSentryUser({ id: data.user.id, username: data.user.username });
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    } catch (error) {
      const key = toErrorKey(error, "register");
      const err = new Error(key);
      (err as any).errorKey = key;
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    abortControllerRef.current?.abort();

    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (err) {
      console.error("auth:logout", err);
    }

    // Clear all stored auth state
    setUser(null);
    clearSentryUser();
    await clearTokens();
    await AsyncStorage.removeItem(CACHED_USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiRequest("GET", "/api/auth/me");
      const data = await res.json();
      setUser(data.user);
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    } catch {
      setUser(null);
      await clearTokens();
      await AsyncStorage.removeItem(CACHED_USER_KEY);
    }
  }, []);

  // Stable ref wrappers: prevent cascading re-renders through the context
  // value when callback identities change. Even though the current callbacks
  // have only stable deps (imports + state setters), wrapping through refs
  // guarantees that adding a non-stable dep later won't cascade into every
  // consumer.
  const loginRef = useRef(login);
  const registerRef = useRef(register);
  const logoutRef = useRef(logout);
  const refreshUserRef = useRef(refreshUser);

  useEffect(() => {
    loginRef.current = login;
  }, [login]);
  useEffect(() => {
    registerRef.current = register;
  }, [register]);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);
  useEffect(() => {
    refreshUserRef.current = refreshUser;
  }, [refreshUser]);

  const stableLogin = useCallback(
    (username: string, password: string) => loginRef.current(username, password),
    [],
  );
  const stableRegister = useCallback(
    (username: string, password: string) => registerRef.current(username, password),
    [],
  );
  const stableLogout = useCallback(() => logoutRef.current(), []);
  const stableRefreshUser = useCallback(() => refreshUserRef.current(), []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login: stableLogin,
      register: stableRegister,
      logout: stableLogout,
      refreshUser: stableRefreshUser,
    }),
    [user, isLoading, stableLogin, stableRegister, stableLogout, stableRefreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
