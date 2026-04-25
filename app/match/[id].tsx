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
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Share } from "react-native";
import { crossAlert } from "@/lib/cross-alert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  FadeOut,
} from "react-native-reanimated";

import Colors, { accent, radii, type as typeTok, textRoleLight } from "@/constants/colors";
import {
  GradientHero,
  PressableScale,
  TeamLogo,
  LiveBadge,
  FilterSegmented,
  Button,
  EmptyState,
  SyncIndicator,
  useCelebration,
  HelpTip,
} from "@/components/ui";
import PitchDiagram from "@/components/ui/PitchDiagram";
import { PredictionReceiptCard } from "@/components/ui/share/PredictionReceiptCard";
import { PredictionDisplayCard } from "@/components/ui/PredictionDisplayCard";
import { haptics } from "@/lib/motion";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { formatLocalTime, formatLocalDate, formatCountdown, getTimeUntil } from "@/lib/datetime";
import { getPredictionDraft, savePredictionDraft, clearPredictionDraft } from "@/lib/storage";
import { useFilterPersistence } from "@/lib/hooks/useFilterPersistence";
import {
  useFixtureEvents,
  useFixtureLineups,
  useFixtureMatchStats,
  useFixtureH2H,
  useTeamStats,
  useCommunityPicks,
  useFootballTopScorers,
  useFixtureById,
} from "@/lib/football-api";
import PlayerProfileSheet, { type PlayerProfileData } from "@/components/PlayerProfileSheet";

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
                homeWin && { color: textRoleLight.inverse },
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
                awayWin && { color: textRoleLight.inverse },
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

  // Long-press acceleration refs for score stepper
  const homePlusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const homeMinusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const awayPlusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const awayMinusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const LONG_PRESS_INTERVAL = 140;

  // Feature A: Community picks histogram
  const [communityPicksExpanded, setCommunityPicksExpanded] = useFilterPersistence<boolean>(
    `match.${id}.communityPicks.expanded`,
    true,
    [true, false],
  );

  // Feature B: Post-lock-in share CTA
  const [showShareCTA, setShowShareCTA] = useState(false);
  const [predictionLockedAt, setPredictionLockedAt] = useState<number | null>(null);
  const dismissedShareCTARef = useRef(false);
  const shareCtaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shareCtaFadeAnim = useSharedValue(1);

  const match = useMemo(() => matches.find((m) => m.id === id), [matches, id]);
  const existingPrediction = predictions[id || ""];

  const [homeScore, setHomeScore] = useState(existingPrediction?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(existingPrediction?.awayScore ?? 0);
  const [submitted, setSubmitted] = useState(!!existingPrediction);
  // `isEditing` is a temporary override that flips the locked card back to
  // the score selector. Needed because `existingPrediction` comes from
  // AppContext and can't be flipped by the child; toggling `submitted` alone
  // isn't enough to override the display card in the render branch below.
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("prediction");
  const [kickoffCountdown, setKickoffCountdown] = useState("");
  const [pointsExpanded, setPointsExpanded] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileData | null>(null);

  const { data: socialProof } = useCommunityPicks(id);
  const { data: fixtureEvents } = useFixtureEvents(id);
  const { data: fixtureLineups } = useFixtureLineups(id);
  const { data: fixtureStats } = useFixtureMatchStats(id);
  const { data: _homeTeamStats } = useTeamStats(match?.homeTeam?.id);
  const { data: _awayTeamStats } = useTeamStats(match?.awayTeam?.id);
  const { data: h2hData } = useFixtureH2H(match?.homeTeam?.id, match?.awayTeam?.id);
  const { data: topScorers } = useFootballTopScorers(match?.league?.id || "");

  // Get fetch metadata for SyncIndicator (isFetching, dataUpdatedAt)
  const { isFetching: matchIsFetching, dataUpdatedAt: matchDataUpdatedAt } = useFixtureById(id);

  const h2hMatches = useMemo(() => h2hData ?? [], [h2hData]);

  const h2hSummary = useMemo(() => {
    if (!match || h2hMatches.length === 0)
      return { homeWins: 0, draws: 0, awayWins: 0, avgGoals: 0 };
    let homeWins = 0,
      draws = 0,
      awayWins = 0,
      totalGoals = 0;
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
      totalGoals += m.homeScore + m.awayScore;
    });
    const avgGoals =
      h2hMatches.length > 0 ? Math.round((totalGoals / h2hMatches.length) * 10) / 10 : 0;
    return { homeWins, draws, awayWins, avgGoals };
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

  const handlePlayerPress = useMemo(
    () => (playerId: number | string) => {
      // Find the player from the lineups data
      if (!fixtureLineups) return;

      let playerData = null;
      for (const teamLineup of fixtureLineups) {
        const allPlayers = [...(teamLineup.startXI || []), ...(teamLineup.subs || [])];
        const foundPlayer = allPlayers.find((p: any) => p.id === playerId);
        if (foundPlayer) {
          playerData = foundPlayer;
          break;
        }
      }

      if (!playerData) return;

      // Look up season stats from top scorers if available
      let seasonStats: PlayerProfileData["seasonStats"] | undefined;
      if (topScorers && Array.isArray(topScorers)) {
        const scorerEntry = topScorers.find(
          (s: any) => s.playerName?.toLowerCase() === playerData.name?.toLowerCase(),
        );
        if (scorerEntry) {
          seasonStats = {
            goals: scorerEntry.goals,
            assists: scorerEntry.assists,
            matches: scorerEntry.matches,
          };
        }
      }

      // Find the team from lineups
      let playerTeam = null;
      for (const teamLineup of fixtureLineups) {
        const allPlayers = [...(teamLineup.startXI || []), ...(teamLineup.subs || [])];
        if (allPlayers.some((p: any) => p.id === playerId)) {
          playerTeam = teamLineup.team;
          break;
        }
      }

      setSelectedPlayer({
        playerId,
        playerName: playerData.name,
        playerNumber: playerData.number,
        playerPos: playerData.pos,
        team: playerTeam,
        seasonStats,
      });
    },
    [fixtureLineups, topScorers],
  );

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

  // Cleanup long-press intervals on unmount
  useEffect(() => {
    return () => {
      if (homePlusIntervalRef.current) clearInterval(homePlusIntervalRef.current);
      if (homeMinusIntervalRef.current) clearInterval(homeMinusIntervalRef.current);
      if (awayPlusIntervalRef.current) clearInterval(awayPlusIntervalRef.current);
      if (awayMinusIntervalRef.current) clearInterval(awayMinusIntervalRef.current);
    };
  }, []);

  // Restore draft on mount if no finalized prediction exists
  useEffect(() => {
    if (!id || existingPrediction) return;
    (async () => {
      const draft = await getPredictionDraft(id);
      if (draft) {
        setHomeScore(draft.home);
        setAwayScore(draft.away);
      }
    })();
  }, [id, existingPrediction]);

  // Debounced draft-save on score changes (300ms)
  useEffect(() => {
    if (!id || submitted) return;
    const timer = setTimeout(() => {
      savePredictionDraft(id, homeScore, awayScore);
    }, 300);
    return () => clearTimeout(timer);
  }, [id, homeScore, awayScore, submitted]);

  // Cleanup share CTA timer on unmount
  useEffect(() => {
    return () => {
      if (shareCtaTimerRef.current) clearTimeout(shareCtaTimerRef.current);
    };
  }, []);

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
      crossAlert(t.match.predictionsLocked, t.match.matchStarted);
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
      await clearPredictionDraft(match.id);
      setSubmitted(true);
      setIsEditing(false); // exit edit mode once the new prediction is saved
      setShowShareButton(true);

      // Feature B: Show share CTA after lock-in
      const now = Date.now();
      setPredictionLockedAt(now);
      setShowShareCTA(true);
      dismissedShareCTARef.current = false;
      shareCtaFadeAnim.value = 1;

      // Auto-dismiss share CTA after 10 seconds
      if (shareCtaTimerRef.current) clearTimeout(shareCtaTimerRef.current);
      shareCtaTimerRef.current = setTimeout(() => {
        if (!dismissedShareCTARef.current) {
          // Fade out over 300ms then hide
          shareCtaFadeAnim.value = withTiming(0, { duration: 300 }, () => {
            setShowShareCTA(false);
          });
        }
      }, 10000);

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
      crossAlert(t.match.error, t.match.submitError);
    } finally {
      submitInFlight.current = false;
    }
  };

  const handleEdit = () => {
    if (matchStarted) {
      crossAlert(t.match.predictionsLocked, t.match.matchStarted);
      return;
    }
    // Pre-fill the selector with the existing prediction's scores so the
    // user can tweak from their saved pick rather than 0-0.
    if (existingPrediction) {
      setHomeScore(existingPrediction.homeScore);
      setAwayScore(existingPrediction.awayScore);
    }
    setIsEditing(true);
    setSubmitted(false);
  };

  const timeStr = formatLocalTime(match.kickoff);
  const dateStr = formatLocalDate(match.kickoff);

  const sections: { value: SectionKey; label: string | React.ReactNode }[] = [
    { value: "prediction", label: t.match.predict },
    {
      value: "h2h",
      // Use plain string label so the segmented control renders cleanly.
      // The H2H HelpTip now lives on the H2H content section header (see below)
      // where it has room to breathe — a 44px Pressable doesn't fit inside a
      // 34px-tall tab.
      label: t.match.h2h,
    },
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
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {match.homeTeam.name || match.homeTeam.shortName}
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
              <View style={styles.liveBadgeRow}>
                <LiveBadge minute={match.minute} />
                <SyncIndicator isFetching={matchIsFetching} lastUpdated={matchDataUpdatedAt} />
              </View>
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
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {match.awayTeam.name || match.awayTeam.shortName}
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
            <Ionicons
              name="today"
              size={11}
              color={isLive ? textRoleLight.inverse : themeAccent.primary}
            />
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
              color={isLive ? textRoleLight.inverse : themeAccent.primary}
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
            {(existingPrediction || submitted) && !isEditing ? (
              <Animated.View entering={ZoomIn.duration(300)}>
                <PredictionDisplayCard
                  homeTeam={match.homeTeam.name}
                  awayTeam={match.awayTeam.name}
                  homeScore={existingPrediction?.homeScore ?? homeScore}
                  awayScore={existingPrediction?.awayScore ?? awayScore}
                  league={match.league.name}
                  kickoffLabel={`${formatLocalDate(match.kickoff)} · ${formatLocalTime(match.kickoff)}`}
                  matchStatus={match.status as "upcoming" | "live" | "finished"}
                  actualScore={
                    isFinished && match.homeScore !== null && match.awayScore !== null
                      ? { home: match.homeScore, away: match.awayScore }
                      : undefined
                  }
                  onEdit={handleEdit}
                  username={profile?.username}
                />

                {/* Feature B: Post-lock-in share CTA */}
                {showShareCTA &&
                  submitted &&
                  predictionLockedAt &&
                  Date.now() - predictionLockedAt < 20000 &&
                  !isFinished && (
                    <Animated.View
                      entering={FadeInDown.duration(300)}
                      exiting={FadeOut.duration(300)}
                      style={[
                        styles.shareCTACard,
                        { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                      ]}
                    >
                      {/* Header */}
                      <View style={styles.shareCTAHeader}>
                        <Ionicons
                          name="chatbubbles-outline"
                          size={20}
                          color={themeAccent.primary}
                        />
                        <Text style={[styles.shareCTATitle, { color: themeTextRole.primary }]}>
                          Share this pick
                        </Text>
                      </View>

                      {/* Subtitle */}
                      <Text style={[styles.shareCTASubtitle, { color: themeTextRole.secondary }]}>
                        Let your group know you&apos;ve locked in.
                      </Text>

                      {/* CTA Buttons */}
                      <View style={styles.shareCTAButtons}>
                        <PressableScale
                          onPress={async () => {
                            haptics.light();
                            try {
                              await Share.share({
                                message: `I predicted ${match.homeTeam.shortName} ${existingPrediction?.homeScore ?? homeScore} – ${existingPrediction?.awayScore ?? awayScore} ${match.awayTeam.shortName} in ${match.league.name}!`,
                              });
                            } catch (err) {
                              console.error("Share error:", err);
                            }
                          }}
                          style={[styles.shareCTAPrimary, { backgroundColor: themeAccent.primary }]}
                          accessibilityLabel="Share prediction to your group"
                          accessibilityRole="button"
                        >
                          <Text style={styles.shareCTAPrimaryText}>Share →</Text>
                        </PressableScale>

                        <PressableScale
                          onPress={() => {
                            haptics.light();
                            dismissedShareCTARef.current = true;
                            if (shareCtaTimerRef.current) clearTimeout(shareCtaTimerRef.current);
                            shareCtaFadeAnim.value = withTiming(0, { duration: 300 }, () => {
                              setShowShareCTA(false);
                            });
                          }}
                          style={styles.shareCTASecondary}
                          accessibilityLabel="Dismiss share prompt"
                          accessibilityRole="button"
                        >
                          <Text
                            style={[
                              styles.shareCTASecondaryText,
                              { color: themeTextRole.tertiary },
                            ]}
                          >
                            Dismiss
                          </Text>
                        </PressableScale>
                      </View>
                    </Animated.View>
                  )}
              </Animated.View>
            ) : matchStarted ? (
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
            ) : (
              <>
                <View
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
                          onPressIn={() => {
                            if (homeScore <= 0) return;
                            homeMinusIntervalRef.current = setInterval(() => {
                              setHomeScore((s) => Math.max(s - 1, 0));
                            }, LONG_PRESS_INTERVAL);
                          }}
                          onPressOut={() => {
                            if (homeMinusIntervalRef.current) {
                              clearInterval(homeMinusIntervalRef.current);
                              homeMinusIntervalRef.current = null;
                            }
                          }}
                          disabled={homeScore <= 0}
                          style={[
                            styles.predictStepMinus,
                            { backgroundColor: "transparent" },
                            homeScore <= 0 && { opacity: 0.35 },
                          ]}
                          hitSlop={12}
                          haptic="light"
                          accessibilityLabel={`Decrease ${match.homeTeam.shortName} score`}
                          accessibilityRole="button"
                        >
                          <Ionicons name="remove" size={20} color={themeAccent.primary} />
                        </PressableScale>
                        <PressableScale
                          onPress={() => homeScore < 15 && setHomeScore((s) => Math.min(s + 1, 15))}
                          onPressIn={() => {
                            if (homeScore >= 15) return;
                            homePlusIntervalRef.current = setInterval(() => {
                              setHomeScore((s) => Math.min(s + 1, 15));
                            }, LONG_PRESS_INTERVAL);
                          }}
                          onPressOut={() => {
                            if (homePlusIntervalRef.current) {
                              clearInterval(homePlusIntervalRef.current);
                              homePlusIntervalRef.current = null;
                            }
                          }}
                          disabled={homeScore >= 15}
                          style={[styles.predictStepPlus, homeScore >= 15 && { opacity: 0.35 }]}
                          hitSlop={12}
                          haptic="light"
                          accessibilityLabel={`Increase ${match.homeTeam.shortName} score`}
                          accessibilityRole="button"
                        >
                          <Ionicons name="add" size={20} color={textRoleLight.inverse} />
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
                          onPressIn={() => {
                            if (awayScore <= 0) return;
                            awayMinusIntervalRef.current = setInterval(() => {
                              setAwayScore((s) => Math.max(s - 1, 0));
                            }, LONG_PRESS_INTERVAL);
                          }}
                          onPressOut={() => {
                            if (awayMinusIntervalRef.current) {
                              clearInterval(awayMinusIntervalRef.current);
                              awayMinusIntervalRef.current = null;
                            }
                          }}
                          disabled={awayScore <= 0}
                          style={[
                            styles.predictStepMinus,
                            { backgroundColor: "transparent" },
                            awayScore <= 0 && { opacity: 0.35 },
                          ]}
                          hitSlop={12}
                          haptic="light"
                          accessibilityLabel={`Decrease ${match.awayTeam.shortName} score`}
                          accessibilityRole="button"
                        >
                          <Ionicons name="remove" size={20} color={themeAccent.primary} />
                        </PressableScale>
                        <PressableScale
                          onPress={() => awayScore < 15 && setAwayScore((s) => Math.min(s + 1, 15))}
                          onPressIn={() => {
                            if (awayScore >= 15) return;
                            awayPlusIntervalRef.current = setInterval(() => {
                              setAwayScore((s) => Math.min(s + 1, 15));
                            }, LONG_PRESS_INTERVAL);
                          }}
                          onPressOut={() => {
                            if (awayPlusIntervalRef.current) {
                              clearInterval(awayPlusIntervalRef.current);
                              awayPlusIntervalRef.current = null;
                            }
                          }}
                          disabled={awayScore >= 15}
                          style={[styles.predictStepPlus, awayScore >= 15 && { opacity: 0.35 }]}
                          hitSlop={12}
                          haptic="light"
                          accessibilityLabel={`Increase ${match.awayTeam.shortName} score`}
                          accessibilityRole="button"
                        >
                          <Ionicons name="add" size={20} color={textRoleLight.inverse} />
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

                {/* Feature A: Community picks histogram */}
                {socialProof && socialProof.totalPredictions > 0 && !isFinished && !submitted && (
                  <View
                    style={[
                      styles.communityPicksCard,
                      { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                    ]}
                  >
                    {/* Header with expand/collapse */}
                    <Pressable
                      onPress={() => setCommunityPicksExpanded(!communityPicksExpanded)}
                      style={styles.communityPicksHeader}
                      accessibilityRole="button"
                      accessibilityLabel={`Community picks, ${socialProof.totalPredictions} predictions`}
                      accessibilityHint="Double tap to toggle"
                    >
                      <View style={styles.communityPicksHeaderLeft}>
                        <Text
                          style={[styles.communityPicksLabel, { color: themeTextRole.tertiary }]}
                        >
                          COMMUNITY PICKS
                        </Text>
                        <Text
                          style={[
                            styles.communityPicksLabelText,
                            { color: themeTextRole.tertiary },
                          ]}
                        >
                          {" "}
                          ·{" "}
                        </Text>
                        <Text
                          style={[styles.communityPicksCount, { color: themeTextRole.secondary }]}
                        >
                          {socialProof.totalPredictions} predictions
                        </Text>
                      </View>
                      <Ionicons
                        name={communityPicksExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={themeTextRole.tertiary}
                      />
                    </Pressable>

                    {/* Histogram bars (shown when expanded) */}
                    {communityPicksExpanded && (
                      <View style={styles.communityPicksBars}>
                        {socialProof.communityPicks.map(
                          (pick: { score: string; percent: number }, i: number) => {
                            const isTopPick = i === 0;
                            const isUserMatch = `${homeScore}-${awayScore}` === pick.score;

                            return (
                              <PressableScale
                                key={i}
                                onPress={() => {
                                  haptics.light();
                                  const [h, a] = pick.score.split("-").map(Number);
                                  setHomeScore(h);
                                  setAwayScore(a);
                                }}
                                style={[
                                  styles.communityPicksRow,
                                  isUserMatch && styles.communityPicksRowHighlight,
                                ]}
                                accessibilityLabel={`${pick.percent}% of users picked ${pick.score}`}
                                accessibilityHint="Double tap to copy this score"
                                accessibilityRole="button"
                              >
                                <Text
                                  style={[
                                    styles.communityPicksScore,
                                    { color: themeTextRole.primary },
                                  ]}
                                >
                                  {pick.score}
                                </Text>
                                <View style={styles.communityPicksBarContainer}>
                                  <View
                                    style={[
                                      styles.communityPicksBarTrack,
                                      { backgroundColor: themeSurface[2] },
                                    ]}
                                  >
                                    <Animated.View
                                      style={[
                                        styles.communityPicksBarFill,
                                        {
                                          width: `${pick.percent}%`,
                                          backgroundColor: isTopPick
                                            ? "rgba(0, 166, 81, 0.30)"
                                            : "rgba(0, 166, 81, 0.16)",
                                        },
                                      ]}
                                    />
                                  </View>
                                </View>
                                <Text
                                  style={[
                                    styles.communityPicksPercent,
                                    { color: themeTextRole.secondary },
                                  ]}
                                >
                                  {pick.percent}%
                                </Text>
                              </PressableScale>
                            );
                          },
                        )}

                        {/* "Other scores" row if necessary */}
                        {socialProof.communityPicks.reduce(
                          (sum: number, p: any) => sum + p.percent,
                          0,
                        ) < 100 && (
                          <View style={styles.communityPicksRow}>
                            <Text
                              style={[styles.communityPicksScore, { color: themeTextRole.primary }]}
                            >
                              Other scores
                            </Text>
                            <View style={styles.communityPicksBarContainer}>
                              <View
                                style={[
                                  styles.communityPicksBarTrack,
                                  { backgroundColor: themeSurface[2] },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.communityPicksBarFill,
                                    {
                                      width: `${100 - socialProof.communityPicks.reduce((sum: number, p: any) => sum + p.percent, 0)}%`,
                                      backgroundColor: "rgba(0, 166, 81, 0.16)",
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.communityPicksPercent,
                                { color: themeTextRole.secondary },
                              ]}
                            >
                              {100 -
                                socialProof.communityPicks.reduce(
                                  (sum: number, p: any) => sum + p.percent,
                                  0,
                                )}
                              %
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Empty state */}
                    {!communityPicksExpanded && (
                      <Text
                        style={[styles.communityPicksEmpty, { color: themeTextRole.secondary }]}
                      >
                        Be the first to predict this match.
                      </Text>
                    )}
                  </View>
                )}

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
                        color={isBoosted ? textRoleLight.inverse : themeAccent.reward}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text
                          style={[
                            styles.boostText,
                            { color: themeTextRole.primary },
                            isBoosted && styles.boostTextActive,
                          ]}
                        >
                          {isBoosted ? t.match.boostActive : t.match.useBoost}
                        </Text>
                        <HelpTip term="boost" iconSize={12} />
                      </View>
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

            {/* Points system — collapsible */}
            <Pressable
              onPress={() => setPointsExpanded((v) => !v)}
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
                <Ionicons
                  name={pointsExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={themeTextRole.tertiary}
                />
              </View>
              {pointsExpanded &&
                [
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
            </Pressable>
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
                  <Ionicons
                    name={match.status === "upcoming" ? "football-outline" : "list-outline"}
                    size={22}
                    color={themeTextRole.tertiary}
                  />
                </View>
                <Text style={[styles.lockedTitle, { color: themeTextRole.primary }]}>
                  {match.status === "upcoming"
                    ? `Kicks off in ${kickoffCountdown || "soon"}`
                    : t.match.noEventsYet}
                </Text>
                <Text style={[styles.lockedText, { color: themeTextRole.secondary }]}>
                  {match.status === "upcoming"
                    ? "Events will appear once the match starts"
                    : isFinished
                      ? "Events still syncing. Pull to refresh."
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

                  // Enhanced icon mapping for event subtypes
                  let iconName: keyof typeof Ionicons.glyphMap;
                  let iconColor: string;
                  let eventSuffix = "";
                  const isGoal = ev.type === "Goal";

                  if (isGoal) {
                    if (ev.detail?.includes("Penalty")) {
                      iconName = "flag";
                      iconColor = themeAccent.primary;
                      eventSuffix = "(P)";
                    } else if (ev.detail?.includes("Own Goal")) {
                      iconName = "football-outline";
                      iconColor = themeTextRole.tertiary;
                      eventSuffix = "(OG)";
                    } else {
                      iconName = "football-outline";
                      iconColor = themeAccent.primary;
                    }
                  } else if (ev.detail?.includes("Yellow")) {
                    iconName = "square";
                    iconColor = themeAccent.reward;
                  } else if (ev.detail?.includes("Red")) {
                    iconName = "square-sharp";
                    iconColor = themeAccent.alert;
                  } else if (ev.detail?.includes("Missed Penalty")) {
                    iconName = "close-circle-outline";
                    iconColor = themeAccent.alert;
                    eventSuffix = "(MP)";
                  } else if (ev.detail?.includes("VAR") || ev.type === "Var") {
                    iconName = "eye-outline";
                    iconColor = themeTextRole.tertiary;
                  } else if (ev.type === "subst") {
                    iconName = "swap-horizontal";
                    iconColor = themeTextRole.secondary;
                  } else {
                    iconName = "flash";
                    iconColor = themeTextRole.secondary;
                  }

                  // Check for half-time divider
                  const prevElapsed = i > 0 ? fixtureEvents[i - 1].elapsed : 0;
                  const showHalfTimeDivider = ev.elapsed >= 45 && prevElapsed < 45;

                  return (
                    <React.Fragment key={i}>
                      {showHalfTimeDivider && (
                        <Animated.View
                          entering={FadeInDown.duration(300)}
                          style={[
                            eventsStyles.halfTimeDivider,
                            { borderColor: themeBorder.subtle },
                          ]}
                        >
                          <View
                            style={[
                              eventsStyles.halfTimeLine,
                              { backgroundColor: themeBorder.subtle },
                            ]}
                          />
                          <Text
                            style={[eventsStyles.halfTimeText, { color: themeTextRole.tertiary }]}
                          >
                            HALF TIME · 45&apos;
                          </Text>
                          <View
                            style={[
                              eventsStyles.halfTimeLine,
                              { backgroundColor: themeBorder.subtle },
                            ]}
                          />
                        </Animated.View>
                      )}
                      <Animated.View
                        entering={FadeInDown.delay(i * 30).duration(300)}
                        style={[
                          eventsStyles.row,
                          {
                            borderBottomColor: themeBorder.subtle,
                            borderLeftWidth: 4,
                            borderLeftColor: ev.team.color || themeTextRole.tertiary,
                            backgroundColor: isGoal ? "rgba(0, 166, 81, 0.05)" : "transparent",
                          },
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
                                {eventSuffix && ` ${eventSuffix}`}
                              </Text>
                              {ev.assist?.name && (
                                <Text
                                  style={[
                                    eventsStyles.assistName,
                                    { color: themeTextRole.tertiary },
                                  ]}
                                >
                                  + {ev.assist.name}
                                </Text>
                              )}
                              {ev.comments && (
                                <Text
                                  style={[
                                    eventsStyles.commentText,
                                    { color: themeTextRole.tertiary },
                                  ]}
                                  numberOfLines={2}
                                >
                                  {ev.comments}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>

                        <View style={eventsStyles.center}>
                          <Text style={[eventsStyles.time, { color: themeTextRole.tertiary }]}>
                            {ev.elapsed}
                            {ev.extraTime ? (
                              <>
                                <Text style={[eventsStyles.time, { color: themeAccent.primary }]}>
                                  +{ev.extraTime}
                                </Text>
                              </>
                            ) : null}
                            &apos;
                          </Text>
                          <Ionicons name={iconName} size={16} color={iconColor} />
                        </View>

                        <View style={[eventsStyles.side, eventsStyles.sideAway]}>
                          {!isHome && (
                            <View
                              style={[eventsStyles.eventContent, eventsStyles.eventContentAway]}
                            >
                              <Text
                                style={[eventsStyles.playerName, { color: themeTextRole.primary }]}
                                numberOfLines={1}
                              >
                                {ev.player?.name ?? ""}
                                {eventSuffix && ` ${eventSuffix}`}
                              </Text>
                              {ev.assist?.name && (
                                <Text
                                  style={[
                                    eventsStyles.assistName,
                                    { color: themeTextRole.tertiary },
                                  ]}
                                >
                                  + {ev.assist.name}
                                </Text>
                              )}
                              {ev.comments && (
                                <Text
                                  style={[
                                    eventsStyles.commentText,
                                    { color: themeTextRole.tertiary },
                                  ]}
                                  numberOfLines={2}
                                >
                                  {ev.comments}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    </React.Fragment>
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
              // Empty state: show countdown if upcoming, static message otherwise
              (() => {
                const timeUntilKickoff = match.kickoff ? getTimeUntil(match.kickoff) : null;
                const isUpcoming = match.status === "upcoming";
                const withinHour = timeUntilKickoff && timeUntilKickoff <= 3600000; // 3600000ms = 1 hour

                return (
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
                      {isUpcoming && withinHour && timeUntilKickoff
                        ? `Lineups expected in ${formatCountdown(timeUntilKickoff)}`
                        : isUpcoming
                          ? "Lineups drop ~30min before kickoff"
                          : t.match.lineupsSyncedAfter}
                    </Text>
                  </View>
                );
              })()
            ) : (
              <View style={{ gap: 16 }}>
                {fixtureLineups.map((teamData: any, ti: number) => {
                  // Adapt hook data to PitchDiagram props
                  const pitchPlayers = (teamData.startXI ?? []).map((p: any) => ({
                    playerId: p.id,
                    playerName: p.name,
                    playerNumber: p.number,
                    playerPos: p.pos,
                    grid: p.grid,
                    isCaptain: p.isCaptain,
                  }));

                  return (
                    <View
                      key={ti}
                      style={[
                        lineupsStyles.teamCard,
                        { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                      ]}
                    >
                      {/* Team Header */}
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
                      </View>

                      {/* Pitch Diagram with starting XI */}
                      <PitchDiagram
                        team={teamData.team}
                        formation={teamData.formation}
                        players={pitchPlayers}
                        orientation={ti === 0 ? "up" : "down"}
                        onPlayerPress={handlePlayerPress}
                      />

                      {/* Coach info if available */}
                      {teamData.coach?.name && (
                        <Text style={[lineupsStyles.coachText, { color: themeTextRole.tertiary }]}>
                          Manager: {teamData.coach.name}
                        </Text>
                      )}

                      {/* Substitutes section */}
                      {(teamData.subs ?? []).length > 0 && (
                        <>
                          <Text
                            style={[
                              lineupsStyles.subheader,
                              { marginTop: 12, marginBottom: 6, color: themeTextRole.tertiary },
                            ]}
                          >
                            Substitutes ({(teamData.subs ?? []).length})
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
                                style={[
                                  lineupsStyles.numBadge,
                                  { backgroundColor: themeSurface[2] },
                                ]}
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
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Player Profile Sheet — wired to lineup taps */}
        <PlayerProfileSheet
          visible={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          player={selectedPlayer}
        />

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
                  First ever meeting between these two
                </Text>
                <Text style={[styles.lockedText, { color: themeTextRole.secondary }]}>
                  Make history. No previous records to draw from.
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
                    <View style={h2hStyles.summaryTeamContent}>
                      <Text style={[h2hStyles.summaryCount, { color: themeTextRole.primary }]}>
                        {h2hSummary.homeWins}
                      </Text>
                      <Text style={[h2hStyles.summaryLabel, { color: themeTextRole.tertiary }]}>
                        Wins
                      </Text>
                      <FormStrip form={_homeTeamStats?.data?.[0]?.form} />
                    </View>
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
                    <View style={h2hStyles.summaryTeamContent}>
                      <Text style={[h2hStyles.summaryCount, { color: themeTextRole.primary }]}>
                        {h2hSummary.awayWins}
                      </Text>
                      <Text style={[h2hStyles.summaryLabel, { color: themeTextRole.tertiary }]}>
                        Wins
                      </Text>
                      <FormStrip form={_awayTeamStats?.data?.[0]?.form} />
                    </View>
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
                  <Text style={[h2hStyles.avgGoalsText, { color: themeTextRole.tertiary }]}>
                    Avg {h2hSummary.avgGoals} goals
                  </Text>
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

                // Build stat rows with pass accuracy computed on the fly
                const statRowsRaw: {
                  label: string;
                  homeVal: number | null;
                  awayVal: number | null;
                  isPct?: boolean;
                  category?: string;
                }[] = [
                  {
                    label: t.match.possession,
                    homeVal: home.statistics.possession,
                    awayVal: away.statistics.possession,
                    isPct: true,
                    category: "possession",
                  },
                  {
                    label: t.match.shotsOnGoal,
                    homeVal: home.statistics.shotsOnGoal,
                    awayVal: away.statistics.shotsOnGoal,
                    category: "attack",
                  },
                  {
                    label: t.match.totalShots,
                    homeVal: home.statistics.shotsTotal,
                    awayVal: away.statistics.shotsTotal,
                    category: "attack",
                  },
                  {
                    label: t.match.shotsInsideBox,
                    homeVal: home.statistics.shotsInsideBox,
                    awayVal: away.statistics.shotsInsideBox,
                    category: "attack",
                  },
                  {
                    label: "Shots outside box",
                    homeVal: home.statistics.shotsOutsideBox,
                    awayVal: away.statistics.shotsOutsideBox,
                    category: "attack",
                  },
                  {
                    label: t.match.cornerKicks,
                    homeVal: home.statistics.cornerKicks,
                    awayVal: away.statistics.cornerKicks,
                    category: "attack",
                  },
                  {
                    label: t.match.totalPasses,
                    homeVal: home.statistics.totalPasses,
                    awayVal: away.statistics.totalPasses,
                    category: "passing",
                  },
                  {
                    label: t.match.accuratePasses,
                    homeVal: home.statistics.accuratePasses,
                    awayVal: away.statistics.accuratePasses,
                    category: "passing",
                  },
                  {
                    label: "Pass accuracy",
                    homeVal:
                      home.statistics.totalPasses && home.statistics.accuratePasses
                        ? Math.round(
                            (home.statistics.accuratePasses / home.statistics.totalPasses) * 100,
                          )
                        : null,
                    awayVal:
                      away.statistics.totalPasses && away.statistics.accuratePasses
                        ? Math.round(
                            (away.statistics.accuratePasses / away.statistics.totalPasses) * 100,
                          )
                        : null,
                    isPct: true,
                    category: "passing",
                  },
                  {
                    label: t.match.fouls,
                    homeVal: home.statistics.fouls,
                    awayVal: away.statistics.fouls,
                    category: "discipline",
                  },
                  {
                    label: t.match.yellowCards,
                    homeVal: home.statistics.yellowCards,
                    awayVal: away.statistics.yellowCards,
                    category: "discipline",
                  },
                  {
                    label: t.match.redCards,
                    homeVal: home.statistics.redCards,
                    awayVal: away.statistics.redCards,
                    category: "discipline",
                  },
                  {
                    label: t.match.offsides,
                    homeVal: home.statistics.offsides,
                    awayVal: away.statistics.offsides,
                    category: "discipline",
                  },
                  {
                    label: t.match.gkSaves,
                    homeVal: home.statistics.saves,
                    awayVal: away.statistics.saves,
                    category: "goalkeeping",
                  },
                ];

                // Filter to only show rows where at least one side has data
                const statRows = statRowsRaw.filter((r) => r.homeVal != null || r.awayVal != null);

                // Separate possession (hero) from other rows
                const possessionRow = statRows.find((r) => r.category === "possession");
                const otherRows = statRows.filter((r) => r.category !== "possession");

                // Group other rows by category
                const categories = [
                  { id: "attack", label: "ATTACK", icon: "football-outline" },
                  { id: "passing", label: "PASSING", icon: "arrow-forward-outline" },
                  { id: "discipline", label: "DISCIPLINE", icon: "shield-half-outline" },
                  { id: "goalkeeping", label: "GOALKEEPING", icon: "hand-right-outline" },
                ];

                const groupedStats = categories
                  .map((cat) => ({
                    ...cat,
                    rows: otherRows.filter((r) => r.category === cat.id),
                  }))
                  .filter((cat) => cat.rows.length > 0);

                // Helper: render a stat row
                const renderStatRow = (
                  row: (typeof statRows)[0],
                  rowIndex: number,
                  isZeroBoth: boolean,
                ) => {
                  const hv = row.homeVal ?? 0;
                  const av = row.awayVal ?? 0;
                  const tot = hv + av;
                  const hPct = tot > 0 ? hv / tot : 0.5;
                  const homeWins = hv > av;
                  const awayWins = av > hv;
                  const isTied = hv === av;

                  return (
                    <View
                      key={rowIndex}
                      style={[
                        matchStatsStyles.statRow,
                        { borderBottomColor: themeBorder.subtle },
                        isZeroBoth && matchStatsStyles.rowFaded,
                      ]}
                    >
                      <Text
                        style={[
                          matchStatsStyles.statVal,
                          {
                            color: homeWins ? themeAccent.primary : themeTextRole.secondary,
                            fontFamily: homeWins ? "Inter_700Bold" : "Inter_500Medium",
                          },
                        ]}
                      >
                        {row.isPct ? `${hv}%` : hv}
                      </Text>
                      <View style={matchStatsStyles.barWrap}>
                        <Text
                          style={[matchStatsStyles.statLabel, { color: themeTextRole.secondary }]}
                        >
                          {row.label}
                        </Text>
                        <View
                          style={[matchStatsStyles.barTrack, { backgroundColor: themeSurface[2] }]}
                        >
                          <View
                            style={[
                              matchStatsStyles.barHome,
                              {
                                flex: hPct,
                                backgroundColor: homeWins
                                  ? themeAccent.primary
                                  : isTied
                                    ? themeTextRole.tertiary
                                    : `rgba(${parseInt(themeTextRole.tertiary.slice(1, 3), 16)}, ${parseInt(themeTextRole.tertiary.slice(3, 5), 16)}, ${parseInt(themeTextRole.tertiary.slice(5, 7), 16)}, 0.3)`,
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
                                  : isTied
                                    ? themeTextRole.tertiary
                                    : `rgba(${parseInt(themeTextRole.tertiary.slice(1, 3), 16)}, ${parseInt(themeTextRole.tertiary.slice(3, 5), 16)}, ${parseInt(themeTextRole.tertiary.slice(5, 7), 16)}, 0.3)`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text
                        style={[
                          matchStatsStyles.statVal,
                          matchStatsStyles.statValRight,
                          {
                            color: awayWins ? themeAccent.primary : themeTextRole.secondary,
                            fontFamily: awayWins ? "Inter_700Bold" : "Inter_500Medium",
                          },
                        ]}
                      >
                        {row.isPct ? `${av}%` : av}
                      </Text>
                    </View>
                  );
                };

                // Helper: render a section header
                const renderSectionHeader = (cat: (typeof categories)[0]) => (
                  <View
                    key={`header-${cat.id}`}
                    style={[
                      matchStatsStyles.sectionHeader,
                      { borderBottomColor: themeTextRole.tertiary },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={themeTextRole.tertiary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        matchStatsStyles.sectionHeaderText,
                        { color: themeTextRole.tertiary },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </View>
                );

                return (
                  <View
                    style={[
                      matchStatsStyles.container,
                      { backgroundColor: themeSurface[0], borderColor: themeBorder.subtle },
                    ]}
                  >
                    {/* Header row */}
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

                    {/* Match context line */}
                    <View
                      style={[
                        matchStatsStyles.contextLine,
                        { borderBottomColor: themeBorder.subtle },
                      ]}
                    >
                      <Text
                        style={[matchStatsStyles.contextText, { color: themeTextRole.tertiary }]}
                      >
                        {match.status === "live"
                          ? `Live ${match.minute}'`
                          : match.status === "finished"
                            ? "Final"
                            : "Upcoming"}
                        {match.round ? ` · Matchday ${match.round}` : ""}
                      </Text>
                    </View>

                    {/* Possession hero section */}
                    {possessionRow &&
                      (() => {
                        const hv = possessionRow.homeVal ?? 0;
                        const av = possessionRow.awayVal ?? 0;
                        const tot = hv + av;
                        const hPct = tot > 0 ? hv / tot : 0.5;
                        const homeWins = hv > av;
                        const awayWins = av > hv;
                        const isTied = hv === av;
                        const isZeroBoth = hv === 0 && av === 0;

                        return (
                          <View
                            style={[
                              matchStatsStyles.possessionHero,
                              { backgroundColor: themeSurface[1] },
                              isZeroBoth && matchStatsStyles.rowFaded,
                            ]}
                          >
                            <View style={matchStatsStyles.possessionNumbers}>
                              <Text
                                style={[
                                  matchStatsStyles.possessionVal,
                                  {
                                    color: homeWins ? themeAccent.primary : themeTextRole.secondary,
                                    fontFamily: homeWins ? "Inter_700Bold" : "Inter_500Medium",
                                  },
                                ]}
                              >
                                {hv}%
                              </Text>
                              <Text
                                style={[
                                  matchStatsStyles.possessionVal,
                                  {
                                    color: awayWins ? themeAccent.primary : themeTextRole.secondary,
                                    fontFamily: awayWins ? "Inter_700Bold" : "Inter_500Medium",
                                  },
                                ]}
                              >
                                {av}%
                              </Text>
                            </View>
                            <View
                              style={[
                                matchStatsStyles.possessionBar,
                                { backgroundColor: themeSurface[2] },
                              ]}
                            >
                              <View
                                style={[
                                  matchStatsStyles.possessionBarHome,
                                  {
                                    flex: hPct,
                                    backgroundColor: homeWins
                                      ? themeAccent.primary
                                      : isTied
                                        ? themeTextRole.tertiary
                                        : `rgba(${parseInt(themeTextRole.tertiary.slice(1, 3), 16)}, ${parseInt(themeTextRole.tertiary.slice(3, 5), 16)}, ${parseInt(themeTextRole.tertiary.slice(5, 7), 16)}, 0.3)`,
                                  },
                                ]}
                              />
                              <View
                                style={[
                                  matchStatsStyles.possessionBarAway,
                                  {
                                    flex: 1 - hPct,
                                    backgroundColor: awayWins
                                      ? themeAccent.primary
                                      : isTied
                                        ? themeTextRole.tertiary
                                        : `rgba(${parseInt(themeTextRole.tertiary.slice(1, 3), 16)}, ${parseInt(themeTextRole.tertiary.slice(3, 5), 16)}, ${parseInt(themeTextRole.tertiary.slice(5, 7), 16)}, 0.3)`,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })()}

                    {/* Grouped stat sections */}
                    {groupedStats.map((cat) => (
                      <View key={cat.id}>
                        {renderSectionHeader(cat)}
                        {cat.rows.map((row, idx) => {
                          const isZeroBoth = (row.homeVal ?? 0) === 0 && (row.awayVal ?? 0) === 0;
                          return renderStatRow(row, idx, isZeroBoth);
                        })}
                      </View>
                    ))}
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
  },
  heroTeamNameLive: { color: textRoleLight.inverse },
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
  heroScoreLive: { color: textRoleLight.inverse },
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
    color: textRoleLight.inverse,
    letterSpacing: 0.6,
  },
  liveBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  heroMetaStrongLive: { color: textRoleLight.inverse },
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
  shareAccordionSection: { gap: 16, paddingHorizontal: 16, marginVertical: 16 },
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
    paddingVertical: 24,
    paddingHorizontal: 22,
    gap: 18,
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
    gap: 4,
    paddingVertical: 4,
  },
  predictTeamCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  predictTeamLabel: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  predictBigScore: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 64,
  },
  predictStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  predictStepMinus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0, 166, 81, 0.35)",
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
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    paddingBottom: 44,
    opacity: 0.4,
  },
  predictOutcomeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    marginTop: -8,
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
    paddingTop: 2,
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
    backgroundColor: textRoleLight.inverse,
  },
  boostSwitchDotActive: { transform: [{ translateX: 18 }] },

  // Community picks histogram (Feature A)
  communityPicksCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  communityPicksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  communityPicksHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  communityPicksLabel: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontSize: 11,
  },
  communityPicksLabelText: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
  },
  communityPicksCount: {
    ...typeTok.body,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  communityPicksBars: {
    gap: 8,
  },
  communityPicksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  communityPicksRowHighlight: {
    borderLeftWidth: 3,
    borderLeftColor: accent.primary,
    paddingLeft: 8,
  },
  communityPicksScore: {
    width: 44,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "left",
  },
  communityPicksBarContainer: {
    flex: 1,
  },
  communityPicksBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  communityPicksBarFill: {
    height: 8,
    borderRadius: 4,
  },
  communityPicksPercent: {
    width: 38,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  communityPicksEmpty: {
    ...typeTok.body,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },

  // Social proof (legacy, kept for backward compatibility)
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

  // Share CTA (Feature B)
  shareCTACard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  shareCTAHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  shareCTATitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  shareCTASubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  shareCTAButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shareCTAPrimary: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  shareCTAPrimaryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: textRoleLight.inverse,
  },
  shareCTASecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  shareCTASecondaryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
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
  },
  pointsTitle: {
    flex: 1,
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
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  lockedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  lockedTitle: {
    ...typeTok.body,
    fontFamily: "Inter_700Bold",
  },
  lockedText: {
    ...typeTok.caption,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
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
  summaryTeamContent: { alignItems: "center", gap: 4 },
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
  avgGoalsText: {
    ...typeTok.caption,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
    textAlign: "center",
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
  contextLine: {
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contextText: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  possessionHero: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  possessionNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  possessionVal: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  possessionBar: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    overflow: "hidden",
  },
  possessionBarHome: { height: 10 },
  possessionBarAway: { height: 10 },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowFaded: {
    opacity: 0.4,
  },
  statVal: {
    width: 42,
    fontSize: 18,
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
    height: 6,
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
  },
  barHome: { height: 6 },
  barAway: { height: 6 },
});

const eventsStyles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  halfTimeDivider: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  halfTimeLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  halfTimeText: {
    ...typeTok.micro,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
    textAlign: "center",
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
  commentText: {
    ...typeTok.micro,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
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
  coachText: {
    ...typeTok.micro,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
    marginBottom: 8,
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
