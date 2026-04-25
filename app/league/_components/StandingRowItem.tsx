import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import type { StandingRow } from "@/lib/types";
import { PressableScale } from "@/components/ui";
import { accent, radii } from "@/constants/colors";

const ROW_HEIGHT = 56;

function StandingRowItemComponent({
  row,
  index,
  leagueId,
}: {
  row: StandingRow;
  index: number;
  leagueId?: string;
}) {
  const { surface, border, textRole } = useTheme();
  const isTop4 = row.position <= 4;
  const isUEL = row.position >= 5 && row.position <= 6;
  const isConferenceLeague = row.position === 7;
  const isBottom2 = row.position >= 18;

  const zoneLabel = isTop4
    ? "Champions League qualification zone"
    : isUEL
      ? "Europa League qualification zone"
      : isConferenceLeague
        ? "Conference League qualification zone"
        : isBottom2
          ? "Relegation zone"
          : "";

  const posBadgeStyle = useMemo(
    () => [
      tStyles.posBadge,
      { backgroundColor: surface[2] },
      isTop4 && tStyles.posBadgeTop,
      isUEL && tStyles.posBadgeUEL,
      isConferenceLeague && tStyles.posBadgeConference,
      isBottom2 && tStyles.posBadgeBottom,
    ],
    [surface, isTop4, isUEL, isConferenceLeague, isBottom2],
  );

  const posTextStyle = useMemo(
    () => [
      tStyles.posText,
      { color: textRole.secondary },
      isTop4 && tStyles.posTextTop,
      isUEL && tStyles.posTextUEL,
      isConferenceLeague && tStyles.posTextConference,
      isBottom2 && tStyles.posTextBottom,
    ],
    [textRole, isTop4, isUEL, isConferenceLeague, isBottom2],
  );

  const gdStyle = useMemo(
    () => [
      tStyles.statCell,
      tStyles.gdCell,
      { color: textRole.secondary },
      row.goalDifference > 0 && tStyles.gdPositive,
      row.goalDifference < 0 && tStyles.gdNegative,
    ],
    [textRole.secondary, row.goalDifference],
  );

  const rowStyle = useMemo(
    () => [tStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }],
    [surface, border],
  );

  return (
    <PressableScale
      onPress={() =>
        router.push({
          pathname: "/team/[id]",
          params: { id: String(row.team.id), ...(leagueId && { leagueId }) },
        })
      }
      style={rowStyle}
      haptic="light"
      pressedScale={0.98}
      accessibilityRole="link"
      accessibilityLabel={`${row.team.name}, position ${row.position}, ${row.points} points`}
    >
      <View
        style={tStyles.posCol}
        accessibilityLabel={
          zoneLabel ? `Position ${row.position}, ${zoneLabel}` : `Position ${row.position}`
        }
      >
        <View style={posBadgeStyle}>
          <Text style={posTextStyle}>{row.position}</Text>
        </View>
      </View>
      {row.team.logo ? (
        <Image
          source={{ uri: row.team.logo, cache: "force-cache" }}
          style={tStyles.teamLogo}
          resizeMode="contain"
        />
      ) : (
        <View style={[tStyles.teamCircle, { backgroundColor: surface[2] }]}>
          <Text style={[tStyles.teamCircleText, { color: textRole.primary }]}>
            {row.team.shortName.charAt(0)}
          </Text>
        </View>
      )}
      <Text style={[tStyles.teamName, { color: textRole.primary }]} numberOfLines={1}>
        {row.team.name}
      </Text>
      <Text style={[tStyles.statCell, { color: textRole.secondary }]}>{row.played}</Text>
      <Text style={[tStyles.statCell, { color: textRole.secondary }]}>{row.won}</Text>
      <Text style={[tStyles.statCell, { color: textRole.secondary }]}>{row.drawn}</Text>
      <Text style={[tStyles.statCell, { color: textRole.secondary }]}>{row.lost}</Text>
      <Text style={gdStyle}>
        {row.goalDifference > 0 ? "+" : ""}
        {row.goalDifference}
      </Text>
      <View style={tStyles.ptsContainer}>
        <Text style={[tStyles.ptsCell, { color: textRole.primary }]}>{row.points}</Text>
      </View>
      <View
        style={tStyles.formCol}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Last ${row.form.length} results: ${row.form
          .map((f) => (f === "W" ? "Win" : f === "D" ? "Draw" : "Loss"))
          .join(", ")}`}
        accessibilityElementsHidden={false}
      >
        {row.form.map((f, i) => (
          <View
            key={i}
            style={[
              tStyles.formDot,
              { backgroundColor: surface[2] },
              f === "W" && tStyles.formWin,
              f === "D" && tStyles.formDraw,
              f === "L" && tStyles.formLoss,
            ]}
            accessibilityElementsHidden
          />
        ))}
      </View>
    </PressableScale>
  );
}

export const StandingRowItem = React.memo(StandingRowItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.row.position === nextProps.row.position &&
    prevProps.row.points === nextProps.row.points &&
    prevProps.row.goalDifference === nextProps.row.goalDifference &&
    prevProps.row.played === nextProps.row.played &&
    JSON.stringify(prevProps.row.form) === JSON.stringify(nextProps.row.form) &&
    prevProps.index === nextProps.index
  );
});

export const ROW_HEIGHT_STANDINGS = ROW_HEIGHT;

// Standings table styles
const tStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  posCol: { width: 32, alignItems: "center" },
  posBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  posBadgeTop: { backgroundColor: "rgba(0, 166, 81, 0.12)" },
  posBadgeUEL: { backgroundColor: "rgba(245, 158, 11, 0.12)" },
  posBadgeConference: { backgroundColor: "rgba(252, 211, 77, 0.12)" },
  posBadgeBottom: { backgroundColor: "rgba(239, 68, 68, 0.10)" },
  posText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  posTextTop: { color: accent.primary },
  posTextUEL: { color: "#F59E0B" },
  posTextConference: { color: "#FCD34D" },
  posTextBottom: { color: accent.alert },
  teamCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  teamCircleText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  teamLogo: {
    width: 28,
    height: 28,
    marginLeft: 4,
  },
  teamName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  statCell: {
    width: 26,
    textAlign: "center" as const,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  gdCell: { width: 30 },
  gdPositive: { color: accent.primary, fontFamily: "Inter_700Bold" },
  gdNegative: { color: accent.alert, fontFamily: "Inter_700Bold" },
  ptsContainer: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  ptsCell: { fontSize: 13, fontFamily: "Inter_700Bold" },
  formCol: { flexDirection: "row", gap: 3, width: 55, justifyContent: "center" },
  formDot: { width: 8, height: 8, borderRadius: 4 },
  formWin: { backgroundColor: accent.primary },
  formDraw: { backgroundColor: "rgba(150, 150, 150, 0.5)" },
  formLoss: { backgroundColor: accent.alert },
});
