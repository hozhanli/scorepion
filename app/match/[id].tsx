/**
 * Match Detail — Emerald Minimalism.
 *
 * Refreshed per §6.10 of the audit:
 *   • Hero is now white + hairline for upcoming/finished matches; emerald
 *     GradientHero is reserved for the LIVE state only (canonical gradient
 *     moment for this screen).
 *   • Top nav: flat back link + hairline league chip (no shadows, no violet).
 *   • Section tabs replaced with the canonical FilterSegmented primitive.
 *   • Prediction card: larger tap targets on the stepper, one inline outcome
 *     chip, emerald Button primitive for Lock In.
 *   • Points system card collapses to a single emerald accent (no rainbow).
 *   • Events use Ionicons instead of emoji glyphs.
 *   • Details card: unified neutral icon wells + emerald accents.
 *   • Removed useTheme, softShadow, importanceColor, washFlame, violet pill.
 */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn, ZoomIn } from "react-native-reanimated";

import Colors, { accent, radii, type as typeTok } from "@/constants/colors";
import {
  GradientHero,
  PressableScale,
  TeamLogo,
  LiveBadge,
  FilterSegmented,
  Button,
  EmptyState,
  useCelebration,
} from "@/components/ui";
import { PredictionReceiptCard } from "@/components/ui/share/PredictionReceiptCard";
import { haptics } from "@/lib/motion";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { formatLocalTime, formatLocalDate, formatCountdown, getTimeUntil } from "@/lib/datetime";
import {
  useFixtureEvents,
  useFixtureLineups,
  useFixtureMatchStats,
  useFixtureH2H,
  useTeamStats,
  useCommunityPicks,
} from "@/lib/football-api";

// ── Form Strip Component ──────────────────────────────────────────────────────

function FormStrip({ form }: { form?: string }) {
  const { accent: themeAccent, textRole: themeTextRole } = useTheme();
  if (!form) return null;

  // Parse form string 'WDLWL' into last 5 results
  const results = form.slice(0, 5).split("");

  return (
    <View
      style={formStripStyles.container}
      accessibilityLabel={`Form: ${results.map((r) => (r === "W" ? "Win" : r === "D" ? "Draw" : "Loss")).join(", ")}`}
    >
      {results.map((r, i) => {
        const color =
          r === "W"
            ? themeAccent.primary
            : r === "L"
              ? themeAccent.alert
              : r === "D"
                ? themeTextRole.tertiary
                : "transparent";
        return (
          <View
            key={i}
            style={[formStripStyles.square, { backgroundColor: color }]}
            accessibilityLabel={r === "W" ? "Win" : r === "D" ? "Draw" : "Loss"}
          />
        );
      })}
    </View>
  );
}

const formStripStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    justifyContent: "center",
  },
  square: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});

// ── H2H row ───────────────────────────────────────────────────────────────────

interface H2HMatch {
  date: string;
  homeTeam: { id: string; name: string; shortName: string; color: string; logo: string };
  awayTeam: { id: string; name: string; shortName: string; color: string; logo: string };
  homeScore: number;
  awayScore: number;
  competition: string;
}

function H2HMatchRow({ match, index }: { match: H2HMatch; index: number }) {
  const {
    surface: themeSurface,
    border: themeBorder,
    textRole: themeTextRole,
    accent: themeAccent,
  } = useTheme();
  const dateStr = formatLocalDate(match.date);
  const homeWin = match.homeScore > match.awayScore;
  const awayWin = match.awayScore > match.homeScore;

  return (
    <View
      style={[h2hStyles.row, { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle }]}
    >
      <View style={h2hStyles.rowHeader}>
        <Text style={[h2hStyles.date, { color: themeTextRole.tertiary }]}>{dateStr}</Text>
        <Text style={[h2hStyles.comp, { color: themeTextRole.tertiary }]} numberOfLines={1}>
          {match.competition}
        </Text>
      </View>
      <View style={h2hStyles.matchContent}>
        <Text
          style={[
            h2hStyles.teamText,
            { color: themeTextRole.secondary },
            homeWin && [h2hStyles.winnerText, { color: themeTextRole.primary }],
          ]}
          numberOfLines={1}
        >
          {match.homeTeam.shortName}
        </Text>
        <View style={h2hStyles.scorePills}>
          <View
            style={[
              h2hStyles.scorePill,
              { backgroundColor: themeSurface[2] },
              homeWin && { backgroundColor: themeAccent.primary },
            ]}
          >
            <Text
              style={[
                h2hStyles.scorePillText,
                { color: themeTextRole.primary },
                homeWin && { color: "#fff" },
              ]}
            >
              {match.homeScore}
            </Text>
          </View>
          <Text style={[h2hStyles.scoreDash, { color: themeTextRole.tertiary }]}>–</Text>
          <View
            style={[
              h2hStyles.scorePill,
              { backgroundColor: themeSurface[2] },
              awayWin && { backgroundColor: themeAccent.primary },
            ]}
          >
            <Text
              style={[
                h2hStyles.scorePillText,
                { color: themeTextRole.primary },
                awayWin && { color: "#fff" },
              ]}
            >
              {match.awayScore}
            </Text>
          </View>
        </View>
        <Text
          style={[h2hStyles.teamText, h2hStyles.teamTextAway, awayWin && h2hStyles.winnerText]}
          numberOfLines={1}
        >
          {match.awayTeam.shortName}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

type SectionKey = "prediction" | "h2h" | "events" | "lineups" | "stats" | "details";

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { matches, predictions, submitPrediction, dailyPack, toggleBoostPick, profile } = useApp();
  const { celebrate } = useCelebration();
  const { t } = useLanguage();
  const {
    surface: themeSurface,
    border: themeBorder,
    textRole: themeTextRole,
    accent: themeAccent,
  } = useTheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Race condition guard for submit button (same pattern as AppContext)
  const submitInFlight = useRef(false);
  const receiptCardRef = useRef<View>(null);
  const [showShareButton, setShowShareButton] = useState(false);

  const match = useMemo(() => matches.find((m) => m.id === id), [matches, id]);
  const existingPrediction = predictions[id || ""];

  const [homeScore, setHomeScore] = useState(existingPrediction?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(existingPrediction?.awayScore ?? 0);
  const [submitted, setSubmitted] = useState(!!existingPrediction);
  const [activeSection, setActiveSection] = useState<SectionKey>("prediction");
  const [kickoffCountdown, setKickoffCountdown] = useState("");

  const { data: socialProof } = useCommunityPicks(id);
  const { data: fixtureEvents } = useFixtureEvents(id);
  const { data: fixtureLineups } = useFixtureLineups(id);
  const { data: fixtureStats } = useFixtureMatchStats(id);
  const { data: _homeTeamStats } = useTeamStats(match?.homeTeam?.id);
  const { data: _awayTeamStats } = useTeamStats(match?.awayTeam?.id);
  const { data: h2hData } = useFixtureH2H(match?.homeTeam?.id, match?.awayTeam?.id);

  const h2hMatches = useMemo(() => h2hData ?? [], [h2hData]);

  const h2hSummary = useMemo(() => {
    if (!match || h2hMatches.length === 0) return { homeWins: 0, draws: 0, awayWins: 0 };
    let homeWins = 0,
      draws = 0,
      awayWins = 0;
    h2hMatches.forEach((m) => {
      const isHomeTeamHome = m.homeTeam.id === match.homeTeam.id;
      if (m.homeScore === m.awayScore) {
        draws++;
      } else if (
        (m.homeScore > m.awayScore && isHomeTeamHome) ||
        (m.awayScore > m.homeScore && !isHomeTeamHome)
      ) {
        homeWins++;
      } else {
        awayWins++;
      }
    });
    return { homeWins, draws, awayWins };
  }, [h2hMatches, match]);

  const isDailyPick = useMemo(
    () => dailyPack?.picks.some((p) => p.matchId === id),
    [dailyPack, id],
  );
  const isBoosted = useMemo(
    () => dailyPack?.picks.find((p) => p.matchId === id)?.boosted || false,
    [dailyPack, id],
  );
  const boostAvailable = useMemo(() => !dailyPack?.boostUsed || isBoosted, [dailyPack, isBoosted]);

  useEffect(() => {
    if (!match || match.status !== "upcoming") return;
    const update = () => {
      const timeUntilKickoff = getTimeUntil(match.kickoff);
      if (timeUntilKickoff <= 0) {
        setKickoffCountdown(t.match.startingSoon);
      } else {
        setKickoffCountdown(formatCountdown(timeUntilKickoff));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [match]);

  if (!match) {
    return (
      <View style={[styles.container, styles.center]}>
        <EmptyState
          icon="alert-circle-outline"
          title={t.match.notFound}
          subtitle={t.match.couldNotLoad}
        />
        <PressableScale onPress={() => router.back()} style={styles.backLink} haptic="light">
          <Text style={styles.backLinkText}>{t.match.goBack}</Text>
        </PressableScale>
      </View>
    );
  }

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const matchStarted = new Date(match.kickoff).getTime() <= Date.now() || isLive || isFinished;

  const handleSubmit = async () => {
    if (matchStarted) {
      Alert.alert(t.match.predictionsLocked, t.match.matchStarted);
      return;
    }
    // Race condition guard: prevent double-submit
    if (submitInFlight.current) {
      console.warn("MatchScreen:handleSubmit guard", {
        matchId: match.id,
        message: "submit already in-flight",
      });
      return;
    }
    submitInFlight.current = true;

    try {
      await submitPrediction(match.id, homeScore, awayScore, isBoosted);
      setSubmitted(true);
      setShowShareButton(true);
      // Canonical gradient celebration moment #1 — prediction locked in.
      // The toast fires its own haptics.success(); we don't double-fire here.
      celebrate({
        variant: "lockin",
        title: t.celebration.lockinTitle,
        subtitle: `${match.homeTeam.shortName} ${homeScore} – ${awayScore} ${match.awayTeam.shortName}`,
      });
      // Auto-dismiss the Match Detail screen so the user lands back on the
      // match list and can see the celebration toast overlap the row they
      // just predicted. 650ms feels snappy without eating the toast.
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        }
      }, 650);
    } catch (_error) {
      Alert.alert(t.match.error, t.match.submitError);
    } finally {
      submitInFlight.current = false;
    }
  };

  const handleEdit = () => {
    if (matchStarted) {
      Alert.alert(t.match.predictionsLocked, t.match.matchStarted);
      return;
    }
    setSubmitted(false);
  };

  const timeStr = formatLocalTime(match.kickoff);
  const dateStr = formatLocalDate(match.kickoff);

  const sections: { value: SectionKey; label: string }[] = [
    { value: "prediction", label: t.match.predict },
    { value: "h2h", label: t.match.h2h },
    { value: "events", label: t.match.events },
    { value: "lineups", label: t.match.lineups },
    { value: "stats", label: t.match.stats },
  ];

  const total = h2hSummary.homeWins + h2hSummary.draws + h2hSummary.awayWins;
  const homePercent = total > 0 ? Math.round((h2hSummary.homeWins / total) * 100) : 0;
  const drawPercent = total > 0 ? Math.round((h2hSummary.draws / total) * 100) : 0;
  const awayPercent = total > 0 ? Math.round((h2hSummary.awayWins / total) * 100) : 0;

  // ── Hero ── white + hairline for upcoming/finished, emerald GradientHero for live
  const Hero = (
    <View style={styles.heroRow}>
      {/* Home */}
      <View style={styles.heroTeamSide}>
        <View
          style={[
            styles.heroLogoWrap,
            isLive && styles.heroLogoWrapLive,
            !isLive && { backgroundColor: themeSurface[2] },
          ]}
        >
          <TeamLogo
            logo={match.homeTeam.logo}
            name={match.homeTeam.name}
            shortName={match.homeTeam.shortName}
            color={match.homeTeam.color}
            size={40}
          />
        </View>
        <Text
          style={[
            styles.heroTeamName,
            isLive && styles.heroTeamNameLive,
            !isLive && { color: themeTextRole.primary },
          ]}
          numberOfLines={1}
        >
          {match.homeTeam.shortName || match.homeTeam.name}
        </Text>
        {_homeTeamStats && _homeTeamStats.data && _homeTeamStats.data[0] && (
          <FormStrip form={_homeTeamStats.data[0].form} />
        )}
      </View>

      {/* Center: score or time */}
      <View style={styles.heroCenter}>
        {isLive || isFinished ? (
          <>
            <View style={styles.heroScoreRow}>
              <Text
                style={[
                  styles.heroScore,
                  isLive && styles.heroScoreLive,
                  !isLive && { color: themeTextRole.primary },
                ]}
              >
                {match.homeScore}
              </Text>
              <Text
                style={[
                  styles.heroScoreSep,
                  isLive && styles.heroScoreSepLive,
                  !isLive && { color: themeTextRole.tertiary },
                ]}
              >
                –
              </Text>
              <Text
                style={[
                  styles.heroScore,
                  isLive && styles.heroScoreLive,
                  !isLive && { color: themeTextRole.primary },
                ]}
              >
                {match.awayScore}
              </Text>
            </View>
            {isLive ? (
              <LiveBadge minute={match.minute} />
            ) : (
              <View style={styles.heroFtChip}>
                <Text style={styles.heroFtChipText}>FULL TIME</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.heroTimeBig, { color: themeTextRole.primary }]}>{timeStr}</Text>
            {kickoffCountdown ? (
              <View style={styles.heroCountdownChip}>
                <Ionicons name="time-outline" size={11} color={themeAccent.primary} />
                <Text style={[styles.heroCountdownText, { color: themeAccent.primary }]}>
                  {kickoffCountdown}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Away */}
      <View style={styles.heroTeamSide}>
        <View
          style={[
            styles.heroLogoWrap,
            isLive && styles.heroLogoWrapLive,
            !isLive && { backgroundColor: themeSurface[2] },
          ]}
        >
          <TeamLogo
            logo={match.awayTeam.logo}
            name={match.awayTeam.name}
            shortName={match.awayTeam.shortName}
            color={match.awayTeam.color}
            size={40}
          />
        </View>
        <Text
          style={[
            styles.heroTeamName,
            isLive && styles.heroTeamNameLive,
            !isLive && { color: themeTextRole.primary },
          ]}
          numberOfLines={1}
        >
          {match.awayTeam.shortName || match.awayTeam.name}
        </Text>
        {_awayTeamStats && _awayTeamStats.data && _awayTeamStats.data[0] && (
          <FormStrip form={_awayTeamStats.data[0].form} />
        )}
      </View>
    </View>
  );

  const HeroMeta = (
    <View style={styles.heroMetaRow}>
      <Text
        style={[
          styles.heroMetaText,
          isLive && styles.heroMetaTextLive,
          !isLive && { color: themeTextRole.secondary },
        ]}
        numberOfLines={1}
      >
        {dateStr}
      </Text>
      {isDailyPick && (
        <>
          <View
            style={[
              styles.heroMetaDot,
              isLive && styles.heroMetaDotLive,
              !isLive && { backgroundColor: themeBorder.subtle },
            ]}
          />
          <View style={styles.heroMetaInline}>
            <Ionicons name="today" size={11} color={isLive ? "#fff" : themeAccent.primary} />
            <Text
              style={[
                styles.heroMetaStrong,
                isLive && styles.heroMetaStrongLive,
                !isLive && { color: themeTextRole.primary },
              ]}
            >
              Daily pick
            </Text>
          </View>
        </>
      )}
      {match.tags && match.tags.length > 0 && (
        <>
          <View
            style={[
              styles.heroMetaDot,
              isLive && styles.heroMetaDotLive,
              !isLive && { backgroundColor: themeBorder.subtle },
            ]}
          />
          <View style={styles.heroMetaInline}>
            <Ionicons
              name={
                match.tags[0] === "Derby"
                  ? "flash"
                  : match.tags[0] === "Final"
                    ? "trophy"
                    : match.tags[0] === "Knockout"
                      ? "shield"
                      : match.tags[0] === "Big Match"
                        ? "star"
                        : match.tags[0] === "Upset Alert"
                          ? "warning"
                          : "trending-up"
              }
              size={11}
              color={isLive ? "#fff" : themeAccent.primary}
            />
            <Text
              style={[
                styles.heroMetaStrong,
                isLive && styles.heroMetaStrongLive,
                !isLive && { color: themeTextRole.primary },
              ]}
            >
              {match.tags[0]}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1, backgroundColor: themeSurface[1] }}
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top nav row ── */}
        <View style={[styles.topNav, { paddingTop: topPad + 6 }]}>
          <PressableScale
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
            ]}
            hitSlop={8}
            haptic="light"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={18} color={themeTextRole.primary} />
            <Text style={[styles.backBtnText, { color: themeTextRole.primary }]}>Back</Text>
          </PressableScale>

          <PressableScale
            onPress={() =>
              router.push({ pathname: "/league/[id]", params: { id: match.league.id } })
            }
            style={[
              styles.leaguePill,
              { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
            ]}
            haptic="light"
          >
            <Ionicons name="football-outline" size={12} color={themeTextRole.secondary} />
            <Text
              style={[styles.leaguePillText, { color: themeTextRole.secondary }]}
              numberOfLines={1}
            >
              {match.league.name}
            </Text>
          </PressableScale>
        </View>

        {/* ── Hero ── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroWrap}>
          {isLive ? (
            <GradientHero
              colors={Colors.gradients.emerald}
              glow="emerald"
              radius={radii.xl}
              padding={20}
            >
              {Hero}
              {HeroMeta}
            </GradientHero>
          ) : (
            <View
              style={[
                styles.heroCardFlat,
                { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
              ]}
            >
              {Hero}
              {HeroMeta}
            </View>
          )}
        </Animated.View>

        {/* ── Section tabs (FilterSegmented) ── */}
        <View style={styles.segmentedWrap}>
          <FilterSegmented
            items={sections}
            value={activeSection}
            onChange={(v) => setActiveSection(v as SectionKey)}
          />
        </View>

        {/* ── PREDICTION ── */}
        {activeSection === "prediction" && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.predictionSection}>
            {matchStarted && !existingPrediction ? (
              <View
                style={[
                  styles.lockedCard,
                  { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                ]}
              >
                <View style={[styles.lockedIconWrap, { backgroundColor: themeSurface[2] }]}>
                  <Ionicons name="lock-closed" size={22} color={themeTextRole.tertiary} />
                </View>
                <Text style={[styles.lockedTitle, { color: themeTextRole.primary }]}>
                  Predictions closed
                </Text>
                <Text style={[styles.lockedText, { color: themeTextRole.secondary }]}>
                  {isLive
                    ? "This match is in progress. Predictions can only be made before kickoff."
                    : isFinished
                      ? "This match has ended. Predictions are no longer available."
                      : "This match has started. Predictions can only be made before kickoff."}
                </Text>
              </View>
            ) : submitted ? (
              <>
                <Animated.View
                  entering={ZoomIn.duration(300)}
                  style={[
                    styles.predictCardClean,
                    { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                  ]}
                >
                  {/* Header */}
                  <View style={styles.predictHeaderClean}>
                    <Text style={[styles.predictLabelClean, { color: themeTextRole.secondary }]}>
                      {t.match.yourPrediction}
                    </Text>
                    <View style={styles.predictCountdownChip}>
                      <Ionicons name="lock-closed" size={11} color={themeAccent.primary} />
                      <Text style={[styles.predictCountdownText, { color: themeAccent.primary }]}>
                        Locked
                      </Text>
                    </View>
                  </View>

                  {/* Score row */}
                  <View style={styles.predictScoreRow}>
                    <View style={styles.predictTeamCol}>
                      <Text
                        style={[styles.predictTeamLabel, { color: themeTextRole.tertiary }]}
                        numberOfLines={1}
                      >
                        {match.homeTeam.shortName}
                      </Text>
                      <Text style={[styles.predictBigScore, { color: themeTextRole.primary }]}>
                        {homeScore}
                      </Text>
                    </View>
                    <Text style={[styles.predictDash, { color: themeTextRole.tertiary }]}>—</Text>
                    <View style={styles.predictTeamCol}>
                      <Text
                        style={[styles.predictTeamLabel, { color: themeTextRole.tertiary }]}
                        numberOfLines={1}
                      >
                        {match.awayTeam.shortName}
                      </Text>
                      <Text style={[styles.predictBigScore, { color: themeTextRole.primary }]}>
                        {awayScore}
                      </Text>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.submittedFooter}>
                    <View style={styles.predictOutcomeChip}>
                      <Ionicons
                        name={homeScore === awayScore ? "remove-circle" : "checkmark-circle"}
                        size={14}
                        color={themeAccent.primary}
                      />
                      <Text style={[styles.predictOutcomeChipText, { color: themeAccent.primary }]}>
                        {homeScore === awayScore
                          ? t.match.draw
                          : homeScore > awayScore
                            ? `${match.homeTeam.shortName} win`
                            : `${match.awayTeam.shortName} win`}
                      </Text>
                    </View>
                    {!matchStarted && (
                      <Pressable
                        onPress={handleEdit}
                        style={({ pressed }) => [styles.changeLink, pressed && { opacity: 0.6 }]}
                        hitSlop={8}
                      >
                        <Ionicons name="create-outline" size={14} color={themeAccent.primary} />
                        <Text style={[styles.changeLinkText, { color: themeAccent.primary }]}>
                          {t.match.change}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </Animated.View>

                {/* PredictionReceiptCard — shown after lock-in */}
                <View style={styles.receiptSection}>
                  <PredictionReceiptCard
                    homeTeam={match.homeTeam.name}
                    awayTeam={match.awayTeam.name}
                    homeScore={homeScore}
                    awayScore={awayScore}
                    league={match.league.name}
                    kickoffLabel={`${formatLocalDate(match.kickoff)} · ${formatLocalTime(match.kickoff)}`}
                    username={profile?.username}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.predictCardClean}>
                  {/* Header */}
                  <View style={styles.predictHeaderClean}>
                    <Text style={styles.predictLabelClean}>{t.match.yourPrediction}</Text>
                    {kickoffCountdown ? (
                      <View style={styles.predictCountdownChip}>
                        <Ionicons name="time-outline" size={11} color={themeAccent.primary} />
                        <Text style={styles.predictCountdownText}>{kickoffCountdown}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Score row */}
                  <View style={styles.predictScoreRow}>
                    {/* Home */}
                    <View style={styles.predictTeamCol}>
                      <Text
                        style={[styles.predictTeamLabel, { color: themeTextRole.tertiary }]}
                        numberOfLines={1}
                      >
                        {match.homeTeam.shortName}
                      </Text>
                      <Text style={[styles.predictBigScore, { color: themeTextRole.primary }]}>
                        {homeScore}
                      </Text>
                      <View style={styles.predictStepperRow}>
                        <PressableScale
                          onPress={() => homeScore > 0 && setHomeScore((s) => Math.max(s - 1, 0))}
                          disabled={homeScore <= 0}
                          style={[
                            styles.predictStepMinus,
                            { backgroundColor: themeSurface[2] },
                            homeScore <= 0 && { opacity: 0.35 },
                          ]}
                          hitSlop={12}
                          haptic="light"
                        >
                          <Ionicons name="remove" size={20} color={themeTextRole.primary} />
                        </PressableScale>
                        <PressableScale
                          onPress={() => homeScore < 15 && setHomeScore((s) => Math.min(s + 1, 15))}
                          disabled={homeScore >= 15}
                          style={[styles.predictStepPlus, homeScore >= 15 && { opacity: 0.35 }]}
                          hitSlop={12}
                          haptic="light"
                        >
                          <Ionicons name="add" size={20} color="#fff" />
                        </PressableScale>
                      </View>
                    </View>

                    {/* Center dash */}
                    <Text style={[styles.predictDash, { color: themeTextRole.tertiary }]}>—</Text>

                    {/* Away */}
                    <View style={styles.predictTeamCol}>
                      <Text
                        style={[styles.predictTeamLabel, { color: themeTextRole.tertiary }]}
                        numberOfLines={1}
                      >
                        {match.awayTeam.shortName}
                      </Text>
                      <Text style={[styles.predictBigScore, { color: themeTextRole.primary }]}>
                        {awayScore}
                      </Text>
                      <View style={styles.predictStepperRow}>
                        <PressableScale
                          onPress={() => awayScore > 0 && setAwayScore((s) => Math.max(s - 1, 0))}
                          disabled={awayScore <= 0}
                          style={[styles.predictStepMinus, awayScore <= 0 && { opacity: 0.35 }]}
                          hitSlop={12}
                          haptic="light"
                        >
                          <Ionicons name="remove" size={20} color={themeTextRole.primary} />
                        </PressableScale>
                        <PressableScale
                          onPress={() => awayScore < 15 && setAwayScore((s) => Math.min(s + 1, 15))}
                          disabled={awayScore >= 15}
                          style={[styles.predictStepPlus, awayScore >= 15 && { opacity: 0.35 }]}
                          hitSlop={12}
                          haptic="light"
                        >
                          <Ionicons name="add" size={20} color="#fff" />
                        </PressableScale>
                      </View>
                    </View>
                  </View>

                  {/* Outcome chip */}
                  <View style={styles.predictOutcomeChip}>
                    <Ionicons
                      name={homeScore === awayScore ? "remove-circle" : "checkmark-circle"}
                      size={14}
                      color={themeAccent.primary}
                    />
                    <Text style={[styles.predictOutcomeChipText, { color: themeAccent.primary }]}>
                      {homeScore === awayScore
                        ? t.match.draw
                        : homeScore > awayScore
                          ? `${match.homeTeam.shortName} win`
                          : `${match.awayTeam.shortName} win`}
                    </Text>
                    <View style={styles.predictOutcomeDot} />
                    <Text style={[styles.predictOutcomeHint, { color: themeAccent.primary }]}>
                      +10 pts exact
                    </Text>
                  </View>
                </View>

                {isDailyPick && boostAvailable && !isFinished && (
                  <PressableScale
                    onPress={() => {
                      haptics.medium();
                      if (id) toggleBoostPick(id);
                    }}
                    style={[
                      styles.boostToggle,
                      { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                      isBoosted && styles.boostToggleActive,
                    ]}
                  >
                    <View style={[styles.boostIconWrap, isBoosted && styles.boostIconWrapActive]}>
                      <Ionicons
                        name="flash"
                        size={16}
                        color={isBoosted ? "#fff" : themeAccent.reward}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.boostText,
                          { color: themeTextRole.primary },
                          isBoosted && styles.boostTextActive,
                        ]}
                      >
                        {isBoosted ? t.match.boostActive : t.match.useBoost}
                      </Text>
                      <Text style={[styles.boostSub, { color: themeTextRole.tertiary }]}>
                        {t.match.boostPerDay}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.boostSwitch,
                        { backgroundColor: themeSurface[2] },
                        isBoosted && styles.boostSwitchActive,
                      ]}
                    >
                      <View
                        style={[styles.boostSwitchDot, isBoosted && styles.boostSwitchDotActive]}
                      />
                    </View>
                  </PressableScale>
                )}

                <Button
                  title={isBoosted ? t.match.lockInBoost : t.match.lockInPrediction}
                  onPress={handleSubmit}
                  variant="primary"
                  icon={isBoosted ? "flash" : "lock-closed"}
                  size="lg"
                  fullWidth
                />
              </>
            )}

            {socialProof && socialProof.totalPredictions > 0 && !isFinished && (
              <View
                style={[
                  styles.socialProofCard,
                  { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                ]}
              >
                <View style={styles.socialProofHeader}>
                  <Ionicons name="people-outline" size={14} color={themeAccent.primary} />
                  <Text style={[styles.socialProofTitle, { color: themeTextRole.primary }]}>
                    {t.match.communityPicks}
                  </Text>
                  <Text style={[styles.socialProofCount, { color: themeTextRole.tertiary }]}>
                    {socialProof.totalPredictions} predictions
                  </Text>
                </View>
                <View style={styles.socialProofPicks}>
                  {socialProof.communityPicks.map(
                    (pick: { score: string; percent: number }, i: number) => (
                      <View key={i} style={styles.socialProofRow}>
                        <Text style={[styles.socialProofScore, { color: themeTextRole.primary }]}>
                          {pick.score}
                        </Text>
                        <View
                          style={[styles.socialProofBarTrack, { backgroundColor: themeSurface[2] }]}
                        >
                          <View
                            style={[styles.socialProofBarFill, { width: `${pick.percent}%` }]}
                          />
                        </View>
                        <Text
                          style={[styles.socialProofPercent, { color: themeTextRole.secondary }]}
                        >
                          {pick.percent}%
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}

            {/* Points system — single emerald accent, no rainbow */}
            <View
              style={[
                styles.pointsCard,
                { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
              ]}
            >
              <View style={styles.pointsTitleRow}>
                <Ionicons name="trophy-outline" size={15} color={themeAccent.primary} />
                <Text style={[styles.pointsTitle, { color: themeTextRole.primary }]}>
                  {t.match.pointsSystem}
                </Text>
              </View>
              {[
                { icon: "star", text: t.match.exactScore, pts: "10" },
                { icon: "checkmark-done", text: t.match.resultGoalDiff, pts: "8" },
                { icon: "checkmark", text: t.match.resultOnly, pts: "5" },
                { icon: "trending-up", text: t.match.goalDiffOnly, pts: "3" },
              ].map((item, i) => (
                <View key={i} style={styles.pointsRow}>
                  <View style={styles.pointsIconWrap}>
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={13}
                      color={themeAccent.primary}
                    />
                  </View>
                  <Text style={[styles.pointsText, { color: themeTextRole.secondary }]}>
                    {item.text}
                  </Text>
                  <Text style={styles.pointsPts}>+{item.pts}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── EVENTS ── */}
        {activeSection === "events" && (
          <View style={styles.predictionSection}>
            {!fixtureEvents || fixtureEvents.length === 0 ? (
              <View
                style={[
                  styles.lockedCard,
                  { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                ]}
              >
                <View style={[styles.lockedIconWrap, { backgroundColor: themeSurface[2] }]}>
                  <Ionicons name="list-outline" size={22} color={themeTextRole.tertiary} />
                </View>
                <Text style={[styles.lockedTitle, { color: themeTextRole.primary }]}>
                  {t.match.noEventsYet}
                </Text>
                <Text style={[styles.lockedText, { color: themeTextRole.secondary }]}>
                  {match.status === "upcoming"
                    ? t.match.eventsComingSoon
                    : t.match.eventsSyncedAfter}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  eventsStyles.container,
                  { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                ]}
              >
                {fixtureEvents.map((ev: any, i: number) => {
                  const isHome =
                    ev.team.id === match.homeTeam.id || String(ev.team.id) === match.homeTeam.id;
                  const iconName: keyof typeof Ionicons.glyphMap =
                    ev.type === "Goal"
                      ? "football"
                      : ev.detail?.includes("Yellow")
                        ? "square"
                        : ev.detail?.includes("Red")
                          ? "square-sharp"
                          : ev.type === "subst"
                            ? "swap-horizontal"
                            : "flash";
                  const iconColor =
                    ev.type === "Goal"
                      ? themeAccent.primary
                      : ev.detail?.includes("Yellow")
                        ? themeAccent.reward
                        : ev.detail?.includes("Red")
                          ? themeAccent.alert
                          : ev.type === "subst"
                            ? themeTextRole.secondary
                            : themeTextRole.secondary;

                  return (
                    <View
                      key={i}
                      style={[
                        eventsStyles.row,
                        { borderBottomColor: themeBorder.subtle },
                        i === fixtureEvents.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={eventsStyles.side}>
                        {isHome && (
                          <View style={eventsStyles.eventContent}>
                            <Text
                              style={[eventsStyles.playerName, { color: themeTextRole.primary }]}
                              numberOfLines={1}
                            >
                              {ev.player?.name ?? ""}
                            </Text>
                            {ev.assist?.name && (
                              <Text
                                style={[eventsStyles.assistName, { color: themeTextRole.tertiary }]}
                              >
                                + {ev.assist.name}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>

                      <View style={eventsStyles.center}>
                        <Text style={[eventsStyles.time, { color: themeTextRole.tertiary }]}>
                          {ev.elapsed}
                          {ev.extraTime ? `+${ev.extraTime}` : ""}&apos;
                        </Text>
                        <Ionicons name={iconName} size={16} color={iconColor} />
                      </View>

                      <View style={[eventsStyles.side, eventsStyles.sideAway]}>
                        {!isHome && (
                          <View style={[eventsStyles.eventContent, eventsStyles.eventContentAway]}>
                            <Text
                              style={[eventsStyles.playerName, { color: themeTextRole.primary }]}
                              numberOfLines={1}
                            >
                              {ev.player?.name ?? ""}
                            </Text>
                            {ev.assist?.name && (
                              <Text
                                style={[eventsStyles.assistName, { color: themeTextRole.tertiary }]}
                              >
                                + {ev.assist.name}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── LINEUPS ── */}
        {activeSection === "lineups" && (
          <View style={styles.predictionSection}>
            {!fixtureLineups || fixtureLineups.length === 0 ? (
              <View
                style={[
                  styles.lockedCard,
                  { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                ]}
              >
                <View style={[styles.lockedIconWrap, { backgroundColor: themeSurface[2] }]}>
                  <Ionicons name="people-outline" size={22} color={themeTextRole.tertiary} />
                </View>
                <Text style={[styles.lockedTitle, { color: themeTextRole.primary }]}>
                  {t.match.noLineupsYet}
                </Text>
                <Text style={[styles.lockedText, { color: themeTextRole.secondary }]}>
                  {match.status === "upcoming"
                    ? t.match.lineupsComingSoon
                    : t.match.lineupsSyncedAfter}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {fixtureLineups.map((teamData: any, ti: number) => (
                  <View
                    key={ti}
                    style={[
                      lineupsStyles.teamCard,
                      { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                    ]}
                  >
                    <View style={lineupsStyles.teamHeader}>
                      {teamData.team?.logo ? (
                        <TeamLogo
                          logo={teamData.team.logo}
                          name={teamData.team.name}
                          shortName={teamData.team.name?.substring(0, 3)}
                          color={teamData.team.color}
                          size={28}
                        />
                      ) : null}
                      <Text style={[lineupsStyles.teamName, { color: themeTextRole.primary }]}>
                        {teamData.team?.name}
                      </Text>
                      <View
                        style={[lineupsStyles.formationBadge, { backgroundColor: themeSurface[2] }]}
                      >
                        <Text
                          style={[lineupsStyles.formationText, { color: themeTextRole.secondary }]}
                        >
                          {teamData.formation}
                        </Text>
                      </View>
                    </View>

                    <Text style={[lineupsStyles.subheader, { color: themeTextRole.tertiary }]}>
                      Starting XI
                    </Text>
                    {(teamData.startXI ?? []).map((p: any, i: number) => (
                      <View
                        key={i}
                        style={[
                          lineupsStyles.playerRow,
                          { borderBottomColor: themeBorder.subtle },
                          i === (teamData.startXI ?? []).length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View
                          style={[lineupsStyles.numBadge, { backgroundColor: themeSurface[2] }]}
                        >
                          <Text style={[lineupsStyles.numText, { color: themeTextRole.primary }]}>
                            {p.number ?? "–"}
                          </Text>
                        </View>
                        <Text
                          style={[lineupsStyles.playerName, { color: themeTextRole.primary }]}
                          numberOfLines={1}
                        >
                          {p.name}
                        </Text>
                        <Text style={[lineupsStyles.pos, { color: themeTextRole.tertiary }]}>
                          {p.pos}
                        </Text>
                      </View>
                    ))}

                    {(teamData.subs ?? []).length > 0 && (
                      <>
                        <Text
                          style={[
                            lineupsStyles.subheader,
                            { marginTop: 12, color: themeTextRole.tertiary },
                          ]}
                        >
                          Substitutes
                        </Text>
                        {(teamData.subs ?? []).map((p: any, i: number) => (
                          <View
                            key={i}
                            style={[
                              lineupsStyles.playerRow,
                              lineupsStyles.subRow,
                              { borderBottomColor: themeBorder.subtle },
                              i === (teamData.subs ?? []).length - 1 && { borderBottomWidth: 0 },
                            ]}
                          >
                            <View
                              style={[lineupsStyles.numBadge, { backgroundColor: themeSurface[2] }]}
                            >
                              <Text
                                style={[
                                  lineupsStyles.numTextMuted,
                                  { color: themeTextRole.secondary },
                                ]}
                              >
                                {p.number ?? "–"}
                              </Text>
                            </View>
                            <Text
                              style={[
                                lineupsStyles.playerNameMuted,
                                { color: themeTextRole.secondary },
                              ]}
                              numberOfLines={1}
                            >
                              {p.name}
                            </Text>
                            <Text style={[lineupsStyles.pos, { color: themeTextRole.tertiary }]}>
                              {p.pos}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── H2H ── */}
        {activeSection === "h2h" && (
          <View style={styles.h2hSection}>
            <Text style={[styles.sectionTitle, { color: themeTextRole.primary }]}>
              Head to head
            </Text>

            {h2hMatches.length === 0 && total === 0 ? (
              <View
                style={[
                  styles.lockedCard,
                  { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                ]}
              >
                <View style={[styles.lockedIconWrap, { backgroundColor: themeSurface[2] }]}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={22}
                    color={themeTextRole.tertiary}
                  />
                </View>
                <Text style={[styles.lockedTitle, { color: themeTextRole.primary }]}>
                  No previous meetings
                </Text>
                <Text style={[styles.lockedText, { color: themeTextRole.secondary }]}>
                  These teams haven&apos;t played each other recently.
                </Text>
              </View>
            ) : null}

            {(h2hMatches.length > 0 || total > 0) && (
              <>
                <View
                  style={[
                    h2hStyles.summaryCard,
                    { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                  ]}
                >
                  <View style={h2hStyles.summaryTeam}>
                    <TeamLogo
                      logo={match.homeTeam.logo}
                      name={match.homeTeam.name}
                      shortName={match.homeTeam.shortName}
                      color={match.homeTeam.color}
                      size={40}
                    />
                    <Text style={[h2hStyles.summaryCount, { color: themeTextRole.primary }]}>
                      {h2hSummary.homeWins}
                    </Text>
                    <Text style={[h2hStyles.summaryLabel, { color: themeTextRole.tertiary }]}>
                      Wins
                    </Text>
                  </View>
                  <View style={h2hStyles.summaryMiddle}>
                    <View style={[h2hStyles.drawCircle, { backgroundColor: themeSurface[2] }]}>
                      <Text style={[h2hStyles.summaryDrawCount, { color: themeTextRole.primary }]}>
                        {h2hSummary.draws}
                      </Text>
                    </View>
                    <Text style={[h2hStyles.summaryDrawLabel, { color: themeTextRole.tertiary }]}>
                      Draws
                    </Text>
                  </View>
                  <View style={h2hStyles.summaryTeam}>
                    <TeamLogo
                      logo={match.awayTeam.logo}
                      name={match.awayTeam.name}
                      shortName={match.awayTeam.shortName}
                      color={match.awayTeam.color}
                      size={40}
                    />
                    <Text style={[h2hStyles.summaryCount, { color: themeTextRole.primary }]}>
                      {h2hSummary.awayWins}
                    </Text>
                    <Text style={[h2hStyles.summaryLabel, { color: themeTextRole.tertiary }]}>
                      Wins
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    h2hStyles.gaugeContainer,
                    { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                  ]}
                >
                  <View style={h2hStyles.gaugeLabels}>
                    <Text style={[h2hStyles.gaugePercent, { color: themeTextRole.primary }]}>
                      {homePercent}%
                    </Text>
                    <Text style={[h2hStyles.gaugePercent, { color: themeTextRole.tertiary }]}>
                      {drawPercent}%
                    </Text>
                    <Text style={[h2hStyles.gaugePercent, { color: themeTextRole.primary }]}>
                      {awayPercent}%
                    </Text>
                  </View>
                  <View style={[h2hStyles.gaugeTrack, { backgroundColor: themeSurface[2] }]}>
                    <View
                      style={[
                        h2hStyles.gaugeSegment,
                        {
                          flex: h2hSummary.homeWins,
                          backgroundColor: accent.primary,
                          borderTopLeftRadius: 10,
                          borderBottomLeftRadius: 10,
                        },
                      ]}
                    />
                    <View
                      style={[
                        h2hStyles.gaugeSegment,
                        { flex: h2hSummary.draws, backgroundColor: themeSurface[2] },
                      ]}
                    />
                    <View
                      style={[
                        h2hStyles.gaugeSegment,
                        {
                          flex: h2hSummary.awayWins,
                          backgroundColor: themeTextRole.primary,
                          borderTopRightRadius: 10,
                          borderBottomRightRadius: 10,
                        },
                      ]}
                    />
                  </View>
                  <View style={h2hStyles.gaugeLegend}>
                    <View style={h2hStyles.legendItem}>
                      <View
                        style={[h2hStyles.legendDot, { backgroundColor: themeAccent.primary }]}
                      />
                      <Text style={[h2hStyles.legendText, { color: themeTextRole.secondary }]}>
                        {match.homeTeam.shortName}
                      </Text>
                    </View>
                    <View style={h2hStyles.legendItem}>
                      <View style={[h2hStyles.legendDot, { backgroundColor: themeSurface[2] }]} />
                      <Text style={[h2hStyles.legendText, { color: themeTextRole.secondary }]}>
                        Draw
                      </Text>
                    </View>
                    <View style={h2hStyles.legendItem}>
                      <View
                        style={[h2hStyles.legendDot, { backgroundColor: themeTextRole.primary }]}
                      />
                      <Text style={[h2hStyles.legendText, { color: themeTextRole.secondary }]}>
                        {match.awayTeam.shortName}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={h2hStyles.recentTitle}>Recent meetings</Text>
                {h2hMatches.map((m, i) => (
                  <H2HMatchRow key={i} match={m} index={i} />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── DETAILS ── */}
        {activeSection === "details" && (
          <View style={styles.detailsSection}>
            <Text style={[styles.sectionTitle, { color: themeTextRole.primary }]}>
              Match details
            </Text>

            <View
              style={[
                detailStyles.card,
                { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
              ]}
            >
              {[
                { icon: "location-outline", label: t.match.venue, value: match.venue || "TBD" },
                { icon: "person-outline", label: t.match.referee, value: match.referee || "TBD" },
                { icon: "calendar-outline", label: t.match.date, value: dateStr },
                { icon: "time-outline", label: t.match.kickoff, value: timeStr },
                { icon: "trophy-outline", label: t.match.competition, value: match.league.name },
              ].map((item, i, arr) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <View style={[detailStyles.divider, { backgroundColor: themeBorder.subtle }]} />
                  )}
                  <View style={detailStyles.row}>
                    <View style={detailStyles.iconWrap}>
                      <Ionicons
                        name={item.icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={themeAccent.primary}
                      />
                    </View>
                    <View style={detailStyles.textCol}>
                      <Text style={[detailStyles.label, { color: themeTextRole.tertiary }]}>
                        {item.label}
                      </Text>
                      <Text style={[detailStyles.value, { color: themeTextRole.primary }]}>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* ── STATS ── */}
        {activeSection === "stats" && (
          <View style={styles.predictionSection}>
            {!fixtureStats || fixtureStats.length === 0 ? (
              <View
                style={[
                  styles.lockedCard,
                  { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                ]}
              >
                <View style={[styles.lockedIconWrap, { backgroundColor: themeSurface[2] }]}>
                  <Ionicons name="stats-chart-outline" size={22} color={themeTextRole.tertiary} />
                </View>
                <Text style={[styles.lockedTitle, { color: themeTextRole.primary }]}>
                  {t.match.noStatsYet}
                </Text>
                <Text style={[styles.lockedText, { color: themeTextRole.secondary }]}>
                  {match.status === "upcoming" ? t.match.statsComingSoon : t.match.statsSyncedAfter}
                </Text>
              </View>
            ) : (
              (() => {
                const home =
                  fixtureStats.find(
                    (t: any) =>
                      t.team.id === match.homeTeam.id || String(t.team.id) === match.homeTeam.id,
                  ) ?? fixtureStats[0];
                const away =
                  fixtureStats.find((t: any) => t.team.id !== home?.team?.id) ?? fixtureStats[1];
                if (!home || !away) return null;

                const statRows: {
                  label: string;
                  homeVal: number | null;
                  awayVal: number | null;
                  isPct?: boolean;
                }[] = [
                  {
                    label: t.match.possession,
                    homeVal: home.statistics.possession,
                    awayVal: away.statistics.possession,
                    isPct: true,
                  },
                  {
                    label: t.match.shotsOnGoal,
                    homeVal: home.statistics.shotsOnGoal,
                    awayVal: away.statistics.shotsOnGoal,
                  },
                  {
                    label: t.match.totalShots,
                    homeVal: home.statistics.shotsTotal,
                    awayVal: away.statistics.shotsTotal,
                  },
                  {
                    label: t.match.shotsInsideBox,
                    homeVal: home.statistics.shotsInsideBox,
                    awayVal: away.statistics.shotsInsideBox,
                  },
                  {
                    label: t.match.cornerKicks,
                    homeVal: home.statistics.cornerKicks,
                    awayVal: away.statistics.cornerKicks,
                  },
                  {
                    label: t.match.offsides,
                    homeVal: home.statistics.offsides,
                    awayVal: away.statistics.offsides,
                  },
                  {
                    label: t.match.fouls,
                    homeVal: home.statistics.fouls,
                    awayVal: away.statistics.fouls,
                  },
                  {
                    label: t.match.yellowCards,
                    homeVal: home.statistics.yellowCards,
                    awayVal: away.statistics.yellowCards,
                  },
                  {
                    label: t.match.redCards,
                    homeVal: home.statistics.redCards,
                    awayVal: away.statistics.redCards,
                  },
                  {
                    label: t.match.gkSaves,
                    homeVal: home.statistics.saves,
                    awayVal: away.statistics.saves,
                  },
                  {
                    label: t.match.totalPasses,
                    homeVal: home.statistics.totalPasses,
                    awayVal: away.statistics.totalPasses,
                  },
                  {
                    label: t.match.accuratePasses,
                    homeVal: home.statistics.accuratePasses,
                    awayVal: away.statistics.accuratePasses,
                  },
                ].filter((r) => r.homeVal != null || r.awayVal != null);

                return (
                  <View
                    style={[
                      matchStatsStyles.container,
                      { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                    ]}
                  >
                    <View
                      style={[
                        matchStatsStyles.headerRow,
                        { borderBottomColor: themeBorder.subtle },
                      ]}
                    >
                      <View style={matchStatsStyles.teamHeaderSide}>
                        <TeamLogo
                          logo={match.homeTeam.logo}
                          name={match.homeTeam.name}
                          shortName={match.homeTeam.shortName}
                          color={match.homeTeam.color}
                          size={24}
                        />
                        <Text
                          style={[
                            matchStatsStyles.teamHeaderName,
                            { color: themeTextRole.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {match.homeTeam.shortName}
                        </Text>
                      </View>
                      <Text
                        style={[matchStatsStyles.headerLabel, { color: themeTextRole.secondary }]}
                      >
                        Stats
                      </Text>
                      <View
                        style={[matchStatsStyles.teamHeaderSide, matchStatsStyles.teamHeaderRight]}
                      >
                        <Text
                          style={[
                            matchStatsStyles.teamHeaderName,
                            { color: themeTextRole.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {match.awayTeam.shortName}
                        </Text>
                        <TeamLogo
                          logo={match.awayTeam.logo}
                          name={match.awayTeam.name}
                          shortName={match.awayTeam.shortName}
                          color={match.awayTeam.color}
                          size={24}
                        />
                      </View>
                    </View>

                    {statRows.map((row, i) => {
                      const hv = row.homeVal ?? 0;
                      const av = row.awayVal ?? 0;
                      const tot = hv + av;
                      const hPct = tot > 0 ? hv / tot : 0.5;
                      const homeWins = hv > av;
                      const awayWins = av > hv;

                      return (
                        <View
                          key={i}
                          style={[
                            matchStatsStyles.statRow,
                            { borderBottomColor: themeBorder.subtle },
                          ]}
                        >
                          <Text
                            style={[
                              matchStatsStyles.statVal,
                              { color: themeTextRole.secondary },
                              homeWins && matchStatsStyles.statValWin,
                            ]}
                          >
                            {row.isPct ? `${hv}%` : hv}
                          </Text>
                          <View style={matchStatsStyles.barWrap}>
                            <Text
                              style={[
                                matchStatsStyles.statLabel,
                                { color: themeTextRole.secondary },
                              ]}
                            >
                              {row.label}
                            </Text>
                            <View
                              style={[
                                matchStatsStyles.barTrack,
                                { backgroundColor: themeSurface[2] },
                              ]}
                            >
                              <View
                                style={[
                                  matchStatsStyles.barHome,
                                  {
                                    flex: hPct,
                                    backgroundColor: homeWins
                                      ? themeAccent.primary
                                      : themeTextRole.tertiary,
                                  },
                                ]}
                              />
                              <View
                                style={[
                                  matchStatsStyles.barAway,
                                  {
                                    flex: 1 - hPct,
                                    backgroundColor: awayWins
                                      ? themeAccent.primary
                                      : themeTextRole.tertiary,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                          <Text
                            style={[
                              matchStatsStyles.statVal,
                              matchStatsStyles.statValRight,
                              awayWins && matchStatsStyles.statValWin,
                            ]}
                          >
                            {row.isPct ? `${av}%` : av}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Sticky prediction section (only when not submitted or in prediction section) ── */}
      {!submitted && activeSection === "prediction" && !matchStarted && (
        <View
          style={[
            styles.stickyPredictionBar,
            {
              backgroundColor: themeSurface[0],
              borderTopColor: themeBorder.subtle,
            },
          ]}
        >
          {showShareButton && (
            <PressableScale
              onPress={() => {
                haptics.light();
                // Share flow wired but deferred to expo-sharing when installed
                // Text summary: I predicted {homeTeam} {homeScore} – {awayScore} {awayTeam} in {league}!
                console.log("Share prediction:", {
                  homeTeam: match.homeTeam.shortName,
                  homeScore,
                  awayScore,
                  awayTeam: match.awayTeam.shortName,
                  league: match.league.name,
                });
              }}
              style={styles.shareLinkButton}
              haptic="light"
            >
              <Ionicons name="share-social-outline" size={16} color={themeAccent.primary} />
              <Text style={styles.shareLinkText}>Share</Text>
            </PressableScale>
          )}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },

  // Top nav
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  backBtnText: {
    ...typeTok.caption,
    fontFamily: "Inter_600SemiBold",
  },
  leaguePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
  },
  leaguePillText: {
    ...typeTok.caption,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 200,
  },

  backLink: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  backLinkText: {
    ...typeTok.body,
    fontFamily: "Inter_600SemiBold",
    color: accent.primary,
  },

  // Hero
  heroWrap: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  heroCardFlat: {
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 14,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTeamSide: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  heroLogoWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogoWrapLive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroTeamName: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    maxWidth: 110,
  },
  heroTeamNameLive: { color: "#fff" },
  heroCenter: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 100,
  },
  heroScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroScore: {
    ...typeTok.display,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    lineHeight: 40,
  },
  heroScoreLive: { color: "#fff" },
  heroScoreSep: {
    ...typeTok.h2,
    fontFamily: "Inter_400Regular",
  },
  heroScoreSepLive: { color: "rgba(255,255,255,0.6)" },
  heroTimeBig: {
    ...typeTok.h2,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  heroCountdownChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
  },
  heroCountdownText: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    color: accent.primary,
    letterSpacing: 0.2,
  },
  heroFtChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroFtChipText: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.6,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  heroMetaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroMetaText: {
    ...typeTok.caption,
    fontFamily: "Inter_500Medium",
  },
  heroMetaTextLive: { color: "rgba(255,255,255,0.80)" },
  heroMetaStrong: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },
  heroMetaStrongLive: { color: "#fff" },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  heroMetaDotLive: { backgroundColor: "rgba(255,255,255,0.5)" },

  // Segmented
  segmentedWrap: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // Section container
  predictionSection: { gap: 16, paddingHorizontal: 16 },
  receiptSection: { gap: 16, paddingHorizontal: 16, marginVertical: 16, alignItems: "center" },
  h2hSection: { gap: 12, paddingHorizontal: 16 },
  detailsSection: { paddingHorizontal: 16, paddingTop: 4 },

  sectionTitle: {
    ...typeTok.h3,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    marginBottom: 8,
  },

  // Prediction card
  predictCardClean: {
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 22,
    gap: 20,
  },
  predictHeaderClean: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  predictLabelClean: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  predictCountdownChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
  },
  predictCountdownText: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    color: accent.primary,
    letterSpacing: 0.3,
  },
  predictScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 8,
  },
  predictTeamCol: {
    flex: 1,
    alignItems: "center",
    gap: 10,
  },
  predictTeamLabel: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  predictBigScore: {
    ...typeTok.display,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 60,
  },
  predictStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  predictStepMinus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  predictStepPlus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  predictDash: {
    ...typeTok.h1,
    fontFamily: "Inter_400Regular",
    paddingBottom: 40,
  },
  predictOutcomeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
  },
  predictOutcomeChipText: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },
  predictOutcomeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0, 166, 81, 0.35)",
  },
  predictOutcomeHint: {
    ...typeTok.micro,
    fontFamily: "Inter_600SemiBold",
    opacity: 0.85,
  },
  submittedFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  changeLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  changeLinkText: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },

  // Boost toggle
  boostToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  boostToggleActive: {
    borderColor: accent.reward,
    backgroundColor: "rgba(245, 166, 35, 0.06)",
  },
  boostIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(245, 166, 35, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  boostIconWrapActive: {
    backgroundColor: accent.reward,
  },
  boostText: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },
  boostTextActive: {},
  boostSub: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  boostSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  boostSwitchActive: { backgroundColor: accent.reward },
  boostSwitchDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  boostSwitchDotActive: { transform: [{ translateX: 18 }] },

  // Social proof
  socialProofCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
  },
  socialProofHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  socialProofTitle: {
    flex: 1,
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },
  socialProofCount: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
  },
  socialProofPicks: { gap: 8 },
  socialProofRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialProofScore: {
    width: 44,
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },
  socialProofBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  socialProofBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: accent.primary,
  },
  socialProofPercent: {
    width: 38,
    ...typeTok.caption,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },

  // Points card
  pointsCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  pointsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  pointsTitle: {
    ...typeTok.body,
    fontFamily: "Inter_700Bold",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  pointsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  pointsText: {
    flex: 1,
    ...typeTok.caption,
    fontFamily: "Inter_500Medium",
  },
  pointsPts: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
    color: accent.primary,
  },

  // Locked / empty
  lockedCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  lockedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  lockedTitle: {
    ...typeTok.body,
    fontFamily: "Inter_700Bold",
  },
  lockedText: {
    ...typeTok.caption,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },

  // Sticky prediction bar (bottom)
  stickyPredictionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  shareLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  shareLinkText: {
    ...typeTok.caption,
    fontFamily: "Inter_600SemiBold",
    color: accent.primary,
  },
});

const h2hStyles = StyleSheet.create({
  row: {
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  date: {
    ...typeTok.micro,
    fontFamily: "Inter_600SemiBold",
  },
  comp: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
    maxWidth: 140,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamText: {
    flex: 1,
    ...typeTok.caption,
    fontFamily: "Inter_500Medium",
  },
  teamTextAway: { textAlign: "right" },
  winnerText: {
    fontFamily: "Inter_700Bold",
  },
  scorePills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scorePill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scorePillText: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },
  scoreDash: {
    ...typeTok.caption,
    fontFamily: "Inter_400Regular",
  },
  summaryCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryTeam: { alignItems: "center", gap: 6 },
  summaryCount: {
    ...typeTok.h2,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
  },
  summaryLabel: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  summaryMiddle: { alignItems: "center", gap: 6 },
  drawCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryDrawCount: {
    ...typeTok.body,
    fontFamily: "Inter_700Bold",
  },
  summaryDrawLabel: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  gaugeContainer: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
  },
  gaugeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  gaugePercent: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },
  gaugeTrack: {
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    overflow: "hidden",
  },
  gaugeSegment: { height: 10 },
  gaugeLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
  },
  recentTitle: {
    ...typeTok.body,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
    marginBottom: 10,
  },
});

const detailStyles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1 },
  label: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    ...typeTok.body,
    fontFamily: "Inter_600SemiBold",
  },
});

const matchStatsStyles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  teamHeaderSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamHeaderRight: { justifyContent: "flex-end" },
  teamHeaderName: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
  },
  headerLabel: {
    width: 48,
    textAlign: "center",
    ...typeTok.micro,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statVal: {
    width: 42,
    ...typeTok.caption,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  statValWin: {
    fontFamily: "Inter_700Bold",
  },
  statValRight: { textAlign: "center" },
  barWrap: { flex: 1, alignItems: "center", gap: 4 },
  statLabel: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  barTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  barHome: { height: 4 },
  barAway: { height: 4 },
});

const eventsStyles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { flex: 1 },
  sideAway: { alignItems: "flex-end" },
  center: {
    width: 64,
    alignItems: "center",
    gap: 4,
  },
  time: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  eventContent: { gap: 2 },
  eventContentAway: { alignItems: "flex-end" },
  playerName: {
    ...typeTok.caption,
    fontFamily: "Inter_600SemiBold",
  },
  assistName: {
    ...typeTok.micro,
    fontFamily: "Inter_400Regular",
  },
});

const lineupsStyles = StyleSheet.create({
  teamCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  teamName: {
    flex: 1,
    ...typeTok.body,
    fontFamily: "Inter_700Bold",
  },
  formationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formationText: {
    ...typeTok.caption,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  subheader: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subRow: { opacity: 0.72 },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
  },
  numTextMuted: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
  },
  playerName: {
    flex: 1,
    ...typeTok.caption,
    fontFamily: "Inter_500Medium",
  },
  playerNameMuted: {
    flex: 1,
    ...typeTok.caption,
    fontFamily: "Inter_400Regular",
  },
  pos: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    width: 28,
    textAlign: "center",
    letterSpacing: 0.4,
  },
});
