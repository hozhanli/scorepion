/**
 * Scorepion v4 Motion Tokens
 *
 * Consistent spring + timing configs for all animations across the app.
 * Inspired by Duolingo / Strava / Sorare:
 *  - Spring defaults: gentle bounce for entries (~380ms arc)
 *  - Tight springs for micro-reactions (~240ms)
 *  - Celebration arcs (500-700ms) for wins and tier climbs
 *  - Haptic helpers paired with motion
 */
import { Platform } from 'react-native';
import {
  FadeIn, FadeInDown, FadeInUp, FadeOut,
  ZoomIn, SlideInUp, SlideInRight,
  withSpring, withTiming, Easing,
  type WithSpringConfig, type WithTimingConfig,
} from 'react-native-reanimated';

// Spring presets
export const springs = {
  // Default entry/response - gentle bounce, ~380ms
  default: { mass: 1, damping: 16, stiffness: 180 } as WithSpringConfig,

  // Micro-reaction - tight snap, ~240ms (button press, emoji tap)
  snappy: { mass: 0.8, damping: 14, stiffness: 260 } as WithSpringConfig,

  // Gentle - slow settle, ~500ms (modal entrance)
  gentle: { mass: 1.2, damping: 22, stiffness: 140 } as WithSpringConfig,

  // Overshoot - celebratory pop (~20% overshoot, ~600ms)
  pop: { mass: 1, damping: 10, stiffness: 160 } as WithSpringConfig,

  // Wobble - playful shake for rewards
  wobble: { mass: 1, damping: 7, stiffness: 200 } as WithSpringConfig,
};

// Timing presets
// Reserved for future use — currently unused
export const timings = {
  fast:   { duration: 180, easing: Easing.out(Easing.cubic) } as WithTimingConfig,
  base:   { duration: 280, easing: Easing.out(Easing.cubic) } as WithTimingConfig,
  slow:   { duration: 480, easing: Easing.out(Easing.cubic) } as WithTimingConfig,
  linger: { duration: 680, easing: Easing.out(Easing.cubic) } as WithTimingConfig,
};

// Stagger helpers (use with .delay(stagger(i)))
export function stagger(i: number, step = 60, max = 6) {
  return Math.min(i, max) * step;
}

// Entry animations — curated shortcuts
export const entries = {
  fadeIn:     () => FadeIn.duration(280).springify().damping(18),
  fadeInDown: (i = 0) => FadeInDown.delay(stagger(i)).duration(380).springify().damping(16),
  fadeInUp:   (i = 0) => FadeInUp.delay(stagger(i)).duration(380).springify().damping(16),
  pop:        (i = 0) => ZoomIn.delay(stagger(i, 80)).duration(420).springify().damping(12),
  slideUp:    (i = 0) => SlideInUp.delay(stagger(i)).duration(420).springify().damping(16),
  slideRight: (i = 0) => SlideInRight.delay(stagger(i)).duration(420).springify().damping(16),
};

// Press scale helpers — for PressableScale wrapper
// Reserved for future use — currently unused
export const press = {
  scaleIn:  () => withSpring(0.96, springs.snappy),
  scaleOut: () => withSpring(1, springs.pop),
};

// Haptics — lazy imported so web still works
let _haptics: typeof import('expo-haptics') | null = null;
async function getHaptics() {
  if (Platform.OS === 'web') return null;
  if (_haptics) return _haptics;
  try {
    _haptics = await import('expo-haptics');
    return _haptics;
  } catch {
    return null;
  }
}

export const haptics = {
  light: async () => {
    const h = await getHaptics();
    if (h) h.impactAsync(h.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: async () => {
    const h = await getHaptics();
    if (h) h.impactAsync(h.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  heavy: async () => {
    const h = await getHaptics();
    if (h) h.impactAsync(h.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  success: async () => {
    const h = await getHaptics();
    if (h) h.notificationAsync(h.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: async () => {
    const h = await getHaptics();
    if (h) h.notificationAsync(h.NotificationFeedbackType.Warning).catch(() => {});
  },
  selection: async () => {
    const h = await getHaptics();
    if (h) h.selectionAsync().catch(() => {});
  },
};

export { withSpring, withTiming, Easing };
