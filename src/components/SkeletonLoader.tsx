/**
 * SkeletonLoader — Shimmer placeholders for loading states.
 * Uses Reanimated for native-thread animation (no JS bridge jank).
 * Sizes the shimmer to match real content layout so the layout shift is zero.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
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

  const baseColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

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
      <View style={[skeletonStyles.row, { marginTop: 14, alignItems: 'center' }]}>
        <View style={skeletonStyles.teamCol}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <Skeleton width={72} height={12} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={48} height={28} borderRadius={8} />
        <View style={[skeletonStyles.teamCol, { alignItems: 'flex-end' }]}>
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
    <View style={{ alignItems: 'center', paddingVertical: 24, gap: 12 }}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width={120} height={18} borderRadius={9} />
      <Skeleton width={80} height={12} borderRadius={6} />
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
