/**
 * ScoreSelector — Prediction score input.
 *
 * Design decisions from research:
 * - 52×52 touch targets (NNG recommends minimum 44px)
 * - Long-press on +/− for continuous increment
 * - Score displayed in 52px bold for immediate readability
 * - Disabled state: minus fades at 0, plus fades at 15
 * - Subtle scale bounce on every change via Reanimated
 * - Team logo ring with brand color border
 */
import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

/** Returns relative luminance of a hex color (0 = black, 1 = white). */
function getLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

interface ScoreSelectorProps {
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  teamName: string;
  teamColor: string;
  teamLogo?: string;
  teamShort?: string;
  maxScore?: number;
}

const LONG_PRESS_INTERVAL = 140; // ms between ticks during long-press

export function ScoreSelector({
  score,
  onIncrement,
  onDecrement,
  teamName,
  teamColor,
  teamLogo,
  teamShort,
  maxScore = 15,
}: ScoreSelectorProps) {
  const { colors, isDark } = useTheme();
  const scoreTextColor = getLuminance(teamColor) > 0.4 ? '#1a1a2e' : '#fff';
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const longPressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const bounce = () => {
    if (reduceMotion) {
      // Skip animation when reduced motion is on
      scale.value = 1;
    } else {
      scale.value = withSequence(
        withTiming(1.18, { duration: 70 }),
        withSpring(1, { damping: 9, stiffness: 320 }),
      );
    }
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleStep = useCallback(
    (action: () => void) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      bounce();
      action();
    },
    [],
  );

  const startLongPress = useCallback(
    (action: () => void) => {
      longPressTimer.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        bounce();
        action();
      }, LONG_PRESS_INTERVAL);
    },
    [],
  );

  const stopLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const btnBg = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.container}>
      {/* Team logo */}
      <View style={[styles.logoRing, { borderColor: `${teamColor}60` }]}>
        {teamLogo ? (
          <Image source={{ uri: teamLogo }} style={styles.logoImg} resizeMode="contain" />
        ) : (
          <View style={[styles.logoFallback, { backgroundColor: teamColor }]}>
            <Text style={styles.logoFallbackText}>
              {(teamShort || teamName).charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.teamLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {teamShort || teamName}
      </Text>

      {/* Score stepper */}
      <View style={[styles.stepper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
        {/* Minus */}
        <Pressable
          onPress={() => score > 0 && handleStep(onDecrement)}
          onLongPress={() => score > 0 && startLongPress(onDecrement)}
          onPressOut={stopLongPress}
          disabled={score <= 0}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: btnBg },
            pressed && styles.stepBtnPressed,
            score <= 0 && styles.stepBtnDisabled,
          ]}
          hitSlop={4}
          accessibilityLabel={`Decrease ${teamShort || teamName} score`}
        >
          <Ionicons
            name="remove"
            size={22}
            color={score <= 0 ? Colors.palette.gray200 : colors.text}
          />
        </Pressable>

        {/* Score */}
        <Animated.View style={[styles.scoreDisplay, { backgroundColor: teamColor }, animStyle]}>
          <Text style={[styles.scoreText, { color: scoreTextColor }]}>{score}</Text>
        </Animated.View>

        {/* Plus */}
        <Pressable
          onPress={() => score < maxScore && handleStep(onIncrement)}
          onLongPress={() => score < maxScore && startLongPress(onIncrement)}
          onPressOut={stopLongPress}
          disabled={score >= maxScore}
          style={({ pressed }) => [
            styles.stepBtn,
            { backgroundColor: btnBg },
            pressed && styles.stepBtnPressed,
            score >= maxScore && styles.stepBtnDisabled,
          ]}
          hitSlop={4}
          accessibilityLabel={`Increase ${teamShort || teamName} score`}
        >
          <Ionicons
            name="add"
            size={22}
            color={score >= maxScore ? Colors.palette.gray200 : colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  logoRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: 44,
    height: 44,
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  teamLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    maxWidth: 110,
    lineHeight: 18,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    padding: 6,
    marginTop: 2,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPressed: {
    transform: [{ scale: 0.88 }],
    opacity: 0.8,
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  scoreDisplay: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 34,
  },
});
