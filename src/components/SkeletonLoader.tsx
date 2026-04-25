/**
 * SkeletonLoader — Shimmer placeholders for loading states.
 * Uses Reanimated for native-thread animation (no JS bridge jank).
 * Sizes the shimmer to match real content layout so the layout shift is zero.
 */
import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { isDark } = useTheme();
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!reduceMotion) {
      progress.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    }
  }, [reduceMotion, progress]);

  const shimmerStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 0.6 };
    }
    return {
      opacity: interpolate(progress.value, [0, 0.5, 1], [0.4, 0.9, 0.4]),
    };
  });

  const baseColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        shimmerStyle,
        style,
      ]}
    />
  );
}

// ── Pre-built skeleton layouts ───────────────────────────────────────────────

export function MatchCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[skeletonStyles.matchCard, { backgroundColor: colors.card }]}>
      <View style={skeletonStyles.row}>
        <Skeleton width={80} height={12} borderRadius={6} />
        <Skeleton width={50} height={12} borderRadius={6} />
      </View>
      <View style={[skeletonStyles.row, { marginTop: 14, alignItems: "center" }]}>
        <View style={skeletonStyles.teamCol}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <Skeleton width={72} height={12} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={48} height={28} borderRadius={8} />
        <View style={[skeletonStyles.teamCol, { alignItems: "flex-end" }]}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <Skeleton width={72} height={12} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
}

export function LeaderboardRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[skeletonStyles.lbRow, { borderBottomColor: colors.cardBorder }]}>
      <Skeleton width={24} height={24} borderRadius={12} />
      <Skeleton width={36} height={36} borderRadius={18} style={{ marginLeft: 12 }} />
      <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
        <Skeleton width="55%" height={13} borderRadius={6} />
        <Skeleton width="35%" height={10} borderRadius={5} />
      </View>
      <Skeleton width={44} height={20} borderRadius={8} />
    </View>
  );
}

export function ProfileHeroSkeleton() {
  return (
    <View style={{ alignItems: "center", paddingVertical: 24, gap: 12 }}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width={120} height={18} borderRadius={9} />
      <Skeleton width={80} height={12} borderRadius={6} />
    </View>
  );
}

// ── Standing Row Skeleton ────────────────────────────────────────────────────
// Approximates a standings entry: position badge + team logo + team name
// + played/won/drawn/lost/gd/pts + 5 form chips.

interface SkeletonStandingRowProps {
  count?: number;
  surface?: string;
}

export function SkeletonStandingRow({
  count = 1,
  surface: surfaceOverride,
}: SkeletonStandingRowProps) {
  const { isDark } = useTheme();
  const surface = surfaceOverride || (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)");

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[standingStyles.row, { marginBottom: i < count - 1 ? 1 : 0 }]}
          accessibilityElementsHidden
        >
          {/* Position badge */}
          <Skeleton width={32} height={32} borderRadius={6} />
          {/* Team logo circle */}
          <Skeleton width={22} height={22} borderRadius={11} style={{ marginLeft: 12 }} />
          {/* Team name bar */}
          <Skeleton width={120} height={14} borderRadius={7} style={{ marginLeft: 12, flex: 1 }} />
          {/* Points bar */}
          <Skeleton width={28} height={14} borderRadius={7} style={{ marginLeft: 8 }} />
          {/* Form chips container */}
          <View style={standingStyles.formChips}>
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton
                key={j}
                width={18}
                height={18}
                borderRadius={4}
                style={{ marginLeft: j > 0 ? 4 : 0 }}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

// ── Player Row Skeleton ──────────────────────────────────────────────────────
// For top scorers / assists / cards / injuries: rank + photo circle
// + stacked name/team bars + stat bubble.

interface SkeletonPlayerRowProps {
  count?: number;
  surface?: string;
}

export function SkeletonPlayerRow({ count = 1, surface: surfaceOverride }: SkeletonPlayerRowProps) {
  const { isDark } = useTheme();
  const surface = surfaceOverride || (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)");

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[playerStyles.row, { marginBottom: i < count - 1 ? 1 : 0 }]}
          accessibilityElementsHidden
        >
          {/* Rank number */}
          <Skeleton width={28} height={28} borderRadius={6} />
          {/* Player photo circle */}
          <Skeleton width={32} height={32} borderRadius={16} style={{ marginLeft: 12 }} />
          {/* Player info: stacked name + team */}
          <View style={playerStyles.infoStack}>
            <Skeleton width={100} height={13} borderRadius={6} style={{ marginBottom: 4 }} />
            <Skeleton width={70} height={11} borderRadius={5} />
          </View>
          {/* Stat bubble */}
          <Skeleton width={44} height={28} borderRadius={8} style={{ marginLeft: 12 }} />
        </View>
      ))}
    </>
  );
}

// ── Transfer Row Skeleton ────────────────────────────────────────────────────
// Two team logos with arrow, player name, date.

interface SkeletonTransferRowProps {
  count?: number;
  surface?: string;
}

export function SkeletonTransferRow({
  count = 1,
  surface: surfaceOverride,
}: SkeletonTransferRowProps) {
  const { isDark } = useTheme();
  const surface = surfaceOverride || (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)");

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[transferStyles.row, { marginBottom: i < count - 1 ? 1 : 0 }]}
          accessibilityElementsHidden
        >
          {/* Player photo */}
          <Skeleton width={32} height={32} borderRadius={16} />
          {/* Transfer flow: out logo -> arrow -> in logo */}
          <View style={transferStyles.flowContainer}>
            <Skeleton width={18} height={18} borderRadius={3} />
            <Skeleton width={12} height={6} borderRadius={2} style={{ marginHorizontal: 8 }} />
            <Skeleton width={18} height={18} borderRadius={3} />
          </View>
          {/* Player name + transfer type */}
          <View style={transferStyles.infoStack}>
            <Skeleton width={90} height={13} borderRadius={6} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={10} borderRadius={5} />
          </View>
          {/* Date badge */}
          <Skeleton width={48} height={20} borderRadius={6} style={{ marginLeft: 12 }} />
        </View>
      ))}
    </>
  );
}

// ── Stat Bar Skeleton ────────────────────────────────────────────────────────
// For match stats: home number + split bar + away number.

interface SkeletonStatBarProps {
  count?: number;
  surface?: string;
}

export function SkeletonStatBar({ count = 1, surface: surfaceOverride }: SkeletonStatBarProps) {
  const { isDark } = useTheme();
  const surface = surfaceOverride || (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)");

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[statBarStyles.row, { marginBottom: i < count - 1 ? 12 : 0 }]}>
          {/* Home stat label + number */}
          <View style={statBarStyles.sideCol}>
            <Skeleton width={80} height={12} borderRadius={6} style={{ marginBottom: 6 }} />
            <Skeleton width={28} height={18} borderRadius={6} />
          </View>
          {/* Center bar (full width, with margins) */}
          <Skeleton width="60%" height={24} borderRadius={12} style={{ marginHorizontal: 12 }} />
          {/* Away stat label + number */}
          <View style={statBarStyles.sideCol}>
            <Skeleton width={28} height={18} borderRadius={6} style={{ marginBottom: 6 }} />
            <Skeleton width={80} height={12} borderRadius={6} />
          </View>
        </View>
      ))}
    </>
  );
}

const skeletonStyles = StyleSheet.create({
  matchCard: {
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  teamCol: {
    flex: 1,
    alignItems: "center",
  },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

const standingStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  formChips: {
    flexDirection: "row",
    marginLeft: 8,
  },
});

const playerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  infoStack: {
    flex: 1,
    marginLeft: 12,
  },
});

const transferStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  flowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  infoStack: {
    flex: 1,
    marginLeft: 12,
  },
});

const statBarStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  sideCol: {
    flex: 0.25,
    alignItems: "center",
  },
});
