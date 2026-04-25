/**
 * PlayerProfileSheet — Bottom-sheet modal for player details.
 *
 * A tappable modal that displays player information including name, number, position,
 * team, season stats, and injury status. Designed for integration into multiple surfaces:
 * lineups, top scorers, injury rows, and team profiles.
 *
 * Usage:
 *   const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileData | null>(null);
 *   <PlayerProfileSheet
 *     visible={!!selectedPlayer}
 *     onClose={() => setSelectedPlayer(null)}
 *     player={selectedPlayer}
 *   />
 */

import React, { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  AccessibilityInfo,
  useWindowDimensions,
  AccessibilityRole,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInUp, SlideOutDown } from "react-native-reanimated";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PlayerProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  player: PlayerProfileData | null;
}

export interface PlayerProfileData {
  playerId: number | string;
  playerName: string;
  playerPhoto?: string;
  playerNumber?: number | null;
  playerPos?: string; // "G" / "D" / "M" / "F"
  team?: {
    id: string | number;
    name: string;
    logo?: string;
    color?: string;
  };
  seasonStats?: {
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
    matches?: number;
  };
  injuryReason?: string;
  injuryReturn?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PlayerProfileSheet({ visible, onClose, player }: PlayerProfileSheetProps) {
  const insets = useSafeAreaInsets();
  const { textRole, surface, border } = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  const maxSheetHeight = Math.floor(screenHeight * 0.7);

  const positionLabel = useMemo(() => {
    if (!player?.playerPos) return undefined;
    const posMap: Record<string, string> = {
      G: "Goalkeeper",
      D: "Defender",
      M: "Midfielder",
      F: "Forward",
    };
    return posMap[player.playerPos] || player.playerPos;
  }, [player?.playerPos]);

  if (!player) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.4)" }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close player profile"
      />

      {/* Sheet */}
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(300)}
        style={[
          styles.sheet,
          {
            maxHeight: maxSheetHeight,
            paddingBottom: insets.bottom + 16,
            backgroundColor: surface[0],
            borderTopColor: border.subtle,
          },
        ]}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandleContainer}>
          <View style={[styles.dragHandle, { backgroundColor: textRole.tertiary }]} />
        </View>

        {/* Content */}
        <Animated.View entering={FadeIn.delay(100)}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            {/* Player Photo */}
            <View
              style={[
                styles.photoContainer,
                {
                  borderColor: player.team?.color || "#999",
                  backgroundColor: surface[1],
                },
              ]}
            >
              {player.playerPhoto ? (
                <Image
                  source={{ uri: player.playerPhoto }}
                  style={styles.photo}
                  accessibilityLabel={`${player.playerName} photo`}
                />
              ) : (
                <Ionicons name="person-outline" size={40} color={textRole.tertiary} />
              )}
            </View>

            {/* Name, Number, Position */}
            <View style={styles.heroInfo}>
              <Text style={[styles.playerName, { color: textRole.primary }]} numberOfLines={2}>
                {player.playerName}
              </Text>

              {player.playerNumber !== null && player.playerNumber !== undefined && (
                <Text style={[styles.playerNumber, { color: textRole.secondary }]}>
                  #{player.playerNumber}
                </Text>
              )}

              {positionLabel && (
                <Text style={[styles.positionLabel, { color: textRole.tertiary }]}>
                  {positionLabel}
                </Text>
              )}
            </View>
          </View>

          {/* Team Section */}
          {player.team && (
            <View style={[styles.teamSection, { borderTopColor: border.subtle }]}>
              {player.team.logo && (
                <Image
                  source={{ uri: player.team.logo }}
                  style={styles.teamLogo}
                  accessibilityLabel={`${player.team.name} logo`}
                />
              )}
              <Text style={[styles.teamName, { color: textRole.primary }]}>{player.team.name}</Text>
            </View>
          )}

          {/* Season Stats Section */}
          {player.seasonStats ? (
            <View style={[styles.statsSection, { borderTopColor: border.subtle }]}>
              <View style={styles.statsGrid}>
                {/* Goals */}
                {player.seasonStats.goals !== undefined && player.seasonStats.goals > 0 && (
                  <View style={styles.statChip}>
                    <Ionicons name="football-outline" size={20} color={textRole.primary} />
                    <Text style={[styles.statValue, { color: textRole.primary }]}>
                      {player.seasonStats.goals}
                    </Text>
                    <Text style={[styles.statLabel, { color: textRole.tertiary }]}>Goals</Text>
                  </View>
                )}

                {/* Assists */}
                {player.seasonStats.assists !== undefined && player.seasonStats.assists > 0 && (
                  <View style={styles.statChip}>
                    <Ionicons name="hand-left-outline" size={20} color={textRole.primary} />
                    <Text style={[styles.statValue, { color: textRole.primary }]}>
                      {player.seasonStats.assists}
                    </Text>
                    <Text style={[styles.statLabel, { color: textRole.tertiary }]}>Assists</Text>
                  </View>
                )}

                {/* Yellow Cards */}
                {player.seasonStats.yellowCards !== undefined &&
                  player.seasonStats.yellowCards > 0 && (
                    <View style={styles.statChip}>
                      <View style={[styles.yellowCard, { backgroundColor: "#FCD34D" }]} />
                      <Text style={[styles.statValue, { color: textRole.primary }]}>
                        {player.seasonStats.yellowCards}
                      </Text>
                      <Text style={[styles.statLabel, { color: textRole.tertiary }]}>Yellows</Text>
                    </View>
                  )}

                {/* Red Cards */}
                {player.seasonStats.redCards !== undefined && player.seasonStats.redCards > 0 && (
                  <View style={styles.statChip}>
                    <View style={[styles.redCard, { backgroundColor: "#DC3545" }]} />
                    <Text style={[styles.statValue, { color: textRole.primary }]}>
                      {player.seasonStats.redCards}
                    </Text>
                    <Text style={[styles.statLabel, { color: textRole.tertiary }]}>Reds</Text>
                  </View>
                )}
              </View>

              {/* Apps this season */}
              {player.seasonStats.matches !== undefined && (
                <Text
                  style={[
                    styles.matchesText,
                    { color: textRole.secondary, borderTopColor: border.subtle },
                  ]}
                >
                  {player.seasonStats.matches} app{player.seasonStats.matches !== 1 ? "s" : ""} this
                  season
                </Text>
              )}
            </View>
          ) : (
            /* Empty state if no stats */
            <View style={[styles.emptyState, { borderTopColor: border.subtle }]}>
              <Ionicons name="information-circle-outline" size={32} color={textRole.tertiary} />
              <Text style={[styles.emptyStateText, { color: textRole.secondary }]}>
                More stats coming soon.
              </Text>
            </View>
          )}

          {/* Injury Card */}
          {player.injuryReason && (
            <View
              style={[
                styles.injuryCard,
                { borderTopColor: border.subtle, backgroundColor: "rgba(220, 53, 69, 0.1)" },
              ]}
            >
              <Ionicons name="medical-outline" size={20} color="#DC3545" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.injuryTitle, { color: "#DC3545" }]}>
                  {player.injuryReason}
                </Text>
                {player.injuryReturn && (
                  <Text style={[styles.injuryReturn, { color: textRole.secondary }]}>
                    Expected return: {player.injuryReturn}
                  </Text>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dragHandleContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  photoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  heroInfo: {
    alignItems: "center",
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  playerNumber: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  positionLabel: {
    fontSize: 12,
    fontWeight: "400",
  },
  teamSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  teamLogo: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsSection: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  statChip: {
    flex: 0.45,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  yellowCard: {
    width: 12,
    height: 16,
    borderRadius: 2,
  },
  redCard: {
    width: 12,
    height: 16,
    borderRadius: 2,
  },
  matchesText: {
    fontSize: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    textAlign: "center",
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: "500",
  },
  injuryCard: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderRadius: 8,
    alignItems: "flex-start",
  },
  injuryTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  injuryReturn: {
    fontSize: 11,
    fontWeight: "400",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Guide for Other Surfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wire PlayerProfileSheet into other surfaces as follows:
 *
 * @top-scorers (app/league/[id].tsx — TopScorersTab)
 *   Import: import PlayerProfileSheet, { type PlayerProfileData } from "@/components/PlayerProfileSheet";
 *   State: const [selectedScorer, setSelectedScorer] = useState<PlayerProfileData | null>(null);
 *   Handler on row Pressable:
 *     onPress={() => setSelectedScorer({
 *       playerId: scorer.playerName, // or use scorer.rank if playerId is available
 *       playerName: scorer.playerName,
 *       playerPhoto: scorer.playerPhoto,
 *       team: scorer.team,
 *       seasonStats: {
 *         goals: scorer.goals,
 *         assists: scorer.assists,
 *         matches: scorer.matches,
 *       },
 *     })}
 *   Render: <PlayerProfileSheet visible={!!selectedScorer} onClose={() => setSelectedScorer(null)} player={selectedScorer} />
 *   Effort: ~15 lines, minimal data transformation
 *
 * @top-assists (app/league/[id].tsx — TopAssistsTab)
 *   Similar to top-scorers; rename to assistProvider.assists in seasonStats.
 *   Data: { goals: 0, assists: provider.assists, matches: provider.matches }
 *   Effort: ~15 lines
 *
 * @top-yellow-cards / @top-red-cards (app/league/[id].tsx — respective tabs)
 *   Card count goes into seasonStats.yellowCards or seasonStats.redCards.
 *   Minimal transformation; no injuries.
 *   Effort: ~15 lines each
 *
 * @injuries-rows (app/league/[id].tsx or dedicated page)
 *   Import and render with injuryReason and injuryReturn populated from data.
 *   Handler: onPress={() => setSelectedPlayer({ ..., injuryReason, injuryReturn })}
 *   Effort: ~20 lines (similar data shape as lineups, but with injury fields)
 *
 * @team-profile (app/team/[id].tsx — once built by agent Y)
 *   Tap a team's top scorer row → same handler as top-scorers row.
 *   Tap a team's injury row → same handler as injuries-rows.
 *   Effort: ~30 lines total (reuse same sheet, wire from multiple sources)
 *
 * Pattern for all integrations:
 *   1. Create state: const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileData | null>(null)
 *   2. On tappable row, call setSelectedPlayer with player data from API response
 *   3. Render the sheet at bottom of component's render tree
 *   4. Pass onClose callback to reset state
 *   No type gymnastics needed — PlayerProfileData is the contract.
 */
