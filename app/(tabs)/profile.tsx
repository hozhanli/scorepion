/**
 * Profile Screen — Emerald Minimalism.
 *
 * Unified ScreenHeader with a settings action in the right slot. The tier
 * level card (emerald GradientHero) is promoted to the top as the canonical
 * hero moment. Stats, achievements, favorites, and groups all sit on plain
 * white cards with 1px hairline borders — no rainbow accents, no softShadow.
 */
import React, { useMemo, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
// Animated imports removed — tab screen renders instantly, no entry animations
import Colors, { accent, radii, type as typeTok } from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { formatLocalDate } from "@/lib/datetime";
import { useAchievements, useUserStats } from "@/lib/football-api";
import { ProfileHeroSkeleton } from "@/components/SkeletonLoader";
import StyledText from "@/components/ui/StyledText";
import {
  GradientHero,
  PressableScale,
  TierBadge,
  ProgressBar,
  ScreenHeader,
  Button,
} from "@/components/ui";
import type { TierName } from "@/components/ui/TierBadge";
import { TierShareCard, ShareCardRenderer, type ShareCardRef } from "@/components/ui/share";
import { WeeklyWrapCard } from "@/components/ui/share/WeeklyWrapCard";
// Motion imports removed — no animations on tab screen
import { computeLevel } from "@/lib/leveling";
export { ErrorBoundary } from "@/components/ErrorBoundary";

// ── Level system ────────────────────────────────────────────────────────────
// `computeLevel` lives in `lib/leveling.ts` so the celebration watcher in the
// Today screen can share the same thresholds.

function getLevelTier(level: number): TierName {
  if (level === 1) return "rookie";
  if (level <= 3) return "bronze";
  if (level <= 5) return "silver";
  if (level <= 6) return "gold";
  return "legend";
}

// ── Week label helper ────────────────────────────────────────────────────────
// Compute the current week's Monday–Sunday range (e.g. "Apr 6 — 12")
function getWeekLabel(): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  const fmt = (d: Date) => {
    const month = new Intl.DateTimeFormat(undefined, { month: "short" }).format(d);
    const day = d.getUTCDate();
    return `${month} ${day}`;
  };

  return `${fmt(monday)} — ${fmt(sunday)}`;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  index: number;
}) {
  const { surface, border } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <PressableScale style={{ flex: 1 }} haptic="light">
        <View
          style={[statStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}
        >
          <View style={statStyles.iconWrap}>
            <Ionicons name={icon} size={20} color={accent.primary} />
          </View>
          <StyledText variant="h3" style={statStyles.value}>
            {value}
          </StyledText>
          <View style={statStyles.accentStripe} />
          <StyledText variant="caption" role="tertiary" style={statStyles.label}>
            {label}
          </StyledText>
        </View>
      </PressableScale>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
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
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
});

// ── Achievement card ─────────────────────────────────────────────────────────
function AchievementCard({
  achievement,
  isUnlocked,
  progress,
  index,
}: {
  achievement: any;
  isUnlocked: boolean;
  progress?: number;
  index: number;
}) {
  const { surface, border, textRole } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: "31%" }}>
      <View
        style={[
          achStyles.card,
          { backgroundColor: surface[0], borderColor: border.subtle },
          isUnlocked && achStyles.cardUnlocked,
        ]}
      >
        {isUnlocked && (
          <View style={achStyles.unlockBadge}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}

        <View
          style={[
            achStyles.iconRing,
            { backgroundColor: isUnlocked ? "rgba(0, 166, 81, 0.12)" : surface[2] },
          ]}
        >
          <Ionicons
            name={achievement.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={isUnlocked ? accent.primary : textRole.tertiary}
          />
        </View>

        <Text
          style={[achStyles.title, { color: isUnlocked ? textRole.primary : textRole.secondary }]}
          numberOfLines={2}
        >
          {achievement.title || "Mystery Achievement"}
        </Text>

        {!isUnlocked && progress !== undefined && (
          <Text style={[achStyles.progressLabel, { color: textRole.tertiary }]}>{progress}/10</Text>
        )}

        {isUnlocked && <Text style={achStyles.unlockedLabel}>Unlocked</Text>}
      </View>
    </View>
  );
}

const achStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  cardUnlocked: {
    borderColor: "rgba(0, 166, 81, 0.25)",
  },
  unlockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 15,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  unlockedLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: accent.primary,
  },
});

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { textRole } = useTheme();
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.titleWrap}>
        <Text style={[sectionStyles.title, { color: textRole.primary }]}>{title}</Text>
        {subtitle && (
          <Text style={[sectionStyles.subtitle, { color: textRole.tertiary }]}>{subtitle}</Text>
        )}
      </View>
      {action && onAction && (
        <PressableScale onPress={onAction} hitSlop={6} haptic="light" pressedScale={0.94}>
          <Text style={sectionStyles.action}>{action}</Text>
        </PressableScale>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  action: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: accent.primary,
  },
});

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, tt } = useLanguage();
  const { profile, groups, isLoading, refreshData } = useApp();
  const { surface, border, textRole } = useTheme();
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const { data: achData, refetch: refetchAch } = useAchievements();
  const { data: userStats, refetch: refetchStats } = useUserStats();
  const [refreshing, setRefreshing] = useState(false);
  const shareRef = useRef<ShareCardRef>(null);

  const isDayZero = !profile || profile.totalPredictions === 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), refetchAch(), refetchStats()]);
    setRefreshing(false);
  }, [refreshData, refetchAch, refetchStats]);

  const accuracy = useMemo(() => {
    if (!profile?.totalPredictions) return 0;
    return Math.round((profile.correctPredictions / profile.totalPredictions) * 100);
  }, [profile]);

  const levelData = useMemo(() => computeLevel(profile?.totalPoints ?? 0), [profile?.totalPoints]);

  const tierName = useMemo(() => {
    if (levelData.level === 1) return "rookie" as TierName;
    if (levelData.level <= 3) return "bronze" as TierName;
    if (levelData.level <= 5) return "silver" as TierName;
    if (levelData.level <= 6) return "gold" as TierName;
    return "legend" as TierName;
  }, [levelData.level]);

  const memberSinceDate = useMemo(() => {
    if (!profile?.joinedAt) return "";
    const d = new Date(profile.joinedAt);
    const now = new Date();
    if (d.getUTCFullYear() === now.getUTCFullYear()) {
      return new Intl.DateTimeFormat(undefined, { month: "short" }).format(d);
    }
    return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(d);
  }, [profile?.joinedAt]);
  void formatLocalDate;

  const achievements = achData?.achievements ?? [];
  const unlockedCount = achievements.filter((a: any) => a.unlocked).length;

  const SettingsAction = (
    <PressableScale
      onPress={() => router.push("/settings")}
      hitSlop={8}
      haptic="light"
      pressedScale={0.92}
    >
      <View
        style={[styles.headerAction, { backgroundColor: surface[0], borderColor: border.subtle }]}
      >
        <Ionicons name="settings-outline" size={20} color={textRole.primary} />
      </View>
    </PressableScale>
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad, backgroundColor: surface[1] }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 110 : 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.primary} />
      }
    >
      <ScreenHeader
        title={profile?.username ?? t.profile.title}
        subtitle={profile ? tt(t.profile.memberSinceDate, { date: memberSinceDate }) : undefined}
        right={SettingsAction}
        showLogo
      />

      {/* ── 1. Tier/Level emerald hero (canonical gradient moment) ── */}
      {isLoading ? (
        <View style={styles.section}>
          <ProfileHeroSkeleton />
        </View>
      ) : !profile ? null : (
        <View style={styles.section}>
          <GradientHero colors={Colors.gradients.emerald} glow="emerald" radius={24} padding={22}>
            <View style={styles.heroTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profile.avatar || profile.username).substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.heroTextCol}>
                <TierBadge
                  tier={getLevelTier(levelData.level)}
                  level={levelData.level}
                  size="sm"
                  solid
                />
                <Text style={styles.heroPts}>
                  {(profile.totalPoints ?? 0).toLocaleString()}{" "}
                  <Text style={styles.heroPtsSuffix}>pts</Text>
                </Text>
              </View>
            </View>

            <View style={styles.heroProgress}>
              <View style={styles.heroProgressHeader}>
                <Text style={styles.heroLevelName}>{levelData.name}</Text>
                <Text style={styles.heroXpCopy}>
                  {levelData.xp} / {levelData.xpForNext} XP
                </Text>
              </View>
              <ProgressBar
                progress={levelData.xpPct}
                colors={["#FFFFFF", "rgba(255, 255, 255, 0.9)"]}
                height={6}
              />
              <Text style={styles.heroNextCopy}>
                {levelData.level < 7
                  ? tt(t.profile.pointsToNext, {
                      points: levelData.pointsToNext,
                      level: levelData.level + 1,
                    })
                  : t.profile.peakTierReached}
              </Text>
            </View>

            {isDayZero && <Text style={styles.welcomeMessage}>{t.profile.welcomeMessage}</Text>}
          </GradientHero>

          {/* Off-screen TierShareCard renderer — only captured when user taps Share */}
          <View style={{ position: "absolute", left: -9999, top: -9999 }} pointerEvents="none">
            <ShareCardRenderer
              ref={shareRef}
              fallbackMessage={`${profile?.username ?? ""} — ${tierName === "rookie" ? "Rookie" : tierName === "bronze" ? "Bronze" : tierName === "silver" ? "Silver" : tierName === "gold" ? "Gold" : "Legend"} on Scorepion`}
            >
              <TierShareCard
                username={profile?.username ?? ""}
                tierName={tierName}
                points={profile?.totalPoints ?? 0}
                level={levelData.level}
              />
            </ShareCardRenderer>
          </View>

          {/* Share my tier button */}
          <PressableScale
            onPress={() => shareRef.current?.share()}
            haptic="light"
            style={[styles.shareTierBtn, { borderColor: border.subtle }]}
            accessibilityRole="button"
            accessibilityLabel={t.profile.shareMyTier}
          >
            <Ionicons name="share-outline" size={16} color={accent.primary} />
            <Text style={styles.shareTierBtnText}>{t.profile.shareMyTier}</Text>
          </PressableScale>
        </View>
      )}

      {/* ── 2. Stats grid 2x2 ── */}
      <View style={styles.section}>
        <SectionHeader title={t.profile.stats} />
        <View style={styles.statRow}>
          <StatCard
            icon="football-outline"
            label={t.leaderboard.predictions}
            value={profile?.totalPredictions ?? 0}
            index={0}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label={t.profile.accuracy}
            value={`${accuracy}%`}
            index={1}
          />
        </View>
        <View style={[styles.statRow, { marginTop: 10 }]}>
          <StatCard
            icon="flame-outline"
            label={t.profile.currentStreak}
            value={profile?.streak ?? 0}
            index={2}
          />
          <StatCard
            icon="trophy-outline"
            label={t.profile.bestStreak}
            value={profile?.bestStreak ?? 0}
            index={3}
          />
        </View>
      </View>

      {/* ── 2.5. Weekly Wrap Card ── */}
      {profile && (
        <View style={styles.section}>
          <WeeklyWrapCard
            weekLabel={getWeekLabel()}
            rank={profile?.rank ?? 0}
            weeklyPoints={userStats?.weeklyPoints ?? 0}
            accuracy={accuracy}
            bestStreak={profile?.bestStreak ?? 0}
            tierLabel={tierName}
            username={profile?.username}
            inline
          />
        </View>
      )}

      {/* ── 3. Achievements ── */}
      <View style={styles.section}>
        <SectionHeader
          title={t.profile.achievements}
          subtitle={
            unlockedCount
              ? tt(t.profile.unlocked, { count: unlockedCount })
              : t.profile.startEarningBadges
          }
          action={achievements.length > 4 ? t.common.seeAll : undefined}
          onAction={() => router.push("/scoring")}
        />

        {achievements.length === 0 ? (
          <View
            style={[styles.achEmpty, { backgroundColor: surface[0], borderColor: border.subtle }]}
          >
            <View style={styles.achEmptyIcon}>
              <Ionicons name="trophy-outline" size={28} color={accent.primary} />
            </View>
            <Text style={[styles.achEmptyTitle, { color: textRole.primary }]}>
              {t.profile.startEarningBadges}
            </Text>
            <Text style={[styles.achEmptySub, { color: textRole.tertiary }]}>
              {t.profile.makePredictions}
            </Text>
          </View>
        ) : (
          <View style={styles.achGrid}>
            {achievements.slice(0, 4).map((ach: any, i: number) => (
              <AchievementCard
                key={ach.id}
                achievement={ach}
                isUnlocked={ach.unlocked}
                progress={ach.progress}
                index={i}
              />
            ))}
          </View>
        )}
      </View>

      {/* ── 4. Groups preview ── */}
      <View style={styles.section}>
        <SectionHeader
          title={t.profile.yourGroups}
          subtitle={
            groups.length > 0 ? tt(t.profile.groupsActive, { count: groups.length }) : undefined
          }
          action={t.profile.manage}
          onAction={() => router.push("/(tabs)/groups")}
        />
        {groups.length === 0 ? (
          <View
            style={[
              styles.groupsEmpty,
              { backgroundColor: surface[0], borderColor: border.subtle },
            ]}
          >
            <Text style={[styles.groupsEmptyText, { color: textRole.secondary }]}>
              {t.groups.joinFirst}
            </Text>
            <View style={styles.groupsEmptyCta}>
              <Button
                title={t.profile.findGroups}
                onPress={() => router.push("/(tabs)/groups")}
                variant="secondary"
                size="sm"
                icon="compass-outline"
                iconPosition="leading"
              />
            </View>
          </View>
        ) : (
          <View style={styles.groupsGrid}>
            {groups.slice(0, 4).map((g: any) => (
              <PressableScale key={g.id} style={{ flex: 1, minWidth: "48%" }} haptic="light">
                <View
                  style={[
                    styles.groupChip,
                    { backgroundColor: surface[0], borderColor: border.subtle },
                  ]}
                >
                  <Text style={[styles.groupName, { color: textRole.primary }]} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text style={[styles.groupCount, { color: textRole.tertiary }]}>
                    {g.memberCount} {g.memberCount === 1 ? t.groups.member : t.groups.members}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </View>
        )}
      </View>

      {/* ── 5. Glossary link ── */}
      <View style={styles.section}>
        <PressableScale onPress={() => router.push("/glossary")} haptic="light">
          <View
            style={[styles.inviteCard, { backgroundColor: surface[0], borderColor: border.subtle }]}
          >
            <View style={styles.inviteIcon}>
              <Ionicons name="book-outline" size={22} color={accent.primary} />
            </View>
            <View style={styles.inviteText}>
              <Text style={[styles.inviteTitle, { color: textRole.primary }]}>Glossary</Text>
              <Text style={[styles.inviteSub, { color: textRole.tertiary }]}>
                Learn football terms
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={textRole.tertiary} />
          </View>
        </PressableScale>
      </View>

      {/* ── 6. Invite friends — secondary emerald hero ── */}
      <View style={styles.section}>
        <PressableScale
          onPress={() =>
            Share.share({ message: t.profile.inviteMessage || "Join me on Scorepion!" })
          }
          haptic="medium"
        >
          <View
            style={[styles.inviteCard, { backgroundColor: surface[0], borderColor: border.subtle }]}
          >
            <View style={styles.inviteIcon}>
              <Ionicons name="people-outline" size={22} color={accent.primary} />
            </View>
            <View style={styles.inviteText}>
              <Text style={[styles.inviteTitle, { color: textRole.primary }]}>
                {t.profile.inviteFriends}
              </Text>
              <Text style={[styles.inviteSub, { color: textRole.tertiary }]}>
                {t.profile.inviteSubtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={textRole.tertiary} />
          </View>
        </PressableScale>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },

  // Hero
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  heroTextCol: {
    flex: 1,
    gap: 8,
  },
  heroPts: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  heroPtsSuffix: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255, 255, 255, 0.75)",
  },
  heroProgress: {
    gap: 8,
    marginTop: 16,
  },
  heroProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  heroLevelName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  heroXpCopy: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255, 255, 255, 0.80)",
  },
  heroNextCopy: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
  },
  welcomeMessage: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 12,
  },

  // Stats
  statRow: {
    flexDirection: "row",
    gap: 10,
  },

  // Achievements
  achGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  achEmpty: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  achEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  achEmptyTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  achEmptySub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  // Groups
  groupsEmpty: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  groupsEmptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  groupsEmptyCta: {
    marginTop: 4,
  },
  groupsGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  groupChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  groupName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  groupCount: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },

  // Invite
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteText: { flex: 1 },
  inviteTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  inviteSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },

  // Share tier button
  shareTierBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    marginTop: 10,
  },
  shareTierBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: accent.primary,
  },
});

// Silence unused token imports reserved for future additive work.
void typeTok;
