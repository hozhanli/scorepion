/**
 * CelebrationToast — the canonical "moment of delight" primitive.
 *
 * Scorepion has five — and only five — gradient celebration moments. Each
 * one surfaces as a top-of-screen toast that slides in, holds for ~2.4s,
 * and slides out. Haptic `success` fires on show.
 *
 *   1. `lockin`      — prediction successfully locked in
 *   2. `tier`        — promotion to a new leaderboard tier
 *   3. `streak`      — streak incremented to a new milestone
 *   4. `points`      — a finished match settled in your favour
 *   5. `achievement` — badge unlocked
 *
 * Any other "toast"-style notification must use the neutral EmptyState or
 * an inline banner; the celebration colour and haptic are reserved.
 *
 * Usage:
 *   // Mount once at app root
 *   <CelebrationProvider>
 *     <App />
 *   </CelebrationProvider>
 *
 *   // Anywhere inside
 *   const { celebrate } = useCelebration();
 *   celebrate({ variant: 'lockin', title: 'Locked in!', subtitle: '2 – 1 for City' });
 *
 * The provider renders exactly one toast at a time. Rapid-fire celebrations
 * are queued and shown sequentially — a second celebrate() call while one is
 * still on screen will be enqueued, not dropped.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View, Text, StyleSheet, Platform, Pressable, AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeInUp, FadeOut, FadeOutUp, useSharedValue, useAnimatedStyle,
  withSpring, withTiming, interpolate, Extrapolate,
} from 'react-native-reanimated';
import { haptics, springs } from '@/lib/motion';
import { accent, radii, text as textRole } from '@/constants/colors';
import { ScorpionCrest } from '@/components/ui/ScorpionCrest';
import { TierUpFullscreen } from '@/components/ui/TierUpFullscreen';

// ─────────────────────────────────────────────────────────────────────────────
// Types

export type CelebrationVariant =
  | 'lockin'
  | 'tier'
  | 'streak'
  | 'points'
  | 'achievement';

export interface CelebrationPayload {
  variant: CelebrationVariant;
  title: string;
  subtitle?: string;
  /** Custom icon override; defaults to the variant's canonical glyph. */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Display duration in ms. Default: 2400. */
  durationMs?: number;
  /** Optional accent color for glow/ring/crest background. Falls back to variant default if not provided. */
  accentColor?: string;
}

interface CelebrationContextValue {
  celebrate: (payload: CelebrationPayload) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Variant → icon map

const DEFAULT_ICON: Record<CelebrationVariant, React.ComponentProps<typeof Ionicons>['name']> = {
  lockin: 'checkmark-circle',
  tier: 'trophy',
  streak: 'flame',
  points: 'star',
  achievement: 'ribbon',
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider

interface QueuedCelebration extends CelebrationPayload {
  id: number;
}

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueuedCelebration[]>([]);
  const [tierUpPayload, setTierUpPayload] = useState<{ tierName: string; subtitle?: string; accentColor?: string } | null>(null);
  const idCounter = useRef(0);

  const celebrate = useCallback((payload: CelebrationPayload) => {
    // Redirect 'tier' variant to fullscreen instead of toast queue
    if (payload.variant === 'tier') {
      setTierUpPayload({
        tierName: payload.title,
        subtitle: payload.subtitle,
        accentColor: payload.accentColor ?? accent.reward,
      });
    } else {
      idCounter.current += 1;
      const id = idCounter.current;
      setQueue((prev) => [...prev, { ...payload, id }]);
    }
  }, []);

  const dismissCurrent = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const current = queue[0];
  // Pending count excludes the toast currently on-screen. When > 0, the host
  // renders a "(N more)" hint so the user knows more celebrations are queued.
  const pending = Math.max(0, queue.length - 1);

  const value = useMemo<CelebrationContextValue>(() => ({ celebrate }), [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {current ? (
        <CelebrationHost
          key={current.id}
          payload={current}
          pending={pending}
          onDismiss={dismissCurrent}
        />
      ) : null}
      <TierUpFullscreen
        visible={tierUpPayload !== null}
        tierName={tierUpPayload?.tierName ?? ''}
        accentColor={tierUpPayload?.accentColor}
        subtitle={tierUpPayload?.subtitle}
        onDismiss={() => setTierUpPayload(null)}
      />
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    // Fail open — logging is better than crashing the whole screen because a
    // parent forgot to mount the provider.
    return {
      celebrate: (_: CelebrationPayload) => {
        if (__DEV__) {
          console.warn('[CelebrationToast] celebrate() called with no provider mounted.');
        }
      },
    };
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Host (the actual visible toast)

function CelebrationHost({
  payload,
  pending,
  onDismiss,
}: {
  payload: CelebrationPayload;
  pending: number;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 16 : Math.max(insets.top, 16);
  // Default raised from 2400ms → 3500ms so Switch Control and partial-vision
  // users (Ingrid, Julian) can actually read the toast before it dismisses.
  const duration = payload.durationMs ?? 3500;

  // Check for Reduce Motion at mount — if enabled, skip the spring entry and
  // use a plain fade. Android / web never populate this; default to false.
  const [reduceMotion, setReduceMotion] = useState(false);
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

  // Wobble + color shimmer shared values
  const iconScale = useSharedValue(0);
  const colorProgress = useSharedValue(0);

  // Fire haptic + schedule auto-dismiss on mount.
  useEffect(() => {
    haptics.medium?.().catch(() => {});
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  // Animate icon wobble on mount
  useEffect(() => {
    iconScale.value = withSpring(1, springs.wobble);
  }, []);

  // Color shimmer for celebratory variants
  useEffect(() => {
    if (['lockin', 'points', 'achievement'].includes(payload.variant)) {
      colorProgress.value = withTiming(1, { duration: 1200 });
    }
  }, [payload.variant]);

  const iconName = payload.icon ?? DEFAULT_ICON[payload.variant];

  // Determine if this variant should render the ScorpionCrest
  // Note: 'tier' variant is now handled by TierUpFullscreen, not the toast queue
  const showCrest = payload.variant === 'lockin';

  const enteringAnim = reduceMotion
    ? FadeIn.duration(180)
    : FadeInUp.duration(320).springify().damping(14);
  const exitingAnim = reduceMotion ? FadeOut.duration(160) : FadeOutUp.duration(220);

  // Icon wobble animation style
  const iconWobbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Color shimmer for celebratory variants
  const iconShimmerStyle = useAnimatedStyle(() => {
    if (!['lockin', 'points', 'achievement'].includes(payload.variant)) {
      return { opacity: 1 };
    }
    const shimmerOpacity = interpolate(
      colorProgress.value,
      [0, 0.5, 1],
      [1, 0.6, 1],
      Extrapolate.CLAMP
    );
    return { opacity: shimmerOpacity };
  });

  return (
    <Animated.View
      entering={enteringAnim}
      exiting={exitingAnim}
      style={[styles.container, { top: topPad + 6 }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Pressable
        onPress={() => {
          haptics.selection?.().catch(() => {});
          onDismiss();
        }}
        style={styles.toast}
        accessibilityRole="button"
        accessibilityLabel={`${payload.title}${payload.subtitle ? `, ${payload.subtitle}` : ''}. Tap to dismiss.`}
        accessibilityHint="Dismisses the celebration"
      >
        <Animated.View style={[iconWobbleStyle, iconShimmerStyle]}>
          <View style={[styles.iconWell, payload.accentColor && { backgroundColor: payload.accentColor }]}>
            {showCrest ? (
              <ScorpionCrest size={18} fill={payload.accentColor ?? accent.primary} />
            ) : (
              <Ionicons name={iconName} size={20} color="#FFFFFF" />
            )}
          </View>
        </Animated.View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2}>
            {payload.title}
          </Text>
          {payload.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {payload.subtitle}
            </Text>
          ) : null}
        </View>
        {pending > 0 ? (
          <View style={styles.pendingPill} accessibilityElementsHidden>
            <Text style={styles.pendingText}>+{pending}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    minWidth: 240,
    maxWidth: 420,
    // Minimal shadow — the toast needs *some* lift to float above content.
    // This is the only sanctioned shadow in Emerald Minimalism because the
    // toast is the highest z-index ephemeral element in the app.
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: radii.pill / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 2,
  },
  pendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginLeft: 4,
  },
  pendingText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

// Silence unused-import lint if textRole isn't directly used downstream.
void textRole;
