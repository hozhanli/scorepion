/**
 * PredictionDisplayCard — Interactive emerald display for locked-in predictions.
 *
 * Replaces the white "Your Prediction" card with a proud green-gradient display
 * that mirrors the Scorepion share-card aesthetic. Includes:
 *   - Header with Scorepion crest + wordmark + edit affordance (when upcoming)
 *     and share icon (always visible)
 *   - Home team name, predicted score (56pt bold), away team name
 *   - Meta pill: league, date, time
 *   - State badge row (Locked, Exact, Correct, Missed)
 *   - Large crest watermark (bottom-right, opacity ~0.1)
 *
 * When match is upcoming and not locked by time, edit icon appears as a white-bordered pill.
 * Share icon always appears as a white-bordered pill on the right side.
 * Tapping edit toggles back to the score-selector form.
 * Tapping share captures the card and opens the native share sheet.
 */
import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  gradients,
  spacing,
  type as typeScale,
  surface,
  radii,
  accent,
  text,
} from "@/constants/colors";
import { ScorpionCrest } from "./ScorpionCrest";
import { PressableScale } from "./PressableScale";
import { HelpTip } from "./HelpTip";

export type PredictionDisplayCardProps = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  kickoffLabel: string; // pre-formatted "Mon, Apr 20 · 21:45"
  matchStatus: "upcoming" | "live" | "finished"; // from match.status
  actualScore?: { home: number; away: number }; // only when match is finished
  onEdit?: () => void; // callback to toggle edit mode
  username?: string; // for share message
};

export function PredictionDisplayCard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  league,
  kickoffLabel,
  matchStatus,
  actualScore,
  onEdit,
  username,
}: PredictionDisplayCardProps) {
  const cardRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      const message = `I predicted ${homeTeam} ${homeScore}-${awayScore} ${awayTeam} in ${league}. Check my prediction on Scorepion!${username ? ` —${username}` : ""}`;
      await Share.share({ message });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // Compute outcome badge
  const renderStateBadge = () => {
    // Pending: match not finished yet
    if (matchStatus !== "finished") {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.stateBadge, styles.lockedBadge]}>
            <Ionicons name="lock-closed" size={14} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.lockedBadgeText}>Locked</Text>
          </View>
          <HelpTip term="locked" iconSize={12} />
        </View>
      );
    }

    // Match is finished — compare prediction to actual
    if (!actualScore) return null;

    const predictionCorrect = homeScore === actualScore.home && awayScore === actualScore.away;
    const outcomeCorrect =
      (homeScore > awayScore && actualScore.home > actualScore.away) ||
      (homeScore < awayScore && actualScore.home < actualScore.away) ||
      (homeScore === awayScore && actualScore.home === actualScore.away);

    if (predictionCorrect) {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.stateBadge, styles.exactBadge]}>
            <Ionicons name="star" size={14} color="#00A651" />
            <Text style={styles.exactBadgeText}>Exact +10</Text>
          </View>
          <HelpTip term="exact" iconSize={12} />
        </View>
      );
    }

    if (outcomeCorrect) {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.stateBadge, styles.correctBadge]}>
            <Ionicons name="checkmark-circle" size={14} color="#00A651" />
            <Text style={styles.correctBadgeText}>Correct +6</Text>
          </View>
          <HelpTip term="correct" iconSize={12} />
        </View>
      );
    }

    // Missed
    return (
      <View style={[styles.stateBadge, styles.missedBadge]}>
        <Ionicons name="close-circle" size={14} color="rgba(255, 255, 255, 0.7)" />
        <Text style={styles.missedBadgeText}>Missed</Text>
      </View>
    );
  };

  const showEditIcon = matchStatus === "upcoming" && onEdit;

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={gradients.emerald as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radii.lg }]}
      >
        {/* Shimmer overlay at top */}
        <View
          pointerEvents="none"
          style={[
            styles.shimmer,
            { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
          ]}
        />

        {/* Watermark crest — bottom-right background, very subtle */}
        <View pointerEvents="none" style={styles.watermarkContainer}>
          <ScorpionCrest
            size={180}
            fill="rgba(255, 255, 255, 0.08)"
            glyphColor="rgba(255, 255, 255, 0.05)"
          />
        </View>

        {/* Header row: Scorepion label + share icon + edit icon pills */}
        <View style={styles.headerRow}>
          <View style={styles.scorpionLabel}>
            <ScorpionCrest size={28} />
            <Text style={styles.scorpionText}>SCORPION</Text>
          </View>

          <View style={styles.iconCluster}>
            <PressableScale
              onPress={handleShare}
              haptic="light"
              style={styles.iconPill}
              hitSlop={8}
            >
              <Ionicons name="share-social-outline" size={16} color={surface[0]} />
            </PressableScale>

            {showEditIcon && (
              <PressableScale onPress={onEdit} haptic="light" style={styles.iconPill} hitSlop={8}>
                <Ionicons name="pencil" size={16} color={accent.primary} />
              </PressableScale>
            )}
          </View>
        </View>

        {/* Home team name */}
        <Text style={styles.teamName}>{homeTeam}</Text>

        {/* Predicted score — massive numbers */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>{homeScore}</Text>
          <Text style={styles.scoreDash}>—</Text>
          <Text style={styles.scoreNumber}>{awayScore}</Text>
        </View>

        {/* Away team name */}
        <Text style={styles.teamName}>{awayTeam}</Text>

        {/* Meta pill: league, date, time */}
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>
            {league} · {kickoffLabel}
          </Text>
        </View>

        {/* State badge row */}
        <View style={styles.badgeRow}>{renderStateBadge()}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    alignSelf: "center",
  },
  gradient: {
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    minHeight: 300,
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    pointerEvents: "none",
  },
  watermarkContainer: {
    position: "absolute",
    right: -30,
    bottom: -30,
    pointerEvents: "none",
  },

  // Header row
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  scorpionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  scorpionText: {
    fontSize: typeScale.micro.size,
    fontFamily: typeScale.micro.family,
    fontWeight: typeScale.micro.weight,
    color: surface[0],
    letterSpacing: 1.5,
  },
  iconCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  iconPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },

  // Team names and score
  teamName: {
    fontSize: typeScale.body.size,
    fontFamily: "Inter_600SemiBold",
    color: surface[0],
    textAlign: "center",
    marginBottom: spacing[1],
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    marginVertical: spacing[3],
  },
  scoreNumber: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    color: surface[0],
    lineHeight: 56,
  },
  scoreDash: {
    fontSize: 40,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 56,
    paddingBottom: 6,
  },

  // Meta pill
  metaPill: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    alignSelf: "center",
    marginVertical: spacing[3],
  },
  metaText: {
    fontSize: typeScale.caption.size,
    fontFamily: typeScale.caption.family,
    fontWeight: typeScale.caption.weight,
    color: surface[0],
    letterSpacing: 0.2,
  },

  // State badges
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  stateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
  },
  lockedBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  lockedBadgeText: {
    fontSize: typeScale.micro.size,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 0.2,
  },
  exactBadge: {
    backgroundColor: "rgba(0, 166, 81, 0.3)",
  },
  exactBadgeText: {
    fontSize: typeScale.micro.size,
    fontFamily: "Inter_600SemiBold",
    color: "#00A651",
    letterSpacing: 0.2,
  },
  correctBadge: {
    backgroundColor: "rgba(0, 166, 81, 0.25)",
  },
  correctBadgeText: {
    fontSize: typeScale.micro.size,
    fontFamily: "Inter_600SemiBold",
    color: "#00A651",
    letterSpacing: 0.2,
  },
  missedBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  missedBadgeText: {
    fontSize: typeScale.micro.size,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.2,
  },
});
