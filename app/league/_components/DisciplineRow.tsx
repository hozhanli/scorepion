import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { PressableScale } from "@/components/ui";
import type { PlayerProfileData } from "@/components/PlayerProfileSheet";
import { accent, radii } from "@/constants/colors";

const ROW_HEIGHT = 76;

interface DisciplineEntry {
  playerName: string;
  playerPhoto?: string;
  team?: any;
  yellowCards: number;
  redCards: number;
  matches: number;
}

function DisciplineRowComponent({
  item,
  index,
  onPress,
}: {
  item: DisciplineEntry;
  index: number;
  onPress?: (player: PlayerProfileData) => void;
}) {
  const { surface, border, textRole } = useTheme();
  const rank = index + 1;
  const perGameRate =
    item.matches > 0 ? ((item.yellowCards + item.redCards) / item.matches).toFixed(2) : "—";

  const rowStyle = React.useMemo(
    () => [dStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }],
    [surface, border],
  );

  const rankTextStyle = React.useMemo(
    () => [dStyles.rankText, { color: textRole.tertiary }],
    [textRole.tertiary],
  );

  const accessibilityLabel = `${rank}. ${item.playerName}, ${item.team?.name || "Unknown"}, ${item.yellowCards} yellow card${item.yellowCards !== 1 ? "s" : ""}, ${item.redCards} red card${item.redCards !== 1 ? "s" : ""}, ${perGameRate} per game`;

  const handlePress = () => {
    if (onPress) {
      onPress({
        playerId: item.playerName,
        playerName: item.playerName,
        playerPhoto: item.playerPhoto,
        team: item.team,
        seasonStats: {
          yellowCards: item.yellowCards,
          redCards: item.redCards,
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
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Rank column */}
      <View style={dStyles.rankCol} accessibilityElementsHidden>
        <Text style={rankTextStyle}>{rank}</Text>
      </View>

      {/* Player photo/badge */}
      {item.playerPhoto ? (
        <Image
          source={{ uri: item.playerPhoto, cache: "force-cache" }}
          style={[dStyles.playerPhoto, { backgroundColor: surface[2] }]}
          resizeMode="cover"
          accessibilityElementsHidden
        />
      ) : item.team?.logo ? (
        <Image
          source={{ uri: item.team.logo, cache: "force-cache" }}
          style={dStyles.teamBadgeImg}
          resizeMode="contain"
          accessibilityElementsHidden
        />
      ) : (
        <View
          style={[dStyles.teamBadge, { backgroundColor: surface[2] }]}
          accessibilityElementsHidden
        >
          <Text style={[dStyles.teamBadgeText, { color: textRole.primary }]}>
            {(item.team?.shortName || "?").charAt(0)}
          </Text>
        </View>
      )}

      {/* Player info: name + team stacked */}
      <View style={dStyles.playerInfo} accessibilityElementsHidden>
        <Text style={[dStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>
          {item.playerName}
        </Text>
        <Text style={[dStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>
          {item.team?.name || ""}
        </Text>
      </View>

      {/* Card pills: yellow and red side-by-side */}
      <View style={dStyles.cardPills} accessibilityElementsHidden>
        {/* Yellow card pill */}
        <View
          style={[
            dStyles.cardPill,
            dStyles.yellowPill,
            { backgroundColor: "rgba(252, 211, 77, 0.12)" },
          ]}
        >
          <View style={dStyles.cardSquare} />
          <Text style={[dStyles.cardCount, { color: "#FCD34D" }]}>{item.yellowCards}</Text>
        </View>

        {/* Red card pill */}
        <View
          style={[
            dStyles.cardPill,
            dStyles.redPill,
            {
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              opacity: item.redCards === 0 ? 0.35 : 1,
            },
          ]}
        >
          <View style={[dStyles.cardSquare, { backgroundColor: "#EF4444" }]} />
          <Text style={[dStyles.cardCount, { color: "#EF4444" }]}>{item.redCards}</Text>
        </View>
      </View>

      {/* Per-game rate */}
      <View style={dStyles.rateCol} accessibilityElementsHidden>
        <Text style={[dStyles.rateText, { color: textRole.tertiary }]}>{perGameRate}/game</Text>
      </View>
    </PressableScale>
  );
}

export const DisciplineRow = React.memo(DisciplineRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.playerName === nextProps.item.playerName &&
    prevProps.item.yellowCards === nextProps.item.yellowCards &&
    prevProps.item.redCards === nextProps.item.redCards &&
    prevProps.item.matches === nextProps.item.matches &&
    prevProps.index === nextProps.index
  );
});

export const ROW_HEIGHT_DISCIPLINE = ROW_HEIGHT;

const dStyles = StyleSheet.create({
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
  teamBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  teamBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  playerPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
  },
  teamBadgeImg: {
    width: 32,
    height: 32,
    borderRadius: 12,
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
  cardPills: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  cardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  yellowPill: {},
  redPill: {},
  cardSquare: {
    width: 10,
    height: 10,
    backgroundColor: "#FCD34D",
    borderRadius: 2,
  },
  cardCount: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  rateCol: {
    marginLeft: 8,
    alignItems: "flex-end",
  },
  rateText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
