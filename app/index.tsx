/**
 * Root splash route — Branded handoff from native splash.
 *
 * Dark navy background (#060D1F) matches the native expo-splash screen,
 * creating a seamless visual transition. The Scorpion crest is positioned
 * identically to the splash icon, then animates into view with the wordmark
 * and tagline below.
 *
 * Entrance choreography:
 *   - Crest: ZoomIn (500ms) — appears as native splash hides
 *   - Wordmark: FadeInDown (400ms, 200ms delay) — slides down below crest
 *   - Tagline: FadeIn (500ms, 500ms delay) — fades in subtly
 *
 * After ~1.2s, routes to auth / onboarding / (tabs) depending on state.
 */
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { ZoomIn, FadeInDown, FadeIn, useReducedMotion } from 'react-native-reanimated';
import { ScorpionCrest } from '@/components/ui/ScorpionCrest';
import StyledText from '@/components/ui/StyledText';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';

const SPLASH_BACKGROUND = '#060D1F'; // Matches app.json splash.backgroundColor
const SPLASH_DELAY_MS = 1200; // Total splash moment duration

export default function RootIndex() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { onboardingDone, isLoading: appLoading } = useApp();
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();

  // Determine routing target
  const nextRoute = useMemo(() => {
    if (!isAuthenticated) return '/auth';
    if (!onboardingDone) return '/onboarding';
    return '/(tabs)';
  }, [isAuthenticated, onboardingDone]);

  // Auto-advance after branded splash moment
  useEffect(() => {
    if (!authLoading && !appLoading) {
      const timeout = setTimeout(() => {
        router.replace(nextRoute);
      }, SPLASH_DELAY_MS);
      return () => clearTimeout(timeout);
    }
  }, [authLoading, appLoading, nextRoute]);

  return (
    <View style={styles.container}>
      {/* Crest: Enters at splash handoff */}
      <Animated.View
        entering={
          reduceMotion
            ? undefined
            : ZoomIn.duration(500).springify()
        }
      >
        <ScorpionCrest size={80} />
      </Animated.View>

      {/* Wordmark: Slides down below crest */}
      <Animated.View
        style={styles.wordmarkContainer}
        entering={
          reduceMotion
            ? undefined
            : FadeInDown.delay(200).duration(400)
        }
      >
        <StyledText
          variant="h2"
          weight="700"
          role="inverse"
          align="center"
        >
          Scorepion
        </StyledText>
      </Animated.View>

      {/* Tagline: Fades in subtly */}
      <Animated.View
        style={styles.taglineContainer}
        entering={
          reduceMotion
            ? undefined
            : FadeIn.delay(500).duration(500)
        }
      >
        <StyledText
          variant="caption"
          role="inverse"
          align="center"
          style={{ opacity: 0.7 }}
        >
          {t.app.tagline}
        </StyledText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BACKGROUND,
  },
  wordmarkContainer: {
    marginTop: 20,
  },
  taglineContainer: {
    marginTop: 12,
  },
});
