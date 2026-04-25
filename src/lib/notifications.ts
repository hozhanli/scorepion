/**
 * Expo push notifications for Scorepion.
 *
 * Permission flow (first app open after sign-in):
 *   1. Ask the OS for notification permission (iOS: alert/badge/sound; Android: channel)
 *   2. If granted, fetch the Expo push token via getExpoPushTokenAsync()
 *   3. Register it with our server (POST /api/push/token)
 *   4. Cache the token locally so we don't re-register every app open
 *
 * Notification handlers:
 *   - Foreground: banners + sounds even when app is in focus
 *   - Response (tap): deep-link to match/league/etc based on push data
 *
 * Platform gotchas:
 *   - Android requires a notification channel before showing anything
 *   - iOS simulator doesn't support push — only real devices
 *   - Web: no-op (Expo push is native-only)
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Router } from "expo-router";
import { apiRequest } from "./query-client";

const PUSH_TOKEN_STORAGE_KEY = "scorepion:push_token";

/**
 * Creates a default notification channel for Android with MAX importance.
 * Must be called before showing any notifications on Android.
 */
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
}

/**
 * Registers the device for push notifications.
 *
 * Flow:
 *   1. Request OS permission
 *   2. Get Expo push token
 *   3. Register with server (POST /api/push/token)
 *   4. Cache in AsyncStorage to avoid re-registering
 *
 * Returns the push token on success, null on denial/web/simulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // No-op on web
  if (Platform.OS === "web") {
    return null;
  }

  // iOS simulator doesn't support push tokens
  if (Platform.OS === "ios" && !Device.isDevice) {
    console.warn(
      "[Notifications] iOS simulator detected — push tokens unavailable. Real device required.",
    );
    return null;
  }

  try {
    // Check cached token first
    const cached = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (cached) {
      return cached;
    }

    // Request OS permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Notifications] Permission denied by user. Push notifications disabled.");
      return null;
    }

    // Setup Android channel before requesting token
    await setupAndroidChannel();

    // Fetch Expo push token
    const projectId =
      require("../../app.json")?.expo?.extra?.eas?.projectId || process.env.EXPO_PROJECT_ID;
    if (!projectId) {
      console.error("[Notifications] EXPO_PROJECT_ID not found in app.json or env");
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    if (!token) {
      console.error("[Notifications] Failed to fetch Expo push token");
      return null;
    }

    // Cache the token
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);

    // Register with server (apiRequest attaches JWT + uses EXPO_PUBLIC_DOMAIN)
    try {
      await apiRequest("POST", "/api/push/token", {
        token,
        platform: Platform.OS,
      });
    } catch (err) {
      console.error("[Notifications] Server registration error:", err);
      // Still return the token even if server call fails — cached locally for retry
    }

    return token;
  } catch (err) {
    console.error("[Notifications] Error during registration:", err);
    return null;
  }
}

/**
 * Syncs a token with the server (idempotent — safe to call multiple times).
 */
export async function syncPushToken(token: string): Promise<void> {
  if (!token) return;
  try {
    await apiRequest("POST", "/api/push/token", {
      token,
      platform: Platform.OS,
    });
  } catch (err) {
    console.error("[Notifications] syncPushToken error:", err);
  }
}

/**
 * Sets up foreground notification handler (banners + sounds even in focus).
 * Must be called once on app startup.
 */
export function setupNotificationHandlers(): void {
  // Configure notification behavior in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // v0.29+ replaced shouldShowAlert with a banner/list split.
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Sets up notification response handler (tap routing).
 * Must be called once on app startup, and router must be ready.
 */
export function setupNotificationResponseHandler(router: Router): void {
  Notifications.addNotificationResponseReceivedListener(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as Record<string, any> | undefined;
      if (!data) return;

      const { type, matchId, leagueId } = data;

      // Route based on notification type
      if (matchId) {
        router.push(`/match/${matchId}`);
      } else if (leagueId) {
        router.push(`/league/${leagueId}`);
      } else if (type === "streak_at_risk") {
        // Navigate to today's matches to encourage a prediction
        router.push("/(tabs)");
      }
    },
  );
}

/**
 * Unregisters a device token (call on logout).
 */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await apiRequest("DELETE", "/api/push/token", { token });
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch (err) {
    console.error("[Notifications] Unregister error:", err);
  }
}
