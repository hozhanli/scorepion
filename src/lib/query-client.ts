import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "./token-store";

/**
 * Default request timeout in milliseconds. Set to 30 seconds to prevent
 * hangs on slow 3G connections and detect unresponsive servers early.
 * Per-endpoint overrides in apiRequest callers take precedence.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

/**
 * Gets the base URL for the Express API server.
 *
 * Accepts EXPO_PUBLIC_DOMAIN in either form:
 *   - bare host:           "localhost:13291"  or  "api.scorepion.fans"
 *   - full URL with scheme: "https://api.scorepion.fans"
 *
 * For bare hosts, `http://` is used when the host is `localhost` or an IP,
 * otherwise `https://`.
 */
export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  // If already a full URL with scheme, use it as-is.
  if (/^https?:\/\//.test(host)) {
    return new URL(host).href;
  }

  // Bare host: infer scheme from whether it's a local/IP address.
  const hostPart = host.split(":")[0];
  const isLocal = hostPart === "localhost" || /^[\d.]+$/.test(hostPart);
  const protocol = isLocal ? "http" : "https";
  return new URL(`${protocol}://${host}`).href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Token refresh logic
// ---------------------------------------------------------------------------

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Deduplicates concurrent refresh attempts (multiple 401s arriving at once).
 * Returns true if refresh succeeded, false if user must re-login.
 */
async function refreshAccessToken(): Promise<boolean> {
  // Deduplicate: if a refresh is already in-flight, wait for it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;

      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/refresh", baseUrl);

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh token is invalid/expired — user must re-login
        await clearTokens();
        return false;
      }

      const data = await res.json();
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Callbacks for auth state changes (set by AuthContext)
// ---------------------------------------------------------------------------

let onAuthExpired: (() => void) | null = null;

export function setOnAuthExpired(callback: (() => void) | null): void {
  onAuthExpired = callback;
}

// ---------------------------------------------------------------------------
// Core API request with auto-refresh
// ---------------------------------------------------------------------------

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (data) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return fetch(url.toString(), {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });
  };

  try {
    const accessToken = await getAccessToken();
    let res = await makeRequest(accessToken);

    // If 401 and we have a refresh token, try refreshing once
    if (res.status === 401 && accessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = await getAccessToken();
        res = await makeRequest(newToken);
      } else {
        // Refresh failed — trigger auth expiry callback
        onAuthExpired?.();
      }
    }

    clearTimeout(timeoutHandle);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    clearTimeout(timeoutHandle);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms on ${method} ${route}`);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// React Query integration
// ---------------------------------------------------------------------------

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const accessToken = await getAccessToken();
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    let res = await fetch(url.toString(), { headers });

    // Auto-refresh on 401
    if (res.status === 401 && accessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = await getAccessToken();
        const newHeaders: Record<string, string> = {};
        if (newToken) newHeaders["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url.toString(), { headers: newHeaders });
      } else {
        onAuthExpired?.();
        if (unauthorizedBehavior === "returnNull") return null;
        throw new Error("401: Session expired");
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch on focus to catch missed updates
      refetchOnReconnect: true, // Refetch on network reconnect
      staleTime: 5 * 60 * 1000,
      retry: 2, // Retry failed queries
    },
    mutations: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 8000),
      onError: (error) => {
        console.error("[API]", error instanceof Error ? error.message : error);
      },
    },
  },
});
