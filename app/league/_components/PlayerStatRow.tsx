import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { PressableScale } from "@/components/ui";
import type { PlayerProfileData } from "@/components/PlayerProfileSheet";
import { accent, radii } from "@/constants/colors";

const ROW_HEIGHT = 70;

function PlayerStatRowComponent({
  item,
  index,
  statValue,
  statIcon,
  isCards = false,
  onPress,
}: {
  item: any;
  index: number;
  statValue: number;
  statIcon: string;
  isCards?: boolean;
  onPress?: (player: PlayerProfileData) => void;
}) {
  const { surface, border, textRole } = useTheme();
  const rank = item.rank || index + 1;
  const isLeader = rank === 1;
  const matches = item.matches || 0;
  const cardsPerMatch = matches > 0 ? (statValue / matches).toFixed(1) : "0.0";

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

  const statLabel =
    statIcon === "shield" ? "tackles" : statIcon === "hand-left" ? "assists" : "stat";
  const accessibilityLabel = `${rank}. ${item.playerName}, ${item.team?.name || "Unknown"}, ${statValue} ${statLabel}${item.matches ? `, ${item.matches} appearances` : ""}`;

  const handlePress = () => {
    if (onPress) {
      onPress({
        playerId: item.playerName,
        playerName: item.playerName,
        playerPhoto: item.playerPhoto,
        team: item.team,
        seasonStats: {
          assists: statIcon === "hand-left" ? statValue : undefined,
          matches: item.matches,
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
        <Text style={rankTextStyle}>{rank}</Text>
      </View>
      {item.playerPhoto ? (
        <Image
          source={{ uri: item.playerPhoto, cache: "force-cache" }}
          style={[sStyles.playerPhoto, { backgroundColor: surface[2] }]}
          resizeMode="cover"
          accessibilityElementsHidden
        />
      ) : item.team?.logo ? (
        <Image
          source={{ uri: item.team.logo, cache: "force-cache" }}
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
            {(item.team?.shortName || "?").charAt(0)}
          </Text>
        </View>
      )}
      <View style={sStyles.playerInfo} accessibilityElementsHidden>
        <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>
          {item.playerName}
        </Text>
        <Text style={[sStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>
          {item.team?.name || ""}
        </Text>
      </View>
      <View style={sStyles.statsCol} accessibilityElementsHidden>
        <View style={goalBubbleStyle}>
          <Ionicons
            name={statIcon as keyof typeof Ionicons.glyphMap}
            size={14}
            color={accent.primary}
          />
          <Text style={sStyles.goalCount}>{statValue}</Text>
        </View>
        {isCards ? (
          <>
            <Text style={[sStyles.assistText, { color: textRole.tertiary }]}>{matches} apps</Text>
            <Text style={[sStyles.assistText, { color: textRole.tertiary }]}>
              {cardsPerMatch} per game
            </Text>
          </>
        ) : (
          <Text style={[sStyles.assistText, { color: textRole.tertiary }]}>{matches} apps</Text>
        )}
      </View>
    </PressableScale>
  );
}

export const PlayerStatRow = React.memo(PlayerStatRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.rank === nextProps.item.rank &&
    prevProps.item.playerName === nextProps.item.playerName &&
    prevProps.statValue === nextProps.statValue &&
    prevProps.item.matches === nextProps.item.matches &&
    prevProps.statIcon === nextProps.statIcon &&
    prevProps.isCards === nextProps.isCards &&
    prevProps.index === nextProps.index
  );
});

export const ROW_HEIGHT_PLAYER = ROW_HEIGHT;

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
