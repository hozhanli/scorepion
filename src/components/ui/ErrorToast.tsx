/**
 * ErrorToast — error notification system for silent failures.
 *
 * Mounted once at app root via <ErrorToastHost />.
 * Shows up to 3 errors stacked at bottom of safe area, 24px above tab bar.
 * Auto-dismisses after 4s; user can tap to dismiss early or tap Retry.
 *
 * Design spec:
 * - Position: bottom of safe area, 24px above tab bar
 * - Width: screenWidth - 32px (16px margins)
 * - Height: min 56px, grows with message
 * - Background: Colors.palette.alertSoft with red border
 * - Icon: alert-circle, 20px, red, left-side
 * - Title: 14pt SemiBold, primary text
 * - Message: 13pt Regular, secondary text, max 2 lines + ellipsis
 * - Retry button: optional pill on right
 * - Entry: FadeInDown + subtle shake
 * - Exit: FadeOut
 * - Respects reduce motion for accessibility
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, AccessibilityInfo, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import Colors, {
  accent,
  radii,
  text as textRole,
  spacing,
  type as typeScale,
} from "@/constants/colors";
import { haptics, springs } from "@/lib/motion";
import { PressableScale } from "@/components/ui/PressableScale";
import { dismissErrorToast, subscribeToErrors, type ErrorToastOptions } from "@/lib/error-toast";

/**
 * Host component: mounts once at app root, manages queue and stacking.
 */
export function ErrorToastHost() {
  const [errorQueue, setErrorQueue] = useState<(ErrorToastOptions & { id: string })[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToErrors((queue) => {
      setErrorQueue(queue as (ErrorToastOptions & { id: string })[]);
    });
    return unsubscribe;
  }, []);

  const insets = useSafeAreaInsets();

  // Bottom of safe area, 24px above where tab bar typically sits
  const bottomSpacing = insets.bottom + spacing[6];

  return (
    <View
      style={[
        styles.host,
        {
          bottom: bottomSpacing,
          paddingHorizontal: spacing[4],
        },
      ]}
      pointerEvents="box-none"
    >
      {errorQueue.map((error, index) => (
        <ErrorToastItem key={error.id} error={error} index={index} totalCount={errorQueue.length} />
      ))}
    </View>
  );
}

/**
 * Individual error toast item with animations
 */
function ErrorToastItem({
  error,
  index,
  totalCount,
}: {
  error: ErrorToastOptions & { id: string };
  index: number;
  totalCount: number;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const shakeAmount = useSharedValue(0);
  const duration = error.durationMs ?? 4000;

  // Check accessibility setting on mount
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (!cancelled) setReduceMotion(!!enabled);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    const timeoutId = setTimeout(() => dismissErrorToast(error.id), duration);
    return () => clearTimeout(timeoutId);
  }, [duration, error.id]);

  // Trigger shake animation on mount
  useEffect(() => {
    haptics.light?.().catch(() => {});
    // Subtle shake: 2px left-right, 2 iterations
    shakeAmount.value = withSpring(0, springs.gentle);
  }, []);

  // Animations based on reduce motion setting
  const enteringAnim = reduceMotion
    ? FadeIn.duration(200)
    : FadeInDown.duration(280).springify().damping(12);

  const exitingAnim = reduceMotion ? FadeOut.duration(160) : FadeOut.duration(200);

  // Shake animation via translateX
  const shakeStyle = useAnimatedStyle(() => {
    const shake = interpolate(shakeAmount.value, [0, 1], [0, 1], Extrapolate.CLAMP);
    const offset = Math.sin(shake * Math.PI * 4) * 2; // 2px left-right, 4 oscillations
    return {
      transform: [{ translateX: offset }],
    };
  });

  // Stack toasts vertically with small gap between them
  const verticalOffset = index * (120 + spacing[2]); // 120 ≈ toast height + gap

  return (
    <Animated.View
      entering={enteringAnim}
      exiting={exitingAnim}
      style={[
        shakeStyle,
        {
          marginBottom: verticalOffset,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessible
      accessibilityLabel={`Error: ${error.title}${error.message ? `. ${error.message}` : ""}`}
    >
      <Pressable
        style={styles.toast}
        onPress={() => dismissErrorToast(error.id)}
        accessibilityRole="button"
        accessibilityHint={
          error.retry ? "Double tap to dismiss, or use the retry button below" : "Tap to dismiss"
        }
      >
        {/* Icon: alert-circle in red on left */}
        <Ionicons name="alert-circle" size={20} color={accent.alert} style={styles.icon} />

        {/* Text content: title + message */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {error.title}
          </Text>
          {error.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {error.message}
            </Text>
          ) : null}
        </View>

        {/* Dismiss button: small close icon on top-right */}
        <Pressable
          hitSlop={8}
          onPress={() => dismissErrorToast(error.id)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss error"
        >
          <Ionicons name="close" size={16} color={textRole.tertiary} style={styles.dismissIcon} />
        </Pressable>
      </Pressable>

      {/* Retry button below toast if provided */}
      {error.retry ? (
        <PressableScale
          onPress={() => {
            error.retry?.();
            dismissErrorToast(error.id);
          }}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel={`Retry: ${error.title}`}
        >
          <Text style={styles.retryText}>Retry</Text>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    pointerEvents: "box-none",
    zIndex: 9998, // Below celebration toasts (9999) but above regular content
  },

  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.palette.redSoft, // rgba(239, 68, 68, 0.10)
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.24)", // red @24% opacity for subtle border
    borderRadius: radii.md,
    minHeight: 56,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  icon: {
    marginTop: 2, // Slight alignment for visual balance
    flexShrink: 0,
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  title: {
    fontSize: typeScale.caption.size,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    color: textRole.primary,
    lineHeight: 18,
  },

  message: {
    fontSize: typeScale.caption.size - 1, // 12pt
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    color: textRole.secondary,
    lineHeight: 16,
    marginTop: 4,
  },

  dismissIcon: {
    marginTop: 2,
    marginRight: -4,
  },

  retryButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginRight: 0,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: radii.pill,
  },

  retryText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    color: accent.alert,
    letterSpacing: 0.2,
  },
});
