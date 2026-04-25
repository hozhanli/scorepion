/**
 * Leaderboard Screen — Emerald Minimalism.
 *
 * Unified ScreenHeader + FilterSegmented. One canonical emerald hero for
 * "Your Rank". Everything else is white cards + hairline borders. No
 * violet/flame/bronze gradient stripes, no prize cards with rainbow tints.
 * Celebratory color is quarantined to TierBadge and medal dots.
 */
import React, { useState, useMemo, useCallback, memo } from "react";
import { View, Text, FlatList, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors, { accent, type as typeTok } from "@/constants/colors";
import StyledText from "@/components/ui/StyledText";
import {
  PressableScale,
  GradientHero,
  TierBadge,
  StatChip,
  ProgressBar,
  ScreenHeader,
  FilterSegmented,
  Button,
  EmptyState,
} from "@/components/ui";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLeaderboard, useChaseData, useWeeklyWinners } from "@/lib/football-api";
import { LeaderboardRowSkeleton } from "@/components/SkeletonLoader";
import { getPeriodContext as getPeriodContextFromDatetime } from "@/lib/datetime";
import { useFilterPersistence } from "@/lib/hooks/useFilterPersistence";

type TimeFilter = "weekly" | "monthly" | "alltime";

interface LBEntry {
  rank: number;
  username: string;
  avatar: string;
  points: number;
  correct: number;
  total: number;
  streak: number;
  change: number;
  userId?: string;
}

// ── Avatar color (muted palette — no rainbow) ────────────────────────────────
// NOTE: These are now set dynamically via useTheme() in components below

function getPeriodContext(filter: TimeFilter) {
  return getPeriodContextFromDatetime(filter);
}

// ── Period context strip (replaces violet gradient hero) ─────────────────────
function PeriodStrip({ filter }: { filter: TimeFilter }) {
  const ctx = getPeriodContext(filter);
  const { surface, border, textRole } = useTheme();
  return (
    <View style={[periodStyles.wrap, { backgroundColor: surface[0], borderColor: border.subtle }]}>
      <View style={periodStyles.iconWrap}>
        <Ionicons name={ctx.icon} size={14} color={accent.primary} />
      </View>
      <View style={periodStyles.textCol}>
        <Text style={[periodStyles.title, { color: textRole.primary }]}>{ctx.title}</Text>
        <Text style={[periodStyles.sub, { color: textRole.tertiary }]}>{ctx.subtitle}</Text>
      </View>
      <View style={periodStyles.rightCol}>
        <Text style={[periodStyles.countdownLabel, { color: textRole.tertiary }]}>Ends in</Text>
        <Text style={[periodStyles.countdown, { color: textRole.primary }]}>{ctx.countdown}</Text>
      </View>
    </View>
  );
}

const periodStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1 },
  title: { fontSize: 13, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 1 },
  rightCol: { alignItems: "flex-end" },
  countdownLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  countdown: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 1 },
});

// ── Podium (white card + hairline) ───────────────────────────────────────────
const medalColors = { gold: "#D4AF37", silver: "#9CA3AF", bronze: "#B87333" };
const tiers = ["gold", "silver", "bronze"] as const;

function Podium({ top3 }: { top3: LBEntry[] }) {
  const { surface, border, textRole } = useTheme();
  if (top3.length === 0) return null;

  const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const sizes = top3.length >= 3 ? [64, 76, 58] : [60, 60, 60];
  const medalTints =
    top3.length >= 3
      ? [medalColors.silver, medalColors.gold, medalColors.bronze]
      : [medalColors.gold, medalColors.silver, medalColors.bronze];
  const medalRanks = top3.length >= 3 ? [2, 1, 3] : [1, 2, 3];
  const pillHeights = top3.length >= 3 ? [54, 72, 42] : [48, 48, 48];

  return (
    <View>
      <View
        style={[podiumStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}
      >
        <View style={podiumStyles.wrap}>
          {order.map((entry, i) => {
            const isChamp = medalRanks[i] === 1;
            const acc = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
            const tier = tiers[i];
            return (
              <View key={entry.rank} style={podiumStyles.spot}>
                {isChamp && (
                  <View style={podiumStyles.crownWrap}>
                    <Ionicons name="trophy" size={20} color={medalColors.gold} />
                  </View>
                )}
                <View style={podiumStyles.avatarWrap}>
                  <View
                    style={[
                      podiumStyles.avatar,
                      {
                        backgroundColor: surface[2],
                        width: sizes[i],
                        height: sizes[i],
                        borderRadius: sizes[i] / 2,
                        borderWidth: isChamp ? 2 : 1,
                        borderColor: medalTints[i],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        podiumStyles.avatarText,
                        { fontSize: isChamp ? 24 : 18, color: textRole.primary },
                      ]}
                    >
                      {(entry.avatar ?? entry.username ?? "UN").substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={[podiumStyles.medal, { backgroundColor: medalTints[i] }]}>
                    <Text style={podiumStyles.medalNum}>{medalRanks[i]}</Text>
                  </View>
                </View>
                <Text style={[podiumStyles.name, { color: textRole.primary }]} numberOfLines={1}>
                  {entry.username}
                </Text>
                <TierBadge tier={tier} size="sm" />
                <Text style={[podiumStyles.pts, { color: textRole.primary }]}>
                  {entry.points.toLocaleString()}
                </Text>

                <View style={podiumStyles.chipsRow}>
                  {acc > 0 && (
                    <StatChip icon="locate" value={acc} label="%" color={accent.primary} />
                  )}
                  {entry.streak > 0 && (
                    <StatChip icon="flame" value={entry.streak} label="" color={accent.streak} />
                  )}
                </View>

                <View
                  style={[
                    podiumStyles.base,
                    {
                      height: pillHeights[i],
                      backgroundColor: surface[2],
                      borderColor: surface[0],
                    },
                  ]}
                >
                  <Text style={[podiumStyles.baseRank, { color: textRole.secondary }]}>
                    #{entry.rank}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const podiumStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 24,
    paddingTop: 22,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  wrap: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 6 },
  spot: { alignItems: "center", gap: 6, flex: 1 },
  crownWrap: { marginBottom: -2 },
  avatarWrap: { position: "relative" },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold" },
  medal: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  medalNum: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  name: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    maxWidth: 100,
    marginTop: 2,
  },
  pts: { fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  chipsRow: { flexDirection: "row", gap: 4, marginTop: 2 },
  base: {
    alignSelf: "stretch",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 6,
    marginTop: 8,
  },
  baseRank: { fontSize: 13, fontFamily: "Inter_700Bold" },
});

// ── YOUR RANK emerald hero (THE canonical gradient moment of this screen) ───
function YourRankHeroCard({
  profile,
  rank,
  accuracy,
  streak,
  bestStreak,
  leaderboard,
}: {
  profile: any;
  rank: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  leaderboard: LBEntry[];
}) {
  if (!profile) return null;

  const userPoints = profile.totalPoints ?? 0;
  const above = leaderboard
    .filter((e) => e.points > userPoints)
    .sort((a, b) => a.points - b.points)[0];
  const ptsToClimb = above ? Math.max(0, above.points - userPoints) : 0;
  const nextRank = above?.rank ?? Math.max(1, rank - 1);

  const inPromoZone = rank <= 5;
  const promoTarget = leaderboard.find((e) => e.rank === 5);
  const promoGap = promoTarget && !inPromoZone ? Math.max(0, promoTarget.points - userPoints) : 0;

  const progress = inPromoZone
    ? 1
    : (() => {
        if (!promoTarget) return 0.15;
        const base = Math.max(1, promoTarget.points);
        return Math.min(0.95, Math.max(0.1, userPoints / base));
      })();

  return (
    <View>
      <GradientHero
        colors={Colors.gradients.emerald}
        glow="emerald"
        radius={24}
        padding={20}
        style={youStyles.card}
      >
        <View style={youStyles.topRow}>
          <Text style={youStyles.eyebrow}>YOUR RANK</Text>
          {streak > 0 && (
            <View style={youStyles.trendChip}>
              <Ionicons name="flame" size={11} color="#fff" />
              <Text style={youStyles.trendText}>{streak}</Text>
            </View>
          )}
        </View>

        <View style={youStyles.mainRow}>
          <View style={youStyles.rankBlock}>
            <Text style={youStyles.rankHash}>#</Text>
            <Text style={youStyles.rankNum}>{rank}</Text>
          </View>
          <View style={youStyles.identityCol}>
            <Text style={youStyles.username} numberOfLines={1}>
              {profile.username}
            </Text>
            <Text style={youStyles.points}>
              {userPoints.toLocaleString()} <Text style={youStyles.ptsSuffix}>pts</Text>
            </Text>
          </View>
        </View>

        <View style={youStyles.progressSection}>
          <View style={youStyles.progressHeader}>
            <Text style={youStyles.progressLabel}>
              {inPromoZone
                ? "You're in the promotion zone"
                : ptsToClimb > 0
                  ? `${ptsToClimb} pts to climb to #${nextRank}`
                  : "Keep predicting to climb"}
            </Text>
            {!inPromoZone && promoGap > 0 && (
              <Text style={youStyles.progressTarget}>{promoGap} to top 5</Text>
            )}
          </View>
          <ProgressBar
            progress={progress}
            colors={["#FFFFFF", "rgba(255, 255, 255, 0.9)"]}
            height={6}
          />
        </View>

        <View style={youStyles.statsRow}>
          <View style={youStyles.statItem}>
            <Text style={youStyles.statValue}>{accuracy}%</Text>
            <Text style={youStyles.statLabel}>Accuracy</Text>
          </View>
          <View style={youStyles.statDiv} />
          <View style={youStyles.statItem}>
            <Text style={youStyles.statValue}>{streak}</Text>
            <Text style={youStyles.statLabel}>Streak</Text>
          </View>
          <View style={youStyles.statDiv} />
          <View style={youStyles.statItem}>
            <Text style={youStyles.statValue}>{bestStreak}</Text>
            <Text style={youStyles.statLabel}>Best</Text>
          </View>
        </View>
      </GradientHero>
    </View>
  );
}

const youStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    gap: 14,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.6,
  },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trendText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  mainRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  rankBlock: { flexDirection: "row", alignItems: "flex-start" },
  rankHash: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 32,
    paddingTop: 8,
  },
  rankNum: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -2.5,
    lineHeight: 60,
  },
  identityCol: { flex: 1 },
  username: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  points: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  ptsSuffix: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)" },
  progressSection: { gap: 8 },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  progressLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.92)",
  },
  progressTarget: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statDiv: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.15)" },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.2,
  },
});

// ── Chase Card (rival one rank above) ───────────────────────────────────────
function ChaseCard({
  target,
  gap,
  targetRank,
}: {
  target: LBEntry;
  gap: number;
  targetRank: number;
}) {
  const { t, tt } = useLanguage();
  const { surface, border, textRole } = useTheme();
  return (
    <View style={[chaseStyles.wrap, { backgroundColor: surface[0], borderColor: border.subtle }]}>
      <View style={chaseStyles.rail} />
      <View style={[chaseStyles.avatar, { backgroundColor: surface[2] }]}>
        <Text style={[chaseStyles.avatarText, { color: textRole.primary }]}>
          {(target.avatar ?? target.username ?? "UN").substring(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={chaseStyles.body}>
        <StyledText variant="caption" role="tertiary" style={chaseStyles.label}>
          {(t.leaderboard.chase?.title ?? "Chasing").toUpperCase()}
        </StyledText>
        <StyledText variant="body" style={chaseStyles.username} numberOfLines={1}>
          {target.username}
        </StyledText>
        <StyledText variant="caption" role="tertiary" style={chaseStyles.rank}>
          #{targetRank}
        </StyledText>
      </View>
      <View style={chaseStyles.pointsCol}>
        <StyledText variant="caption" style={chaseStyles.pointsValue}>
          {target.points.toLocaleString()}
        </StyledText>
        <StyledText variant="caption" role="accent" style={chaseStyles.pointsGap}>
          {tt(t.leaderboard.chase?.gap ?? "{{points}} pts to catch {{username}}", {
            points: gap.toLocaleString(),
            username: target.username,
          })}
        </StyledText>
      </View>
    </View>
  );
}

const chaseStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  rail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: accent.primary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  label: {
    letterSpacing: 1,
  },
  username: {},
  rank: {},
  pointsCol: {
    alignItems: "flex-end",
    maxWidth: 140,
  },
  pointsValue: {},
  pointsGap: {
    textAlign: "right",
  },
});

// ── Row ──────────────────────────────────────────────────────────────────────
// The current-user row reuses the MemberStandingRow treatment from
// app/group/[id].tsx — emerald rail + 2px border + YOU pill + highlighted
// avatar + bumped points value — so Sven's "find me in one second" heuristic
// applies on the main leaderboard too (Round 2 parity fix).
const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  index,
  isCurrentUser,
}: {
  entry: LBEntry;
  index: number;
  isCurrentUser: boolean;
}) {
  const { t } = useLanguage();
  const { surface, border, textRole } = useTheme();
  const isTop3 = entry.rank <= 3;

  return (
    <View>
      <PressableScale
        onPress={() => {
          if (isCurrentUser) {
            router.push("/(tabs)/profile");
          }
          // TODO: navigate to user profile when screen exists
        }}
        pressedScale={0.98}
      >
        <View
          style={[
            rowStyles.row,
            { backgroundColor: surface[0], borderBottomColor: border.subtle },
            isCurrentUser && {
              ...rowStyles.rowActive,
              backgroundColor: "rgba(0, 166, 81, 0.09)",
              borderColor: accent.primary,
            },
          ]}
        >
          {/* Full-height emerald rail — only on the current-user row. */}
          {isCurrentUser && <View style={rowStyles.youRail} />}

          <View style={rowStyles.rankCol}>
            {isTop3 ? (
              <View
                style={[
                  rowStyles.medal,
                  {
                    backgroundColor: [medalColors.gold, medalColors.silver, medalColors.bronze][
                      entry.rank - 1
                    ],
                  },
                ]}
              >
                <Text style={rowStyles.medalText}>{entry.rank}</Text>
              </View>
            ) : (
              <Text style={[rowStyles.rankNum, { color: textRole.tertiary }]}>{entry.rank}</Text>
            )}
          </View>

          <View
            style={[
              rowStyles.avatar,
              { backgroundColor: surface[2] },
              isCurrentUser && rowStyles.avatarHighlight,
            ]}
          >
            <Text style={[rowStyles.avatarText, { color: textRole.primary }]}>
              {(entry.avatar ?? entry.username ?? "UN").substring(0, 2).toUpperCase()}
            </Text>
          </View>

          <View style={rowStyles.infoCol}>
            <View style={rowStyles.nameRow}>
              <Text
                style={[
                  rowStyles.username,
                  { color: textRole.primary },
                  isCurrentUser && rowStyles.usernameHighlight,
                ]}
                numberOfLines={1}
              >
                {entry.username}
              </Text>
              {isCurrentUser && (
                <View style={rowStyles.youPill}>
                  <Text style={rowStyles.youPillText}>{t.leaderboard.you.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={rowStyles.microRow}>
              {entry.streak > 0 && (
                <StatChip icon="flame" value={entry.streak} label="" color={accent.streak} />
              )}
              {entry.total > 0 && (
                <StatChip
                  icon="locate"
                  value={Math.round((entry.correct / entry.total) * 100)}
                  label="%"
                  color={accent.primary}
                />
              )}
            </View>
          </View>

          <View style={rowStyles.pointsCol}>
            <Text
              style={[
                rowStyles.points,
                { color: textRole.primary },
                isCurrentUser && rowStyles.pointsHighlight,
              ]}
            >
              {entry.points.toLocaleString()}
            </Text>
            <View style={rowStyles.deltaRow}>
              {entry.change > 0 ? (
                <>
                  <Ionicons name="caret-up" size={9} color={accent.primary} />
                  <Text style={[rowStyles.deltaText, { color: accent.primary }]}>
                    +{entry.change}
                  </Text>
                </>
              ) : entry.change < 0 ? (
                <>
                  <Ionicons name="caret-down" size={9} color={accent.alert} />
                  <Text style={[rowStyles.deltaText, { color: accent.alert }]}>{entry.change}</Text>
                </>
              ) : (
                <Text style={[rowStyles.deltaText, { color: textRole.tertiary }]}>—</Text>
              )}
            </View>
          </View>
        </View>
      </PressableScale>
    </View>
  );
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: "relative",
    overflow: "hidden",
  },
  rowActive: {
    borderWidth: 2,
    paddingLeft: 24, // extra room for the left rail
  },
  /** Full-height emerald rail on the far left of the current-user row. */
  youRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: accent.primary,
  },
  rankCol: { width: 32, alignItems: "center" },
  rankNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  medal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  medalText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  avatarHighlight: {
    borderWidth: 2,
    borderColor: accent.primary,
  },
  avatarText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  infoCol: { flex: 1, marginLeft: 12 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  username: { fontSize: 14, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  usernameHighlight: { color: accent.primary },
  youPill: {
    backgroundColor: accent.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
  },
  microRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  pointsCol: { alignItems: "flex-end", minWidth: 56 },
  points: { fontSize: 15, fontFamily: "Inter_700Bold" },
  pointsHighlight: { fontSize: 18, color: accent.primary },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  deltaText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
});

// ── Section header ───────────────────────────────────────────────────────────
function LBSectionHeader({ label, hint }: { label: string; hint?: string }) {
  const { textRole } = useTheme();
  return (
    <View style={sectionStyles.wrap}>
      <Text style={[sectionStyles.label, { color: textRole.tertiary }]}>{label}</Text>
      {hint ? <Text style={[sectionStyles.hint, { color: textRole.tertiary }]}>{hint}</Text> : null}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  hint: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

// ── Main screen ──────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { surface, border, textRole } = useTheme();
  const { profile, dailyPack } = useApp();
  const [timeFilter, setTimeFilter] = useFilterPersistence<TimeFilter>(
    "leaderboard.timeFilter",
    "alltime",
    ["weekly", "monthly", "alltime"],
  );
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const { data: leaderboard = [], isLoading } = useLeaderboard(timeFilter);
  const { data: weeklyWinners } = useWeeklyWinners();
  const { data: chaseData } = useChaseData(timeFilter);

  // First compute the effective leaderboard (includes current user if needed)
  // This handles the case where the server returns an empty list but the user has local points.
  const effectiveLeaderboard = useMemo(() => {
    if ((leaderboard as LBEntry[]).length > 0) {
      return leaderboard as LBEntry[];
    }
    // Server returned empty, but user has points locally — synthesize their entry
    // For weekly tab, use dailyPack.weeklyPoints; for others, use profile.totalPoints
    if (profile) {
      let userPoints = 0;
      if (timeFilter === "weekly") {
        userPoints = dailyPack?.weeklyPoints ?? 0;
      } else {
        userPoints = profile.totalPoints ?? 0;
      }

      if (userPoints > 0) {
        return [
          {
            rank: 1,
            username: profile.username,
            avatar: profile.avatar ?? (profile.username ?? "user").substring(0, 2).toUpperCase(),
            points: userPoints,
            correct: profile.correctPredictions ?? 0,
            total: profile.totalPredictions ?? 0,
            streak: profile.streak ?? 0,
            change: 0,
            userId: profile.id,
          },
        ];
      }
    }
    return [];
  }, [leaderboard, profile, dailyPack, timeFilter]);

  const userRank = useMemo(() => {
    if (chaseData?.userRank) return chaseData.userRank;
    if (!profile) return 0;
    const found = (effectiveLeaderboard as LBEntry[]).find((e) => e.username === profile.username);
    if (found) return found.rank;
    const above = (effectiveLeaderboard as LBEntry[]).filter(
      (e) => e.points > (profile.totalPoints ?? 0),
    ).length;
    return above + 1;
  }, [profile, effectiveLeaderboard, chaseData]);

  const accuracy = useMemo(() => {
    if (!profile || !profile.totalPredictions) return 0;
    return Math.round((profile.correctPredictions / profile.totalPredictions) * 100);
  }, [profile]);

  const chaseTarget = useMemo(() => {
    if (!profile) return null;
    const entries = effectiveLeaderboard as LBEntry[];
    if (entries.length === 0) return null;

    // Find current user's index (either by exact username match or by derived rank)
    const selfIdx = entries.findIndex((e) => e.username === profile.username);

    let targetIdx: number;
    if (selfIdx > 0) {
      // User is in the list — chase the person directly above
      targetIdx = selfIdx - 1;
    } else if (selfIdx === 0) {
      // User is #1 — no one to chase
      return null;
    } else {
      // User not in visible leaderboard — chase the lowest-ranked visible entry
      targetIdx = entries.length - 1;
    }

    const target = entries[targetIdx];
    const gap = Math.max(0, target.points - (profile.totalPoints ?? 0));
    return { target, gap, targetRank: target.rank };
  }, [effectiveLeaderboard, profile]);

  const top3 = (effectiveLeaderboard as LBEntry[]).slice(0, 3);
  const rest = (effectiveLeaderboard as LBEntry[]).slice(3);
  const streak = dailyPack?.streak ?? profile?.streak ?? 0;
  const bestStreak = profile?.bestStreak ?? 0;

  const filterItems = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "alltime", label: "All time" },
  ];

  const renderRow = useCallback(
    ({ item, index }: { item: LBEntry; index: number }) => (
      <LeaderboardRow
        entry={item}
        index={index}
        isCurrentUser={item.username === profile?.username}
      />
    ),
    [profile],
  );

  return (
    <View style={[styles.container, { backgroundColor: surface[1], paddingTop: topPad }]}>
      <FlatList
        data={rest}
        renderItem={renderRow}
        keyExtractor={(item) => `${item.rank}_${item.username}`}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 130 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={12}
        windowSize={10}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title="Leaderboard"
              subtitle={`${effectiveLeaderboard.length} players competing`}
              showLogo
            />

            <View style={styles.filterWrap}>
              <FilterSegmented
                items={filterItems}
                value={timeFilter}
                onChange={(v) => setTimeFilter(v as TimeFilter)}
              />
            </View>

            <PeriodStrip filter={timeFilter} />

            {isLoading ? (
              <View style={styles.loadingWrap}>
                <LeaderboardRowSkeleton />
                <LeaderboardRowSkeleton />
                <LeaderboardRowSkeleton />
              </View>
            ) : top3.length === 0 ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon="star-outline"
                  title="Be the first to predict this week"
                  subtitle="Lock in your picks to claim the leaderboard."
                />
              </View>
            ) : (
              <Podium top3={top3} />
            )}

            {profile && (
              <YourRankHeroCard
                profile={profile}
                rank={userRank}
                accuracy={accuracy}
                streak={streak}
                bestStreak={bestStreak}
                leaderboard={effectiveLeaderboard as LBEntry[]}
              />
            )}

            {chaseTarget && (
              <ChaseCard
                target={chaseTarget.target}
                gap={chaseTarget.gap}
                targetRank={chaseTarget.targetRank}
              />
            )}

            {weeklyWinners && weeklyWinners.length > 0 && (
              <>
                <LBSectionHeader label="Last week's champions" />
                <View
                  style={[
                    styles.winnersCard,
                    { backgroundColor: surface[0], borderColor: border.subtle },
                  ]}
                >
                  {weeklyWinners.slice(0, 3).map((w: any, i: number) => {
                    const mc = [medalColors.gold, medalColors.silver, medalColors.bronze];
                    return (
                      <View key={w.id || i} style={styles.winnerRow}>
                        <View style={[styles.winnerMedal, { backgroundColor: mc[i] }]}>
                          <Text style={styles.winnerMedalText}>{i + 1}</Text>
                        </View>
                        <Text
                          style={[styles.winnerName, { color: textRole.primary }]}
                          numberOfLines={1}
                        >
                          {w.username}
                        </Text>
                        <Text style={[styles.winnerPts, { color: textRole.primary }]}>
                          {w.points} pts
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {rest.length > 0 && (
              <LBSectionHeader label="All players" hint={`${effectiveLeaderboard.length} total`} />
            )}

            {isLoading && [0, 1, 2].map((i) => <LeaderboardRowSkeleton key={i} />)}
          </View>
        }
        ListFooterComponent={
          rest.length > 0 ? (
            <View style={styles.footerCta}>
              <Button
                title="Predict more to climb"
                onPress={() => router.push("/(tabs)/matches")}
                variant="primary"
                size="md"
                icon="arrow-forward"
                iconPosition="trailing"
                fullWidth
              />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterWrap: {
    paddingHorizontal: 20,
    marginTop: -4,
    marginBottom: 16,
  },
  loadingWrap: { alignItems: "center", paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  winnersCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 2,
  },
  winnerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  winnerMedal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  winnerMedalText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  winnerName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  winnerPts: { fontSize: 13, fontFamily: "Inter_700Bold" },
  footerCta: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});

// Silence unused token imports — reserved for future additive work.
void typeTok;
