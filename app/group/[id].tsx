/**
 * Group Detail — Emerald Minimalism.
 *
 * Refresh per §6.11:
 *   • Back link + tier chip top row — flat white + hairline.
 *   • Hero replaces the violet GradientHero with a white + hairline card that
 *     carries the group name, tier badge, member/points/accuracy stats, and
 *     the invite-code chip. No gradient, no glow.
 *   • Day-zero invite banner: neutral card with emerald ProgressBar, Button
 *     primitives for Share / Copy (no flame gradient).
 *   • Quick action strip: 4 identical white + hairline pills, all emerald
 *     icons — no rainbow (violet/coral/teal/gray).
 *   • Group standings: single-column list of white + hairline rows with the
 *     current-user row in an emerald-tint pattern.
 *   • Weekly highlight: neutral card with emerald ProgressBar (no washEmerald).
 *   • Activity feed / Challenges / Footer: all converted to white + hairline
 *     cards with emerald accents; leave button is a tertiary destructive link.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Platform, ScrollView, Share, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

let QRCode: any = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (e) {
  // QR code library not available, will use fallback
}

import Colors, { accent, radii } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/motion';
import {
  PressableScale, ProgressBar, TierBadge, Button, EmptyState,
} from '@/components/ui';
import { LEAGUES } from '@/lib/mock-data';
import { useEnhancedGroupActivity } from '@/lib/football-api';
import {
  formatLocalDate,
  getNextWeeklyResetUtc, getTimeUntil, formatCountdown,
} from '@/lib/datetime';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityFeedItem {
  id: string;
  type: 'prediction' | 'exact_score' | 'points_earned' | 'streak' | 'joined' | 'boost_pick' | 'achievement' | 'weekly_winner';
  username: string;
  avatar: string;
  color: string;
  message: string;
  detail?: string;
  timestamp: string;
  relativeTime: string;
  icon: string;
  iconColor: string;
}

interface GroupMember {
  id: string;
  username: string;
  avatar: string;
  points: number;
  correct: number;
  total: number;
  streak: number;
  color: string;
  joinedAt?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTierFromMemberCount(count: number): 'rookie' | 'bronze' | 'silver' | 'gold' {
  if (count < 3) return 'rookie';
  if (count < 6) return 'bronze';
  if (count < 10) return 'silver';
  return 'gold';
}

// Neutral avatar pattern — quarantine old rainbow colors.
// These are now passed from useTheme() context in the components

// ── Activity feed row ─────────────────────────────────────────────────────────

function ActivityFeedRow({
  item,
  index,
  isLast,
}: {
  item: ActivityFeedItem;
  index: number;
  isLast: boolean;
}) {
  const { surface, border, textRole } = useTheme();
  const iconName: keyof typeof Ionicons.glyphMap =
    item.type === 'boost_pick' ? 'flash' :
    item.type === 'achievement' ? 'ribbon' :
    item.type === 'weekly_winner' ? 'trophy' :
    item.type === 'exact_score' ? 'star' :
    item.type === 'streak' ? 'flame' :
    item.type === 'joined' ? 'person-add' :
    (item.icon as any) || 'pulse';

  return (
    <View style={[feedStyles.row, isLast && { borderBottomWidth: 0 }, { borderBottomColor: border.subtle }]}>
        <View style={[feedStyles.avatar, { backgroundColor: surface[2] }]}>
          <Text style={[feedStyles.avatarText, { color: textRole.primary }]}>{item.avatar}</Text>
        </View>
        <View style={feedStyles.content}>
          <Text style={[feedStyles.message, { color: textRole.primary }]} numberOfLines={2}>
            <Text style={[feedStyles.username, { color: textRole.primary }]}>{item.username} </Text>
            {item.message}
          </Text>
          {item.detail && (
            <View style={feedStyles.detailRow}>
              <Ionicons name={iconName} size={11} color={accent.primary} />
              <Text style={feedStyles.detail}>{item.detail}</Text>
            </View>
          )}
        </View>
        <Text style={[feedStyles.time, { color: textRole.tertiary }]}>{item.relativeTime}</Text>
      </View>
  );
}

// ── Member standing row ──────────────────────────────────────────────────────

function MemberStandingRow({
  member,
  rank,
  isCurrentUser,
}: {
  member: GroupMember;
  rank: number;
  isCurrentUser: boolean;
}) {
  const { surface, border, textRole } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={[
        standingStyles.row,
        { backgroundColor: surface[0], borderColor: border.subtle },
        isCurrentUser && standingStyles.rowHighlight
      ]}>
        {/* Left rail: only visible for "You" — a full-height emerald bar so the
            current user's row is immediately findable at a glance, even
            without reading the username. */}
        {isCurrentUser && <View style={standingStyles.youRail} />}
        <View style={[
          standingStyles.rankBadge,
          { backgroundColor: surface[2] },
          rank <= 3 && standingStyles.rankBadgeTop
        ]}>
          <Text style={[standingStyles.rankText, { color: textRole.secondary }, rank <= 3 && standingStyles.rankTextTop]}>
            {rank}
          </Text>
        </View>
        <View style={[
          standingStyles.avatar,
          { backgroundColor: surface[2] },
          isCurrentUser && standingStyles.avatarHighlight
        ]}>
          <Text style={[standingStyles.avatarText, { color: textRole.primary }]}>{member.avatar}</Text>
        </View>
        <View style={standingStyles.infoCol}>
          <View style={standingStyles.nameRow}>
            <Text
              style={[standingStyles.username, { color: textRole.primary }, isCurrentUser && standingStyles.usernameHighlight]}
              numberOfLines={1}
            >
              {member.username}
            </Text>
            {isCurrentUser && (
              <View style={standingStyles.youPill}>
                <Text style={standingStyles.youPillText}>{t.leaderboard.you.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={[standingStyles.stats, { color: textRole.tertiary }]}>
            {member.correct}/{member.total} correct
          </Text>
        </View>
        <View style={standingStyles.pointsCol}>
          <Text style={[standingStyles.pointsValue, isCurrentUser && standingStyles.pointsValueHighlight]}>
            {member.points}
          </Text>
          <Text style={[standingStyles.pointsLabel, { color: textRole.tertiary }]}>pts</Text>
        </View>
      </View>
  );
}

// ── Challenge card ────────────────────────────────────────────────────────────

function ChallengeCard({
  title,
  xp,
  progress,
  index,
}: {
  title: string;
  xp: number;
  progress: number;
  index: number;
}) {
  const { surface, border, textRole } = useTheme();
  return (
    <View style={[challengeStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}>
        <View style={challengeStyles.content}>
          <Text style={[challengeStyles.title, { color: textRole.primary }]}>{title}</Text>
          <ProgressBar
            progress={Math.min(progress / 100, 1)}
            colors={[accent.primary, accent.primary]}
            height={4}
          />
        </View>
        <View style={[challengeStyles.xpPill, { backgroundColor: surface[2] }]}>
          <Text style={[challengeStyles.xpText, { color: accent.primary }]}>+{xp} xp</Text>
        </View>
      </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const { id, name, code, leagueIds: leagueIdsParam } = useLocalSearchParams<{
    id: string;
    name: string;
    code: string;
    memberCount: string;
    isPublic: string;
    leagueIds: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { surface, border, textRole } = useTheme();
  const { t } = useLanguage();
  const { profile, leaveGroup } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const _leagueIds = useMemo(() => {
    try { return leagueIdsParam ? JSON.parse(leagueIdsParam) : []; }
    catch { return []; }
  }, [leagueIdsParam]);

  const { data: members = [], isLoading: membersLoading } = useQuery<GroupMember[]>({
    queryKey: ['/api/groups', id, 'standings'],
    enabled: !!id,
  });

  const { data: activityFeed = [], isLoading: activityLoading } = useQuery<ActivityFeedItem[]>({
    queryKey: ['/api/groups', id, 'activity'],
    enabled: !!id,
  });

  const { data: enhancedActivityData = [], isLoading: enhancedActivityLoading } =
    useEnhancedGroupActivity(id ?? '');

  const mergedActivityFeed = useMemo(() => {
    const enhancedIds = new Set(enhancedActivityData.map((it: any) => it.id));
    const enhanced = enhancedActivityData.map((it: any) => ({
      ...it,
      relativeTime: it.relativeTime || formatLocalDate(it.timestamp),
    }));
    const basic = activityFeed.filter((it: ActivityFeedItem) => !enhancedIds.has(it.id));
    return [...enhanced, ...basic]
      .sort((a: any, b: any) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [enhancedActivityData, activityFeed]);

  const isLoading = membersLoading || activityLoading || enhancedActivityLoading;
  const isDayZero = members.length <= 1;
  const isSmallGroup = members.length < 3;

  const groupLeader = useMemo(() => (members.length > 0 ? members[0] : null), [members]);
  const currentUser = useMemo(
    () => members.find(m => m.username === profile?.username),
    [members, profile],
  );

  const [weeklyCountdown, setWeeklyCountdown] = useState('');
  React.useEffect(() => {
    const update = () => {
      const timeUntil = getTimeUntil(getNextWeeklyResetUtc());
      setWeeklyCountdown(formatCountdown(timeUntil));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = useCallback(async () => {
    haptics.medium();
    try {
      await Share.share({
        message: `Join my Scorepion group "${name}"! Use invite code: ${code}`,
        title: `Join ${name} on Scorepion`,
      });
    } catch {}
  }, [name, code]);

  const handleCopyCode = useCallback(async () => {
    haptics.success();
    await Clipboard.setStringAsync(code ?? '');
    Alert.alert('Copied!', `Invite code "${code}" copied to clipboard`);
  }, [code]);

  const handleLeave = useCallback(() => {
    haptics.medium();
    Alert.alert(
      'Leave group',
      `Are you sure you want to leave "${name}"? Your predictions and points stay safe on your profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await leaveGroup(id);
              haptics.success();
              router.back();
            } catch (err) {
              Alert.alert(
                'Could not leave',
                'Something went wrong. Please try again.',
              );
            }
          },
        },
      ],
    );
  }, [id, name, leaveGroup, router]);

  const handleMenu = useCallback(() => {
    haptics.light();
    Alert.alert('Group options', 'What would you like to do?', [
      { text: 'Share invite link', onPress: handleShare },
      { text: 'Copy invite code', onPress: handleCopyCode },
      { text: 'Leave group', style: 'destructive', onPress: handleLeave },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleShare, handleCopyCode, handleLeave]);

  const _groupLeagues = _leagueIds
    .map((lid: string) => LEAGUES.find(l => l.id === lid))
    .filter(Boolean);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: surface[0] }]}>
        <ActivityIndicator
          size="large"
          color={accent.primary}
          style={styles.loader}
        />
      </View>
    );
  }

  const totalPoints = members.reduce((s, m) => s + m.points, 0);
  const accuracyPct = members.length > 0
    ? Math.round(
        (members.reduce((s, m) => s + m.correct, 0) /
          Math.max(members.reduce((s, m) => s + m.total, 1), 1)) *
          100,
      )
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: surface[0] }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top nav row ── */}
      <View
        style={[styles.topNav, { paddingTop: topPad + 12 }]}
      >
        <PressableScale
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: surface[0], borderColor: border.subtle }]}
          hitSlop={8}
          haptic="light"
        >
          <Ionicons name="chevron-back" size={18} color={textRole.primary} />
          <Text style={[styles.backBtnText, { color: textRole.primary }]}>Back</Text>
        </PressableScale>

        <PressableScale
          onPress={handleMenu}
          style={[styles.menuBtn, { backgroundColor: surface[0], borderColor: border.subtle }]}
          haptic="light"
          accessibilityLabel="Group menu"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={textRole.primary} />
        </PressableScale>
      </View>

      {/* ── Hero ── */}
      <View style={styles.heroWrap}>
        <View style={[heroStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}>
          <View style={heroStyles.titleRow}>
            <View style={heroStyles.titleCol}>
              <Text style={[heroStyles.name, { color: textRole.primary }]} numberOfLines={2}>
                {name}
              </Text>
              <Text style={[heroStyles.meta, { color: textRole.tertiary }]}>
                {members.length === 1
                  ? 'Just you so far'
                  : `${members.length} member${members.length === 1 ? '' : 's'}`}
              </Text>
            </View>
            <TierBadge
              tier={getTierFromMemberCount(members.length)}
              level={members.length}
              size="sm"
              solid
            />
          </View>

          <View style={[heroStyles.statsRow, { backgroundColor: surface[1] }]}>
            <View style={heroStyles.stat}>
              <Text style={[heroStyles.statValue, { color: textRole.primary }]}>{members.length}</Text>
              <Text style={[heroStyles.statLabel, { color: textRole.tertiary }]}>Members</Text>
            </View>
            <View style={[heroStyles.statDivider, { backgroundColor: border.subtle }]} />
            <View style={heroStyles.stat}>
              <Text style={[heroStyles.statValue, { color: textRole.primary }]}>{totalPoints}</Text>
              <Text style={[heroStyles.statLabel, { color: textRole.tertiary }]}>Total pts</Text>
            </View>
            <View style={[heroStyles.statDivider, { backgroundColor: border.subtle }]} />
            <View style={heroStyles.stat}>
              <Text style={[heroStyles.statValue, { color: textRole.primary }]}>{accuracyPct}%</Text>
              <Text style={[heroStyles.statLabel, { color: textRole.tertiary }]}>Accuracy</Text>
            </View>
          </View>

          <PressableScale
            onPress={handleCopyCode}
            style={[heroStyles.codeChip, { backgroundColor: surface[2] }]}
            haptic="light"
          >
            <Ionicons name="key-outline" size={12} color={textRole.secondary} />
            <Text style={[heroStyles.codeText, { color: textRole.primary }]}>
              {code ? code.substring(0, 12) : 'GROUP_CODE'}
            </Text>
            <Ionicons name="copy-outline" size={12} color={textRole.tertiary} />
          </PressableScale>
        </View>
      </View>

      {/* ── Day-zero invite banner ── */}
      {isSmallGroup && (
        <View style={styles.sectionWrap}>
          <View style={[inviteStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}>
            <View style={inviteStyles.iconWrap}>
              <Ionicons name="person-add-outline" size={20} color={accent.primary} />
            </View>
            <Text style={[inviteStyles.headline, { color: textRole.primary }]}>Your group needs more players</Text>
            <Text style={[inviteStyles.subtext, { color: textRole.secondary }]}>
              Invite {3 - members.length} more friend{3 - members.length > 1 ? 's' : ''} to
              unlock weekly challenges
            </Text>
            <View style={inviteStyles.progressWrap}>
              <ProgressBar
                progress={members.length / 3}
                colors={[accent.primary, accent.primary]}
                height={5}
              />
              <Text style={[inviteStyles.progressText, { color: textRole.tertiary }]}>
                {members.length}/3 members
              </Text>
            </View>
            <View style={inviteStyles.actions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Share"
                  onPress={handleShare}
                  variant="primary"
                  size="md"
                  icon="share-outline"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Copy code"
                  onPress={handleCopyCode}
                  variant="secondary"
                  size="md"
                  icon="copy-outline"
                  fullWidth
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── Invite Section ── */}
      <View style={styles.sectionWrap}>
        <View style={[inviteDetailStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}>
          <Text style={[inviteDetailStyles.title, { color: textRole.primary }]}>
            {t.groupInvite.inviteSection}
          </Text>

          {/* Invite Code Display */}
          <View style={inviteDetailStyles.codeSection}>
            <Text style={[inviteDetailStyles.label, { color: textRole.secondary }]}>
              {t.groupInvite.inviteCode}
            </Text>
            <View style={[inviteDetailStyles.codeDisplay, { backgroundColor: surface[1], borderColor: border.subtle }]}>
              <Text style={[inviteDetailStyles.codeText, { color: textRole.primary }]}>
                {code || 'GROUP_CODE'}
              </Text>
              <PressableScale
                onPress={handleCopyCode}
                style={inviteDetailStyles.copyButton}
                haptic="light"
                accessibilityLabel={t.groupInvite.copyCode}
              >
                <Ionicons name="copy-outline" size={18} color={accent.primary} />
              </PressableScale>
            </View>
          </View>

          {/* QR Code Section - Only show if library available */}
          {QRCode && (
            <View style={inviteDetailStyles.qrSection}>
              <Text style={[inviteDetailStyles.label, { color: textRole.secondary }]}>
                {t.groupInvite.qrCode}
              </Text>
              <View style={[inviteDetailStyles.qrContainer, { backgroundColor: surface[1], borderColor: border.subtle }]}>
                {code ? (
                  <QRCode
                    value={code}
                    size={120}
                    color={textRole.primary}
                    backgroundColor={surface[1]}
                  />
                ) : (
                  <Text style={[inviteDetailStyles.qrPlaceholder, { color: textRole.tertiary }]}>
                    QR Code
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Share Button */}
          <PressableScale
            onPress={handleShare}
            style={{ width: '100%' }}
            haptic="medium"
            accessibilityLabel={t.groupInvite.shareInvite}
            accessibilityRole="button"
          >
            <View style={[inviteDetailStyles.shareButton, { backgroundColor: accent.primary }]}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={inviteDetailStyles.shareButtonText}>{t.groupInvite.shareInvite}</Text>
            </View>
          </PressableScale>
        </View>
      </View>

      {/* ── Quick action strip ── */}
      <View>
        <View style={actionStyles.strip}>
          <PressableScale
            onPress={handleShare}
            style={[actionStyles.pill, { backgroundColor: surface[0], borderColor: border.subtle }]}
            haptic="light"
          >
            <Ionicons name="person-add-outline" size={18} color={accent.primary} />
            <Text style={[actionStyles.label, { color: textRole.primary }]}>Invite</Text>
          </PressableScale>

          <PressableScale
            onPress={() => Alert.alert('Chat', 'Group chat coming soon')}
            style={[actionStyles.pill, { backgroundColor: surface[0], borderColor: border.subtle }]}
            haptic="light"
          >
            <Ionicons name="chatbubble-outline" size={18} color={accent.primary} />
            <Text style={[actionStyles.label, { color: textRole.primary }]}>Chat</Text>
          </PressableScale>

          <PressableScale
            onPress={handleShare}
            style={[actionStyles.pill, { backgroundColor: surface[0], borderColor: border.subtle }]}
            haptic="light"
          >
            <Ionicons name="share-outline" size={18} color={accent.primary} />
            <Text style={[actionStyles.label, { color: textRole.primary }]}>Share</Text>
          </PressableScale>

          <PressableScale
            onPress={handleMenu}
            style={[actionStyles.pill, { backgroundColor: surface[0], borderColor: border.subtle }]}
            haptic="light"
          >
            <Ionicons name="settings-outline" size={18} color={accent.primary} />
            <Text style={[actionStyles.label, { color: textRole.primary }]}>More</Text>
          </PressableScale>
        </View>
      </View>

      {/* ── Group standings ── */}
      <View style={styles.sectionWrap}>
        <View style={leaderboardStyles.header}>
          <Text style={[leaderboardStyles.title, { color: textRole.primary }]}>Group standings</Text>
          {members.length > 0 && (
            <Text style={[leaderboardStyles.count, { color: textRole.tertiary }]}>{members.length} members</Text>
          )}
        </View>

        {isDayZero ? (
          <EmptyState
            icon="people-outline"
            title="You're the only player"
            subtitle="Invite friends to compete!"
          />
        ) : (
          <View style={leaderboardStyles.list}>
            {members.map((member, idx) => (
              <MemberStandingRow
                key={member.id}
                member={member}
                rank={idx + 1}
                isCurrentUser={member.username === profile?.username}
              />
            ))}
          </View>
        )}
      </View>

      {/* ── Weekly highlight ── */}
      {groupLeader && !isDayZero && (
        <View style={styles.sectionWrap}>
          <View style={[highlightStyles.card, { backgroundColor: surface[0], borderColor: border.subtle }]}>
            <View style={highlightStyles.header}>
              <View style={highlightStyles.headerIconWrap}>
                <Ionicons name="trophy" size={14} color={accent.primary} />
              </View>
              <Text style={[highlightStyles.title, { color: textRole.primary }]}>This week's top performer</Text>
            </View>

            <Text style={[highlightStyles.subtitle, { color: textRole.primary }]}>
              {groupLeader.username} leads with {groupLeader.points} pts
            </Text>

            {currentUser && currentUser.id !== groupLeader.id && (
              <View style={highlightStyles.progressBlock}>
                <ProgressBar
                  progress={Math.min(
                    1,
                    currentUser.points / Math.max(groupLeader.points, 1),
                  )}
                  colors={[accent.primary, accent.primary]}
                  height={5}
                />
                <Text style={[highlightStyles.gap, { color: textRole.secondary }]}>
                  {Math.max(0, groupLeader.points - currentUser.points)} pts behind
                </Text>
              </View>
            )}

            <View style={highlightStyles.countdownRow}>
              <Ionicons name="time-outline" size={11} color={textRole.tertiary} />
              <Text style={[highlightStyles.countdown, { color: textRole.tertiary }]}>
                Resets in {weeklyCountdown || '—'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Recent activity feed ── */}
      <View style={styles.sectionWrap}>
        <View style={feedSectionStyles.header}>
          <Text style={[feedSectionStyles.title, { color: textRole.primary }]}>Recent activity</Text>
        </View>

        {mergedActivityFeed.length === 0 ? (
          <View style={[feedSectionStyles.emptyCard, { backgroundColor: surface[0], borderColor: border.subtle }]}>
            <EmptyState
              icon="time-outline"
              title="No activity yet"
              subtitle="Be the first to predict!"
            />
            <View style={{ alignSelf: 'center', marginTop: 4 }}>
              <Button
                title="Go to matches"
                onPress={() => router.push('/(tabs)/matches')}
                variant="primary"
                size="md"
                icon="football-outline"
              />
            </View>
          </View>
        ) : (
          <View style={[feedSectionStyles.list, { backgroundColor: surface[0], borderColor: border.subtle }]}>
            {mergedActivityFeed.map((item, idx) => (
              <ActivityFeedRow
                key={item.id}
                item={item as ActivityFeedItem}
                index={idx}
                isLast={idx === mergedActivityFeed.length - 1}
              />
            ))}
          </View>
        )}
      </View>

      {/* ── Challenges ── */}
      <View style={styles.sectionWrap}>
        <View style={challengeSectionStyles.header}>
          <Text style={[challengeSectionStyles.title, { color: textRole.primary }]}>Challenges</Text>
        </View>

        {isSmallGroup ? (
          <View style={[challengeSectionStyles.lockedCard, { backgroundColor: surface[0], borderColor: border.subtle }]}>
            <View style={[challengeSectionStyles.lockedIconWrap, { backgroundColor: surface[2] }]}>
              <Ionicons name="lock-closed" size={18} color={textRole.tertiary} />
            </View>
            <Text style={[challengeSectionStyles.lockedTitle, { color: textRole.primary }]}>Unlocks at 3 members</Text>
            <View style={{ alignSelf: 'stretch' }}>
              <ProgressBar
                progress={members.length / 3}
                colors={[accent.primary, accent.primary]}
                height={5}
              />
            </View>
          </View>
        ) : (
          <>
            <ChallengeCard title="Predict all matches this weekend" xp={50} progress={65} index={0} />
            <ChallengeCard title="Beat the group leader this week" xp={100} progress={30} index={1} />
            <ChallengeCard title="7-day prediction streak" xp={80} progress={3} index={2} />
          </>
        )}
      </View>

      {/* ── Footer ── */}
      <View>
        <View style={[footerStyles.section]}>
          <View style={[footerStyles.codeBox, { backgroundColor: surface[0], borderColor: border.subtle }]}>
            <Ionicons name="key-outline" size={12} color={textRole.tertiary} />
            <Text style={[footerStyles.code, { color: textRole.primary }]}>
              {code ? code.substring(0, 12) : 'GROUP_CODE'}
            </Text>
            <PressableScale onPress={handleCopyCode} haptic="light">
              <Ionicons name="copy-outline" size={14} color={accent.primary} />
            </PressableScale>
          </View>

          <PressableScale
            onPress={handleLeave}
            style={[footerStyles.leaveBtn, { borderColor: accent.alert }]}
            haptic="light"
          >
            <Text style={[footerStyles.leaveBtnText, { color: accent.alert }]}>Leave group</Text>
          </PressableScale>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  loader: { flex: 1, justifyContent: 'center' },

  // Top nav
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
  },

  sectionWrap: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
});

const heroStyles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 20,
    gap: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleCol: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignSelf: 'stretch',
  },
  codeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
});

const inviteStyles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 166, 81, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  progressWrap: {
    gap: 6,
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});

const actionStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 22,
    gap: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});

const leaderboardStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    gap: 8,
  },
});

const standingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: radii.md,
    gap: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  rowHighlight: {
    backgroundColor: 'rgba(0, 166, 81, 0.09)',
    borderColor: accent.primary,
    borderWidth: 2,
    paddingLeft: 18, // extra room for the left rail
  },
  /** Full-height emerald rail on the far left of the current-user row. */
  youRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: accent.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usernameHighlight: {
    color: accent.primary,
  },
  avatarHighlight: {
    borderWidth: 2,
    borderColor: accent.primary,
  },
  youPill: {
    backgroundColor: accent.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
  },
  pointsValueHighlight: {
    fontSize: 18,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: accent.primary,
  },
  rankText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  rankTextTop: { color: '#fff' },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  stats: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  pointsCol: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: accent.primary,
    letterSpacing: -0.2,
  },
  pointsLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

const highlightStyles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 166, 81, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  progressBlock: { gap: 6 },
  gap: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  countdown: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});

const feedSectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  emptyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
  },
  list: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

const feedStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  username: {
    fontFamily: 'Inter_700Bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detail: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: accent.primary,
  },
  time: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    minWidth: 36,
    textAlign: 'right',
  },
});

const challengeSectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  lockedCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  lockedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});

const challengeStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.md,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  xpPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  xpText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
});

const footerStyles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    gap: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  code: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  leaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  leaveBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});

const inviteDetailStyles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 20,
    gap: 18,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  codeSection: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 12,
  },
  codeText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  copyButton: {
    padding: 8,
  },
  qrSection: {
    gap: 10,
    alignItems: 'center',
  },
  qrContainer: {
    width: 140,
    height: 140,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  qrPlaceholder: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
  },
  shareButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});

// Silence unused placeholder imports used in legacy branches.
void Colors;
