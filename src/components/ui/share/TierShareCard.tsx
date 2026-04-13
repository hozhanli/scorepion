/**
 * TierShareCard — "Share my tier" card for the profile.
 *
 * A wide square card (320×320) with:
 *   - Full-bleed gradient background (tier-colored)
 *   - Centered TierBadge
 *   - Tier name + username
 *   - Points total at bottom
 *   - Scorepion wordmark in corner
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type ViewStyle, type StyleProp } from 'react-native';
import { spacing, type as typeScale, radii, surface, tiers } from '@/constants/colors';
import type { TierName } from '../TierBadge';
import { TierBadge } from '../TierBadge';

export type TierShareCardProps = {
  username: string;
  tierName: TierName;
  points: number;
  level?: number;
  style?: StyleProp<ViewStyle>;
};

export function TierShareCard({
  username,
  tierName,
  points,
  level,
  style,
}: TierShareCardProps) {
  const tierCfg = tiers[tierName];

  return (
    <View
      collapsable={false}
      style={[styles.outerContainer, style]}
    >
      <LinearGradient
        colors={tierCfg.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radii.lg }]}
      >
        {/* Top shimmer overlay */}
        <View
          pointerEvents="none"
          style={[styles.shimmer, { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg }]}
        />

        {/* Main content — centered */}
        <View style={styles.center}>
          {/* Tier badge */}
          <View style={styles.badgeContainer}>
            <TierBadge tier={tierName} level={level} size="lg" solid />
          </View>

          {/* Tier name */}
          <Text style={styles.tierName}>{tierCfg.label}</Text>

          {/* Username */}
          <Text style={styles.username}>@{username}</Text>
        </View>

        {/* Bottom section — points + wordmark */}
        <View style={styles.footer}>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
          <Text style={styles.wordmark}>scorepion</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: 320,
    aspectRatio: 1,
    alignSelf: 'center',
  },
  gradient: {
    flex: 1,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    pointerEvents: 'none',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[3],
  },
  badgeContainer: {
    marginBottom: spacing[2],
  },
  tierName: {
    fontSize: typeScale.h1.size,
    fontFamily: typeScale.h1.family,
    fontWeight: typeScale.h1.weight,
    color: surface[0],
    letterSpacing: 0,
  },
  username: {
    fontSize: typeScale.body.size,
    fontFamily: typeScale.body.family,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0,
  },
  footer: {
    alignItems: 'center',
    gap: spacing[2],
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
  },
  pointsValue: {
    fontSize: typeScale.h2.size,
    fontFamily: typeScale.h2.family,
    fontWeight: typeScale.h2.weight,
    color: surface[0],
  },
  pointsLabel: {
    fontSize: typeScale.caption.size,
    fontFamily: typeScale.caption.family,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  wordmark: {
    fontSize: typeScale.micro.size,
    fontFamily: typeScale.micro.family,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.3,
    textTransform: 'lowercase',
  },
});
