/**
 * LeagueDetailScreen — Emerald Minimalism.
 *
 * Full refactor from the previous gradient-heavy screen:
 *   • Hero: white + hairline, neutral league crest well, title, season chip.
 *   • Tabs: horizontally scrollable segmented chips, emerald active pill.
 *   • Rows (standings / scorers / assists / cards / injuries / transfers):
 *     white surface, 1px hairline, no shadows, neutral avatars.
 *   • Top-3 positional badges use emerald tint (champion league spots) and
 *     alert tint (relegation). No gold/silver/bronze medals — emerald is the
 *     only ladder colour in the app. The #1 scorer / top assister / etc. gets
 *     a subtle emerald pill on the stat, not a gradient medal.
 *
 * Dependencies removed: `LinearGradient`, `useTheme`, ad-hoc shadows,
 * `Colors.palette.gold` / `violet` / `blue*` / `navy*`, all hex literals.
 */
import React, { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Platform, FlatList, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { accent, radii } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import type { StandingRow, TopScorer } from "@/lib/types";
import { useApp } from "@/contexts/AppContext";
import {
  useFootballStandings,
  useFootballTopScorers,
  useFootballTopAssists,
  useFootballTopYellowCards,
  useFootballTopRedCards,
  useFootballInjuries,
  useFootballTransfers,
} from "@/lib/football-api";
import { formatLocalDate } from "@/lib/datetime";
import {
  PressableScale,
  SkeletonStandingRow,
  SkeletonPlayerRow,
  SkeletonTransferRow,
  HelpTip,
} from "@/components/ui";
import PlayerProfileSheet, { type PlayerProfileData } from "@/components/PlayerProfileSheet";
import { useFilterPersistence } from "@/lib/hooks/useFilterPersistence";
import { StandingRowItem, ROW_HEIGHT_STANDINGS } from "./_components/StandingRowItem";
import { ScorerRowItem, ROW_HEIGHT_SCORER } from "./_components/ScorerRowItem";
import { PlayerStatRow, ROW_HEIGHT_PLAYER } from "./_components/PlayerStatRow";
import { InjuryTeamHeader, InjuryRow, ROW_HEIGHT_INJURY } from "./_components/InjuryRow";
import { TransferRow, ROW_HEIGHT_TRANSFER } from "./_components/TransferRow";
import {
  TransferWindowHeader,
  ROW_HEIGHT_TRANSFER_HEADER,
} from "./_components/TransferWindowHeader";
import { DisciplineRow, ROW_HEIGHT_DISCIPLINE } from "./_components/DisciplineRow";

type TabType = "standings" | "scorers" | "assists" | "cards" | "injuries" | "transfers";

const TAB_CONFIG: { key: TabType; label: string; icon: string; iconOutline: string }[] = [
  { key: "standings", label: "Table", icon: "list", iconOutline: "list-outline" },
  { key: "scorers", label: "Goals", icon: "football", iconOutline: "football-outline" },
  { key: "assists", label: "Assists", icon: "hand-left", iconOutline: "hand-left-outline" },
  { key: "cards", label: "Cards", icon: "card", iconOutline: "card-outline" },
  { key: "injuries", label: "Injuries", icon: "medkit", iconOutline: "medkit-outline" },
  {
    key: "transfers",
    label: "Transfers",
    icon: "swap-horizontal",
    iconOutline: "swap-horizontal-outline",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main screen

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { surface, border, textRole } = useTheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [activeTab, setActiveTab] = useFilterPersistence<TabType>("league.activeTab", "standings", [
    "standings",
    "scorers",
    "assists",
    "cards",
    "injuries",
    "transfers",
  ]);
  const [cardsFilter, setCardsFilter] = useFilterPersistence<"all" | "yellow" | "red" | "rate">(
    "league.cardsFilter",
    "all",
    ["all", "yellow", "red", "rate"],
  );
  const [transferFilter, setTransferFilter] = useFilterPersistence<"all" | "in" | "out">(
    "league.transferFilter",
    "all",
    ["all", "in", "out"],
  );
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfileData | null>(null);

  const { leagues } = useApp();
  const league = useMemo(() => leagues.find((l) => l.id === id), [leagues, id]);

  // Gate queries: only fetch the active tab's data to reduce network load
  const { data: standings = [], isLoading: standingsLoading } = useFootballStandings(
    activeTab === "standings" ? id || "" : "",
  );
  const { data: scorers = [], isLoading: scorersLoading } = useFootballTopScorers(
    activeTab === "scorers" ? id || "" : "",
  );
  const { data: assists = [], isLoading: assistsLoading } = useFootballTopAssists(
    activeTab === "assists" ? id || "" : "",
  );
  const { data: yellowCards = [], isLoading: yellowLoading } = useFootballTopYellowCards(
    activeTab === "cards" ? id || "" : "",
  );
  const { data: redCards = [], isLoading: redLoading } = useFootballTopRedCards(
    activeTab === "cards" ? id || "" : "",
  );
  const { data: injuries = [], isLoading: injuriesLoading } = useFootballInjuries(
    activeTab === "injuries" ? id || "" : "",
  );
  const { data: transfers = [], isLoading: transfersLoading } = useFootballTransfers(
    activeTab === "transfers" ? id || "" : "",
  );

  const isLoading =
    activeTab === "standings"
      ? standingsLoading
      : activeTab === "scorers"
        ? scorersLoading
        : activeTab === "assists"
          ? assistsLoading
          : activeTab === "cards"
            ? yellowLoading || redLoading
            : activeTab === "injuries"
              ? injuriesLoading
              : transfersLoading;

  // Compute matchday for standings hero
  const matchday = standings.length > 0 ? Math.max(...standings.map((s) => s.played)) : undefined;
  const totalMatchdays = standings.length > 0 ? (standings.length - 1) * 2 : undefined;

  // Merge yellow and red cards into unified discipline view
  const mergedDiscipline = useMemo(() => {
    interface DisciplineEntry {
      playerName: string;
      playerPhoto?: string;
      team?: any;
      yellowCards: number;
      redCards: number;
      matches: number;
    }
    const map = new Map<string, DisciplineEntry>();

    // Merge yellow cards
    for (const y of yellowCards) {
      const key = `${y.playerName}|${y.team?.id}`;
      map.set(key, {
        playerName: y.playerName,
        playerPhoto: y.playerPhoto,
        team: y.team,
        yellowCards: y.yellowCards || 0,
        redCards: 0,
        matches: y.matches || 0,
      });
    }

    // Merge red cards
    for (const r of redCards) {
      const key = `${r.playerName}|${r.team?.id}`;
      const existing = map.get(key);
      if (existing) {
        existing.redCards = r.redCards || 0;
        existing.matches = Math.max(existing.matches, r.matches || 0);
      } else {
        map.set(key, {
          playerName: r.playerName,
          playerPhoto: r.playerPhoto,
          team: r.team,
          yellowCards: 0,
          redCards: r.redCards || 0,
          matches: r.matches || 0,
        });
      }
    }

    const entries = Array.from(map.values());

    // Apply filter and sort
    switch (cardsFilter) {
      case "yellow":
        return entries.sort((a, b) => b.yellowCards - a.yellowCards);
      case "red":
        return entries.filter((e) => e.redCards > 0).sort((a, b) => b.redCards - a.redCards);
      case "rate":
        return entries
          .filter((e) => e.matches >= 3)
          .sort(
            (a, b) =>
              (b.yellowCards + b.redCards) / b.matches - (a.yellowCards + a.redCards) / a.matches,
          );
      default:
        // 'all': sort by disciplineScore (yellow + red*2)
        return entries.sort(
          (a, b) => b.yellowCards + b.redCards * 2 - (a.yellowCards + a.redCards * 2),
        );
    }
  }, [yellowCards, redCards, cardsFilter]);

  // Group injuries by team, sorted alphabetically by team name
  const injuriesByTeam = useMemo(() => {
    type InjuryGroup = { team: any; players: any[] };
    const grouped = injuries.reduce(
      (acc, injury) => {
        const teamId = injury.team?.id;
        if (!teamId) return acc;
        if (!acc[teamId]) {
          acc[teamId] = { team: injury.team, players: [] };
        }
        acc[teamId].players.push(injury);
        return acc;
      },
      {} as Record<string, InjuryGroup>,
    );

    return (Object.values(grouped) as InjuryGroup[]).sort((a, b) =>
      (a.team?.name || "").localeCompare(b.team?.name || ""),
    );
  }, [injuries]);

  // Flatten grouped injuries for FlatList
  const flatInjuries = useMemo(() => {
    const flat: any[] = [];
    injuriesByTeam.forEach((group) => {
      flat.push({ _type: "teamHeader", _id: `header-${group.team?.id}`, teamInfo: group });
      group.players.forEach((player: any) => {
        flat.push({ ...player, _type: "player" });
      });
    });
    return flat;
  }, [injuriesByTeam]);

  // Transfer window grouping helper
  function windowKey(dateStr: string): { label: string; sortKey: string } {
    const d = new Date(dateStr);
    const month = d.getMonth(); // 0-indexed
    const year = d.getFullYear();
    // Summer window: Jun–Sep  |  Winter window: Dec–Feb  |  Other: off-window
    if (month >= 5 && month <= 8) return { label: `SUMMER ${year}`, sortKey: `${year}-S` };
    if (month === 11)
      return { label: `WINTER ${year}/${(year + 1).toString().slice(-2)}`, sortKey: `${year}-W` };
    if (month <= 1)
      return { label: `WINTER ${year - 1}/${year.toString().slice(-2)}`, sortKey: `${year - 1}-W` };
    return { label: `OFF-WINDOW ${year}`, sortKey: `${year}-O` };
  }

  // Group and flatten transfers by window
  const flatTransfers = useMemo(() => {
    // Apply filter first
    let filtered = transfers;
    if (transferFilter === "in") {
      filtered = transfers.filter((t) => t.type === "in");
    } else if (transferFilter === "out") {
      filtered = transfers.filter((t) => t.type === "out");
    }

    // Group by window
    const grouped: Record<string, { label: string; sortKey: string; transfers: any[] }> = {};
    filtered.forEach((transfer: any) => {
      const key = windowKey(transfer.date);
      if (!grouped[key.sortKey]) {
        grouped[key.sortKey] = { label: key.label, sortKey: key.sortKey, transfers: [] };
      }
      grouped[key.sortKey].transfers.push(transfer);
    });

    // Sort windows descending (most recent first)
    const sortedWindows = Object.values(grouped).sort((a, b) => b.sortKey.localeCompare(a.sortKey));

    // Flatten: header + transfers within each window
    const flat: any[] = [];
    sortedWindows.forEach((window) => {
      flat.push({ _type: "windowHeader", _id: `header-${window.sortKey}`, label: window.label });
      // Sort transfers within window by date descending
      const sorted = window.transfers.sort((a: any, b: any) => {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        return bDate - aDate;
      });
      sorted.forEach((transfer: any) => {
        flat.push({ ...transfer, _type: "transfer" });
      });
    });

    return flat;
  }, [transfers, transferFilter]);

  const currentData =
    activeTab === "standings"
      ? standings
      : activeTab === "scorers"
        ? scorers
        : activeTab === "assists"
          ? assists
          : activeTab === "cards"
            ? mergedDiscipline
            : activeTab === "injuries"
              ? flatInjuries
              : activeTab === "transfers"
                ? flatTransfers
                : transfers;

  const headerContent = (
    <View>
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

        <Animated.View entering={FadeInDown.duration(400)} style={styles.leagueInfo}>
          <View
            style={[
              styles.leagueIconWell,
              { backgroundColor: surface[2], borderColor: border.subtle },
            ]}
          >
            {league.logo ? (
              <Image
                source={{ uri: league.logo, cache: "force-cache" }}
                style={styles.leagueLogo}
                resizeMode="contain"
              />
            ) : league.flag ? (
              <Image
                source={{ uri: league.flag, cache: "force-cache" }}
                style={styles.leagueLogo}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name={league.icon as keyof typeof Ionicons.glyphMap}
                size={36}
                color={accent.primary}
              />
            )}
          </View>
          <Text style={styles.leagueName}>{league.name}</Text>
          <View style={styles.seasonPill}>
            <Ionicons name="calendar-outline" size={11} color={textRole.tertiary} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={styles.leagueCountry}>
                {league.country} · 2025/26
                {matchday && totalMatchdays ? ` · Matchday ${matchday} of ${totalMatchdays}` : ""}
              </Text>
              {matchday && totalMatchdays && <HelpTip term="matchday" iconSize={10} />}
            </View>
          </View>
        </Animated.View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
        style={styles.tabScroll}
      >
        {TAB_CONFIG.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <PressableScale
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabChip,
                active && styles.tabChipActive,
                !active && { backgroundColor: surface[1], borderColor: border.subtle },
              ]}
              haptic="selection"
              pressedScale={0.97}
            >
              <Ionicons
                name={(active ? tab.icon : tab.iconOutline) as keyof typeof Ionicons.glyphMap}
                size={14}
                color={active ? "#FFFFFF" : textRole.secondary}
              />
              <Text
                style={[
                  styles.tabText,
                  active && styles.tabTextActive,
                  !active && { color: textRole.secondary },
                ]}
              >
                {tab.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {activeTab === "cards" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContent}
          style={styles.filterChipsScroll}
        >
          <PressableScale
            onPress={() => setCardsFilter("all")}
            style={[
              styles.filterChip,
              cardsFilter === "all"
                ? styles.filterChipActive
                : { backgroundColor: surface[1], borderColor: border.subtle },
            ]}
            haptic="selection"
          >
            <Text
              style={[
                styles.filterChipText,
                cardsFilter === "all" && styles.filterChipTextActive,
                cardsFilter !== "all" && { color: textRole.secondary },
              ]}
            >
              All
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => setCardsFilter("yellow")}
            style={[
              styles.filterChip,
              cardsFilter === "yellow"
                ? styles.filterChipActive
                : { backgroundColor: surface[1], borderColor: border.subtle },
            ]}
            haptic="selection"
          >
            <Text
              style={[
                styles.filterChipText,
                cardsFilter === "yellow" && styles.filterChipTextActive,
                cardsFilter !== "yellow" && { color: textRole.secondary },
              ]}
            >
              Most yellow
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => setCardsFilter("red")}
            style={[
              styles.filterChip,
              cardsFilter === "red"
                ? styles.filterChipActive
                : { backgroundColor: surface[1], borderColor: border.subtle },
            ]}
            haptic="selection"
          >
            <Text
              style={[
                styles.filterChipText,
                cardsFilter === "red" && styles.filterChipTextActive,
                cardsFilter !== "red" && { color: textRole.secondary },
              ]}
            >
              Most red
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => setCardsFilter("rate")}
            style={[
              styles.filterChip,
              cardsFilter === "rate"
                ? styles.filterChipActive
                : { backgroundColor: surface[1], borderColor: border.subtle },
            ]}
            haptic="selection"
          >
            <Text
              style={[
                styles.filterChipText,
                cardsFilter === "rate" && styles.filterChipTextActive,
                cardsFilter !== "rate" && { color: textRole.secondary },
              ]}
            >
              Highest rate
            </Text>
          </PressableScale>
        </ScrollView>
      )}

      {activeTab === "transfers" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContent}
          style={styles.filterChipsScroll}
        >
          <PressableScale
            onPress={() => setTransferFilter("all")}
            style={[
              styles.filterChip,
              transferFilter === "all"
                ? styles.filterChipActive
                : { backgroundColor: surface[1], borderColor: border.subtle },
            ]}
            haptic="selection"
          >
            <Text
              style={[
                styles.filterChipText,
                transferFilter === "all" && styles.filterChipTextActive,
                transferFilter !== "all" && { color: textRole.secondary },
              ]}
            >
              All
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => setTransferFilter("in")}
            style={[
              styles.filterChip,
              transferFilter === "in"
                ? styles.filterChipActive
                : { backgroundColor: surface[1], borderColor: border.subtle },
            ]}
            haptic="selection"
          >
            <Text
              style={[
                styles.filterChipText,
                transferFilter === "in" && styles.filterChipTextActive,
                transferFilter !== "in" && { color: textRole.secondary },
              ]}
            >
              Incoming
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => setTransferFilter("out")}
            style={[
              styles.filterChip,
              transferFilter === "out"
                ? styles.filterChipActive
                : { backgroundColor: surface[1], borderColor: border.subtle },
            ]}
            haptic="selection"
          >
            <Text
              style={[
                styles.filterChipText,
                transferFilter === "out" && styles.filterChipTextActive,
                transferFilter !== "out" && { color: textRole.secondary },
              ]}
            >
              Outgoing
            </Text>
          </PressableScale>
        </ScrollView>
      )}

      {activeTab === "standings" && (
        <View style={[tStyles.headerRow, { borderBottomColor: border.subtle }]}>
          <View style={tStyles.posCol}>
            <Text style={[tStyles.headerText, { color: textRole.tertiary }]}>#</Text>
          </View>
          <View style={{ width: 30 }} />
          <Text style={[tStyles.headerText, { flex: 1, marginLeft: 6, color: textRole.tertiary }]}>
            Team
          </Text>
          <Text style={[tStyles.headerText, tStyles.statCell, { color: textRole.tertiary }]}>
            P
          </Text>
          <Text style={[tStyles.headerText, tStyles.statCell, { color: textRole.tertiary }]}>
            W
          </Text>
          <Text style={[tStyles.headerText, tStyles.statCell, { color: textRole.tertiary }]}>
            D
          </Text>
          <Text style={[tStyles.headerText, tStyles.statCell, { color: textRole.tertiary }]}>
            L
          </Text>
          <View
            style={[
              tStyles.statCell,
              tStyles.gdCell,
              { flexDirection: "row", alignItems: "center", gap: 2 },
            ]}
          >
            <Text style={[tStyles.headerText, { color: textRole.tertiary }]}>GD</Text>
            <HelpTip term="gd" iconSize={10} />
          </View>
          <View style={tStyles.ptsHeaderContainer}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={[tStyles.headerText, { color: textRole.tertiary }]}>Pts</Text>
              <HelpTip term="pts" iconSize={10} />
            </View>
          </View>
          <View style={tStyles.formCol}>
            <Text style={[tStyles.headerText, { color: textRole.tertiary }]}>Last 5</Text>
          </View>
        </View>
      )}
    </View>
  );

  const keyExtractor = useCallback(
    (item: any, idx: number) => {
      if (activeTab === "standings") return (item as StandingRow).team.id + "_" + idx;
      if (activeTab === "injuries" && item._type === "teamHeader") return item._id;
      if (activeTab === "transfers" && item._type === "windowHeader") return item._id;
      if (activeTab === "scorers") return (item as TopScorer).playerName + "_" + idx;
      return (item.playerName || item._id || "") + "_" + idx;
    },
    [activeTab],
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (activeTab === "standings") {
      return <StandingRowItem row={item as StandingRow} index={index} leagueId={id} />;
    }
    if (activeTab === "scorers") {
      return <ScorerRowItem scorer={item as TopScorer} index={index} onPress={setSelectedPlayer} />;
    }
    if (activeTab === "assists") {
      return (
        <PlayerStatRow
          item={item}
          index={index}
          statValue={item.assists}
          statIcon="hand-left"
          isCards={false}
          onPress={setSelectedPlayer}
        />
      );
    }
    if (activeTab === "cards") {
      return <DisciplineRow item={item} index={index} onPress={setSelectedPlayer} />;
    }
    if (activeTab === "injuries") {
      if (item._type === "teamHeader") {
        return <InjuryTeamHeader teamInfo={item.teamInfo} />;
      }
      return <InjuryRow item={item} index={index} onPress={setSelectedPlayer} />;
    }
    if (activeTab === "transfers") {
      if (item._type === "windowHeader") {
        return <TransferWindowHeader label={item.label} />;
      }
      return <TransferRow item={item} index={index} />;
    }
    return <TransferRow item={item} index={index} />;
  };

  if (!league) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: surface[0] }]}>
        <Ionicons name="alert-circle-outline" size={48} color={textRole.tertiary} />
        <Text style={[styles.errorText, { color: textRole.secondary }]}>League not found</Text>
        <PressableScale onPress={() => router.back()} style={styles.backLink} haptic="light">
          <Text style={[styles.backLinkText, { color: accent.primary }]}>Go back</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: surface[0] }]}>
      <FlatList
        data={currentData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={headerContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonContainer}>
              {activeTab === "standings" && <SkeletonStandingRow count={10} />}
              {activeTab === "scorers" && <SkeletonPlayerRow count={8} />}
              {activeTab === "assists" && <SkeletonPlayerRow count={8} />}
              {activeTab === "cards" && <SkeletonPlayerRow count={8} />}
              {activeTab === "injuries" && <SkeletonPlayerRow count={5} />}
              {activeTab === "transfers" && <SkeletonTransferRow count={5} />}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="football-outline" size={40} color={textRole.tertiary} />
              <Text style={[styles.emptyText, { color: textRole.tertiary }]}>
                No data available
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
      />
      <PlayerProfileSheet
        visible={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        player={selectedPlayer}
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
  leagueInfo: { alignItems: "center", marginTop: 16, gap: 10 },
  leagueIconWell: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  leagueLogo: {
    width: 56,
    height: 56,
  },
  leagueName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  seasonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  leagueCountry: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },

  // Tabs
  tabScroll: {
    marginTop: 16,
    marginBottom: 4,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  tabChipActive: {
    backgroundColor: accent.primary,
    borderColor: accent.primary,
  },
  tabText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  // Card filter chips
  filterChipsScroll: {
    marginTop: 8,
    marginBottom: 12,
  },
  filterChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  filterChipActive: {
    borderColor: accent.primary,
    backgroundColor: "rgba(0, 166, 81, 0.08)",
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  filterChipTextActive: {
    color: accent.primary,
  },

  // Transfer sub-tabs (for In/Out toggle)
  subTabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  subTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  subTabActive: {
    borderColor: accent.primary,
    backgroundColor: "rgba(0, 166, 81, 0.08)",
  },
  subTabText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  subTabTextActive: {
    color: accent.primary,
  },

  empty: {
    alignItems: "center",
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  skeletonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});

// Standings table styles
const tStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase" as const,
    textAlign: "center" as const,
    letterSpacing: 0.5,
  },
  posCol: { width: 32, alignItems: "center" },
  statCell: {
    width: 26,
    textAlign: "center" as const,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  gdCell: { width: 30 },
  ptsHeaderContainer: {
    width: 30,
    alignItems: "center",
  },
  formCol: { flexDirection: "row", gap: 3, width: 55, justifyContent: "center" },
});
