/**
 * ProgressBar — sleek animated progress bar for v4.
 *
 * A rounded, gradient-filled bar that animates from 0 → pct on mount.
 * Optional glow for active states. Used for level XP bars, daily pack
 * progress, rank promotion progress, etc.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { GradientTuple } from './GradientHero';

export interface ProgressBarProps {
  progress: number;            // 0..1
  height?: number;
  track?: string;
  colors?: GradientTuple;      // 2-3 stops
  glow?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export function ProgressBar({
  progress,
  height = 10,
  track = 'rgba(15, 23, 42, 0.08)',
  colors = ['#00C75A', '#00A651'] as const,
  glow = false,
  radius,
  style,
}: ProgressBarProps) {
  const width = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const r = radius ?? height / 2;

  useEffect(() => {
    const targetProgress = Math.max(0, Math.min(1, progress));
    if (reduceMotion) {
      // Skip animation when reduced motion is on
      width.value = targetProgress;
    } else {
      width.value = withTiming(targetProgress, {
        duration: 560,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progress, width, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: r, backgroundColor: track },
        glow && Platform.select({
          web: { boxShadow: `0 0 0 1px rgba(0, 166, 81, 0.10)` as any },
          default: {},
        }),
        style,
      ]}
    >
      <AnimatedGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { height, borderRadius: r }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
