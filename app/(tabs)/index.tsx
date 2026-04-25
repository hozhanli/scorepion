/**
 * Today Screen — Emerald Minimalism.
 *
 * Unified ScreenHeader (H1 "Today, {day}" + caption username line) with a
 * 36px avatar in the right slot. Streak hero is the canonical gradient
 * moment; metrics collapse to a single emerald accent on white+hairline
 * cards; Daily Pack keeps the emerald GradientHero. Empty states use the
 * EmptyState primitive — no more flame wash backgrounds.
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Platform, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors, { accent, type as typeTok } from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserStats } from "@/lib/football-api";
import { MatchCard } from "@/components/MatchCard";
import { MatchCardSkeleton } from "@/components/SkeletonLoader";
import { formatLocalTime, getNextWeeklyResetUtc } from "@/lib/datetime";
import { getTodayString } from "@/lib/time-utils";
import {
  PressableScale,
  ScreenHeader,
  EmptyState,
  GradientHero,
  WelcomeBackBanner,
  useCelebration,
  HelpTip,
} from "@/components/ui";
import { StreakFlame } from "@/components/ui/StreakFlame";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ThisWeekCard } from "@/components/ui/ThisWeekCard";
import StyledText from "@/components/ui/StyledText";
import { getLastVisit, setLastVisit } from "@/lib/storage";
import { computeLevel } from "@/lib/leveling";

function MetricCard({
  icon,
  value,
  label,
  helpTerm,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  helpTerm?: string;
}) {
  const { surface, border } = useTheme();
  return (
    <View style={[metricStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}>
      <View style={metricStyles.iconWrap}>
        <Ionicons name={icon} size={20} color={accent.primary} />
      </View>
      <StyledText variant="h3" style={metricStyles.value}>
        {value}
      </StyledText>
      <View style={metricStyles.accentStripe} />
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "center" }}
      >
        <StyledText variant="micro" role="tertiary" style={metricStyles.label}>
          {label}
        </StyledText>
        {helpTerm && <HelpTip term={helpTerm} iconSize={10} />}
      </View>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    letterSpacing: -0.3,
  },
  accentStripe: {
    width: 24,
    height: 2,
    backgroundColor: accent.primary,
    marginBottom: 6,
  },
  label: {
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
});

function DailyPackCard({
  completed,
  total,
  allComplete,
  nextKickoff,
  onPress,
}: {
  completed: number;
  total: number;
  allComplete: boolean;
  nextKickoff?: string;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  const pct = total > 0 ? completed / total : 0;

  return (
    <PressableScale onPress={onPress} haptic="light">
      <GradientHero
        colors={Colors.gradients.emerald}
        glow="emerald"
        radius={24}
        padding={20}
        style={dailyStyles.card}
      >
        <View style={dailyStyles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={dailyStyles.title}>
              {allComplete ? t.today.packComplete : t.today.yourPack}
            </Text>
            <HelpTip term="dailypack" iconSize={14} />
          </View>
        </View>

        <View style={dailyStyles.numberRow}>
          <Text style={dailyStyles.bigNumber}>
            {completed} / {total}
          </Text>
          <Text style={dailyStyles.subtitle}>{t.today.predicted_badge}</Text>
        </View>

        <ProgressBar progress={pct} colors={["#FFFFFF", "rgba(255, 255, 255, 0.9)"]} height={6} />

        {!allComplete && nextKickoff && (
          <Text style={dailyStyles.nextKickoff}>
            {t.today.nextAt} {nextKickoff}
          </Text>
        )}
      </GradientHero>
    </PressableScale>
  );
}

const dailyStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  headerRow: {
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  numberRow: {
    alignItems: "center",
    gap: 4,
  },
  bigNumber: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255, 255, 255, 0.85)",
  },
  nextKickoff: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255, 255, 255, 0.75)",
    textAlign: "center",
    marginTop: 4,
  },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { surface, textRole, border } = useTheme();
  const { predictions, profile, dailyPack, dailyPickMatches, refreshData, isLoading } = useApp();
  const { data: userStats, refetch: refetchStats } = useUserStats();
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const completedCount = useMemo(() => {
    if (!dailyPack) return Object.keys(predictions).length > 0 ? 1 : 0;
    return dailyPack.picks.filter((p) => p.completed || predictions[p.matchId]).length;
  }, [dailyPack, predictions]);

  const totalPicks = dailyPack?.picks.length || dailyPickMatches.length;
  const allComplete = totalPicks > 0 && completedCount >= totalPicks;

  const streak = userStats?.streak ?? profile?.streak ?? 0;
  const bestStreak = userStats?.bestStreak ?? profile?.bestStreak ?? 0;
  const weeklyPoints = userStats?.weeklyPoints ?? 0;

  // ── Celebration watcher ────────────────────────────────────────────────────
  // Observes stats deltas and fires the four previously-dormant CelebrationToast
  // variants: streak (tick / break), tier (level-up), achievement (rank climb),
  // and points (silent settlement gains). The `lockin` variant is fired from
  // the match detail screen on prediction submit — that wiring is unchanged.
  //
  // We deliberately skip the very first observation so a returning user does
  // not get both a welcome-back banner and a cascade of celebration toasts for
  // predictions that settled while they were away. The welcome-back banner
  // already summarises those.
  const { celebrate } = useCelebration();
  const { t, tt } = useLanguage();
  const prevSnapshot = useRef<{
    streak: number;
    totalPoints: number;
    totalPredictions: number;
    rank: number;
    level: number;
  } | null>(null);

  useEffect(() => {
    if (!userStats) return;
    const level = computeLevel(userStats.totalPoints ?? 0).level;
    const next = {
      streak: userStats.streak ?? 0,
      totalPoints: userStats.totalPoints ?? 0,
      totalPredictions: userStats.totalPredictions ?? 0,
      rank: userStats.rank ?? 0,
      level,
    };

    // First observation — just prime the ref.
    if (prevSnapshot.current === null) {
      prevSnapshot.current = next;
      return;
    }

    const prev = prevSnapshot.current;

    // Tier promotion — highest priority.
    if (next.level > prev.level) {
      celebrate({
        variant: "tier",
        title: tt(t.celebration.tierUpTitle, { level: next.level }),
        subtitle: t.celebration.tierUpSubtitle,
      });
    }

    // Streak tick (up) — only at meaningful milestones or on +1 transitions.
    if (next.streak > prev.streak) {
      celebrate({
        variant: "streak",
        title: tt(t.celebration.streakTickTitle, { streak: next.streak }),
        subtitle:
          next.streak >= (bestStreak || 0)
            ? t.celebration.streakBestSubtitle
            : t.celebration.streakKeepSubtitle,
      });
    }

    // Streak break — was >0, now 0.
    if (prev.streak > 0 && next.streak === 0) {
      celebrate({
        variant: "streak",
        title: t.celebration.streakResetTitle,
        subtitle: t.celebration.streakResetSubtitle,
        icon: "sync-outline",
      });
    }

    // Rank climb — lower is better. Require prior rank > 0 to avoid the
    // first-populated-rank edge case.
    if (prev.rank > 0 && next.rank > 0 && next.rank < prev.rank) {
      const jumped = prev.rank - next.rank;
      celebrate({
        variant: "achievement",
        title: tt(t.celebration.rankClimbTitle, { rank: next.rank }),
        subtitle:
          jumped === 1 ? t.celebration.rankClimbOne : tt(t.celebration.rankClimbMany, { jumped }),
      });
    }

    // Settlement points — points grew without a new prediction being made.
    if (next.totalPoints > prev.totalPoints && next.totalPredictions === prev.totalPredictions) {
      const delta = next.totalPoints - prev.totalPoints;
      celebrate({
        variant: "points",
        title: tt(t.celebration.pointsGainedTitle, { delta }),
        subtitle: t.celebration.pointsGainedSubtitle,
      });
    }

    prevSnapshot.current = next;
  }, [userStats, celebrate, bestStreak, t, tt]);

  // Local fallback so the Reset metric is never "–": days until the next
  // weekly reset (Sunday UTC). Server value wins if present.
  const daysLeft = useMemo(() => {
    if (typeof userStats?.resetDays === "number") return userStats.resetDays;
    const reset = getNextWeeklyResetUtc();
    const diff = Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 86_400_000));
    return diff;
  }, [userStats?.resetDays]);

  // Week dots for the StreakFlame strip. Each dot represents one of the last
  // 7 days (Mon → Sun). A dot is lit if any prediction was SUBMITTED on that
  // day. This replaces the previous hardcoded `Array(7).fill(false)`.
  const weekDots = useMemo(() => {
    const now = new Date();
    const dots: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const start = day.getTime();
      const end = start + 86_400_000;
      const hit = Object.values(predictions).some((p) => {
        const ts = p.timestamp ? new Date(p.timestamp).getTime() : 0;
        return ts >= start && ts < end;
      });
      dots.push(hit);
    }
    return dots;
  }, [predictions]);

  // ── Welcome-back banner ────────────────────────────────────────────────────
  // Summarises settled predictions that landed since the user's last visit,
  // provided they were away for > 6 hours. Dismissible for the session.
  const [welcomeBack, setWelcomeBack] = useState<{
    settledCount: number;
    pointsEarned: number;
    hoursAway: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const last = await getLastVisit();
      const now = Date.now();
      await setLastVisit(now);
      if (!last) return; // first-ever session — no banner
      const hoursAway = Math.round((now - last) / 3_600_000);
      if (hoursAway < 6) return; // still the same session window
      const settled = Object.values(predictions).filter(
        (p) => p.settled && (p.timestamp ?? 0) >= last,
      );
      if (settled.length === 0) return;
      const pointsEarned = settled.reduce((acc, p) => acc + (p.points ?? 0), 0);
      if (!cancelled) {
        setWelcomeBack({
          settledCount: settled.length,
          pointsEarned,
          hoursAway,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally only runs once on mount — we don't want the banner to
    // re-appear after the user dismisses it and then a new prediction
    // settles during the same session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter dailyPickMatches to show only today's matches
  const todaysMatches = useMemo(() => {
    const today = getTodayString(); // e.g., "2026-04-20"
    return dailyPickMatches.filter((m) => {
      const matchDate = m.kickoff.split("T")[0]; // Extract YYYY-MM-DD from ISO string
      return matchDate === today;
    });
  }, [dailyPickMatches]);

  const unpredictedMatches = useMemo(
    () => todaysMatches.filter((m) => !predictions[m.id] && m.status === "upcoming"),
    [todaysMatches, predictions],
  );

  const nextKickoffStr = useMemo(() => {
    if (unpredictedMatches.length === 0) return undefined;
    return formatLocalTime(unpredictedMatches[0].kickoff);
  }, [unpredictedMatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), refetchStats()]);
    setRefreshing(false);
  }, [refreshData, refetchStats]);

  const avatarInitial = profile?.username?.charAt(0).toUpperCase() ?? "?";

  const dayName = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date());
  const greetingSub = profile?.username
    ? `${profile.username}, here's your pack`
    : "Here's your pack";

  const AvatarButton = (
    <PressableScale
      onPress={() => router.push("/(tabs)/profile")}
      hitSlop={8}
      haptic="light"
      pressedScale={0.92}
      accessibilityRole="button"
      accessibilityLabel={t.a11y.viewProfile}
    >
      <View style={[styles.avatar, { backgroundColor: surface[2] }]}>
        <Text style={[styles.avatarText, { color: textRole.primary }]}>{avatarInitial}</Text>
      </View>
    </PressableScale>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: surface[1], paddingTop: topPad }]}
      testID="today-screen"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 110 : 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.palette.emerald}
          />
        }
      >
        <ScreenHeader
          title={`Today, ${dayName}`}
          subtitle={greetingSub}
          right={AvatarButton}
          showLogo
          animate={false}
        />

        {/* ── Welcome-back banner ── */}
        {welcomeBack && (
          <WelcomeBackBanner
            settledCount={welcomeBack.settledCount}
            pointsEarned={welcomeBack.pointsEarned}
            hoursAway={welcomeBack.hoursAway}
            onPress={() => router.push("/(tabs)/profile")}
            onDismiss={() => setWelcomeBack(null)}
          />
        )}

        {/* ── Streak Hero ── */}
        <View>
          <View style={styles.streakContainer}>
            <StreakFlame
              streak={streak}
              bestStreak={bestStreak}
              weekDots={weekDots}
              subtitle={
                streak > 0
                  ? t.today.onFire.replace("{{best}}", bestStreak.toString())
                  : bestStreak > 0
                    ? t.today.rebuildToday.replace("{{best}}", bestStreak.toString())
                    : t.today.lockInToStartStreak
              }
              onPress={() => router.push("/scoring" as any)}
            />
          </View>
        </View>

        {/* ── 3-column Metrics row ── */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="trophy-outline"
            value={bestStreak}
            label={t.today.best}
            helpTerm="streak"
          />
          <MetricCard icon="star-outline" value={weeklyPoints} label={t.today.weekPts} />
          <MetricCard icon="refresh-outline" value={daysLeft} label={t.today.reset} />
        </View>

        {/* ── This Week card ── */}
        <ThisWeekCard />

        {/* ── Daily Pack card ── */}
        {totalPicks > 0 && (
          <View>
            <DailyPackCard
              completed={completedCount}
              total={totalPicks}
              allComplete={allComplete}
              nextKickoff={nextKickoffStr}
              onPress={() => router.push("/(tabs)/matches")}
            />
          </View>
        )}

        {/* ── Section header ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textRole.primary }]}>
            {t.today.todaysMatches}
          </Text>
          <PressableScale
            onPress={() => router.push("/(tabs)/matches")}
            hitSlop={8}
            haptic="light"
            pressedScale={0.94}
          >
            <View style={styles.seeAllRow}>
              <Text style={styles.seeAllText}>{t.today.seeAll}</Text>
              <Ionicons name="arrow-forward" size={13} color={accent.primary} />
            </View>
          </PressableScale>
        </View>

        {isLoading ? (
          [0, 1, 2].map((i) => <MatchCardSkeleton key={i} />)
        ) : todaysMatches.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="calendar-outline"
              title={t.today.noPicks || "No matches on your radar today"}
              subtitle={t.today.checkBack || "Tomorrow's lineup awaits. See all matches →"}
              action={
                <PressableScale
                  onPress={() => router.push("/(tabs)/matches")}
                  haptic="light"
                  pressedScale={0.94}
                >
                  <View style={styles.emptyActionButton}>
                    <Text style={styles.emptyActionText}>See all matches</Text>
                  </View>
                </PressableScale>
              }
            />
          </View>
        ) : (
          todaysMatches.map((match, i) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id]}
              onPress={() => router.push({ pathname: "/match/[id]", params: { id: match.id } })}
              index={i}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Avatar (right slot)
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },

  // Streak
  streakContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // Metrics
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: typeTok.h2.size,
    fontFamily: typeTok.h2.family,
    letterSpacing: -0.4,
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: accent.primary,
  },

  // Empty
  emptyWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Empty action button
  emptyActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: accent.primary,
    alignItems: "center",
  },
  emptyActionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
