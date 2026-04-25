import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { PressableScale } from "@/components/ui";
import type { PlayerProfileData } from "@/components/PlayerProfileSheet";
import { formatLocalDate } from "@/lib/datetime";
import { accent, radii } from "@/constants/colors";

const ROW_HEIGHT = 80;

function InjuryTeamHeaderComponent({ teamInfo }: { teamInfo: { team: any; players: any[] } }) {
  const { surface, textRole } = useTheme();

  const headerStyle = useMemo(
    () => [injStyles.teamHeader, { backgroundColor: surface[2] }],
    [surface],
  );

  return (
    <View style={headerStyle}>
      {teamInfo.team?.logo ? (
        <Image
          source={{ uri: teamInfo.team.logo, cache: "force-cache" }}
          style={injStyles.teamCrest}
          resizeMode="contain"
        />
      ) : (
        <View style={[injStyles.teamBadgeSmall, { backgroundColor: surface[1] }]}>
          <Text style={[injStyles.teamBadgeText, { color: textRole.primary }]}>
            {(teamInfo.team?.shortName || "?").charAt(0)}
          </Text>
        </View>
      )}
      <Text style={[injStyles.teamNameHeader, { color: textRole.primary }]}>
        {teamInfo.team?.name || "Unknown Team"}
      </Text>
    </View>
  );
}

export const InjuryTeamHeader = React.memo(InjuryTeamHeaderComponent, (prevProps, nextProps) => {
  return prevProps.teamInfo.team?.id === nextProps.teamInfo.team?.id;
});

function InjuryRowComponent({
  item,
  index,
  onPress,
}: {
  item: any;
  index: number;
  onPress?: (player: PlayerProfileData) => void;
}) {
  const { surface, border, textRole } = useTheme();

  const rowStyle = useMemo(
    () => [sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }],
    [surface, border],
  );

  const playerInfoStyle = useMemo(() => [sStyles.playerInfo, { marginLeft: 12 }], []);

  const injuryDateStr = item.fixtureDate ? `, out until ${formatLocalDate(item.fixtureDate)}` : "";
  const accessibilityLabel = `${item.playerName}, ${item.team?.name || "Unknown"}, ${item.type || "Injury"}${item.reason ? `: ${item.reason}` : ""}${injuryDateStr}`;

  const handlePress = () => {
    if (onPress) {
      onPress({
        playerId: item.playerName,
        playerName: item.playerName,
        playerPhoto: item.playerPhoto,
        team: item.team,
        injuryReason: item.reason || item.type,
        injuryReturn: item.fixtureDate ? formatLocalDate(item.fixtureDate) : undefined,
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
      {item.playerPhoto ? (
        <Image
          source={{ uri: item.playerPhoto, cache: "force-cache" }}
          style={[sStyles.playerPhoto, { marginLeft: 0, backgroundColor: surface[2] }]}
          resizeMode="cover"
          accessibilityElementsHidden
        />
      ) : item.team?.logo ? (
        <Image
          source={{ uri: item.team.logo, cache: "force-cache" }}
          style={[sStyles.teamBadgeImg, { marginLeft: 0 }]}
          resizeMode="contain"
          accessibilityElementsHidden
        />
      ) : (
        <View
          style={[sStyles.teamBadge, { marginLeft: 0, backgroundColor: surface[2] }]}
          accessibilityElementsHidden
        >
          <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>
            {(item.team?.shortName || "?").charAt(0)}
          </Text>
        </View>
      )}
      <View style={playerInfoStyle} accessibilityElementsHidden>
        <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>
          {item.playerName}
        </Text>
        <View style={injStyles.returnDateRow}>
          <Text style={[sStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>
            {item.team?.name || ""}
          </Text>
          {item.fixtureDate && (
            <Text style={[sStyles.assistText, { color: textRole.tertiary }]} numberOfLines={1}>
              Out until {formatLocalDate(item.fixtureDate)}
            </Text>
          )}
        </View>
      </View>
      <View style={sStyles.statsCol} accessibilityElementsHidden>
        <View style={injStyles.typeBadge}>
          <Ionicons name="medkit" size={11} color={accent.alert} />
          <Text style={injStyles.typeText} numberOfLines={1}>
            {item.type || "Injury"}
          </Text>
        </View>
        <Text style={[sStyles.assistText, { color: textRole.tertiary }]} numberOfLines={1}>
          {item.reason || ""}
        </Text>
      </View>
    </PressableScale>
  );
}

export const InjuryRow = React.memo(InjuryRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.playerName === nextProps.item.playerName &&
    prevProps.item.type === nextProps.item.type &&
    prevProps.item.reason === nextProps.item.reason &&
    prevProps.index === nextProps.index
  );
});

export const ROW_HEIGHT_INJURY = ROW_HEIGHT;

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

const injStyles = StyleSheet.create({
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: radii.sm,
    gap: 10,
  },
  teamCrest: {
    width: 40,
    height: 40,
  },
  teamBadgeSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  teamBadgeText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  teamNameHeader: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  returnDateRow: {
    gap: 4,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(239, 68, 68, 0.10)",
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: accent.alert,
    maxWidth: 80,
  },
});
