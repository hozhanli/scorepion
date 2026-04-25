/**
 * PredictionReceiptCard — the fired-and-forget emerald receipt for a locked-in prediction.
 *
 * A vertical emerald-gradient card showing:
 *   - SCOREPION label with crest (micro type)
 *   - Team names + predicted score (display type)
 *   - Match date/league badge (caption type)
 *   - Watermark crest background (bottom-right, subtle)
 *   - Wordmark at bottom
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { type ViewStyle, type StyleProp } from "react-native";
import { gradients, spacing, type as typeScale, text, surface, radii } from "@/constants/colors";
import { ScorpionCrest } from "../ScorpionCrest";

export type PredictionReceiptCardProps = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  kickoffLabel: string; // pre-formatted date/time
  username?: string;
  style?: StyleProp<ViewStyle>;
};

export function PredictionReceiptCard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  league,
  kickoffLabel,
  username,
  style,
}: PredictionReceiptCardProps) {
  return (
    <View collapsable={false} style={[styles.outerContainer, style]}>
      <LinearGradient
        colors={gradients.emerald as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radii.hero }]}
      >
        {/* Top shimmer overlay */}
        <View
          pointerEvents="none"
          style={[
            styles.shimmer,
            { borderTopLeftRadius: radii.hero, borderTopRightRadius: radii.hero },
          ]}
        />

        {/* Watermark crest — bottom-right background, subtle */}
        <View pointerEvents="none" style={styles.watermarkContainer}>
          <ScorpionCrest
            size={180}
            fill="rgba(255, 255, 255, 0.08)"
            glyphColor="rgba(255, 255, 255, 0.05)"
          />
        </View>

        {/* Scorepion header with crest + wordmark */}
        <View style={styles.labelContainer}>
          <ScorpionCrest size={28} />
          <Text style={styles.label}>SCOREPION</Text>
        </View>

        {/* Match info — spacer to center content */}
        <View style={styles.spacer} />

        {/* Score section */}
        <View style={styles.scoreSection}>
          <Text style={styles.teamName}>{homeTeam}</Text>
          <Text style={styles.scoreDisplay}>
            {homeScore} — {awayScore}
          </Text>
          <Text style={styles.teamName}>{awayTeam}</Text>
        </View>

        {/* Match details badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {league} · {kickoffLabel}
          </Text>
        </View>

        {/* Bottom wordmark */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Predicted on scorepion.app</Text>
          {username && <Text style={styles.usernameText}>by @{username}</Text>}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
  },
  gradient: {
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    minHeight: 400,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    pointerEvents: "none",
  },
  watermarkContainer: {
    position: "absolute",
    right: -30,
    bottom: -30,
    pointerEvents: "none",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  label: {
    fontSize: typeScale.micro.size,
    fontFamily: typeScale.micro.family,
    fontWeight: typeScale.micro.weight,
    color: surface[0],
    letterSpacing: 1.5,
  },
  spacer: {
    flex: 1,
  },
  scoreSection: {
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  teamName: {
    fontSize: typeScale.body.size,
    fontFamily: typeScale.body.family,
    color: surface[0],
    fontWeight: "600",
  },
  scoreDisplay: {
    fontSize: typeScale.display.size,
    fontFamily: typeScale.display.family,
    fontWeight: typeScale.display.weight,
    color: surface[0],
    letterSpacing: typeScale.display.letterSpacing,
    lineHeight: typeScale.display.lineHeight,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    marginBottom: spacing[5],
    alignSelf: "center",
  },
  badgeText: {
    fontSize: typeScale.caption.size,
    fontFamily: typeScale.caption.family,
    fontWeight: typeScale.caption.weight,
    color: surface[0],
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: "center",
    gap: spacing[1],
  },
  footerText: {
    fontSize: typeScale.micro.size,
    fontFamily: typeScale.micro.family,
    fontWeight: typeScale.micro.weight,
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 0.2,
  },
  usernameText: {
    fontSize: typeScale.micro.size,
    fontFamily: typeScale.micro.family,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0,
  },
});
