/**
 * PitchDiagram — Visual football pitch showing a starting XI formation.
 *
 * Rewritten from scratch for reliability:
 * - Dynamically calculates Y positions based on actual formation rows
 * - Centers players evenly within each row (not edge-aligned)
 * - Handles missing grid data by distributing players across formation rows
 * - Cleaner, simpler orientation flipping
 * - Removed team watermark and mount animations for iOS stability
 *
 * Usage:
 *   <PitchDiagram
 *     team={team}
 *     formation="4-3-3"
 *     players={[{playerId, playerName, playerNumber, playerPos, grid, isCaptain}]}
 *     orientation="up"
 *     onPlayerPress={(playerId) => setSelectedPlayerId(playerId)}
 *   />
 */

import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import Svg, { Rect, Circle, Line, Defs, LinearGradient, Stop, Path } from "react-native-svg";
import StyledText from "./StyledText";
import { useTheme } from "@/contexts/ThemeContext";

export interface PitchDiagramProps {
  team: {
    id: string | number;
    name: string;
    shortName?: string;
    color: string;
    logo?: string;
  };
  formation: string;
  players: {
    playerId: number | string;
    playerName: string;
    playerNumber: number | null;
    playerPos?: string;
    grid?: string | null;
    isCaptain?: boolean;
  }[];
  orientation?: "up" | "down";
  onPlayerPress?: (playerId: number | string) => void;
  compact?: boolean;
  benchCount?: number;
}

interface PositionedPlayer {
  playerId: number | string;
  playerName: string;
  playerNumber: number | null;
  playerPos?: string;
  isCaptain?: boolean;
  x: number;
  y: number;
  row: number;
  col: number;
}

/**
 * Determine if a color is "warm" (red, orange, yellow tones).
 */
function isWarmColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return r > 150 || (r > 100 && g > 100);
}

/**
 * Get contrasting goalkeeper jersey color.
 */
function getGKColor(teamColor: string): string {
  return isWarmColor(teamColor) ? "#1E40AF" : "#EA580C";
}

/**
 * Parse formation string "4-3-3" into [1, 4, 3, 3] (GK + outfield rows).
 */
function parseFormation(formation: string): number[] {
  if (!formation) return [];
  const parts = formation
    .split("-")
    .map((p) => parseInt(p, 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return [1, ...parts]; // GK always row 1
}

/**
 * Parse grid string "2:3" -> [2, 3].
 */
function parseGrid(grid: string | null | undefined): [number, number] | null {
  if (!grid || typeof grid !== "string") return null;
  const parts = grid.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}

/**
 * Map playerPos to a likely formation row.
 * G -> row 1, D -> row 2, M -> row 3 or 4, F -> last row(s).
 */
function posToLikelyRow(pos: string | undefined, formationRows: number): number {
  switch (pos) {
    case "G":
      return 1;
    case "D":
      return 2;
    case "M":
      return Math.ceil(formationRows / 2); // midfield rows
    case "F":
      return Math.max(3, formationRows - 1); // forward rows (avoid row 1)
    default:
      return 2; // fallback to defender row
  }
}

/**
 * Build positioned players with calculated x, y coordinates.
 * Uses formation shape to evenly distribute rows, centers players within rows.
 */
function buildPositionedPlayers(
  players: PitchDiagramProps["players"],
  formation: string,
  pitchWidth: number,
  pitchHeight: number,
  orientation: "up" | "down",
): PositionedPlayer[] {
  const formationArray = parseFormation(formation);
  if (formationArray.length === 0) {
    // No formation: distribute all players evenly across 5 virtual rows
    formationArray.push(1, 4, 3, 3, 1); // fallback shape
  }

  const numRows = formationArray.length;
  const rowHeight = pitchHeight / numRows;

  // Bucket players into rows: either by grid data or by position
  const rowBuckets: PositionedPlayer[][] = Array.from({ length: numRows }, () => []);
  const unplacedPlayers: [number, PitchDiagramProps["players"][0]][] = [];

  players.forEach((player, idx) => {
    const gridParsed = parseGrid(player.grid);
    if (gridParsed) {
      const [gridRow] = gridParsed;
      // Clamp to valid row range [1, numRows]
      const row = Math.max(1, Math.min(gridRow, numRows));
      rowBuckets[row - 1].push({ ...player, x: 0, y: 0, row, col: 0, isCaptain: player.isCaptain });
    } else {
      // No grid: will assign by position later
      unplacedPlayers.push([idx, player]);
    }
  });

  // Distribute unplaced players evenly across rows based on their position
  unplacedPlayers.forEach(([idx, player]) => {
    const likelyRow = posToLikelyRow(player.playerPos, numRows);
    const row = Math.max(1, Math.min(likelyRow, numRows));
    rowBuckets[row - 1].push({ ...player, x: 0, y: 0, row, col: 0, isCaptain: player.isCaptain });
  });

  // Now compute x, y for each player
  const result: PositionedPlayer[] = [];

  rowBuckets.forEach((playersInRow, rowIdx) => {
    const row = rowIdx + 1;
    const numInRow = playersInRow.length;

    // Y position: center of this row
    const yCenter = (rowIdx + 0.5) * rowHeight;
    const y = orientation === "down" ? pitchHeight - yCenter : yCenter;

    // X positions: evenly spaced across the pitch width, centered
    playersInRow.forEach((p, colIdx) => {
      const col = colIdx + 1;
      // Spread across pitch: if 4 in row, place at 25%, 50%, 75%, 100% ... actually center them
      const xCenter = ((colIdx + 0.5) / numInRow) * pitchWidth;
      result.push({ ...p, x: xCenter, y, row, col });
    });
  });

  return result;
}

export default function PitchDiagram({
  team,
  formation,
  players,
  orientation = "up",
  onPlayerPress,
  compact = false,
  benchCount,
}: PitchDiagramProps) {
  const theme = useTheme();

  const pitchWidth = compact ? 160 : 280;
  const pitchHeight = pitchWidth * 1.2; // Taller aspect ratio for vertical breathing room
  const jerseyRadius = compact ? 14 : 20;
  const fontSize = compact ? 10 : 11;

  const positionedPlayers = useMemo(
    () => buildPositionedPlayers(players, formation, pitchWidth, pitchHeight, orientation),
    [players, formation, pitchWidth, pitchHeight, orientation],
  );

  const isIncomplete = players.length < 11;
  const formationLabel = formation || "Unknown";
  const hasFormation = !!formation;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Formation label - renders ABOVE pitch, never overlapping */}
      {hasFormation && (
        <View
          style={[
            styles.formationBadge,
            { borderColor: team.color, backgroundColor: `${team.color}26` },
          ]}
        >
          <Text style={[styles.formationText, { color: team.color }]}>{formationLabel}</Text>
          <View style={styles.formationDots}>
            {formationLabel.split("-").map((count, i) => (
              <View key={i} style={styles.dotGroup}>
                {Array.from({ length: Math.min(parseInt(count, 10), 5) }).map((_, j) => (
                  <View key={j} style={[styles.formationDot, { backgroundColor: team.color }]} />
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Pitch SVG container with explicit height */}
      <View style={[styles.svgContainer, { height: pitchHeight }]}>
        <Svg width={pitchWidth} height={pitchHeight} viewBox={`0 0 ${pitchWidth} ${pitchHeight}`}>
          <Defs>
            <LinearGradient id="pitchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#0B5E1E" />
              <Stop offset="100%" stopColor="#0E6A22" />
            </LinearGradient>
          </Defs>

          {/* Pitch background with subtle stripes */}
          {Array.from({ length: 8 }, (_, i) => (
            <Rect
              key={`stripe-${i}`}
              x={0}
              y={(i * pitchHeight) / 8}
              width={pitchWidth}
              height={pitchHeight / 8}
              fill={i % 2 === 0 ? "#0B5E1E" : "#0E6A22"}
            />
          ))}

          {/* Touchline border */}
          <Rect
            x={0}
            y={0}
            width={pitchWidth}
            height={pitchHeight}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />

          {/* Halfway line */}
          <Line
            x1={0}
            y1={pitchHeight / 2}
            x2={pitchWidth}
            y2={pitchHeight / 2}
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />

          {/* Center circle */}
          <Circle
            cx={pitchWidth / 2}
            cy={pitchHeight / 2}
            r={pitchWidth * 0.13}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />

          {/* Center spot */}
          <Circle cx={pitchWidth / 2} cy={pitchHeight / 2} r={1.5} fill="#FFFFFF" opacity={0.7} />

          {/* Penalty area (top) */}
          <Rect
            x={pitchWidth * 0.2}
            y={0}
            width={pitchWidth * 0.6}
            height={pitchHeight * 0.16}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />

          {/* Goal area (top) */}
          <Rect
            x={pitchWidth * 0.35}
            y={0}
            width={pitchWidth * 0.3}
            height={pitchHeight * 0.07}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />

          {/* Penalty spot (top) */}
          <Circle cx={pitchWidth / 2} cy={pitchHeight * 0.1} r={1.5} fill="#FFFFFF" opacity={0.7} />

          {/* Penalty area (bottom) */}
          <Rect
            x={pitchWidth * 0.2}
            y={pitchHeight * 0.84}
            width={pitchWidth * 0.6}
            height={pitchHeight * 0.16}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />

          {/* Goal area (bottom) */}
          <Rect
            x={pitchWidth * 0.35}
            y={pitchHeight * 0.93}
            width={pitchWidth * 0.3}
            height={pitchHeight * 0.07}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />

          {/* Penalty spot (bottom) */}
          <Circle cx={pitchWidth / 2} cy={pitchHeight * 0.9} r={1.5} fill="#FFFFFF" opacity={0.7} />

          {/* Corner arcs */}
          <Path
            d={`M ${pitchWidth * 0.02} 0 Q ${pitchWidth * 0.02} ${pitchHeight * 0.02}, 0 ${pitchHeight * 0.02}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />
          <Path
            d={`M ${pitchWidth * 0.98} 0 Q ${pitchWidth * 0.98} ${pitchHeight * 0.02}, ${pitchWidth} ${pitchHeight * 0.02}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />
          <Path
            d={`M ${pitchWidth * 0.02} ${pitchHeight} Q ${pitchWidth * 0.02} ${pitchHeight * 0.98}, 0 ${pitchHeight * 0.98}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />
          <Path
            d={`M ${pitchWidth * 0.98} ${pitchHeight} Q ${pitchWidth * 0.98} ${pitchHeight * 0.98}, ${pitchWidth} ${pitchHeight * 0.98}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.7}
          />
        </Svg>

        {/* Player circles - positioned absolutely over pitch, no animations */}
        <View style={styles.playersOverlay} pointerEvents="box-none">
          {positionedPlayers.map((player) => {
            const isGoalkeeper = player.playerPos === "G" || player.row === 1;
            const jerseyColor = isGoalkeeper ? getGKColor(team.color) : team.color;
            const nameDisplay = player.playerName.split(" ").pop() || "";
            const truncatedName = nameDisplay.substring(0, 7) + (nameDisplay.length > 7 ? "" : "");

            const positionName =
              player.playerPos === "G"
                ? "Goalkeeper"
                : player.playerPos === "D"
                  ? "Defender"
                  : player.playerPos === "M"
                    ? "Midfielder"
                    : player.playerPos === "F"
                      ? "Forward"
                      : "unknown";

            return (
              <Pressable
                key={player.playerId}
                onPress={() => onPlayerPress?.(player.playerId)}
                style={[
                  styles.playerTouchTarget,
                  {
                    left: player.x - jerseyRadius - 4,
                    top: player.y - jerseyRadius - 20,
                  },
                ]}
                disabled={!onPlayerPress}
                accessibilityRole="button"
                accessibilityLabel={`${player.playerName}, number ${player.playerNumber ?? "unknown"}, position ${positionName}`}
                accessibilityHint={onPlayerPress ? "Double tap for player profile" : undefined}
              >
                <View style={styles.playerLabel}>
                  {/* Jersey circle */}
                  <View
                    style={[
                      styles.jersey,
                      {
                        width: jerseyRadius * 2,
                        height: jerseyRadius * 2,
                        borderRadius: jerseyRadius,
                        backgroundColor: jerseyColor,
                      },
                    ]}
                  >
                    {/* Shoulder panel */}
                    <View
                      style={[
                        styles.shoulderPanel,
                        {
                          width: jerseyRadius * 2,
                          height: jerseyRadius * 0.7,
                          backgroundColor: `${jerseyColor}CC`,
                          borderTopLeftRadius: jerseyRadius,
                          borderTopRightRadius: jerseyRadius,
                        },
                      ]}
                    />

                    {/* Glossy highlight */}
                    <View
                      style={[
                        styles.jerseyHighlight,
                        {
                          width: jerseyRadius * 1.3,
                          height: jerseyRadius * 1.3,
                          borderRadius: jerseyRadius * 0.65,
                        },
                      ]}
                    />

                    {/* Player number */}
                    <Text
                      style={[
                        styles.numberText,
                        {
                          fontSize: compact ? 11 : 14,
                        },
                      ]}
                    >
                      {player.playerNumber ?? "?"}
                    </Text>

                    {/* Captain armband */}
                    {player.isCaptain && <View style={styles.captainBadge} />}
                  </View>

                  {/* Player name - truncated to 7 chars */}
                  <Text
                    style={[
                      styles.playerNameText,
                      {
                        fontSize,
                        width: jerseyRadius * 3.2,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {truncatedName}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bench indicator bar */}
      {benchCount !== undefined && benchCount > 0 && (
        <View style={[styles.benchBar, { width: pitchWidth }]}>
          <View style={styles.benchDots}>
            {Array.from({ length: Math.min(benchCount, 12) }).map((_, i) => (
              <View key={i} style={[styles.benchDot, { backgroundColor: team.color }]} />
            ))}
          </View>
        </View>
      )}

      {/* Status labels */}
      {isIncomplete && (
        <StyledText variant="caption" role="tertiary" style={styles.statusLabel}>
          Incomplete lineup ({players.length}/11)
        </StyledText>
      )}
      {!hasFormation && (
        <StyledText variant="caption" role="tertiary" style={styles.statusLabel}>
          Formation unknown
        </StyledText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  containerCompact: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  formationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  formationText: {
    fontSize: 16,
    fontWeight: "700",
  },
  formationDots: {
    flexDirection: "row",
    gap: 4,
  },
  dotGroup: {
    flexDirection: "row",
    gap: 2,
  },
  formationDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  svgContainer: {
    position: "relative",
    marginBottom: 12,
    alignSelf: "center",
  },
  benchBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    justifyContent: "center",
    paddingHorizontal: 4,
    marginVertical: 8,
  },
  benchDots: {
    flexDirection: "row",
    gap: 3,
  },
  benchDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  playersOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playerTouchTarget: {
    position: "absolute",
    width: 56,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  playerLabel: {
    alignItems: "center",
    gap: 3,
  },
  jersey: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    position: "relative",
    overflow: "hidden",
  },
  shoulderPanel: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  jerseyHighlight: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    opacity: 0.25,
    top: -1,
  },
  numberText: {
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    fontFamily: "Inter",
  },
  captainBadge: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 10,
    height: 10,
    backgroundColor: "#FFD700",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  playerNameText: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: "center",
    fontWeight: "600",
  },
  statusLabel: {
    marginTop: 8,
  },
});
