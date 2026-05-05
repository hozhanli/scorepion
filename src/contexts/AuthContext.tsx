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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  deleteUser,
} from "@react-native-firebase/auth";
import { apiRequest, setOnAuthExpired } from "@/lib/query-client";
import { setUser as setSentryUser, clearUser as clearSentryUser } from "@/lib/sentry";
import { auth, firebaseErrorToKey, type AuthErrorKey } from "@/lib/firebase";

const CACHED_USER_KEY = "auth:cachedUser";

export type { AuthErrorKey };

interface AuthUser {
  id: string;
  username: string;
  email: string;
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
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    favoriteLeagues?: string[],
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function attachAuthErrorKey(err: unknown, key: AuthErrorKey): Error {
  const out = err instanceof Error ? err : new Error(String(err));
  (out as any).errorKey = key;
  return out;
}

/**
 * Translate an HTTP-shaped error from the API client into an AuthErrorKey.
 * Used for /sync failures (the only auth-adjacent server call left after
 * Firebase took over login/register/refresh).
 */
function syncErrorToKey(err: unknown): AuthErrorKey {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("Network request failed") || raw.includes("timeout")) return "networkError";
  if (raw.includes("409")) return "usernameTaken";
  if (raw.includes("429")) return "tooManyAttempts";
  return "registerFailed";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // While `register` is mid-flight (Firebase signup → server sync), the
  // onAuthStateChanged listener should NOT race us by fetching /api/auth/me
  // — the profile row doesn't exist yet, and the listener would 404.
  const registrationInFlight = useRef(false);

  // Register auth-expiry callback so the API client can force logout when
  // the server reports a permanently invalid token.
  useEffect(() => {
    setOnAuthExpired(() => {
      // Force Firebase to drop its session — onAuthStateChanged then clears local state.
      signOut(auth).catch(() => {});
    });
    return () => setOnAuthExpired(null);
  }, []);

  // Source of truth: Firebase auth state. Fires once on mount with the
  // restored user (or null), and again on every sign-in/sign-out.
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;
      if (registrationInFlight.current) return;

      if (!firebaseUser) {
        setUser(null);
        clearSentryUser();
        await AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
        setIsLoading(false);
        return;
      }

      // Show cached profile for instant UI while we revalidate.
      try {
        const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
        if (cached) {
          const cachedUser = JSON.parse(cached) as AuthUser;
          if (cachedUser.id === firebaseUser.uid) {
            setUser(cachedUser);
            setIsLoading(false);
          }
        }
      } catch {
        // Cache read failed — non-fatal
      }

      try {
        const res = await apiRequest("GET", "/api/auth/me");
        const data = await res.json();
        if (cancelled) return;
        setUser(data.user);
        setSentryUser({ id: data.user.id, username: data.user.username });
        await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      } catch (err) {
        // 404 means Firebase user exists but server profile doesn't — this is
        // an orphaned signup (e.g. register sync failed mid-flight). Sign out
        // so the user can try again.
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("404")) {
          await signOut(auth).catch(() => {});
        } else {
          // Network or transient — leave cached user visible.
          console.error("auth:me", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged will populate the user state from /api/auth/me.
    } catch (error) {
      throw attachAuthErrorKey(error, firebaseErrorToKey(error, "login"));
    }
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string, favoriteLeagues: string[] = []) => {
      registrationInFlight.current = true;
      try {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } catch (error) {
        registrationInFlight.current = false;
        throw attachAuthErrorKey(error, firebaseErrorToKey(error, "register"));
      }

      // Firebase signup succeeded → create the server-side profile row.
      try {
        const res = await apiRequest("POST", "/api/auth/sync", { username, favoriteLeagues });
        const data = await res.json();
        setUser(data.user);
        setSentryUser({ id: data.user.id, username: data.user.username });
        await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      } catch (error) {
        // Sync failed — most commonly username conflict (409). Roll back the
        // Firebase identity so the user can retry with a different username
        // (or different email entirely) without leaving an orphan account.
        const fbUser = auth.currentUser;
        if (fbUser) {
          try {
            await deleteUser(fbUser);
          } catch {
            // If deletion fails (rare — needs recent login), the orphan will
            // be cleaned up on next failed /me fetch via signOut.
            await signOut(auth).catch(() => {});
          }
        }
        throw attachAuthErrorKey(error, syncErrorToKey(error));
      } finally {
        registrationInFlight.current = false;
      }
    },
    [],
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw attachAuthErrorKey(error, firebaseErrorToKey(error, "reset"));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("auth:logout", err);
    }
    // onAuthStateChanged listener clears local state.
  }, []);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null);
      return;
    }
    try {
      const res = await apiRequest("GET", "/api/auth/me");
      const data = await res.json();
      setUser(data.user);
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401") || msg.includes("404")) {
        await signOut(auth).catch(() => {});
      }
    }
  }, []);

  // The five callbacks above all use `useCallback` with an empty dep array,
  // so their identity is stable for the lifetime of the provider — no extra
  // ref indirection needed. Memoize the value so context consumers don't
  // re-render on unrelated state changes.
  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      sendPasswordReset,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, sendPasswordReset, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
