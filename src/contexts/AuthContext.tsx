import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, getQueryFn } from '@/lib/query-client';

const CACHED_USER_KEY = 'auth:cachedUser';

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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. Try loading from cache first — instant startup
        const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
        if (cached && !cancelled) {
          const cachedUser = JSON.parse(cached) as AuthUser;
          setUser(cachedUser);
          setIsLoading(false);
        }

        // 2. Validate with server in background
        try {
          const res = await apiRequest('GET', '/api/auth/me');
          const data = await res.json();
          if (!cancelled) {
            setUser(data.user);
            await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
          }
        } catch {
          // Server says unauthorized or error — clear cache
          if (!cancelled) {
            setUser(null);
            await AsyncStorage.removeItem(CACHED_USER_KEY);
          }
        }
      } catch {
        // Cache read failed — non-fatal
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiRequest('POST', '/api/auth/login', { username, password });
    const data = await res.json();
    setUser(data.user);
    await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await apiRequest('POST', '/api/auth/register', { username, password });
    const data = await res.json();
    setUser(data.user);
    await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (err) {
      console.error('auth:logout', err);
    }
    setUser(null);
    await AsyncStorage.removeItem(CACHED_USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiRequest('GET', '/api/auth/me');
      const data = await res.json();
      setUser(data.user);
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    } catch {
      setUser(null);
      await AsyncStorage.removeItem(CACHED_USER_KEY);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  }), [user, isLoading, login, register, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
