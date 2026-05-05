import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

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
  const host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  if (/^https?:\/\//.test(host)) {
    return new URL(host).href;
  }

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
// Firebase ID-token retrieval
// ---------------------------------------------------------------------------

/**
 * Gets the current Firebase ID token. Firebase auto-refreshes when within
 * 5 minutes of expiry, so we just call `getIdToken()` — the SDK handles
 * the refresh transparently and returns a fresh token on each call.
 *
 * Pass `forceRefresh=true` after a 401 to force the SDK to fetch a new token
 * (the previous one may have been revoked server-side or the clock skewed).
 */
async function getIdToken(forceRefresh = false): Promise<string | null> {
  const fbUser = auth.currentUser;
  if (!fbUser) return null;
  try {
    return await fbUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auth-expiry callback (set by AuthContext)
// ---------------------------------------------------------------------------

let onAuthExpired: (() => void) | null = null;

export function setOnAuthExpired(callback: (() => void) | null): void {
  onAuthExpired = callback;
}

// ---------------------------------------------------------------------------
// Core API request
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
    const token = await getIdToken();
    let res = await makeRequest(token);

    // 401 with a token usually means the token was rejected (skew, revocation,
    // upstream key rotation). Force-refresh once and retry.
    if (res.status === 401 && token) {
      const fresh = await getIdToken(true);
      if (fresh && fresh !== token) {
        res = await makeRequest(fresh);
      }
      if (res.status === 401) onAuthExpired?.();
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

    const token = await getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res = await fetch(url.toString(), { headers });

    if (res.status === 401 && token) {
      const fresh = await getIdToken(true);
      if (fresh && fresh !== token) {
        const retryHeaders: Record<string, string> = { Authorization: `Bearer ${fresh}` };
        res = await fetch(url.toString(), { headers: retryHeaders });
      }
      if (res.status === 401) {
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
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000,
      retry: 2,
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
