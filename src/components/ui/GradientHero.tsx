/**
 * GradientHero — reward-moment surface for Emerald Minimalism.
 *
 * Reserved for the five approved gradient moments only:
 *   (1) StreakFlame  (2) TierBadge  (3) Match-live / tier promotion / leaderboard
 *   period hero  (4) ProgressBar  (5) Celebration toasts.
 *
 * NEVER use as a screen background, a section header, or an empty state wash.
 * The `glow` prop is limited to `emerald | flame | gold | none`; the legacy
 * `violet` option has been retired and now renders as emerald.
 */
import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { elevation } from '@/constants/colors';

export type GradientTuple =
  | readonly [string, string]
  | readonly [string, string, string]
  | readonly [string, string, string, string];

export interface GradientHeroProps {
  colors: GradientTuple;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  radius?: number;
  /** Legacy `violet` option is retired and silently remapped to emerald. */
  glow?: 'flame' | 'emerald' | 'violet' | 'gold' | 'none';
  padding?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const GLOW: Record<string, any> = {
  flame: Platform.select({
    web: { boxShadow: '0 12px 28px rgba(255, 107, 53, 0.22)' as any },
    default: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 22, elevation: 6 },
  }),
  emerald: Platform.select({
    web: { boxShadow: '0 12px 28px rgba(0, 166, 81, 0.22)' as any },
    default: { shadowColor: '#00A651', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 22, elevation: 6 },
  }),
  // Legacy — retired and remapped to emerald so stale references remain visually harmless.
  violet: Platform.select({
    web: { boxShadow: '0 12px 28px rgba(0, 166, 81, 0.22)' as any },
    default: { shadowColor: '#00A651', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 22, elevation: 6 },
  }),
  gold: Platform.select({
    web: { boxShadow: '0 12px 28px rgba(245, 166, 35, 0.22)' as any },
    default: { shadowColor: '#F5A623', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 22, elevation: 6 },
  }),
  none: {},
};

export function GradientHero({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  radius = 24,
  glow = 'none',
  padding = 20,
  style,
  children,
}: GradientHeroProps) {
  const elevationStyle = Platform.select({
    web: { boxShadow: elevation.soft.web as any },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: elevation.soft.offset,
      shadowOpacity: elevation.soft.opacity,
      shadowRadius: elevation.soft.radius,
      elevation: elevation.soft.elev,
    },
  });

  return (
    <View style={[{ borderRadius: radius }, elevationStyle, GLOW[glow], style]}>
      <LinearGradient
        colors={colors as any}
        start={start}
        end={end}
        style={[styles.gradient, { borderRadius: radius, padding }]}
      >
        {/* Subtle top shimmer overlay for depth */}
        <View pointerEvents="none" style={[styles.shimmer, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]} />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
