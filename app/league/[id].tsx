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
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, FlatList, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { accent, radii } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getLeagueById, StandingRow, TopScorer } from '@/lib/mock-data';
import {
  useFootballStandings,
  useFootballTopScorers,
  useFootballTopAssists,
  useFootballTopYellowCards,
  useFootballTopRedCards,
  useFootballInjuries,
  useFootballTransfers,
} from '@/lib/football-api';
import { formatLocalDate } from '@/lib/datetime';
import { PressableScale } from '@/components/ui/PressableScale';

type TabType = 'standings' | 'scorers' | 'assists' | 'cards' | 'injuries' | 'transfers';

const TAB_CONFIG: { key: TabType; label: string; icon: string; iconOutline: string }[] = [
  { key: 'standings', label: 'Table', icon: 'list', iconOutline: 'list-outline' },
  { key: 'scorers', label: 'Goals', icon: 'football', iconOutline: 'football-outline' },
  { key: 'assists', label: 'Assists', icon: 'hand-left', iconOutline: 'hand-left-outline' },
  { key: 'cards', label: 'Cards', icon: 'card', iconOutline: 'card-outline' },
  { key: 'injuries', label: 'Injuries', icon: 'medkit', iconOutline: 'medkit-outline' },
  { key: 'transfers', label: 'Transfers', icon: 'swap-horizontal', iconOutline: 'swap-horizontal-outline' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Standings row

function StandingRowItem({ row, index }: { row: StandingRow; index: number }) {
  const { surface, border, textRole } = useTheme();
  const isTop4 = row.position <= 4;
  const isBottom2 = row.position >= 7;

  return (
    <View style={[tStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }]}>
        <View style={tStyles.posCol}>
          <View style={[
            tStyles.posBadge,
            { backgroundColor: surface[2] },
            isTop4 && tStyles.posBadgeTop,
            isBottom2 && tStyles.posBadgeBottom,
          ]}>
            <Text style={[
              tStyles.posText,
              { color: textRole.secondary },
              isTop4 && tStyles.posTextTop,
              isBottom2 && tStyles.posTextBottom,
            ]}>{row.position}</Text>
          </View>
        </View>
        {row.team.logo ? (
          <Image source={{ uri: row.team.logo }} style={tStyles.teamLogo} resizeMode="contain" />
        ) : (
          <View style={[tStyles.teamCircle, { backgroundColor: surface[2] }]}>
            <Text style={[tStyles.teamCircleText, { color: textRole.primary }]}>{row.team.shortName.charAt(0)}</Text>
          </View>
        )}
        <Text style={[tStyles.teamName, { color: textRole.primary }]} numberOfLines={1}>{row.team.name}</Text>
        <Text style={[tStyles.statCell, { color: textRole.secondary }]}>{row.played}</Text>
        <Text style={[tStyles.statCell, { color: textRole.secondary }]}>{row.won}</Text>
        <Text style={[tStyles.statCell, { color: textRole.secondary }]}>{row.drawn}</Text>
        <Text style={[tStyles.statCell, { color: textRole.secondary }]}>{row.lost}</Text>
        <Text style={[
          tStyles.statCell,
          tStyles.gdCell,
          { color: textRole.secondary },
          row.goalDifference > 0 && tStyles.gdPositive,
          row.goalDifference < 0 && tStyles.gdNegative,
        ]}>
          {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
        </Text>
        <View style={tStyles.ptsContainer}>
          <Text style={[tStyles.ptsCell, { color: textRole.primary }]}>{row.points}</Text>
        </View>
        <View style={tStyles.formCol}>
          {row.form.map((f, i) => (
            <View key={i} style={[
              tStyles.formDot,
              { backgroundColor: surface[2] },
              f === 'W' && tStyles.formWin,
              f === 'D' && tStyles.formDraw,
              f === 'L' && tStyles.formLoss,
            ]} />
          ))}
        </View>
      </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player stat rows (scorers / assists / cards)

function ScorerRowItem({ scorer, index }: { scorer: TopScorer; index: number }) {
  const { surface, border, textRole } = useTheme();
  const isLeader = scorer.rank === 1;

  return (
    <View style={[sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }]}>
        <View style={sStyles.rankCol}>
          <Text style={[sStyles.rankText, { color: textRole.tertiary }, isLeader && sStyles.rankTextLeader]}>
            {scorer.rank}
          </Text>
        </View>
        {scorer.playerPhoto ? (
          <Image source={{ uri: scorer.playerPhoto }} style={[sStyles.playerPhoto, { backgroundColor: surface[2] }]} resizeMode="cover" />
        ) : scorer.team.logo ? (
          <Image source={{ uri: scorer.team.logo }} style={sStyles.teamBadgeImg} resizeMode="contain" />
        ) : (
          <View style={[sStyles.teamBadge, { backgroundColor: surface[2] }]}>
            <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>{scorer.team.shortName.charAt(0)}</Text>
          </View>
        )}
        <View style={sStyles.playerInfo}>
          <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>{scorer.playerName}</Text>
          <Text style={[sStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>{scorer.team.name}</Text>
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

function PlayerStatRow({ item, index, statValue, statIcon }: {
  item: any; index: number; statValue: number; statIcon: string;
}) {
  const { surface, border, textRole } = useTheme();
  const rank = item.rank || index + 1;
  const isLeader = rank === 1;

  return (
    <View style={[sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }]}>
        <View style={sStyles.rankCol}>
          <Text style={[sStyles.rankText, { color: textRole.tertiary }, isLeader && sStyles.rankTextLeader]}>
            {rank}
          </Text>
        </View>
        {item.playerPhoto ? (
          <Image source={{ uri: item.playerPhoto }} style={[sStyles.playerPhoto, { backgroundColor: surface[2] }]} resizeMode="cover" />
        ) : item.team?.logo ? (
          <Image source={{ uri: item.team.logo }} style={sStyles.teamBadgeImg} resizeMode="contain" />
        ) : (
          <View style={[sStyles.teamBadge, { backgroundColor: surface[2] }]}>
            <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>{(item.team?.shortName || '?').charAt(0)}</Text>
          </View>
        )}
        <View style={sStyles.playerInfo}>
          <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>{item.playerName}</Text>
          <Text style={[sStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>{item.team?.name || ''}</Text>
        </View>
        <View style={sStyles.statsCol}>
          <View style={[sStyles.goalBubble, isLeader && sStyles.goalBubbleLeader]}>
            <Ionicons name={statIcon as keyof typeof Ionicons.glyphMap} size={14} color={accent.primary} />
            <Text style={sStyles.goalCount}>{statValue}</Text>
          </View>
          <Text style={[sStyles.assistText, { color: textRole.tertiary }]}>{item.matches || 0} apps</Text>
        </View>
      </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Injuries & transfers rows

function InjuryRow({ item, index }: { item: any; index: number }) {
  const { surface, border, textRole } = useTheme();

  return (
    <View style={[sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }]}>
        {item.playerPhoto ? (
          <Image source={{ uri: item.playerPhoto }} style={[sStyles.playerPhoto, { marginLeft: 0, backgroundColor: surface[2] }]} resizeMode="cover" />
        ) : item.team?.logo ? (
          <Image source={{ uri: item.team.logo }} style={[sStyles.teamBadgeImg, { marginLeft: 0 }]} resizeMode="contain" />
        ) : (
          <View style={[sStyles.teamBadge, { marginLeft: 0, backgroundColor: surface[2] }]}>
            <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>{(item.team?.shortName || '?').charAt(0)}</Text>
          </View>
        )}
        <View style={[sStyles.playerInfo, { marginLeft: 12 }]}>
          <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>{item.playerName}</Text>
          <Text style={[sStyles.playerTeam, { color: textRole.tertiary }]} numberOfLines={1}>{item.team?.name || ''}</Text>
        </View>
        <View style={sStyles.statsCol}>
          <View style={injStyles.typeBadge}>
            <Ionicons name="medkit" size={11} color={accent.alert} />
            <Text style={injStyles.typeText} numberOfLines={1}>
              {item.type || 'Injury'}
            </Text>
          </View>
          <Text style={[sStyles.assistText, { color: textRole.tertiary }]} numberOfLines={1}>{item.reason || ''}</Text>
        </View>
      </View>
  );
}

function TransferRow({ item, index }: { item: any; index: number }) {
  const { surface, border, textRole } = useTheme();

  return (
    <View style={[sStyles.row, { backgroundColor: surface[0], borderColor: border.subtle }]}>
        {item.playerPhoto ? (
          <Image source={{ uri: item.playerPhoto }} style={[sStyles.playerPhoto, { marginLeft: 0, backgroundColor: surface[2] }]} resizeMode="cover" />
        ) : (
          <View style={[sStyles.teamBadge, { marginLeft: 0, backgroundColor: surface[2] }]}>
            <Text style={[sStyles.teamBadgeText, { color: textRole.primary }]}>?</Text>
          </View>
        )}
        <View style={[sStyles.playerInfo, { marginLeft: 12, flex: 1 }]}>
          <Text style={[sStyles.playerName, { color: textRole.primary }]} numberOfLines={1}>{item.playerName}</Text>
          <View style={trStyles.transferFlow}>
            <View style={trStyles.teamRow}>
              {item.teamOut?.logo ? (
                <Image source={{ uri: item.teamOut.logo }} style={trStyles.miniLogo} resizeMode="contain" />
              ) : null}
              <Text style={[trStyles.teamOutText, { color: textRole.tertiary }]} numberOfLines={1}>{item.teamOut?.name || 'Free'}</Text>
            </View>
            <Ionicons name="arrow-forward" size={11} color={accent.primary} />
            <View style={trStyles.teamRow}>
              {item.teamIn?.logo ? (
                <Image source={{ uri: item.teamIn.logo }} style={trStyles.miniLogo} resizeMode="contain" />
              ) : null}
              <Text style={[trStyles.teamInText, { color: accent.primary }]} numberOfLines={1}>{item.teamIn?.name || 'Free'}</Text>
            </View>
          </View>
        </View>
        <View style={sStyles.statsCol}>
          <View style={[trStyles.typeBadge, { backgroundColor: surface[2] }]}>
            <Text style={[trStyles.typeText, { color: textRole.secondary }]} numberOfLines={1}>{item.type || 'N/A'}</Text>
          </View>
          {item.date ? <Text style={[sStyles.assistText, { color: textRole.tertiary }]}>{formatLocalDate(item.date)}</Text> : null}
        </View>
      </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { surface, border, textRole } = useTheme();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [cardSubTab, setCardSubTab] = useState<'yellow' | 'red'>('yellow');

  const league = useMemo(() => getLeagueById(id || ''), [id]);
  const { data: standings = [], isLoading: standingsLoading } = useFootballStandings(id || '');
  const { data: scorers = [], isLoading: scorersLoading } = useFootballTopScorers(id || '');
  const { data: assists = [], isLoading: assistsLoading } = useFootballTopAssists(id || '');
  const { data: yellowCards = [], isLoading: yellowLoading } = useFootballTopYellowCards(id || '');
  const { data: redCards = [], isLoading: redLoading } = useFootballTopRedCards(id || '');
  const { data: injuries = [], isLoading: injuriesLoading } = useFootballInjuries(id || '');
  const { data: transfers = [], isLoading: transfersLoading } = useFootballTransfers(id || '');

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

  const isLoading = activeTab === 'standings' ? standingsLoading
    : activeTab === 'scorers' ? scorersLoading
    : activeTab === 'assists' ? assistsLoading
    : activeTab === 'cards' ? (cardSubTab === 'yellow' ? yellowLoading : redLoading)
    : activeTab === 'injuries' ? injuriesLoading
    : transfersLoading;

  const currentData = activeTab === 'standings' ? standings
    : activeTab === 'scorers' ? scorers
    : activeTab === 'assists' ? assists
    : activeTab === 'cards' ? (cardSubTab === 'yellow' ? yellowCards : redCards)
    : activeTab === 'injuries' ? injuries
    : transfers;

  const headerContent = (
    <View>
      <View style={[styles.hero, { paddingTop: topPad + 12, backgroundColor: surface[0], borderBottomColor: border.subtle }]}>
        <View style={styles.navRow}>
          <PressableScale onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: surface[1], borderColor: border.subtle }]} haptic="light">
            <Ionicons name="chevron-back" size={22} color={textRole.primary} />
          </PressableScale>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.leagueInfo}>
          <View style={styles.leagueIconWell}>
            <Ionicons name={league.icon as keyof typeof Ionicons.glyphMap} size={36} color={accent.primary} />
          </View>
          <Text style={styles.leagueName}>{league.name}</Text>
          <View style={styles.seasonPill}>
            <Ionicons name="calendar-outline" size={11} color={textRole.tertiary} />
            <Text style={styles.leagueCountry}>{league.country} · 2025/26 Season</Text>
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
                !active && { backgroundColor: surface[1], borderColor: border.subtle }
              ]}
              haptic="selection"
              pressedScale={0.97}
            >
              <Ionicons
                name={(active ? tab.icon : tab.iconOutline) as keyof typeof Ionicons.glyphMap}
                size={14}
                color={active ? '#FFFFFF' : textRole.secondary}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive, !active && { color: textRole.secondary }]}>
                {tab.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {activeTab === 'cards' && (
        <View style={styles.subTabRow}>
          <PressableScale
            onPress={() => setCardSubTab('yellow')}
            style={[
              styles.subTab,
              cardSubTab === 'yellow' ? styles.subTabActive : { backgroundColor: surface[1], borderColor: border.subtle }
            ]}
            haptic="selection"
          >
            <Ionicons name="card" size={12} color={cardSubTab === 'yellow' ? accent.primary : textRole.secondary} />
            <Text style={[styles.subTabText, cardSubTab === 'yellow' && styles.subTabTextActive, cardSubTab !== 'yellow' && { color: textRole.secondary }]}>Yellow</Text>
          </PressableScale>
          <PressableScale
            onPress={() => setCardSubTab('red')}
            style={[
              styles.subTab,
              cardSubTab === 'red' ? styles.subTabActive : { backgroundColor: surface[1], borderColor: border.subtle }
            ]}
            haptic="selection"
          >
            <Ionicons name="card" size={12} color={cardSubTab === 'red' ? accent.primary : textRole.secondary} />
            <Text style={[styles.subTabText, cardSubTab === 'red' && styles.subTabTextActive, cardSubTab !== 'red' && { color: textRole.secondary }]}>Red</Text>
          </PressableScale>
        </View>
      )}

      {activeTab === 'standings' && (
        <View style={[tStyles.headerRow, { borderBottomColor: border.subtle }]}>
          <View style={tStyles.posCol}><Text style={[tStyles.headerText, { color: textRole.tertiary }]}>#</Text></View>
          <View style={{ width: 30 }} />
          <Text style={[tStyles.headerText, { flex: 1, marginLeft: 6, color: textRole.tertiary }]}>Team</Text>
          <Text style={[tStyles.headerText, tStyles.statCell, { color: textRole.tertiary }]}>P</Text>
          <Text style={[tStyles.headerText, tStyles.statCell, { color: textRole.tertiary }]}>W</Text>
          <Text style={[tStyles.headerText, tStyles.statCell, { color: textRole.tertiary }]}>D</Text>
          <Text style={[tStyles.headerText, tStyles.statCell, { color: textRole.tertiary }]}>L</Text>
          <Text style={[tStyles.headerText, tStyles.statCell, tStyles.gdCell, { color: textRole.tertiary }]}>GD</Text>
          <View style={tStyles.ptsHeaderContainer}><Text style={[tStyles.headerText, { color: textRole.tertiary }]}>Pts</Text></View>
          <View style={tStyles.formCol}><Text style={[tStyles.headerText, { color: textRole.tertiary }]}>Form</Text></View>
        </View>
      )}
    </View>
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (activeTab === 'standings') {
      return <StandingRowItem row={item as StandingRow} index={index} />;
    }
    if (activeTab === 'scorers') {
      return <ScorerRowItem scorer={item as TopScorer} index={index} />;
    }
    if (activeTab === 'assists') {
      return <PlayerStatRow item={item} index={index} statValue={item.assists} statIcon="hand-left" />;
    }
    if (activeTab === 'cards') {
      if (cardSubTab === 'yellow') {
        return <PlayerStatRow item={item} index={index} statValue={item.yellowCards} statIcon="card" />;
      }
      return <PlayerStatRow item={item} index={index} statValue={item.redCards} statIcon="card" />;
    }
    if (activeTab === 'injuries') {
      return <InjuryRow item={item} index={index} />;
    }
    return <TransferRow item={item} index={index} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: surface[0] }]}>
      <FlatList
        data={currentData}
        keyExtractor={(item: any, idx) => {
          if (activeTab === 'standings') return (item as StandingRow).team.id + '_' + idx;
          if (activeTab === 'scorers') return (item as TopScorer).playerName + '_' + idx;
          return (item.playerName || '') + '_' + idx;
        }}
        renderItem={renderItem}
        ListHeaderComponent={headerContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={accent.primary} />
              <Text style={[styles.emptyText, { color: textRole.tertiary }]}>Loading data…</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="football-outline" size={40} color={textRole.tertiary} />
              <Text style={[styles.emptyText, { color: textRole.tertiary }]}>No data available</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  backLink: { paddingVertical: 8, paddingHorizontal: 16 },
  backLinkText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  leagueInfo: { alignItems: 'center', marginTop: 16, gap: 10 },
  leagueIconWell: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  seasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  leagueCountry: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontFamily: 'Inter_600SemiBold',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Card sub-tabs
  subTabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  subTabActive: {
    borderColor: accent.primary,
    backgroundColor: 'rgba(0, 166, 81, 0.08)',
  },
  subTabText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  subTabTextActive: {
    color: accent.primary,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});

// Standings table styles
const tStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  posCol: { width: 32, alignItems: 'center' },
  posBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBadgeTop: { backgroundColor: 'rgba(0, 166, 81, 0.12)' },
  posBadgeBottom: { backgroundColor: 'rgba(239, 68, 68, 0.10)' },
  posText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  posTextTop: { color: accent.primary },
  posTextBottom: { color: accent.alert },
  teamCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  teamCircleText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  teamLogo: {
    width: 28,
    height: 28,
    marginLeft: 4,
  },
  teamName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  statCell: {
    width: 26,
    textAlign: 'center' as const,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  gdCell: { width: 30 },
  gdPositive: { color: accent.primary, fontFamily: 'Inter_700Bold' },
  gdNegative: { color: accent.alert, fontFamily: 'Inter_700Bold' },
  ptsContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ptsHeaderContainer: {
    width: 30,
    alignItems: 'center',
  },
  ptsCell: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  formCol: { flexDirection: 'row', gap: 3, width: 55, justifyContent: 'center' },
  formDot: { width: 8, height: 8, borderRadius: 4 },
  formWin: { backgroundColor: accent.primary },
  formDraw: { backgroundColor: 'rgba(150, 150, 150, 0.5)' },
  formLoss: { backgroundColor: accent.alert },
});

// Player-row styles (scorers / assists / cards)
const sStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  rankCol: { width: 28, alignItems: 'center' },
  rankText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  rankTextLeader: {
    color: accent.primary,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  teamBadgeText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  playerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  teamBadgeImg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    marginLeft: 8,
  },
  playerInfo: { flex: 1, marginLeft: 12 },
  playerName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  playerTeam: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  statsCol: { alignItems: 'flex-end' },
  goalBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 166, 81, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  goalBubbleLeader: {
    backgroundColor: 'rgba(0, 166, 81, 0.14)',
  },
  goalCount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: accent.primary,
  },
  assistText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
});

const injStyles = StyleSheet.create({
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
  },
  typeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: accent.alert,
    maxWidth: 80,
  },
});

// Transfer styles also need inline theme colors later

const trStyles = StyleSheet.create({
  transferFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 80,
  },
  miniLogo: {
    width: 14,
    height: 14,
  },
  teamOutText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  teamInText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    maxWidth: 60,
  },
});
