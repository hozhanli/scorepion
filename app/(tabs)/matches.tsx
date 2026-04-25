/**
 * Matches Screen — Emerald Minimalism.
 *
 * Unified ScreenHeader + FilterSegmented control + breathing date sections.
 * Match cards use the canonical MatchCard primitive.
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  RefreshControl,
  Image,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
// Animated import removed — tab screen renders instantly, no entry animations
import Colors, { accent, type as typeTok, radii } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { MatchCard } from "@/components/MatchCard";
import { ScreenHeader, FilterSegmented, PressableScale, EmptyState } from "@/components/ui";
import { Match } from "@/lib/types";
import { getCollapsedSections, saveCollapsedSections } from "@/lib/storage";
import { getLocalDateKey, getUserTimezone } from "@/lib/datetime";
import { useFilterPersistence } from "@/lib/hooks/useFilterPersistence";

type FilterType = "all" | "live" | "upcoming" | "finished";

function getSmartDateLabel(
  dateKey: string,
  t: any,
  tt: (s: string, v?: Record<string, string | number>) => string,
  locale: string,
): { label: string; sub: string; isToday: boolean } {
  // Parse the dateKey (YYYY-MM-DD in local timezone)
  const [year, month, day] = dateKey.split("-").map(Number);
  const target = new Date(year, month - 1, day);

  // Get today in local timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: getUserTimezone(),
  });
  const todayStr = formatter.format(now);
  const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
  const today = new Date(todayYear, todayMonth - 1, todayDay);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  const weekdayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: getUserTimezone(),
  }).format(target);
  const monthDayLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: getUserTimezone(),
  }).format(target);
  const fullDateLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: getUserTimezone(),
  }).format(target);

  if (diffDays === 0) return { label: t.matches.today, sub: monthDayLabel, isToday: true };
  if (diffDays === 1) return { label: t.matches.tomorrow, sub: monthDayLabel, isToday: false };
  if (diffDays === -1) return { label: t.matches.yesterday, sub: monthDayLabel, isToday: false };
  if (diffDays > 1 && diffDays <= 6)
    return { label: weekdayLabel, sub: monthDayLabel, isToday: false };
  if (diffDays < -1 && diffDays >= -6) {
    return {
      label: tt(t.matches.lastWeekday, { weekday: weekdayLabel }),
      sub: monthDayLabel,
      isToday: false,
    };
  }
  return { label: weekdayLabel, sub: fullDateLabel, isToday: false };
}

type ListItem =
  | {
      type: "date-header";
      dateKey: string;
      label: string;
      sub: string;
      isToday: boolean;
      matchCount: number;
    }
  | {
      type: "league-header";
      leagueName: string;
      leagueId: string;
      leagueLogo: string | null;
      leagueColor: string;
      matchCount: number;
      isCollapsed: boolean;
      dateKey: string;
    }
  | { type: "match"; match: Match };

export default function FixturesScreen() {
  const { colors, surface, textRole, border } = useTheme();
  const { t, tt, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { matches, leagues, predictions, refreshData } = useApp();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useFilterPersistence<string>("matches.search", "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  // Rehydration guard — we must not persist the empty initial Set on first
  // render, otherwise we would overwrite the user's saved keys before the
  // AsyncStorage read completes.
  const hydrated = useRef(false);

  // Load persisted collapsed section keys on mount. Surfaced after Round 2's
  // Sven diary ("Bundesliga-only filter does not survive app restart").
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const keys = await getCollapsedSections();
        if (!cancelled && Array.isArray(keys) && keys.length > 0) {
          setCollapsedSections(new Set(keys));
        }
      } catch {
        // Swallow — a failed load is non-fatal; user starts with no collapses.
      } finally {
        hydrated.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist any subsequent change. Fire-and-forget; errors are non-fatal.
  useEffect(() => {
    if (!hydrated.current) return;
    void saveCollapsedSections(Array.from(collapsedSections));
  }, [collapsedSections]);

  // Debounce search input — 200ms delay
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const filteredMatches = useMemo(() => {
    if (filter === "all") return matches;
    return matches.filter((m) => m.status === filter);
  }, [matches, filter]);

  // Apply search filter on top of segmented status filter
  const searchFilteredMatches = useMemo(() => {
    if (!debouncedSearch) return filteredMatches;
    return filteredMatches.filter((m) => {
      const home = m.homeTeam?.name?.toLowerCase() ?? "";
      const away = m.awayTeam?.name?.toLowerCase() ?? "";
      const league = m.league?.name?.toLowerCase() ?? "";
      return (
        home.includes(debouncedSearch) ||
        away.includes(debouncedSearch) ||
        league.includes(debouncedSearch)
      );
    });
  }, [filteredMatches, debouncedSearch]);

  // When search is active, override collapsed state to expand all
  const effectiveCollapsed = debouncedSearch ? new Set<string>() : collapsedSections;

  const listData = useMemo(() => {
    const byDate: Record<string, Match[]> = {};
    searchFilteredMatches.forEach((m) => {
      const dk = getLocalDateKey(m.kickoff);
      if (!byDate[dk]) byDate[dk] = [];
      byDate[dk].push(m);
    });

    const sortedDates = Object.keys(byDate).sort((a, b) => {
      const todayKey = getLocalDateKey(new Date());
      if (a === todayKey) return -1;
      if (b === todayKey) return 1;
      const aFuture = a >= todayKey;
      const bFuture = b >= todayKey;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      if (aFuture && bFuture) return a.localeCompare(b);
      return b.localeCompare(a);
    });

    const items: ListItem[] = [];

    sortedDates.forEach((dateKey) => {
      const dateMatches = byDate[dateKey];
      const { label, sub, isToday } = getSmartDateLabel(dateKey, t, tt, language);

      items.push({
        type: "date-header",
        dateKey,
        label,
        sub,
        isToday,
        matchCount: dateMatches.length,
      });

      const isDateCollapsed = effectiveCollapsed.has(`date_${dateKey}`);
      if (isDateCollapsed) return;

      const byLeague: Record<string, Match[]> = {};
      const leagueOrder: string[] = [];
      dateMatches.forEach((m) => {
        if (!byLeague[m.league.name]) {
          byLeague[m.league.name] = [];
          leagueOrder.push(m.league.name);
        }
        byLeague[m.league.name].push(m);
      });

      leagueOrder.forEach((leagueName) => {
        const leagueMatches = byLeague[leagueName];
        const league = leagues.find((l) => l.name === leagueName);
        const leagueId = league?.id || "";
        const leagueLogo = league?.logo || null;
        const collapseKey = `league_${dateKey}_${leagueName}`;
        const isLeagueCollapsed = effectiveCollapsed.has(collapseKey);

        items.push({
          type: "league-header",
          leagueName,
          leagueId,
          leagueLogo,
          leagueColor: league?.color || Colors.palette.emerald,
          matchCount: leagueMatches.length,
          isCollapsed: isLeagueCollapsed,
          dateKey,
        });

        if (isLeagueCollapsed) return;

        const sorted = [...leagueMatches].sort(
          (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
        );
        sorted.forEach((match) => items.push({ type: "match", match }));
      });
    });

    return items;
  }, [searchFilteredMatches, effectiveCollapsed, leagues, t, tt, language]);

  const liveCount = matches.filter((m) => m.status === "live").length;

  // Helper to extract all section keys from the current list for collapse-all/expand-all
  const getAllSectionKeys = useCallback((): string[] => {
    const keys: string[] = [];
    const byDate: Record<string, Match[]> = {};
    searchFilteredMatches.forEach((m) => {
      const dk = getLocalDateKey(m.kickoff);
      if (!byDate[dk]) byDate[dk] = [];
      byDate[dk].push(m);
    });

    Object.keys(byDate).forEach((dateKey) => {
      keys.push(`date_${dateKey}`);

      const dateMatches = byDate[dateKey];
      const byLeague: Record<string, Match[]> = {};
      const leagueOrder: string[] = [];
      dateMatches.forEach((m) => {
        if (!byLeague[m.league.name]) {
          byLeague[m.league.name] = [];
          leagueOrder.push(m.league.name);
        }
        byLeague[m.league.name].push(m);
      });

      leagueOrder.forEach((leagueName) => {
        keys.push(`league_${dateKey}_${leagueName}`);
      });
    });

    return keys;
  }, [searchFilteredMatches]);

  const handleCollapseAll = useCallback(async () => {
    const keys = getAllSectionKeys();
    const nextSet = new Set(keys);
    setCollapsedSections(nextSet);
  }, [getAllSectionKeys]);

  const handleExpandAll = useCallback(async () => {
    setCollapsedSections(new Set());
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const filters: {
    key: FilterType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    count?: number;
  }[] = [
    { key: "all", label: t.matches.all, icon: "football-outline" },
    { key: "live", label: t.matches.live, icon: "radio-outline", count: liveCount },
    { key: "upcoming", label: t.matches.upcoming, icon: "time-outline" },
    { key: "finished", label: t.matches.finished, icon: "checkmark-done-outline" },
  ];

  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const upcomingCount = matches.filter((m) => m.status === "upcoming").length;

  const renderItem = useCallback(
    ({ item, index }: { item: ListItem; index: number }) => {
      if (item.type === "date-header") {
        const isCollapsed = effectiveCollapsed.has(`date_${item.dateKey}`);
        return (
          <PressableScale
            onPress={() => toggleCollapse(`date_${item.dateKey}`)}
            haptic="selection"
            pressedScale={0.99}
            accessibilityRole="button"
            accessibilityLabel={isCollapsed ? t.a11y.expand : t.a11y.collapse}
            accessibilityState={{ expanded: !isCollapsed }}
          >
            <View style={[styles.dateHeader, index > 0 && styles.dateHeaderSpaced]}>
              <View style={styles.dateHeaderLeft}>
                <Text
                  style={[
                    styles.dateLabel,
                    { color: item.isToday ? accent.primary : textRole.primary },
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={[styles.dateSub, { color: textRole.tertiary }]}>· {item.sub}</Text>
              </View>
              <View style={styles.dateHeaderRight}>
                <Text style={[styles.matchCountText, { color: textRole.tertiary }]}>
                  {item.matchCount} {item.matchCount === 1 ? t.matches.match : t.matches.matches}
                </Text>
                <Ionicons
                  name={isCollapsed ? "chevron-down" : "chevron-up"}
                  size={15}
                  color={textRole.tertiary}
                />
              </View>
            </View>
          </PressableScale>
        );
      }

      if (item.type === "league-header") {
        const collapseKey = `league_${item.dateKey}_${item.leagueName}`;
        return (
          <PressableScale
            onPress={() => toggleCollapse(collapseKey)}
            haptic="selection"
            pressedScale={0.99}
            style={styles.leagueHeader}
          >
            {item.leagueLogo ? (
              <Image
                source={{ uri: item.leagueLogo }}
                style={styles.leagueLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.leagueDot, { backgroundColor: item.leagueColor }]} />
            )}
            <Text style={[styles.leagueName, { color: textRole.secondary }]}>
              {item.leagueName}
            </Text>
            <Text style={[styles.leagueCount, { color: textRole.tertiary }]}>
              {item.matchCount}
            </Text>
            <PressableScale
              onPress={() => {
                const league = leagues.find((l) => l.id === item.leagueId);
                if (league) router.push({ pathname: "/league/[id]", params: { id: league.id } });
              }}
              haptic="light"
              pressedScale={0.9}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.a11y.viewLeague + " " + item.leagueName}
            >
              <Ionicons name="chevron-forward" size={14} color={textRole.tertiary} />
            </PressableScale>
            <Ionicons
              name={item.isCollapsed ? "chevron-down" : "chevron-up"}
              size={13}
              color={textRole.tertiary}
            />
          </PressableScale>
        );
      }

      return (
        <MatchCard
          match={item.match}
          prediction={predictions[item.match.id]}
          onPress={() => router.push({ pathname: "/match/[id]", params: { id: item.match.id } })}
          index={index}
        />
      );
    },
    [predictions, toggleCollapse, effectiveCollapsed, leagues, textRole, t],
  );

  const getItemKey = useCallback((item: ListItem, index: number) => {
    if (item.type === "date-header") return `dh_${item.dateKey}`;
    if (item.type === "league-header") return `lh_${item.dateKey}_${item.leagueName}`;
    return `m_${item.match.id}`;
  }, []);

  // Determine which empty state to show
  const showSearchEmpty = debouncedSearch.length > 0 && searchFilteredMatches.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: surface[1], paddingTop: topPad }]}>
      <ScreenHeader
        title={t.matches.title}
        subtitle={tt(t.matches.subtitle, { upcoming: upcomingCount, live: liveCount })}
        showLogo
      />

      <View style={styles.filterWrap}>
        <FilterSegmented
          items={filters.map((f) => ({
            value: f.key,
            label: f.label,
            count: f.count,
          }))}
          value={filter}
          onChange={(v) => setFilter(v as FilterType)}
        />
      </View>

      {/* Toolbar: Search + Collapse/Expand (single row) */}
      <View style={styles.toolbarWrap}>
        <View style={styles.toolbarRow}>
          <View
            style={[
              styles.searchInputWrap,
              { backgroundColor: surface[2], borderColor: border.subtle },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={textRole.tertiary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: textRole.primary }]}
              placeholder={t.matches.searchPlaceholder}
              placeholderTextColor={textRole.tertiary}
              value={search}
              onChangeText={setSearch}
              accessible
              accessibilityLabel={t.matches.searchA11y}
            />
            {search.length > 0 && (
              <PressableScale
                onPress={() => setSearch("")}
                haptic="light"
                pressedScale={0.8}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t.matches.clearSearch}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={textRole.tertiary}
                  style={styles.searchClear}
                />
              </PressableScale>
            )}
          </View>

          {/* Collapse / Expand */}
          <View style={styles.collapseExpand}>
            <PressableScale
              onPress={handleCollapseAll}
              haptic="light"
              pressedScale={0.9}
              style={[
                styles.collapseBtn,
                { backgroundColor: surface[2], borderColor: border.subtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t.matches.collapseAll}
            >
              <Ionicons name="chevron-up-outline" size={16} color={textRole.secondary} />
            </PressableScale>
            <PressableScale
              onPress={handleExpandAll}
              haptic="light"
              pressedScale={0.9}
              style={[
                styles.collapseBtn,
                { backgroundColor: surface[2], borderColor: border.subtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t.matches.expandAll}
            >
              <Ionicons name="chevron-down-outline" size={16} color={textRole.secondary} />
            </PressableScale>
          </View>
        </View>
      </View>

      {/* Search Empty State */}
      {showSearchEmpty && (
        <View style={styles.empty}>
          <View style={styles.emptyContent}>
            <Ionicons
              name="search-outline"
              size={40}
              color={textRole.tertiary}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: textRole.primary }]}>
              {t.matches.noMatches}
            </Text>
            <Text style={[styles.emptyText, { color: textRole.tertiary }]}>
              {tt(t.matches.noMatchesForQuery, { query: debouncedSearch })}
            </Text>
            <PressableScale
              onPress={() => setSearch("")}
              haptic="light"
              pressedScale={0.95}
              style={[styles.clearBtn, { backgroundColor: accent.primary }]}
              accessibilityRole="button"
            >
              <Text style={[styles.clearBtnText, { color: "#FFFFFF" }]}>
                {t.matches.clearSearch}
              </Text>
            </PressableScale>
          </View>
        </View>
      )}

      {/* Normal List */}
      {!showSearchEmpty && (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={getItemKey}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 110 : 120 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.palette.emerald}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <EmptyState
                icon="football-outline"
                title={
                  filter === "live"
                    ? t.matches.noLive
                    : filter === "finished"
                      ? t.matches.noFinished
                      : filter === "upcoming"
                        ? t.matches.noUpcoming
                        : t.matches.noMatches
                }
                subtitle={filter === "all" ? t.matches.pullToRefresh : t.matches.tryDifferentFilter}
              />
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterWrap: {
    paddingHorizontal: 20,
    marginTop: -4,
    marginBottom: 16,
  },
  toolbarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: typeTok.body.size,
    fontFamily: typeTok.body.family,
  },
  searchClear: {
    marginLeft: 4,
  },
  collapseExpand: {
    flexDirection: "row",
    gap: 8,
  },
  collapseBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
    marginTop: 12,
  },
  clearBtnText: {
    fontSize: typeTok.caption.size,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingTop: 8,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dateHeaderSpaced: {
    marginTop: 8,
  },
  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    flex: 1,
  },
  dateLabel: {
    fontSize: typeTok.h3.size,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  dateSub: {
    fontSize: typeTok.caption.size,
    fontFamily: typeTok.caption.family,
  },
  dateHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchCountText: {
    fontSize: typeTok.micro.size,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginBottom: 4,
  },
  leagueLogo: {
    width: 18,
    height: 18,
  },
  leagueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueName: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  leagueCount: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginRight: 4,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    flex: 1,
  },
  emptyContent: {
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 280,
  },
});
