/**
 * PressableScale — v4 tactile Pressable wrapper.
 *
 * Every tap gets a consistent spring scale + haptic pulse. Use this
 * everywhere instead of raw <Pressable> for hero targets (cards, CTAs,
 * big buttons). Falls back to opacity on the web.
 */
import React from 'react';
import { Pressable, Platform, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useReducedMotion } from 'react-native-reanimated';
import { springs, haptics } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;           // default 0.96 (Emerald Minimalism tightened value)
  haptic?: 'none' | 'light' | 'medium' | 'heavy' | 'selection';
  children?: React.ReactNode;
}

export function PressableScale({
  style,
  pressedScale = 0.96,
  haptic = 'light',
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    // When reduced motion is on, skip animation or set amplitude to 0
    const targetScale = reduceMotion ? 1 : pressedScale;
    scale.value = reduceMotion ? 1 : withSpring(pressedScale, springs.snappy);
    if (haptic !== 'none' && Platform.OS !== 'web') {
      haptics[haptic]?.().catch(() => {});
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = reduceMotion ? 1 : withSpring(1, springs.pop);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      {...rest}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animStyle, style]}
    >
      {children as any}
    </AnimatedPressable>
  );
}
