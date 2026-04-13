/**
 * WeeklyWrapCard — the Sunday-night / Monday-morning weekly recap.
 *
 * Two modes:
 *   inline (profile page) — compact, themed, matches Emerald Minimalism cards.
 *   export (share image)  — fixed-width, branded footer with scorepion.app.
 *
 * Inline variant uses the same surface/border/hairline pattern as StatCard
 * and AchievementCard on the profile page for visual consistency.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { type ViewStyle, type StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accent, spacing, type as typeScale, radii } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { TierBadge } from '../TierBadge';
import type { TierName } from '../TierBadge';

export type WeeklyWrapCardProps = {
  weekLabel: string; // e.g. "Apr 6 — 12"
  rank: number;
  weeklyPoints: number;
  accuracy: number; // 0-100
  bestStreak: number;
  tierLabel: TierName;
  peopleBeaten?: number; // optional
  username?: string;
  style?: StyleProp<ViewStyle>;
  inline?: boolean; // When true, optimize for inline profile display (not share export)
};

export function WeeklyWrapCard({
  weekLabel,
  rank,
  weeklyPoints,
  accuracy,
  bestStreak,
  tierLabel,
  peopleBeaten,
  username,
  style,
  inline = false,
}: WeeklyWrapCardProps) {
  const { surface, border, textRole } = useTheme();
  const flavorText = peopleBeaten
    ? `You beat ${peopleBeaten.toLocaleString()} predictors this week.`
    : null;

  // ── Inline variant (profile page) ──
  if (inline) {
    return (
      <View style={[styles.inlineCard, { backgroundColor: surface[0], borderColor: border.subtle }, style]}>
        {/* Emerald left accent */}
        <View style={styles.inlineAccent} />

        <View style={styles.inlineContent}>
          {/* Header row */}
          <View style={styles.inlineHeaderRow}>
            <View style={styles.inlineHeaderLeft}>
              <Text style={[styles.inlineHeaderText, { color: textRole.secondary }]}>
                Your week · <Text style={{ fontFamily: 'Inter_700Bold', color: textRole.primary }}>{weekLabel}</Text>
              </Text>
            </View>
            <View style={[styles.inlineRankPill, { backgroundColor: `${accent.primary}14` }]}>
              <Text style={styles.inlineRankText}>#{rank}</Text>
            </View>
          </View>

          {/* Stats row — 4 columns */}
          <View style={styles.inlineStatsRow}>
            <View style={styles.inlineStat}>
              <View style={styles.inlineIconWrap}>
                <Ionicons name="star-outline" size={14} color={accent.primary} />
              </View>
              <Text style={[styles.inlineStatValue, { color: textRole.primary }]}>{weeklyPoints}</Text>
              <Text style={[styles.inlineStatLabel, { color: textRole.tertiary }]}>Points</Text>
            </View>

            <View style={[styles.inlineDivider, { backgroundColor: border.subtle }]} />

            <View style={styles.inlineStat}>
              <View style={styles.inlineIconWrap}>
                <Ionicons name="checkmark-circle-outline" size={14} color={accent.primary} />
              </View>
              <Text style={[styles.inlineStatValue, { color: textRole.primary }]}>{accuracy}%</Text>
              <Text style={[styles.inlineStatLabel, { color: textRole.tertiary }]}>Accuracy</Text>
            </View>

            <View style={[styles.inlineDivider, { backgroundColor: border.subtle }]} />

            <View style={styles.inlineStat}>
              <View style={styles.inlineIconWrap}>
                <Ionicons name="flame-outline" size={14} color={accent.primary} />
              </View>
              <Text style={[styles.inlineStatValue, { color: textRole.primary }]}>{bestStreak}</Text>
              <Text style={[styles.inlineStatLabel, { color: textRole.tertiary }]}>Streak</Text>
            </View>

            <View style={[styles.inlineDivider, { backgroundColor: border.subtle }]} />

            <View style={styles.inlineStat}>
              <TierBadge tier={tierLabel} size="sm" solid />
            </View>
          </View>

          {/* Optional flavor text */}
          {flavorText && (
            <Text style={[styles.inlineFlavorText, { color: textRole.tertiary }]}>{flavorText}</Text>
          )}
        </View>
      </View>
    );
  }

  // ── Export variant (share card) ──
  return (
    <View style={[styles.outerContainer, style]}>
      <View style={[styles.card, { backgroundColor: surface[0] }]}>
        <View style={styles.leftRail} />

        <View style={styles.content}>
          <Text style={[styles.header, { color: textRole.secondary }]}>
            Your week · <Text style={[styles.headerBold, { color: textRole.primary }]}>{weekLabel}</Text>
          </Text>

          <View style={styles.rankSection}>
            <Text style={[styles.rankLabel, { color: textRole.tertiary }]}>Current Rank</Text>
            <Text style={styles.rankNumber}>#{rank}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCell, { backgroundColor: surface[1] }]}>
              <Text style={[styles.statValue, { color: textRole.primary }]}>{weeklyPoints}</Text>
              <Text style={[styles.statLabel, { color: textRole.tertiary }]}>Points</Text>
            </View>
            <View style={[styles.statCell, { backgroundColor: surface[1] }]}>
              <Text style={[styles.statValue, { color: textRole.primary }]}>{accuracy}%</Text>
              <Text style={[styles.statLabel, { color: textRole.tertiary }]}>Accuracy</Text>
            </View>
            <View style={[styles.statCell, { backgroundColor: surface[1] }]}>
              <Text style={[styles.statValue, { color: textRole.primary }]}>{bestStreak}</Text>
              <Text style={[styles.statLabel, { color: textRole.tertiary }]}>Best Streak</Text>
            </View>
            <View style={[styles.statCell, { backgroundColor: surface[1] }]}>
              <TierBadge tier={tierLabel} size="sm" solid />
            </View>
          </View>

          {flavorText && (
            <Text style={[styles.flavorText, { color: textRole.secondary }]}>{flavorText}</Text>
          )}

          <View style={[styles.footer, { borderTopColor: border.subtle }]}>
            <Text style={[styles.footerText, { color: textRole.secondary }]}>scorepion.app</Text>
            {username && (
              <Text style={[styles.usernameText, { color: textRole.tertiary }]}>@{username}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Inline variant (profile page) ──
  inlineCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  inlineAccent: {
    width: 3,
    backgroundColor: accent.primary,
  },
  inlineContent: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  inlineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineHeaderLeft: {
    flex: 1,
  },
  inlineHeaderText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  inlineRankPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inlineRankText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: accent.primary,
    letterSpacing: -0.3,
  },
  inlineStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  inlineIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${accent.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineStatValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  inlineStatLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  inlineDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 2,
  },
  inlineFlavorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },

  // ── Export variant (share card) ──
  outerContainer: {
    width: 320,
    alignSelf: 'center',
  },
  card: {
    borderRadius: radii.lg,
    flexDirection: 'row',
    minHeight: 480,
    overflow: 'hidden',
    borderLeftWidth: 2,
    borderLeftColor: accent.primary,
  },
  leftRail: {
    width: 0,
  },
  content: {
    flex: 1,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
  },
  header: {
    fontSize: typeScale.micro.size,
    fontFamily: typeScale.micro.family,
    fontWeight: typeScale.micro.weight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing[4],
  },
  headerBold: {
    fontWeight: '700',
  },
  rankSection: {
    marginBottom: spacing[4],
  },
  rankLabel: {
    fontSize: typeScale.caption.size,
    fontFamily: typeScale.caption.family,
    marginBottom: spacing[1],
  },
  rankNumber: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    color: accent.primary,
    letterSpacing: -1,
    lineHeight: 48,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radii.sm,
  },
  statValue: {
    fontSize: typeScale.h2.size,
    fontFamily: typeScale.h2.family,
    fontWeight: typeScale.h2.weight,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typeScale.caption.size,
    fontFamily: typeScale.caption.family,
    textAlign: 'center',
  },
  flavorText: {
    fontSize: typeScale.body.size,
    fontFamily: typeScale.body.family,
    textAlign: 'center',
    marginBottom: spacing[3],
    lineHeight: typeScale.body.lineHeight,
  },
  footer: {
    alignItems: 'center',
    gap: spacing[1],
    borderTopWidth: 1,
    paddingTop: spacing[3],
  },
  footerText: {
    fontSize: typeScale.micro.size,
    fontFamily: typeScale.micro.family,
    fontWeight: typeScale.micro.weight,
    letterSpacing: 0.2,
  },
  usernameText: {
    fontSize: typeScale.micro.size,
    fontFamily: typeScale.micro.family,
    fontWeight: '500',
  },
});
