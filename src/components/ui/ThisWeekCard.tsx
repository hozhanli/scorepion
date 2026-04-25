/**
 * ThisWeekCard — Weekly glance summary for the Home tab.
 *
 * Shows key metrics (points, accuracy, streak, tier) and a chase target
 * at a glance, optimized for a 3-second scan.
 *
 * Layout:
 *   • Top row: "THIS WEEK · Apr 13–19" + rank badge "#47"
 *   • Middle row: 4 comma-separated stats with icons
 *   • Bottom row: Chase card (who to catch)
 *
 * Tappable → navigates to Leaderboard.
 */
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useUserStats } from "@/lib/football-api";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { computeLevel } from "@/lib/leveling";
import { PressableScale } from "@/components/ui/PressableScale";
import StyledText from "@/components/ui/StyledText";
import { accent } from "@/constants/colors";

interface ThisWeekCardProps {
  onPress?: () => void;
}

function getWeekDateRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  // Get Monday of this week
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diffToMonday);
  // Get Sunday of this week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatter = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return {
    start: formatter(monday),
    end: formatter(sunday),
  };
}

export function ThisWeekCard({ onPress }: ThisWeekCardProps) {
  const { surface, border, textRole } = useTheme();
  const { t } = useLanguage();
  const { data: userStats } = useUserStats();
  const { dailyPack } = useApp();

  const weeklyPoints = userStats?.weeklyPoints ?? 0;
  const streak = userStats?.streak ?? 0;
  const correctPredictions = userStats?.correctPredictions ?? 0;
  const totalPredictions = userStats?.totalPredictions ?? 1;
  const rank = userStats?.rank ?? 0;
  const totalPoints = userStats?.totalPoints ?? 0;

  const accuracy =
    totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;

  const tier = useMemo(() => computeLevel(totalPoints), [totalPoints]);

  const dateRange = useMemo(() => getWeekDateRange(), []);

  // Chase: who's ahead
  const [chaseTarget, chaseName, chaseGap] = useMemo(() => {
    if (rank === 1) return [null, "You're the leader", 0];
    if (!userStats) return [null, "Loading...", 0];
    // Placeholder logic: assume there's always someone ahead
    // In production, this would come from useChaseData() if available
    // For now, show a generic "Climb the ranks" message
    return [null, `${rank > 0 ? `Rank ${rank - 1}` : "Someone"} ahead`, 0];
  }, [rank, userStats]);

  const handlePress = () => {
    onPress?.();
    router.push("/(tabs)/leaderboard" as any);
  };

  // Empty state: user hasn't predicted yet this week
  if (weeklyPoints === 0 && dailyPack?.picks?.length === 0) {
    return (
      <PressableScale onPress={() => router.push("/(tabs)/matches" as any)} haptic="light">
        <View
          style={[cardStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}
        >
          <View style={cardStyles.headerRow}>
            <StyledText variant="micro" role="tertiary" style={cardStyles.label}>
              THIS WEEK
            </StyledText>
          </View>
          <View style={cardStyles.emptyContent}>
            <Text style={cardStyles.emptyText}>
              Your first prediction this week earns you points.
            </Text>
          </View>
        </View>
      </PressableScale>
    );
  }

  return (
    <PressableScale onPress={handlePress} haptic="light">
      <View style={[cardStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}>
        {/* Header: "THIS WEEK · Apr 13–19" + rank badge */}
        <View style={cardStyles.headerRow}>
          <View>
            <StyledText variant="micro" role="tertiary" style={cardStyles.label}>
              THIS WEEK · {dateRange.start}–{dateRange.end}
            </StyledText>
          </View>
          {rank > 0 && (
            <View style={[cardStyles.rankBadge, { backgroundColor: accent.primary }]}>
              <Text style={cardStyles.rankText}>#{rank}</Text>
            </View>
          )}
        </View>

        {/* Stats row: points, accuracy, streak, tier */}
        <View style={cardStyles.statsRow}>
          <StatIcon icon="football-outline" label={`${weeklyPoints} pts`} />
          <Text style={cardStyles.statSeparator}>·</Text>
          <StatIcon icon="trending-up-outline" label={`${accuracy}%`} />
          <Text style={cardStyles.statSeparator}>·</Text>
          <StatIcon icon="flame-outline" label={`${streak}-day`} />
          <Text style={cardStyles.statSeparator}>·</Text>
          <StatIcon icon="medal-outline" label={tier.name} />
        </View>

        {/* Chase row */}
        {chaseTarget === null && rank > 0 ? (
          <View style={cardStyles.chaseRow}>
            <Text style={cardStyles.chaseText}>Climb to rank #{rank - 1}</Text>
            <Ionicons name="arrow-forward" size={12} color={accent.primary} />
          </View>
        ) : rank === 1 ? (
          <View style={cardStyles.chaseRow}>
            <Text style={cardStyles.chaseText}>You&apos;re the leader 🏆</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

function StatIcon({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={cardStyles.stat}>
      <Ionicons name={icon} size={12} color={accent.primary} />
      <Text style={cardStyles.statLabel}>{label}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: "center",
  },

  rankText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#333333",
    letterSpacing: -0.2,
  },

  statSeparator: {
    fontSize: 12,
    color: "rgba(0,0,0,0.2)",
    marginHorizontal: 2,
  },

  chaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  chaseText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: accent.primary,
    flex: 1,
  },

  emptyContent: {
    paddingVertical: 8,
  },

  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#666666",
    fontStyle: "italic",
  },
});
