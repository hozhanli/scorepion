/**
 * WelcomeBackBanner — tells a returning user what happened while they were away.
 *
 * Shown once per session at the top of the Home screen when:
 *   • the user's last visit was more than 6 hours ago, AND
 *   • at least one prediction settled since then (win or loss).
 *
 * The banner is a single white+hairline row with an emerald accent on
 * positive outcomes (points earned) or a neutral tone on misses. It is
 * dismissible — the user can tap the close glyph to hide it for the rest of
 * the session. A new qualifying return triggers it again.
 *
 * This is NOT a CelebrationToast — the toast is for instantaneous moments
 * like "locked in!". The welcome-back banner is a calm summary of activity
 * that happened while the app was backgrounded.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { accent, radii } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { PressableScale } from './PressableScale';
import { useLanguage } from '@/contexts/LanguageContext';

export interface WelcomeBackBannerProps {
  /** Number of settled predictions since last visit. */
  settledCount: number;
  /** Points earned since last visit (null = unknown). */
  pointsEarned: number;
  /** Hours since last visit (rounded). */
  hoursAway: number;
  /** Tap handler — should navigate to Profile / activity. */
  onPress?: () => void;
  /** Dismiss handler — should hide the banner for the session. */
  onDismiss: () => void;
}

export function WelcomeBackBanner({
  settledCount,
  pointsEarned,
  hoursAway,
  onPress,
  onDismiss,
}: WelcomeBackBannerProps) {
  const { surface, border, textRole } = useTheme();
  const { t, tt } = useLanguage();
  const positive = pointsEarned > 0;
  const title = positive
    ? tt(t.welcomeBack.pointsPositive, { points: pointsEarned })
    : settledCount > 0
    ? (settledCount === 1 ? tt(t.welcomeBack.settled, { count: settledCount }) : tt(t.welcomeBack.settledPlural, { count: settledCount }))
    : t.welcomeBack.fallback;
  const subtitle = (() => {
    if (hoursAway >= 24) {
      const days = Math.round(hoursAway / 24);
      return days === 1 ? tt(t.welcomeBack.subtitleDay, { days }) : tt(t.welcomeBack.subtitleDays, { days });
    }
    return tt(t.welcomeBack.subtitleHours, { hours: hoursAway });
  })();

  return (
    <Animated.View
      entering={FadeInDown.duration(360).springify().damping(16)}
      exiting={FadeOut.duration(200)}
      style={styles.wrap}
    >
      <PressableScale
        onPress={onPress}
        style={[
          styles.row,
          {
            backgroundColor: surface[0],
            borderColor: border.subtle,
          },
          positive && {
            borderColor: 'rgba(0, 166, 81, 0.38)',
            backgroundColor: 'rgba(0, 166, 81, 0.10)',
          },
        ]}
        haptic="light"
        pressedScale={0.98}
      >
        <View style={[styles.iconWell, { backgroundColor: surface[2] }, positive && { backgroundColor: 'rgba(0, 166, 81, 0.14)' }]}>
          <Ionicons
            name={positive ? 'trending-up' : 'time-outline'}
            size={18}
            color={positive ? accent.primary : textRole.secondary}
          />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: textRole.primary }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.subtitle, { color: textRole.tertiary }]} numberOfLines={1}>{subtitle}</Text>
        </View>
        <PressableScale
          onPress={(e?: any) => {
            e?.stopPropagation?.();
            onDismiss();
          }}
          hitSlop={16}
          haptic="selection"
          pressedScale={0.9}
          style={styles.closeBtn}
          accessibilityLabel={t.welcomeBack.dismissLabel}
          accessibilityRole="button"
        >
          <Ionicons name="close" size={18} color={textRole.tertiary} />
        </PressableScale>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
