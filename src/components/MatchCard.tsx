/**
 * MatchCard — Emerald Minimalism.
 *
 * A hairline, shadow-free list row used on Home, Matches, and Group detail.
 *
 * Treatment:
 *   • Surface: white (`surface[0]`) + 1px hairline (`border.subtle`), no shadow.
 *   • League chip: white + hairline, `text.secondary` label.
 *   • Team wells: neutral `surface[2]` circles — no violet/flame gradient rings.
 *   • Team names: `text.primary`, no gold.
 *   • LIVE badge: `accent.alert` soft pill with a 6px dot (no shadow).
 *   • Urgent countdown: `accent.streak` (flame) inline icon + text — the only
 *     non-emerald affordance in the card, earned by the < 1h window.
 *   • Prediction pill: emerald-tint fill only for settled positive outcomes
 *     (exact / result). Pending = neutral surface with a lock glyph so users
 *     can tell "locked in, waiting" apart from "correct, points earned".
 *     Miss = neutral surface, tertiary text. No LinearGradient, no glow.
 *   • CTA pill: emerald fill with white label. Uses `PressableScale` via the
 *     parent wrapper — the pill itself is a plain view inside the pressable.
 *
 * Dependencies dropped: `LinearGradient`, `useTheme`, ad-hoc shadow maps,
 * `Colors.palette.violet` / `gold` / `blue` / `blueSoft`.
 */
import React, { useState, useEffect, memo, useRef } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import Colors, { accent, radii, textRoleLight } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import type { Match } from "@/lib/types";
import { Prediction } from "@/lib/storage";
import { formatLocalTime, formatLocalDate, formatCountdown, getTimeUntil } from "@/lib/datetime";
import { PressableScale } from "@/components/ui/PressableScale";
import { SyncIndicator } from "@/components/ui/SyncIndicator";
import { haptics } from "@/lib/motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onPress: () => void;
  index?: number;
  isFetching?: boolean; // React Query's isFetching state
  dataUpdatedAt?: number; // Unix timestamp (ms) of last fetch
}

// ─────────────────────────────────────────────────────────────────────────────
// Score change flash animation hook

function useScoreFlash() {
  const homeFlash = useSharedValue(1);
  const awayFlash = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const flashScore = (type: "home" | "away") => {
    if (reduceMotion) return;
    const target = type === "home" ? homeFlash : awayFlash;
    target.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 }),
    );
  };

  return { homeFlash, awayFlash, flashScore };
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown hook

function useCountdown(kickoff: string, status: string) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (status !== "upcoming") return;
    const update = () => {
      const timeUntil = getTimeUntil(kickoff);
      setLabel(timeUntil <= 0 ? "Soon" : formatCountdown(timeUntil));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [kickoff, status]);
  return label;
}

// ─────────────────────────────────────────────────────────────────────────────
// Live pulse dot — subtle breathing animation

function LivePulseDot() {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 1 : pulse.value,
  }));

  return <Animated.View style={[styles.liveDot, style]} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Team logo well — neutral surface, no gradient ring

function TeamLogo({ logo, shortName }: { logo?: string; shortName: string }) {
  const { surface, textRole } = useTheme();
  if (logo) {
    return (
      <View style={[styles.teamLogoWrap, { backgroundColor: surface[2] }]}>
        <Image source={{ uri: logo }} style={styles.teamLogoImg} resizeMode="contain" />
      </View>
    );
  }
  return (
    <View style={[styles.teamLogoFallback, { backgroundColor: surface[2] }]}>
      <Text style={[styles.teamLogoInitial, { color: textRole.primary }]}>
        {shortName.charAt(0)}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Prediction pill — emerald / neutral, no shadow

function PredictionPill({
  prediction,
  match,
  onTap,
}: {
  prediction: Prediction;
  match: Match;
  onTap?: () => void;
}) {
  const { surface, textRole } = useTheme();
  const isFinished = match.status === "finished";
  let outcome: "exact" | "result" | "miss" | "pending" = "pending";
  const pts = prediction.points;

  if (isFinished && match.homeScore !== null && match.awayScore !== null) {
    if (prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore) {
      outcome = "exact";
    } else {
      const p =
        prediction.homeScore > prediction.awayScore
          ? "H"
          : prediction.homeScore < prediction.awayScore
            ? "A"
            : "D";
      const a =
        match.homeScore > match.awayScore ? "H" : match.homeScore < match.awayScore ? "A" : "D";
      outcome = p === a ? "result" : "miss";
    }
  }

  // Glyph + text use `emeraldDeep` (#007A3D) rather than `accent.primary`
  // (#00A651) so the combo on the 10% emerald tint over white passes WCAG AA.
  // Kenji's Round 2 quantitative audit flagged the original pairing as
  // sub-3:1 for the glyph — this brings it comfortably above 4.5:1.
  const stateDescription =
    outcome === "exact"
      ? `Exact prediction: ${prediction.homeScore} to ${prediction.awayScore}, earned ${pts} points`
      : outcome === "result"
        ? `Correct outcome: ${prediction.homeScore} to ${prediction.awayScore}, earned ${pts} points`
        : outcome === "miss"
          ? `Missed: you predicted ${prediction.homeScore}–${prediction.awayScore}, no points`
          : `Locked in: ${prediction.homeScore} to ${prediction.awayScore}, waiting for result`;

  const cfg = {
    exact: {
      bg: "rgba(0, 166, 81, 0.12)",
      color: Colors.palette.emeraldDeep,
      icon: "star" as const,
      label: `Exact +${pts ?? 10}`,
    },
    result: {
      bg: "rgba(0, 166, 81, 0.12)",
      color: Colors.palette.emeraldDeep,
      icon: "checkmark-circle" as const,
      label: `Correct${pts ? ` +${pts}` : ""}`,
    },
    miss: {
      bg: surface[2],
      color: textRole.tertiary,
      icon: "close-circle" as const,
      label: "No points",
    },
    pending: {
      bg: surface[2],
      color: textRole.secondary,
      icon: "lock-closed" as const,
      label: `Locked ${prediction.homeScore}–${prediction.awayScore}`,
    },
  }[outcome];

  const pillScale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const handlePillPress = async () => {
    if (!reduceMotion) {
      pillScale.value = withSequence(
        withTiming(1.12, { duration: 120 }),
        withTiming(1, { duration: 130 }),
      );
    }
    await haptics.light?.().catch(() => {});
    onTap?.();
  };

  const pillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
  }));

  return (
    <Pressable
      onPress={handlePillPress}
      accessibilityRole="button"
      accessibilityLabel={stateDescription}
      accessibilityHint={outcome === "pending" ? "Double tap to edit prediction" : undefined}
    >
      <Animated.View style={[styles.predPill, { backgroundColor: cfg.bg }, pillAnimStyle]}>
        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
        <Text style={[styles.predPillText, { color: cfg.color }]}>{cfg.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main card

export const MatchCard = memo(function MatchCard({
  match,
  prediction,
  onPress,
  index = 0,
  isFetching = false,
  dataUpdatedAt,
}: MatchCardProps) {
  const { t, tt } = useLanguage();
  const { surface, border, textRole } = useTheme();
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const countdown = useCountdown(match.kickoff, match.status);
  const timeUntilMs = getTimeUntil(match.kickoff);
  const isUrgent = !isLive && !isFinished && timeUntilMs > 0 && timeUntilMs < 3_600_000;

  const { homeFlash, awayFlash, flashScore } = useScoreFlash();
  const prevScores = useRef({ home: match.homeScore, away: match.awayScore });

  // Trigger flash on score changes (skip first mount)
  useEffect(() => {
    if (!isLive) return;
    if (match.homeScore !== prevScores.current.home && match.homeScore !== null) {
      flashScore("home");
      prevScores.current.home = match.homeScore;
    }
    if (match.awayScore !== prevScores.current.away && match.awayScore !== null) {
      flashScore("away");
      prevScores.current.away = match.awayScore;
    }
  }, [match.homeScore, match.awayScore, isLive, flashScore]);

  // Determine threshold windows for countdown display
  const isWithin5Min = timeUntilMs > 0 && timeUntilMs < 300_000; // < 5 minutes
  const isWithin1Hour = timeUntilMs > 0 && timeUntilMs < 3_600_000; // < 1 hour
  const isWithin24Hours = timeUntilMs > 0 && timeUntilMs < 86_400_000; // < 24 hours
  const isBeyond24Hours = timeUntilMs >= 86_400_000; // >= 24 hours

  const kickoffTime = formatLocalTime(match.kickoff);
  const kickoffDay = (() => {
    const now = new Date();
    void now;
    const timeUntil = getTimeUntil(match.kickoff);
    const diffDays = Math.floor(timeUntil / 86_400_000);
    if (diffDays < 0) return formatLocalDate(match.kickoff);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return formatLocalDate(match.kickoff);
  })();

  // Build a rich accessibility label
  const homeTeamName = match.homeTeam?.name || match.homeTeam?.shortName || t.league.team;
  const awayTeamName = match.awayTeam?.name || match.awayTeam?.shortName || t.league.team;
  const leagueName = match.league?.name || "—";

  let statusLabel = "";
  let scoreLabel = "";
  let timeLabel = "";

  if (isLive) {
    statusLabel = `${t.matches.nowLive}`;
    if (match.homeScore !== null && match.awayScore !== null) {
      scoreLabel = `${match.homeScore}–${match.awayScore}`;
    }
    if (match.minute != null) {
      timeLabel = `${match.minute}'`;
    }
  } else if (isFinished) {
    statusLabel = t.matches.ft;
    if (match.homeScore !== null && match.awayScore !== null) {
      scoreLabel = `${match.homeScore}–${match.awayScore}`;
    }
  } else {
    statusLabel = "Upcoming";
    timeLabel = `${kickoffDay} ${kickoffTime}`;
  }

  const accessibilityLabelParts = [
    homeTeamName,
    scoreLabel,
    awayTeamName,
    leagueName,
    statusLabel,
    timeLabel,
  ].filter(Boolean);
  const fullAccessibilityLabel = accessibilityLabelParts.join(", ");

  const scoreFlashStyle = useAnimatedStyle(() => ({
    transform: [{ scale: homeFlash.value }],
  }));

  return (
    <View>
      <PressableScale
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: surface[0],
            borderColor: border.subtle,
          },
        ]}
        // Use "link" on the outer card (it navigates to detail) so web renders as <a>,
        // not <button>. The inner PredictionPill is a real action button — HTML allows
        // a <button> nested inside an <a>, but forbids <button> inside <button>.
        accessibilityRole="link"
        accessibilityLabel={fullAccessibilityLabel}
        haptic="light"
      >
        {/* Meta row: league chip · kickoff day/time */}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.leagueChip,
              {
                backgroundColor: surface[0],
                borderColor: border.subtle,
              },
            ]}
          >
            {match.league?.logo ? (
              <Image
                source={{ uri: match.league.logo }}
                style={styles.leagueLogoIcon}
                resizeMode="contain"
              />
            ) : null}
            <Text style={[styles.leagueName, { color: textRole.secondary }]} numberOfLines={1}>
              {match.league?.name || "—"}
            </Text>
          </View>
          <View style={styles.metaRight}>
            {isLive ? (
              <>
                <View
                  style={styles.liveBadge}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`Live, ${match.minute ?? 0} minutes played`}
                >
                  <LivePulseDot />
                  <Text style={styles.liveText} accessibilityElementsHidden>
                    {t.matches.nowLive} {match.minute ?? 0}&apos;
                  </Text>
                </View>
                <SyncIndicator isFetching={isFetching} lastUpdated={dataUpdatedAt} />
              </>
            ) : isFinished ? (
              <Text style={[styles.metaText, { color: textRole.tertiary }]}>{t.matches.ft}</Text>
            ) : (
              <Text style={[styles.metaText, { color: textRole.tertiary }]}>
                {kickoffDay}, {kickoffTime}
              </Text>
            )}
          </View>
        </View>

        {/* Teams + score */}
        <View style={styles.matchRow}>
          <View style={styles.teamSide}>
            <TeamLogo
              logo={match.homeTeam?.logo}
              shortName={match.homeTeam?.shortName || match.homeTeam?.name || t.league.team}
            />
            <Text
              style={[styles.teamName, { color: textRole.primary }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {match.homeTeam?.name || match.homeTeam?.shortName || t.league.team}
            </Text>
          </View>

          <View style={styles.scoreArea}>
            {isLive || isFinished ? (
              <>
                <Animated.View style={scoreFlashStyle}>
                  <Text style={[styles.score, { color: textRole.primary }]}>
                    {match.homeScore ?? 0} : {match.awayScore ?? 0}
                  </Text>
                </Animated.View>
                {isLive && match.minute != null && (
                  <Text style={[styles.scoreCaption, { color: textRole.tertiary }]}>
                    {match.minute}&apos;
                  </Text>
                )}
              </>
            ) : (
              <>
                {/* Countdown-as-primary logic based on time windows */}
                {isWithin5Min && countdown ? (
                  <>
                    <Text style={[styles.scoreTime, { color: accent.streak }]}>
                      {countdown === "Soon" ? "Soon" : countdown}
                    </Text>
                  </>
                ) : isWithin1Hour && countdown ? (
                  <>
                    <View style={styles.countdownRow}>
                      <Ionicons name="time" size={10} color={accent.streak} />
                      <Text style={[styles.scoreCaption, { color: accent.streak }]}>
                        {countdown}
                      </Text>
                    </View>
                  </>
                ) : isWithin24Hours && !isBeyond24Hours && countdown ? (
                  <>
                    <Text style={[styles.scoreTime, { fontSize: 16, color: textRole.primary }]}>
                      {tt(t.matches.startsIn, { time: countdown })}
                    </Text>
                    <Text style={[styles.scoreCaption, { color: textRole.tertiary }]}>
                      {kickoffDay}, {kickoffTime}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.scoreTime, { color: textRole.primary }]}>
                      {kickoffTime}
                    </Text>
                    <Text style={[styles.scoreCaption, { color: textRole.tertiary }]}>
                      {kickoffDay}
                    </Text>
                  </>
                )}
              </>
            )}
          </View>

          <View style={styles.teamSide}>
            <TeamLogo
              logo={match.awayTeam?.logo}
              shortName={match.awayTeam?.shortName || match.awayTeam?.name || t.league.team}
            />
            <Text
              style={[styles.teamName, { color: textRole.primary }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {match.awayTeam?.name || match.awayTeam?.shortName || t.league.team}
            </Text>
          </View>
        </View>

        {/* Bottom: prediction pill or CTA */}
        {prediction ? (
          <View style={styles.bottomRow}>
            <PredictionPill prediction={prediction} match={match} />
          </View>
        ) : isLive ? (
          <View style={styles.bottomRow}>
            <View style={[styles.ctaPill, { backgroundColor: accent.primary, opacity: 0.85 }]}>
              <Ionicons name="play" size={12} color={textRoleLight.inverse} />
              <Text style={styles.ctaText}>Watch live</Text>
            </View>
          </View>
        ) : isFinished ? (
          <View style={styles.bottomRow}>
            <View style={[styles.ctaPill, { backgroundColor: accent.primary, opacity: 0.6 }]}>
              <Ionicons name="checkmark-done" size={12} color={textRoleLight.inverse} />
              <Text style={styles.ctaText}>Match ended</Text>
            </View>
          </View>
        ) : !isFinished && !isLive ? (
          <View style={styles.bottomRow}>
            <View style={styles.ctaPill}>
              <Ionicons name="flash" size={12} color={textRoleLight.inverse} />
              <Text style={styles.ctaText}>{t.match.predict}</Text>
              <Ionicons name="arrow-forward" size={11} color={textRoleLight.inverse} />
            </View>
          </View>
        ) : null}
      </PressableScale>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.hero,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  // Meta row
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  leagueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: "62%",
  },
  leagueName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  leagueLogoIcon: {
    width: 16,
    height: 16,
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(239, 68, 68, 0.10)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: accent.alert,
  },
  liveText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: accent.alert,
    letterSpacing: 0.3,
  },

  // Match row
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamSide: {
    flex: 1,
    alignItems: "center",
    gap: 10,
  },
  teamLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoImg: {
    width: 36,
    height: 36,
  },
  teamLogoFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoInitial: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  teamName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },

  // Score area
  scoreArea: {
    paddingHorizontal: 8,
    alignItems: "center",
    minWidth: 88,
    gap: 4,
  },
  score: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  scoreTime: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  scoreCaption: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Bottom row
  bottomRow: {
    marginTop: 16,
    alignItems: "center",
  },
  predPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  predPillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: accent.primary,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: textRoleLight.inverse,
  },
});

// Re-export Colors to keep named-import compatibility for files that may
// still expect MatchCard to pull from the tokens module.
export { Colors };
