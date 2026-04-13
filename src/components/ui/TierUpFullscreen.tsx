/**
 * TierUpFullscreen — A premium fullscreen celebration overlay for tier promotions.
 *
 * When a user unlocks a new tier, this component renders a centered, animated
 * fullscreen modal with:
 *   - A dimmed backdrop (rgba(0,0,0,0.7))
 *   - Animated ScorpionCrest with a radial glow
 *   - "NEW TIER UNLOCKED" label in accent color
 *   - Large tier name with FadeInDown animation
 *   - Optional subtitle with delayed fade-in
 *   - "Tap to continue" hint at the bottom
 *   - Auto-dismiss after 4 seconds or on tap
 *
 * Respects reduceMotion accessibility setting.
 */
import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable, AccessibilityInfo, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn, FadeInDown, FadeOut, ZoomIn, useReducedMotion, useSharedValue, withSpring,
  withDelay, withSequence,
} from 'react-native-reanimated';
import { ScorpionCrest } from '@/components/ui/ScorpionCrest';
import { useLanguage } from '@/contexts/LanguageContext';
import { accent, radii } from '@/constants/colors';
import { haptics, springs } from '@/lib/motion';

export type TierUpFullscreenProps = {
  visible: boolean;
  tierName: string; // e.g. "Gold"
  accentColor?: string; // tier color override; defaults to accent.reward
  subtitle?: string; // e.g. "You earned 500 points this week" (optional)
  onDismiss: () => void;
};

export const TierUpFullscreen = React.forwardRef<View, TierUpFullscreenProps>(
  ({
    visible,
    tierName,
    accentColor = accent.reward,
    subtitle,
    onDismiss,
  }, ref) => {
    const [reduceMotion, setReduceMotion] = useState(false);
    const { t } = useLanguage();
    const prefersReducedMotion = useReducedMotion();

    // Check for Reduce Motion at mount
    useEffect(() => {
      let cancelled = false;
      AccessibilityInfo.isReduceMotionEnabled?.()
        .then((enabled) => {
          if (!cancelled) setReduceMotion(!!enabled);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []);

    // Fire haptic + schedule auto-dismiss on mount
    useEffect(() => {
      if (visible) {
        haptics.heavy?.().catch(() => {});
        const t = setTimeout(onDismiss, 7000);
        return () => clearTimeout(t);
      }
      return undefined;
    }, [visible, onDismiss]);

    const handleDismiss = () => {
      haptics.selection?.().catch(() => {});
      onDismiss();
    };

    const shouldReduceMotion = reduceMotion || prefersReducedMotion;

    const crestEntering = shouldReduceMotion
      ? FadeIn.duration(180)
      : ZoomIn.duration(500).springify().damping(12);

    const labelEntering = shouldReduceMotion
      ? FadeIn.duration(180)
      : FadeInDown.duration(300).delay(0).springify().damping(14);

    const tierEntering = shouldReduceMotion
      ? FadeIn.duration(180)
      : FadeInDown.duration(350).delay(300).springify().damping(14);

    const subtitleEntering = shouldReduceMotion
      ? FadeIn.duration(180)
      : FadeInDown.duration(320).delay(600).springify().damping(14);

    const hintEntering = shouldReduceMotion
      ? FadeIn.duration(180)
      : FadeIn.duration(300).delay(900);

    const exiting = shouldReduceMotion
      ? FadeOut.duration(160)
      : FadeOut.duration(300);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <SafeAreaView style={styles.backdrop} edges={['top', 'left', 'right', 'bottom']}>
          <Pressable
            onPress={handleDismiss}
            style={StyleSheet.absoluteFill}
            accessible={false}
          />

          <Animated.View
            ref={ref}
            entering={FadeIn.duration(200)}
            exiting={exiting}
            style={styles.container}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            accessibilityLabel={`${tierName} tier unlocked`}
          >
            {/* Radial glow backdrop */}
            <View
              style={[
                styles.glowLayer1,
                { backgroundColor: accentColor, opacity: 0.15 },
              ]}
            />
            <View
              style={[
                styles.glowLayer2,
                { backgroundColor: accentColor, opacity: 0.08 },
              ]}
            />

            {/* Animated crest */}
            <Animated.View
              entering={crestEntering}
              style={styles.crestWrapper}
            >
              <ScorpionCrest
                size={120}
                fill={accentColor}
                glyphColor="#FFFFFF"
              />
            </Animated.View>

            {/* "NEW TIER UNLOCKED" label */}
            <Animated.Text
              entering={labelEntering}
              style={[styles.label, { color: accentColor }]}
              accessibilityElementsHidden
            >
              {t.celebration?.newTierUnlocked ?? 'NEW TIER UNLOCKED'}
            </Animated.Text>

            {/* Tier name */}
            <Animated.Text
              entering={tierEntering}
              style={styles.tierName}
              accessibilityElementsHidden
            >
              {tierName}
            </Animated.Text>

            {/* Optional subtitle */}
            {subtitle ? (
              <Animated.Text
                entering={subtitleEntering}
                style={styles.subtitle}
                accessibilityElementsHidden
              >
                {subtitle}
              </Animated.Text>
            ) : null}

            {/* "Tap to continue" hint */}
            <Animated.Text
              entering={hintEntering}
              style={styles.hint}
              accessibilityElementsHidden
            >
              {t.celebration?.tapToContinue ?? 'Tap to continue'}
            </Animated.Text>
          </Animated.View>
        </SafeAreaView>
      </Modal>
    );
  }
);

TierUpFullscreen.displayName = 'TierUpFullscreen';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  glowLayer1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: '50%',
    left: '50%',
    marginTop: -140,
    marginLeft: -140,
  },
  glowLayer2: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    top: '50%',
    left: '50%',
    marginTop: -190,
    marginLeft: -190,
  },
  crestWrapper: {
    zIndex: 10,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    textAlign: 'center',
    zIndex: 10,
  },
  tierName: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    zIndex: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.84)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    zIndex: 10,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.60)',
    textAlign: 'center',
    marginTop: 12,
    zIndex: 10,
  },
});

export default TierUpFullscreen;
