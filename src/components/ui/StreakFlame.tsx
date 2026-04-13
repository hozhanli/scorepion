/**
 * StreakFlame — Duolingo-style streak card.
 *
 * Shows a flame icon + large streak count, a row of 7 day-dots (current week),
 * and optional subtitle ("Keep it alive!", "Best streak: 12"). Built on
 * GradientHero with flame gradient + glow shadow.
 *
 * Designed as a drop-in replacement for the v3 "Streak" metric tile.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { radii } from '@/constants/colors';
import { GradientHero } from './GradientHero';
import { PressableScale } from './PressableScale';

export interface StreakFlameProps {
  streak: number;
  bestStreak?: number;
  weekDots?: boolean[]; // 7 booleans: completed? (defaults all false)
  subtitle?: string;
  compact?: boolean;
  onPress?: () => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakFlame({
  streak,
  bestStreak,
  weekDots,
  subtitle,
  compact = false,
  onPress,
}: StreakFlameProps) {
  const dots = weekDots ?? Array(7).fill(false);
  const isActive = streak > 0;
  const reduceMotion = useReducedMotion();

  const content = (
    <GradientHero
      colors={isActive ? (['#FFB347', '#FF6B35', '#E04A1E'] as const) : (['#CBD5E1', '#94A3B8'] as const)}
      glow={isActive ? 'flame' : 'none'}
      radius={compact ? 20 : 24}
      padding={compact ? 16 : 20}
    >
      <View style={styles.row}>
        <Animated.View entering={reduceMotion ? undefined : ZoomIn.duration(420).springify().damping(12)} style={styles.flameWrap}>
          <Ionicons name="flame" size={compact ? 32 : 40} color="#FFFFFF" />
        </Animated.View>

        <View style={styles.body}>
          <Text style={[styles.streakNumber, compact && styles.streakNumberCompact]}>
            {streak}
          </Text>
          <Text style={styles.streakLabel}>
            day{streak === 1 ? '' : 's'} streak
          </Text>
          {(subtitle || bestStreak != null) && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle ?? (bestStreak ? `Best: ${bestStreak} days` : '')}
            </Text>
          )}
        </View>
      </View>

      {!compact && (
        <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(120).duration(320)} style={styles.weekRow}>
          {dots.map((done, i) => (
            <View key={i} style={styles.dayCol}>
              <View
                style={[
                  styles.dot,
                  done ? styles.dotDone : styles.dotEmpty,
                ]}
              >
                {done && <Ionicons name="checkmark" size={10} color="#FF6B35" />}
              </View>
              <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
            </View>
          ))}
        </Animated.View>
      )}
    </GradientHero>
  );

  // When an `onPress` is provided (e.g. route to the scoring guide), wrap the
  // hero in a PressableScale so users can tap the streak card to learn how
  // scoring works. Without it, the card renders as a static hero.
  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        haptic="light"
        pressedScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${streak}-day streak. Tap to open the scoring guide.`}
      >
        {content}
      </PressableScale>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flameWrap: {
    width: 60,
    height: 60,
    borderRadius: radii.pill / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  streakNumberCompact: {
    fontSize: 28,
    lineHeight: 30,
  },
  streakLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
    marginTop: -2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: radii.pill / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: '#FFFFFF',
  },
  dotEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255, 255, 255, 0.75)',
  },
});
