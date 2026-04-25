/**
 * Secure token storage for JWT auth.
 *
 * - Native (iOS/Android): Uses expo-secure-store (hardware-backed keychain /
 *   EncryptedSharedPreferences).
 * - Web: Falls back to localStorage. This is less secure than a native
 *   keychain, but expo-secure-store's web module is a no-op stub so we must
 *   handle it ourselves. For a production web app you'd typically use
 *   httpOnly cookies instead, but for an Expo universal app localStorage
 *   is the pragmatic choice.
 *
 * Access tokens are also cached in-memory for faster synchronous reads.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "auth:accessToken";
const REFRESH_TOKEN_KEY = "auth:refreshToken";

// ---------------------------------------------------------------------------
// Platform-aware helpers
// ---------------------------------------------------------------------------

const isWeb = Platform.OS === "web";

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private/incognito mode may throw
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Best effort
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// ---------------------------------------------------------------------------
// Access Token
// ---------------------------------------------------------------------------

let memoryAccessToken: string | null = null;

export async function getAccessToken(): Promise<string | null> {
  // Check memory first (faster than keychain / localStorage)
  if (memoryAccessToken) return memoryAccessToken;

  try {
    const token = await getItem(ACCESS_TOKEN_KEY);
    if (token) memoryAccessToken = token;
    return token;
  } catch {
    return memoryAccessToken;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  memoryAccessToken = token;
  try {
    await setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // Secure store unavailable — memory-only is acceptable for access tokens
  }
}

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    console.warn(
      "[TokenStore] Failed to persist refresh token — session will not survive app restart",
    );
  }
}

// ---------------------------------------------------------------------------
// Clear All
// ---------------------------------------------------------------------------

export async function clearTokens(): Promise<void> {
  memoryAccessToken = null;
  try {
    await deleteItem(ACCESS_TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
  } catch {
    // Best effort
  }
}
