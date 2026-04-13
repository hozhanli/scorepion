/**
 * ScreenHeader — Canonical tab/page header for Emerald Minimalism.
 *
 * Unified single-row layout:
 *
 *   [ Crest 28px (optional) ] [ H1 title + caption subtitle ] [ Action 44×44 (optional) ]
 *
 * When `showLogo` is true, the ScorpionCrest sits to the left of the title
 * creating a branded, premium header row. Used on all main tab screens.
 *
 * Usage:
 *   <ScreenHeader title="Matches" subtitle="18 upcoming" showLogo />
 *   <ScreenHeader title="Match Detail" left={<BackButton />} right={<ShareBtn />} />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { type, spacing } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { ScorpionCrest } from './ScorpionCrest';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Custom left slot — overrides showLogo if both provided */
  left?: React.ReactNode;
  /** Custom right slot (44×44 action area) */
  right?: React.ReactNode;
  /** Show the ScorpionCrest to the left of the title */
  showLogo?: boolean;
  animate?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  left,
  right,
  showLogo = false,
  animate = false,
}: ScreenHeaderProps) {
  const { textRole } = useTheme();
  const Container: any = animate ? Animated.View : View;
  const entering = animate
    ? FadeInDown.duration(380).springify().damping(16)
    : undefined;

  const leftContent = left ?? (showLogo ? <ScorpionCrest size={28} /> : null);

  return (
    <Container entering={entering} style={styles.wrap}>
      <View style={styles.row}>
        {leftContent ? (
          <View style={styles.leftSlot}>{leftContent}</View>
        ) : null}
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: textRole.primary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: textRole.secondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.action}>{right}</View> : null}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  leftSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: type.h1.size,
    lineHeight: type.h1.lineHeight,
    fontFamily: type.h1.family,
    letterSpacing: type.h1.letterSpacing,
  },
  subtitle: {
    marginTop: 2,
    fontSize: type.caption.size,
    lineHeight: type.caption.lineHeight,
    fontFamily: type.caption.family,
  },
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
