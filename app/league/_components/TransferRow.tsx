import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { formatLocalDate } from "@/lib/datetime";
import { accent, radii } from "@/constants/colors";

const ROW_HEIGHT = 76;

/**
 * Determine fee badge variants from transfer type string.
 * Since the backend doesn't expose a numeric `fee` field,
 * we infer from the `type` field only (free, loan, released, etc).
 */
function feeBadge(transfer: any): { label: string; color: string; bg: string } {
  const t = (transfer.type || "").toLowerCase();
  if (t.includes("free")) {
    return { label: "FREE", color: "#525252", bg: "rgba(82, 82, 82, 0.12)" };
  }
  if (t.includes("loan")) {
    return { label: "LOAN", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" };
  }
  if (t.includes("released")) {
    return { label: "RELEASED", color: "#EF4444", bg: "rgba(239, 68, 68, 0.12)" };
  }
  // Fallback for unknown types
  return { label: t.toUpperCase() || "TRANSFER", color: "#525252", bg: "rgba(82, 82, 82, 0.12)" };
}

function TransferRowComponent({ item, index }: { item: any; index: number }) {
  const { surface, border, textRole } = useTheme();

  const rowStyle = useMemo(
    () => [sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }],
    [surface, border],
  );

  const arrowColor = item.type === "out" ? "#D97706" : accent.primary;
  const badge = feeBadge(item);

  const transferDirection = item.type === "out" ? "left club" : "joined";
  const dateStr = item.date ? formatLocalDate(item.date) : "Unknown date";
  const accessibilityLabel = `${item.playerName}, ${transferDirection}, from ${item.teamOut?.name || "Unknown"} to ${item.teamIn?.name || "Unknown"}, ${badge.label}, on ${dateStr}`;

  return (
    <View
      style={rowStyle}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Player photo circle (44px) */}
      {item.playerPhoto ? (
        <Image
          source={{ uri: item.playerPhoto, cache: "force-cache" }}
          style={[sStyles.playerPhoto, { backgroundColor: surface[2] }]}
          resizeMode="cover"
          accessibilityElementsHidden
        />
      ) : (
        <View
          style={[sStyles.playerInitial, { backgroundColor: surface[2] }]}
          accessibilityElementsHidden
        >
          <Text style={[sStyles.playerInitialText, { color: textRole.primary }]}>
            {(item.playerName || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Player name + date */}
      <View style={sStyles.playerInfo} accessibilityElementsHidden>
        <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>
          {item.playerName}
        </Text>
        {item.date ? (
          <Text style={[sStyles.dateText, { color: textRole.tertiary }]}>
            {formatLocalDate(item.date)}
          </Text>
        ) : null}
      </View>

      {/* Team flow: team-out → arrow → team-in */}
      <View style={sStyles.transferFlow} accessibilityElementsHidden>
        {/* Team-out crest (24px) */}
        {item.teamOut?.logo ? (
          <Image
            source={{ uri: item.teamOut.logo, cache: "force-cache" }}
            style={sStyles.teamCrest}
            resizeMode="contain"
          />
        ) : (
          <View style={[sStyles.teamCrewBadge, { backgroundColor: surface[2] }]}>
            <Text style={[sStyles.teamCrewText, { color: textRole.secondary }]}>
              {(item.teamOut?.name || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Arrow (direction: forward for 'in', back for 'out') */}
        <Ionicons
          name={item.type === "out" ? "arrow-back" : "arrow-forward"}
          size={14}
          color={arrowColor}
        />

        {/* Team-in crest (24px) */}
        {item.teamIn?.logo ? (
          <Image
            source={{ uri: item.teamIn.logo, cache: "force-cache" }}
            style={sStyles.teamCrest}
            resizeMode="contain"
          />
        ) : (
          <View style={[sStyles.teamCrewBadge, { backgroundColor: surface[2] }]}>
            <Text style={[sStyles.teamCrewText, { color: textRole.secondary }]}>
              {(item.teamIn?.name || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Fee badge */}
      <View style={[sStyles.feeBadge, { backgroundColor: badge.bg }]} accessibilityElementsHidden>
        <Text style={[sStyles.feeBadgeText, { color: badge.color }]} numberOfLines={1}>
          {badge.label}
        </Text>
      </View>
    </View>
  );
}

export const TransferRow = React.memo(TransferRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.playerName === nextProps.item.playerName &&
    prevProps.item.type === nextProps.item.type &&
    prevProps.item.teamOut?.id === nextProps.item.teamOut?.id &&
    prevProps.item.teamIn?.id === nextProps.item.teamIn?.id &&
    prevProps.item.date === nextProps.item.date &&
    prevProps.index === nextProps.index
  );
});

export const ROW_HEIGHT_TRANSFER = ROW_HEIGHT;

const sStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 12,
  },
  playerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  playerInitial: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitialText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  playerInfo: {
    flex: 0.6,
  },
  playerName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  dateText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 3,
  },
  transferFlow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamCrest: {
    width: 24,
    height: 24,
  },
  teamCrewBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCrewText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  feeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  feeBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    maxWidth: 60,
  },
});
