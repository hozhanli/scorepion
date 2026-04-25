import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import type { TopScorer } from "@/lib/types";
import { PressableScale } from "@/components/ui";
import type { PlayerProfileData } from "@/components/PlayerProfileSheet";
import { accent, radii } from "@/constants/colors";

const ROW_HEIGHT = 70;

function ScorerRowItemComponent({
  scorer,
  index,
  onPress,
}: {
  scorer: TopScorer;
  index: number;
  onPress?: (player: PlayerProfileData) => void;
}) {
  const { surface, border, textRole } = useTheme();
  const isLeader = scorer.rank === 1;

  const rowStyle = useMemo(
    () => [sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }],
    [surface, border],
  );

  const goalBubbleStyle = useMemo(
    () => [sStyles.goalBubble, isLeader && sStyles.goalBubbleLeader],
    [isLeader],
  );

  const rankTextStyle = useMemo(
    () => [sStyles.rankText, { color: textRole.tertiary }, isLeader && sStyles.rankTextLeader],
    [textRole.tertiary, isLeader],
  );

  const accessibilityLabel = `${scorer.rank}. ${scorer.playerName}, ${scorer.team.name}, ${scorer.goals} goals${scorer.assists ? `, ${scorer.assists} assists` : ""}`;

  const handlePress = () => {
    if (onPress) {
      onPress({
        playerId: scorer.playerName,
        playerName: scorer.playerName,
        playerPhoto: scorer.playerPhoto,
        team: scorer.team,
        seasonStats: {
          goals: scorer.goals,
          assists: scorer.assists,
          matches: scorer.matches,
        },
      });
    }
  };

  return (
    <PressableScale
      onPress={handlePress}
      style={rowStyle}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={sStyles.rankCol} accessibilityElementsHidden>
        <Text style={rankTextStyle}>{scorer.rank}</Text>
      </View>
      {scorer.playerPhoto ? (
        <Image
          source={{ uri: scorer.playerPhoto, cache: "force-cache" }}
          style={[sStyles.playerPhoto, { backgroundColor: surface[2] }]}
          resizeMode="cover"
          accessibilityElementsHidden
        />
      ) : scorer.team.logo ? (
        <Image
          source={{ uri: scorer.team.logo, cache: "force-cache" }}
          style={sStyles.teamBadgeImg}
          resizeMode="contain"
          accessibilityElementsHidden
        />
      ) : (
        <View
          style={[sStyles.teamBadge, { backgroundColor: surface[2] }]}
          accessibilityElementsHidden
        >
          <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>
            {scorer.team.shortName.charAt(0)}
          </Text>
        </View>
      )}
      <View style={sStyles.playerInfo} accessibilityElementsHidden>
        <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>
          {scorer.playerName}
        </Text>
        <Text style={[sStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>
          {scorer.team.name}
        </Text>
      </View>
      <View style={sStyles.statsCol} accessibilityElementsHidden>
        <View style={goalBubbleStyle}>
          <Ionicons name="football" size={14} color={accent.primary} />
          <Text style={sStyles.goalCount}>{scorer.goals}</Text>
        </View>
        <Text style={[sStyles.assistText, { color: textRole.tertiary }]}>{scorer.assists} ast</Text>
      </View>
    </PressableScale>
  );
}

export const ScorerRowItem = React.memo(ScorerRowItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.scorer.rank === nextProps.scorer.rank &&
    prevProps.scorer.playerName === nextProps.scorer.playerName &&
    prevProps.scorer.goals === nextProps.scorer.goals &&
    prevProps.scorer.assists === nextProps.scorer.assists &&
    prevProps.index === nextProps.index
  );
});

export const ROW_HEIGHT_SCORER = ROW_HEIGHT;

const sStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  rankCol: { width: 28, alignItems: "center" },
  rankText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  rankTextLeader: {
    color: accent.primary,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  teamBadgeText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  playerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  teamBadgeImg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    marginLeft: 8,
  },
  playerInfo: { flex: 1, marginLeft: 12 },
  playerName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  playerTeam: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statsCol: { alignItems: "flex-end" },
  goalBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 166, 81, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  goalBubbleLeader: {
    backgroundColor: "rgba(0, 166, 81, 0.14)",
  },
  goalCount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: accent.primary,
  },
  assistText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
});
