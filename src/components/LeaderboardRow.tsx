/**
 * Legacy LeaderboardRow — retained for reference. The active leaderboard row
 * is inlined in `app/(tabs)/leaderboard.tsx` per the Emerald Minimalism
 * refresh. This component is no longer imported anywhere.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { LeaderboardEntry } from '@/lib/mock-data';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser?: boolean;
  isPremium?: boolean;
  showPremiumBadge?: boolean;
}

function getAvatarColor(username: string): string {
  const colors = [
    '#FF3B5C', '#3B82F6', '#00C853', '#FF8C00', '#9333EA',
    '#EC4899', '#14B8A6', '#F59E0B', '#6366F1', '#EF4444',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function LeaderboardRow({ entry, index, isCurrentUser, isPremium, showPremiumBadge }: LeaderboardRowProps) {
  const { colors, isDark } = useTheme();
  const isTop3 = entry.rank <= 3;
  const medalColor = entry.rank === 1 ? '#FFB300' : entry.rank === 2 ? '#9CA3AF' : '#B87333';
  const avatarBg = isCurrentUser ? Colors.palette.emerald : getAvatarColor(entry.username);

  return (
    <View>
      <View style={[styles.row, { borderBottomColor: colors.cardBorder }, isCurrentUser && styles.rowHighlight]}>
        <View style={styles.rankCol}>
          {isTop3 ? (
            <View style={[styles.medal, { backgroundColor: medalColor }]}>
              <Text style={styles.medalText}>{entry.rank}</Text>
            </View>
          ) : (
            <Text style={styles.rankText}>{entry.rank}</Text>
          )}
        </View>

        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{entry.avatar}</Text>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.username, { color: colors.text }, isCurrentUser && styles.usernameHighlight]} numberOfLines={1}>
              {entry.username}
              {isCurrentUser ? ' (You)' : ''}
            </Text>
            {showPremiumBadge && (
              <Ionicons name="diamond" size={12} color={Colors.palette.gold} style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.stats}>{entry.correct}/{entry.total} correct</Text>
        </View>

        <View style={styles.pointsCol}>
          <Text style={[styles.points, { color: colors.text }, isTop3 && styles.pointsTop]}>{entry.points.toLocaleString()}</Text>
          <View style={styles.changeRow}>
            {entry.change > 0 && (
              <>
                <Ionicons name="caret-up" size={9} color={Colors.palette.emerald} />
                <Text style={[styles.changeText, { color: Colors.palette.emerald }]}>{entry.change}</Text>
              </>
            )}
            {entry.change < 0 && (
              <>
                <Ionicons name="caret-down" size={9} color={Colors.palette.red} />
                <Text style={[styles.changeText, { color: Colors.palette.red }]}>{Math.abs(entry.change)}</Text>
              </>
            )}
            {entry.change === 0 && (
              <Text style={[styles.changeText, { color: Colors.palette.gray300 }]}>-</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.palette.gray100,
  },
  rowHighlight: {
    backgroundColor: 'rgba(0,200,83,0.04)',
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.palette.gray400,
  },
  medal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  infoCol: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
    flexShrink: 1,
  },
  usernameHighlight: {
    color: Colors.palette.emerald,
  },
  stats: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.palette.gray300,
    marginTop: 2,
  },
  pointsCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  points: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.light.text,
  },
  pointsTop: {
    color: Colors.palette.gold,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  changeText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
});
