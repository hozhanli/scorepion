import { initSentryClient, SentryErrorBoundary } from "@/lib/sentry";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// KeyboardProvider from react-native-keyboard-controller requires a custom
// dev build (its native module is unavailable under Expo Go). Removed to
// unblock the simulator; reintroduce behind a `npx expo prebuild` + pod
// install flow if rich keyboard handling is needed.
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CelebrationProvider } from "@/components/ui";
import { ErrorToastHost } from "@/components/ui/ErrorToast";
// ConnectionBanner retired per Emerald Minimalism audit §3.4 —
// offline state is now represented by inline error recovery in affected
// content areas and a silent dot indicator (future: tab bar corner).
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import {
  registerForPushNotifications,
  setupNotificationHandlers,
  setupNotificationResponseHandler,
  syncPushToken,
  unregisterPushToken,
} from "@/lib/notifications";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

// Initialize Sentry error tracking on app start
initSentryClient();

SplashScreen.preventAutoHideAsync();

/**
 * Initializes push notifications when user authenticates.
 * Wrapped in a component so it has access to AuthContext and router.
 */
function PushNotificationInitializer() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Setup notification handlers on first mount (one-time)
  useEffect(() => {
    setupNotificationHandlers();
    setupNotificationResponseHandler(router);
  }, [router]);

  // Register for push and sync token when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications()
        .then((token) => {
          if (token) {
            syncPushToken(token).catch((err) => {
              console.warn("[App] Failed to sync push token:", err);
            });
          }
        })
        .catch((err) => {
          console.warn("[App] Push notification registration failed:", err);
          // Non-blocking: app continues even if push setup fails
        });
    }
  }, [isAuthenticated]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen
        name="match/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="league/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="group/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="premium"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="scoring"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="delete-account"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="glossary"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="privacy"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen name="terms" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen
        name="team/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <PushNotificationInitializer />
              <CelebrationProvider>
                <AppProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                    <ErrorToastHost />
                  </GestureHandlerRootView>
                </AppProvider>
              </CelebrationProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
