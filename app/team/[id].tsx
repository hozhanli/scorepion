/**
 * Team Profile Screen — Emerald Minimalism.
 *
 * Route: /team/[id] where [id] is the API-Football team ID.
 * Accepts query params: { leagueId?: string } for league-scoped sections.
 *
 * Sections (stacked vertical, scrollable):
 *   1. Hero: team crest, name, league + position chip, back button
 *   2. Season overview stats (from useTeamStats): W/D/L/GF-GA grid
 *   3. Recent form: last 5 finished fixtures (client-side filtered)
 *   4. Next fixture: earliest upcoming match as big card
 *   5. Top scorers (this team, from league data)
 *   6. Injured players (this team)
 *   7. Recent transfers (in/out sub-tabs)
 */
import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Platform, FlatList, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { accent, radii } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import type { StandingRow, TopScorer, Match } from "@/lib/types";
import { useApp } from "@/contexts/AppContext";
import {
  useFootballStandings,
  useFootballTopScorers,
  useFootballInjuries,
  useFootballTransfers,
  useFootballMatches,
  useTeamStats,
} from "@/lib/football-api";
import { formatLocalDate, formatLocalTime } from "@/lib/datetime";
import { PressableScale, SkeletonPlayerRow } from "@/components/ui";

type TransferSubTab = "in" | "out";

// ─────────────────────────────────────────────────────────────────────────────
// Season overview stats row

function SeasonStatsRow({ label, value }: { label: string; value: string | number }) {
  const { textRole } = useTheme();
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: textRole.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textRole.tertiary }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent form chip

function FormChip({ result, opponent }: { result: "W" | "D" | "L"; opponent: string }) {
  const { surface, border, textRole } = useTheme();
  const resultColor =
    result === "W" ? accent.primary : result === "L" ? accent.alert : "rgba(150, 150, 150, 0.5)";

  return (
    <View style={[styles.formChip, { backgroundColor: surface[1], borderColor: border.subtle }]}>
      <View style={[styles.formDot, { backgroundColor: resultColor }]} />
      <Text style={[styles.formText, { color: textRole.secondary }]} numberOfLines={1}>
        {opponent}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Next fixture card

function NextFixtureCard({ match }: { match: Match }) {
  const { surface, border, textRole } = useTheme();
  const kickoffTime = formatLocalTime(match.kickoff);
  const kickoffDate = formatLocalDate(match.kickoff);

  return (
    <PressableScale
      onPress={() => router.push(`/match/${match.id}`)}
      style={[styles.nextFixtureCard, { backgroundColor: surface[0], borderColor: border.subtle }]}
      haptic="light"
      pressedScale={0.98}
    >
      <View style={styles.fixtureHeader}>
        <Text style={[styles.fixtureDate, { color: textRole.tertiary }]}>{kickoffDate}</Text>
        <Text style={[styles.fixtureTime, { color: textRole.primary }]}>{kickoffTime}</Text>
      </View>

      <View style={styles.fixtureTeams}>
        {match.homeTeam.logo ? (
          <Image
            source={{ uri: match.homeTeam.logo }}
            style={styles.fixtureLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.fixtureBadge, { backgroundColor: surface[2] }]}>
            <Text style={[styles.fixtureBadgeText, { color: textRole.primary }]}>
              {match.homeTeam.shortName.charAt(0)}
            </Text>
          </View>
        )}

        <View style={styles.fixtureVs}>
          <Text style={[styles.fixtureVsText, { color: textRole.tertiary }]}>vs</Text>
        </View>

        {match.awayTeam.logo ? (
          <Image
            source={{ uri: match.awayTeam.logo }}
            style={styles.fixtureLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.fixtureBadge, { backgroundColor: surface[2] }]}>
            <Text style={[styles.fixtureBadgeText, { color: textRole.primary }]}>
              {match.awayTeam.shortName.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.fixtureVenue, { color: textRole.secondary }]} numberOfLines={1}>
        {match.venue || "TBD"}
      </Text>
    </PressableScale>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scorer row (inlined from league page pattern)

function ScorerRowItem({ scorer }: { scorer: TopScorer }) {
  const { surface, border, textRole } = useTheme();
  const isLeader = scorer.rank === 1;

  return (
    <View style={[sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }]}>
      <View style={sStyles.rankCol}>
        <Text
          style={[
            sStyles.rankText,
            { color: textRole.tertiary },
            isLeader && sStyles.rankTextLeader,
          ]}
        >
          {scorer.rank}
        </Text>
      </View>
      {scorer.playerPhoto ? (
        <Image
          source={{ uri: scorer.playerPhoto }}
          style={[sStyles.playerPhoto, { backgroundColor: surface[2] }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[sStyles.teamBadge, { backgroundColor: surface[2] }]}>
          <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>
            {scorer.team.shortName.charAt(0)}
          </Text>
        </View>
      )}
      <View style={sStyles.playerInfo}>
        <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>
          {scorer.playerName}
        </Text>
        <Text style={[sStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>
          {scorer.team.name}
        </Text>
      </View>
      <View style={sStyles.statsCol}>
        <View style={[sStyles.goalBubble, isLeader && sStyles.goalBubbleLeader]}>
          <Ionicons name="football" size={14} color={accent.primary} />
          <Text style={sStyles.goalCount}>{scorer.goals}</Text>
        </View>
        <Text style={[sStyles.assistText, { color: textRole.tertiary }]}>{scorer.assists} ast</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Injury row

function InjuryRow({ item }: { item: any }) {
  const { surface, border, textRole } = useTheme();

  return (
    <View style={[sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }]}>
      {item.playerPhoto ? (
        <Image
          source={{ uri: item.playerPhoto }}
          style={[sStyles.playerPhoto, { marginLeft: 0, backgroundColor: surface[2] }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[sStyles.teamBadge, { marginLeft: 0, backgroundColor: surface[2] }]}>
          <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>?</Text>
        </View>
      )}
      <View style={[sStyles.playerInfo, { marginLeft: 12 }]}>
        <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>
          {item.playerName}
        </Text>
        <View style={injStyles.returnDateRow}>
          <Text style={[sStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>
            {item.team?.name || ""}
          </Text>
          {item.fixtureDate && (
            <Text style={[sStyles.assistText, { color: textRole.tertiary }]} numberOfLines={1}>
              Out until {formatLocalDate(item.fixtureDate)}
            </Text>
          )}
        </View>
      </View>
      <View style={sStyles.statsCol}>
        <View style={injStyles.typeBadge}>
          <Ionicons name="medkit" size={11} color={accent.alert} />
          <Text style={injStyles.typeText} numberOfLines={1}>
            {item.type || "Injury"}
          </Text>
        </View>
        <Text style={[sStyles.assistText, { color: textRole.tertiary }]} numberOfLines={1}>
          {item.reason || ""}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transfer row

function TransferRow({ item }: { item: any }) {
  const { surface, border, textRole } = useTheme();

  return (
    <View style={[sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }]}>
      {item.playerPhoto ? (
        <Image
          source={{ uri: item.playerPhoto }}
          style={[sStyles.playerPhoto, { marginLeft: 0, backgroundColor: surface[2] }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[sStyles.teamBadge, { marginLeft: 0, backgroundColor: surface[2] }]}>
          <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>?</Text>
        </View>
      )}
      <View style={[sStyles.playerInfo, { marginLeft: 12, flex: 1 }]}>
        <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>
          {item.playerName}
        </Text>
        <View style={trStyles.transferFlow}>
          <View style={trStyles.teamRow}>
            {item.teamOut?.logo ? (
              <Image
                source={{ uri: item.teamOut.logo }}
                style={trStyles.miniLogo}
                resizeMode="contain"
              />
            ) : null}
            <Text style={[trStyles.teamOutText, { color: textRole.tertiary }]} numberOfLines={1}>
              {item.teamOut?.name || "Free"}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={11} color={accent.primary} />
          <View style={trStyles.teamRow}>
            {item.teamIn?.logo ? (
              <Image
                source={{ uri: item.teamIn.logo }}
                style={trStyles.miniLogo}
                resizeMode="contain"
              />
            ) : null}
            <Text style={[trStyles.teamInText, { color: accent.primary }]} numberOfLines={1}>
              {item.teamIn?.name || "Free"}
            </Text>
          </View>
        </View>
      </View>
      <View style={sStyles.statsCol}>
        <View style={[trStyles.typeBadge, { backgroundColor: surface[2] }]}>
          <Text style={[trStyles.typeText, { color: textRole.secondary }]} numberOfLines={1}>
            {item.type || "N/A"}
          </Text>
        </View>
        {item.date ? (
          <Text style={[sStyles.assistText, { color: textRole.tertiary }]}>
            {formatLocalDate(item.date)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  const { textRole } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={accent.primary} />
      <Text style={[styles.sectionTitle, { color: textRole.primary }]}>{title}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen

export default function TeamProfileScreen() {
  const { id, leagueId } = useLocalSearchParams<{ id: string; leagueId?: string }>();
  const insets = useSafeAreaInsets();
  const { surface, border, textRole } = useTheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { leagues } = useApp();
  const [transferSubTab, setTransferSubTab] = useState<TransferSubTab>("in");

  // Fetch team stats
  const { data: teamStats, isLoading: statsLoading } = useTeamStats(id);

  // Fetch standings (for position info)
  const { data: standings = [], isLoading: standingsLoading } = useFootballStandings(
    leagueId || "",
  );

  // Fetch matches (for recent form & next fixture)
  const { data: allMatches = [], isLoading: matchesLoading } = useFootballMatches(
    leagueId ? { leagueId } : undefined,
  );

  // Fetch league-scoped data
  const { data: scorers = [], isLoading: scorersLoading } = useFootballTopScorers(leagueId || "");
  const { data: injuries = [], isLoading: injuriesLoading } = useFootballInjuries(leagueId || "");
  const { data: transfers = [], isLoading: transfersLoading } = useFootballTransfers(
    leagueId || "",
  );

  // Compute team info and position
  const teamStanding = useMemo(() => standings.find((s) => s.team.id === id), [standings, id]);

  const league = useMemo(() => leagues.find((l) => l.id === leagueId), [leagues, leagueId]);

  // Compute recent form (last 5 finished fixtures)
  const recentForm = useMemo(() => {
    return allMatches
      .filter((m) => m.status === "finished" && (m.homeTeam.id === id || m.awayTeam.id === id))
      .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
      .slice(0, 5)
      .map((m) => {
        const isHome = m.homeTeam.id === id;
        const result =
          m.homeScore === m.awayScore
            ? "D"
            : (isHome && m.homeScore! > m.awayScore!) || (!isHome && m.awayScore! > m.homeScore!)
              ? "W"
              : "L";
        const opponent = isHome ? m.awayTeam.shortName : m.homeTeam.shortName;
        return { result: result as "W" | "D" | "L", opponent };
      });
  }, [allMatches, id]);

  // Compute next fixture
  const nextFixture = useMemo(() => {
    const upcoming = allMatches
      .filter((m) => m.status === "upcoming" && (m.homeTeam.id === id || m.awayTeam.id === id))
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [allMatches, id]);

  // Filter top scorers for this team
  const teamTopScorers = useMemo(
    () => scorers.filter((s) => s.team.id === id).slice(0, 5),
    [scorers, id],
  );

  // Filter injuries for this team
  const teamInjuries = useMemo(() => injuries.filter((inj) => inj.team?.id === id), [injuries, id]);

  // Filter transfers for this team
  const teamTransfers = useMemo(
    () => transfers.filter((t) => t.teamIn?.id === id || t.teamOut?.id === id).slice(0, 5),
    [transfers, id],
  );

  const filteredTransfers = useMemo(
    () =>
      transferSubTab === "in"
        ? teamTransfers.filter((t) => t.type === "in")
        : teamTransfers.filter((t) => t.type === "out"),
    [teamTransfers, transferSubTab],
  );

  const headerContent = (
    <View>
      {/* Hero section */}
      <View
        style={[
          styles.hero,
          {
            paddingTop: topPad + 12,
            backgroundColor: surface[0],
            borderBottomColor: border.subtle,
          },
        ]}
      >
        <View style={styles.navRow}>
          <PressableScale
            onPress={() => router.back()}
            style={[styles.navBtn, { backgroundColor: surface[1], borderColor: border.subtle }]}
            haptic="light"
          >
            <Ionicons name="chevron-back" size={22} color={textRole.primary} />
          </PressableScale>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.teamInfo}>
          <View
            style={[
              styles.teamIconWell,
              { backgroundColor: surface[2], borderColor: border.subtle },
            ]}
          >
            {teamStanding?.team.logo ? (
              <Image
                source={{ uri: teamStanding.team.logo }}
                style={styles.teamCrest}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.creatCircle, { backgroundColor: surface[1] }]}>
                <Text style={[styles.creatText, { color: textRole.primary }]}>
                  {teamStanding?.team.shortName.charAt(0) || "?"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.teamName}>{teamStanding?.team.name || "Unknown Team"}</Text>
          {league && (
            <View style={styles.leagueChip}>
              <Text style={[styles.leagueText, { color: textRole.tertiary }]}>
                {league.name} ·{" "}
                {teamStanding
                  ? `${teamStanding.position}${["st", "nd", "rd"][(teamStanding.position - 1) % 3] || "th"}`
                  : "—"}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Season stats section */}
      {teamStats && teamStats.found !== false && (
        <View style={styles.statsSection}>
          <SectionHeader icon="football" title="Season Stats" />
          <View style={styles.statsGrid}>
            <SeasonStatsRow label="Wins" value={teamStats.wins || 0} />
            <SeasonStatsRow label="Draws" value={teamStats.draws || 0} />
            <SeasonStatsRow label="Losses" value={teamStats.losses || 0} />
            <SeasonStatsRow
              label="GF-GA"
              value={`${teamStats.goalsFor || 0}-${teamStats.goalsAgainst || 0}`}
            />
          </View>
        </View>
      )}

      {/* Recent form section */}
      {recentForm.length > 0 && (
        <View style={styles.formSection}>
          <SectionHeader icon="flame" title="Recent Form" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.formScroll}
          >
            {recentForm.map((form, i) => (
              <FormChip key={i} result={form.result} opponent={form.opponent} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Next fixture section */}
      {nextFixture && (
        <View style={styles.nextFixtureSection}>
          <SectionHeader icon="calendar" title="Next Match" />
          <NextFixtureCard match={nextFixture} />
        </View>
      )}

      {/* Top scorers section */}
      {leagueId && (
        <View style={styles.sectionGap}>
          <SectionHeader icon="football" title="Top Scorers" />
        </View>
      )}
    </View>
  );

  const allSections = [
    { key: "scorers", data: teamTopScorers, isLoading: scorersLoading },
    { key: "injuries", data: teamInjuries, isLoading: injuriesLoading },
    { key: "transfers", data: filteredTransfers, isLoading: transfersLoading },
  ];

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    // Determine which section this item belongs to based on context
    // We'll use a wrapper approach in the main list
    return null;
  };

  // Flatten all sections into a single array for FlatList
  const flatData = useMemo(() => {
    const flat: any[] = [];

    // Add scorers section
    if (leagueId && teamTopScorers.length > 0) {
      teamTopScorers.forEach((scorer) => {
        flat.push({ ...scorer, _type: "scorer" });
      });
    } else if (leagueId && !scorersLoading && teamTopScorers.length === 0) {
      flat.push({ _type: "scorersEmpty" });
    }

    // Add spacer
    if (flat.length > 0) flat.push({ _type: "spacer" });

    // Add injuries section
    if (leagueId && teamInjuries.length > 0) {
      flat.push({ _type: "injuriesHeader" });
      teamInjuries.forEach((injury) => {
        flat.push({ ...injury, _type: "injury" });
      });
    } else if (leagueId && !injuriesLoading && teamInjuries.length === 0) {
      flat.push({ _type: "injuriesEmpty" });
    }

    // Add spacer
    if (leagueId && flat.length > 0) flat.push({ _type: "spacer" });

    // Add transfers section
    if (leagueId && filteredTransfers.length > 0) {
      flat.push({ _type: "transfersHeader" });
      filteredTransfers.forEach((transfer) => {
        flat.push({ ...transfer, _type: "transfer" });
      });
    } else if (leagueId && !transfersLoading && filteredTransfers.length === 0) {
      flat.push({ _type: "transfersEmpty" });
    }

    return flat;
  }, [
    leagueId,
    teamTopScorers,
    teamInjuries,
    filteredTransfers,
    scorersLoading,
    injuriesLoading,
    transfersLoading,
  ]);

  const renderFlatItem = ({ item, index }: { item: any; index: number }) => {
    if (item._type === "scorer") {
      return <ScorerRowItem scorer={item as TopScorer} />;
    }
    if (item._type === "scorersEmpty") {
      return (
        <View style={styles.emptyRow}>
          <Text style={[styles.emptyText, { color: textRole.tertiary }]}>No data available</Text>
        </View>
      );
    }
    if (item._type === "spacer") {
      return <View style={styles.spacer} />;
    }
    if (item._type === "injuriesHeader") {
      return <SectionHeader icon="medkit" title="Injuries" />;
    }
    if (item._type === "injury") {
      return <InjuryRow item={item} />;
    }
    if (item._type === "injuriesEmpty") {
      return (
        <View style={styles.emptyRow}>
          <Text style={[styles.emptyText, { color: textRole.tertiary }]}>
            No injuries at this time
          </Text>
        </View>
      );
    }
    if (item._type === "transfersHeader") {
      return (
        <View>
          <SectionHeader icon="swap-horizontal" title="Transfers" />
          <View style={styles.transferSubTabRow}>
            <PressableScale
              onPress={() => setTransferSubTab("in")}
              style={[
                styles.transferSubTab,
                transferSubTab === "in"
                  ? styles.transferSubTabActive
                  : { backgroundColor: surface[1], borderColor: border.subtle },
              ]}
              haptic="selection"
            >
              <Ionicons
                name="arrow-forward"
                size={12}
                color={transferSubTab === "in" ? accent.primary : textRole.secondary}
              />
              <Text
                style={[
                  styles.transferSubTabText,
                  transferSubTab === "in" && styles.transferSubTabTextActive,
                  transferSubTab !== "in" && { color: textRole.secondary },
                ]}
              >
                In
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => setTransferSubTab("out")}
              style={[
                styles.transferSubTab,
                transferSubTab === "out"
                  ? styles.transferSubTabActive
                  : { backgroundColor: surface[1], borderColor: border.subtle },
              ]}
              haptic="selection"
            >
              <Ionicons
                name="arrow-back"
                size={12}
                color={transferSubTab === "out" ? accent.primary : textRole.secondary}
              />
              <Text
                style={[
                  styles.transferSubTabText,
                  transferSubTab === "out" && styles.transferSubTabTextActive,
                  transferSubTab !== "out" && { color: textRole.secondary },
                ]}
              >
                Out
              </Text>
            </PressableScale>
          </View>
        </View>
      );
    }
    if (item._type === "transfer") {
      return <TransferRow item={item} />;
    }
    if (item._type === "transfersEmpty") {
      return (
        <View style={styles.emptyRow}>
          <Text style={[styles.emptyText, { color: textRole.tertiary }]}>No transfers yet</Text>
        </View>
      );
    }
    return null;
  };

  const isLoadingAny =
    statsLoading ||
    standingsLoading ||
    matchesLoading ||
    scorersLoading ||
    injuriesLoading ||
    transfersLoading;

  if (!id) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: surface[0] }]}>
        <Ionicons name="alert-circle-outline" size={48} color={textRole.tertiary} />
        <Text style={[styles.errorText, { color: textRole.secondary }]}>Team not found</Text>
        <PressableScale onPress={() => router.back()} style={styles.backLink} haptic="light">
          <Text style={[styles.backLinkText, { color: accent.primary }]}>Go back</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: surface[0] }]}>
      <FlatList
        data={leagueId ? flatData : []}
        keyExtractor={(item: any, idx) => {
          if (item._type === "scorer") return `scorer_${(item as TopScorer).playerName}_${idx}`;
          if (item._type === "injury") return `injury_${item.playerName}_${idx}`;
          if (item._type === "transfer") return `transfer_${item.playerName}_${idx}`;
          return `${item._type}_${idx}`;
        }}
        renderItem={renderFlatItem}
        ListHeaderComponent={headerContent}
        ListEmptyComponent={
          leagueId ? (
            isLoadingAny ? (
              <View style={styles.skeletonContainer}>
                <SkeletonPlayerRow count={5} />
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="football-outline" size={40} color={textRole.tertiary} />
                <Text style={[styles.emptyText, { color: textRole.tertiary }]}>
                  No data available
                </Text>
              </View>
            )
          ) : (
            <View style={styles.empty}>
              <Ionicons name="alert-circle-outline" size={40} color={textRole.tertiary} />
              <Text style={[styles.emptyText, { color: textRole.secondary }]}>
                League ID required for full details
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  backLink: { paddingVertical: 8, paddingHorizontal: 16 },
  backLinkText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  teamInfo: { alignItems: "center", marginTop: 16, gap: 10 },
  teamIconWell: {
    width: 88,
    height: 88,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCrest: {
    width: 72,
    height: 72,
  },
  creatCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  creatText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  teamName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  leagueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderColor: "rgba(0,0,0,0.1)",
  },
  leagueText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },

  // Sections
  statsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },

  formSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  formScroll: {
    paddingTop: 12,
    gap: 8,
  },
  formChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  formDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  formText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    maxWidth: 60,
  },

  nextFixtureSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  nextFixtureCard: {
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  fixtureHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  fixtureDate: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  fixtureTime: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  fixtureTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 12,
  },
  fixtureLogo: {
    width: 48,
    height: 48,
  },
  fixtureBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fixtureBadgeText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  fixtureVs: {
    alignItems: "center",
  },
  fixtureVsText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  fixtureVenue: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionGap: {
    paddingTop: 12,
  },

  transferSubTabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  transferSubTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  transferSubTabActive: {
    borderColor: accent.primary,
    backgroundColor: "rgba(0, 166, 81, 0.08)",
  },
  transferSubTabText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  transferSubTabTextActive: {
    color: accent.primary,
  },

  emptyRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  spacer: {
    height: 1,
  },
  empty: {
    alignItems: "center",
    paddingTop: 48,
    gap: 12,
  },
  skeletonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});

// Player-row styles (scorers / injuries / transfers)
const sStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  rankCol: { width: 28, alignItems: "center" },
  rankText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  rankTextLeader: {
    color: accent.primary,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  teamBadgeText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  playerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  playerInfo: { flex: 1, marginLeft: 12 },
  playerName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  playerTeam: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statsCol: { alignItems: "flex-end" },
  goalBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 166, 81, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  goalBubbleLeader: {
    backgroundColor: "rgba(0, 166, 81, 0.14)",
  },
  goalCount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: accent.primary,
  },
  assistText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
});

const injStyles = StyleSheet.create({
  returnDateRow: {
    gap: 4,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(239, 68, 68, 0.10)",
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: accent.alert,
    maxWidth: 80,
  },
});

const trStyles = StyleSheet.create({
  transferFlow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    maxWidth: 80,
  },
  miniLogo: {
    width: 14,
    height: 14,
  },
  teamOutText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  teamInText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 60,
  },
});
