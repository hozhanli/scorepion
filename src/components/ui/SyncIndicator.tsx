/**
 * SyncIndicator — Live data freshness indicator.
 *
 * A 6px dot that visually represents the freshness of cached data:
 *   • Idle (fresh, no active fetch): soft emerald with steady opacity
 *   • Stale (>60s since last update): flame (orange) with steady opacity
 *   • Fetching (active refetch): emerald with pulsing animation
 *
 * Used on match cards and match detail hero to give users confidence that
 * live scores are synced close to backend reality.
 */
import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

export interface SyncIndicatorProps {
  isFetching: boolean; // React Query's isFetching state
  lastUpdated?: number; // Unix timestamp (ms) of last successful fetch
}

export const SyncIndicator = React.memo(function SyncIndicator({
  isFetching,
  lastUpdated,
}: SyncIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  // Determine data freshness: stale if last update > 60s ago
  const isStale = useMemo(() => {
    if (!lastUpdated) return false;
    const ageMs = Date.now() - lastUpdated;
    return ageMs > 60_000; // 60 seconds
  }, [lastUpdated]);

  // Pulsing animation for fetching state
  useEffect(() => {
    if (!isFetching || reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [isFetching, pulse, reduceMotion]);

  const dotColor = isFetching
    ? Colors.palette.emerald // Pulsing emerald while fetching
    : isStale
      ? Colors.palette.flame // Steady flame (orange) if stale
      : Colors.palette.emerald; // Steady emerald if fresh

  const animStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion || !isFetching ? 0.6 : pulse.value,
  }));

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: dotColor }, animStyle]}
      accessibilityLabel={isFetching ? "Syncing data" : isStale ? "Data is stale" : "Data is fresh"}
    />
  );
});

const styles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
