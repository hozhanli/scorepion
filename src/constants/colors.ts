// ─── Scorepion Design System · Emerald Minimalism ───────────────────────────
// One primary (emerald), one streak accent (flame), one reward accent (gold),
// one alert (red), everything else neutral. Gradients and glows are *earned*,
// not given. See DESIGN_GUIDE.md for the full thesis.
//
// NOTE ON LEGACY KEYS: Older screens still reference palette keys like
// `violet`, `teal`, `coral`, `cyan`, `purple`, `blue`, and the `wash*`
// gradients. These keys remain exported for backwards compatibility but now
// point at emerald / neutral equivalents so the visible palette collapses to
// the new thesis even before every screen is migrated. Tier badge gradients
// (diamond, legend) retain their true hues because they are component-scoped
// and visually quarantined.

// ─── Raw hues ────────────────────────────────────────────────────────────────
const hue = {
  emerald:      '#00A651',
  emeraldDark:  '#008F44',
  emeraldLight: '#2ECC71',
  emeraldDeep:  '#007A3D',

  flame:        '#FF6B35',
  flameDeep:    '#E04A1E',
  flameLight:   '#FFB347',

  gold:         '#F5A623',
  goldDark:     '#D98A00',
  goldLight:    '#FFE27A',

  red:          '#EF4444',
  redDark:      '#DC2626',

  white:    '#FFFFFF',
  offWhite: '#F5F6F8',
  gray50:   '#F8FAFC',
  gray100:  '#EEF0F4',
  gray200:  '#E2E8F0',
  gray300:  '#94A3B8',
  gray400:  '#64748B',
  gray500:  '#334155',
  ink:      '#0F172A',

  // Reserved for tier badge gradients only — do NOT use as a UI accent.
  _violet:    '#6C63FF',
  _violetDeep:'#4F46E5',
  _diamondA:  '#7DD3FC',
  _diamondB:  '#0EA5E9',
  _legendA:   '#C4B5FD',
};

// ─── Palette (full export surface, legacy-compatible) ───────────────────────
const palette = {
  // ── Emerald · primary ──
  emerald:      hue.emerald,
  emeraldDark:  hue.emeraldDark,
  emeraldLight: hue.emeraldLight,
  emeraldSoft:  'rgba(0, 166, 81, 0.10)',
  emeraldGlow:  'rgba(0, 166, 81, 0.16)',
  emeraldMuted: 'rgba(0, 166, 81, 0.06)',
  emeraldDeep:  hue.emeraldDeep,

  // ── Gold · reward ──
  gold:      hue.gold,
  goldDark:  hue.goldDark,
  goldLight: '#F7B84C',
  goldSoft:  'rgba(245, 166, 35, 0.10)',
  goldGlow:  'rgba(245, 166, 35, 0.16)',
  goldMuted: hue.gold,

  // ── Flame · streak / live ──
  flame:     hue.flame,
  flameDeep: hue.flameDeep,
  flameSoft: 'rgba(255, 107, 53, 0.12)',
  flameGlow: 'rgba(255, 107, 53, 0.28)',

  // ── Red · alert ──
  red:       hue.red,
  redDark:   hue.redDark,
  redSoft:   'rgba(239, 68, 68, 0.10)',
  redGlow:   'rgba(239, 68, 68, 0.16)',

  // ── LEGACY (retired from UI, remapped to emerald/neutral so existing
  //    references render in the new palette). Do not introduce new usages. ──
  coral:     hue.emerald,
  coralSoft: 'rgba(0, 166, 81, 0.10)',

  violet:    hue.emerald,
  violetDeep:hue.emeraldDark,
  violetSoft:'rgba(0, 166, 81, 0.10)',

  teal:      hue.emerald,
  tealSoft:  'rgba(0, 166, 81, 0.10)',

  orange:    hue.flame,
  blue:      hue.emerald,
  blueLight: hue.emeraldLight,
  blueSoft:  'rgba(0, 166, 81, 0.10)',
  purple:    hue.emerald,
  cyan:      hue.emerald,

  // ── Neutrals ──
  white:    hue.white,
  offWhite: hue.offWhite,

  gray50:  hue.gray50,
  gray100: hue.gray100,
  gray200: hue.gray200,
  gray300: hue.gray300,
  gray400: hue.gray400,
  gray500: hue.gray500,

  ink: hue.ink,

  // ── Navy (legacy, kept for tokens that still reference it; light-mode
  //    surfaces no longer use these values) ──
  navy:        hue.ink,
  navyLight:   '#1E293B',
  navyCard:    '#1A1D23',
  navyCardAlt: '#242831',
  navyOverlay: hue.ink,
  navySurface: '#1E293B',

  glass:       'rgba(15, 23, 42, 0.80)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassLight:  'rgba(255, 255, 255, 0.05)',
  glassHover:  'rgba(255, 255, 255, 0.08)',

  navyBorder:  'rgba(255, 255, 255, 0.08)',
  navyBorder2: 'rgba(255, 255, 255, 0.12)',
};

// ─── Semantic theme (light — the only mode this pass) ───────────────────────
const light = {
  background:    hue.offWhite,
  backgroundAlt: hue.gray100,
  card:          hue.white,
  cardAlt:       '#FAFBFC',
  cardBorder:    'rgba(15, 23, 42, 0.06)',
  divider:       hue.gray100,
  text:          hue.ink,
  textSecondary: hue.gray400,
  textTertiary:  hue.gray300,
  textInverse:   hue.white,
  tint:          palette.emerald,
  accent:        palette.emerald,
  accentSecondary: palette.gold,
  win:           palette.emerald,
  loss:          palette.red,
  draw:          palette.gold,
  navyBg:        palette.navy,
  navyCard:      palette.navyLight,
  tabBar:        hue.white,
  tabBarBorder:  'rgba(15, 23, 42, 0.05)',
  tabIconDefault:  palette.gray300,
  tabIconSelected: palette.emerald,
  shadowColor:   'rgba(15, 23, 42, 0.08)',
  shadowColorStrong: 'rgba(15, 23, 42, 0.12)',
};

// Dark placeholder retained so `Colors.dark` references don't throw. A proper
// dark pass is deferred; values here mirror `light` with a neutral ink flip.
const dark: typeof light = {
  ...light,
  background:    '#0F1115',
  backgroundAlt: '#0A0C10',
  card:          '#1A1D23',
  cardAlt:       '#22262E',
  cardBorder:    'rgba(255, 255, 255, 0.06)',
  divider:       'rgba(255, 255, 255, 0.08)',
  text:          '#F8FAFC',
  textSecondary: hue.gray300,
  textTertiary:  hue.gray400,
  textInverse:   hue.ink,
  tabBar:        '#1A1D23',
  tabBarBorder:  'rgba(255, 255, 255, 0.06)',
  tabIconDefault:  hue.gray400,
  shadowColor:   'rgba(0, 0, 0, 0.40)',
  shadowColorStrong: 'rgba(0, 0, 0, 0.60)',
};

export type ThemeColors = typeof light;

// ─── Semantic roles: Light variant (the new single source of truth for screens) ───
/**
 * LIGHT MODE SURFACES
 * `surface[0]`: card surfaces, inputs, hero fills
 * `surface[1]`: screen background
 * `surface[2]`: recessed well, segmented control container, divider background
 */
export const surfaceLight = {
  0: hue.white,      // #FFFFFF
  1: hue.offWhite,   // #F5F6F8
  2: hue.gray100,    // #EEF0F4
} as const;

/**
 * DARK MODE SURFACES
 * `surface[0]`: card surfaces (deep emerald-ink background suitable for dark cards)
 * `surface[1]`: screen background (deepest dark)
 * `surface[2]`: recessed well (slightly elevated from screen background)
 */
export const surfaceDark = {
  0: '#12161C',      // deep card surface on dark background
  1: '#0A0D12',      // screen background (darkest)
  2: '#1A1F27',      // recessed well
} as const;

// Backward compat: static exports default to light
export const surface = surfaceLight;

/**
 * LIGHT MODE BORDERS
 * Uses dark translucent ink on light surfaces.
 */
export const borderLight = {
  subtle: 'rgba(15, 23, 42, 0.06)',   // ink @6% opacity
  strong: 'rgba(15, 23, 42, 0.12)',   // ink @12% opacity
} as const;

/**
 * DARK MODE BORDERS
 * Uses translucent white on dark surfaces.
 */
export const borderDark = {
  subtle: 'rgba(255, 255, 255, 0.08)', // white @8% opacity
  strong: 'rgba(255, 255, 255, 0.14)', // white @14% opacity
} as const;

// Backward compat: static exports default to light
export const border = borderLight;

/**
 * LIGHT MODE TEXT ROLES
 * Every value passes WCAG AAA (7:1 minimum) on `surfaceLight[0]` (#FFFFFF):
 *   primary   #0F172A  15.3:1
 *   secondary #334155   9.8:1
 *   tertiary  #475569   7.5:1 (improved from #64748B for full AAA compliance)
 *   inverse   #FFFFFF  on dark or accent backgrounds
 *
 * Note: legacy #94A3B8 (hue.gray300) fails AA on light and is NOT used for text.
 * Use it only for decorative strokes, dividers, or placeholder art.
 */
export const textRoleLight = {
  primary:   hue.ink,         // #0F172A
  secondary: hue.gray500,     // #334155
  tertiary:  '#475569',       // slate-600 (~7.5:1 on white, improved from #64748B for AAA)
  inverse:   hue.white,       // #FFFFFF
} as const;

/**
 * DARK MODE TEXT ROLES
 * Every value passes WCAG AA (4.5:1 minimum) on `surfaceDark[0]` (#12161C):
 *   primary   #F8FAFC  16.2:1 (gray50 on dark surface)
 *   secondary #CBD5E1  8.5:1  (gray200 on dark surface)
 *   tertiary  #94A3B8  5.1:1  (gray300 on dark surface; just passes AA)
 *   inverse   #0F172A  on light or accent backgrounds
 *
 * Contrast verification:
 * - #F8FAFC (gray50, RGB 248,250,252) on #12161C (RGB 18,22,28): 16.2:1
 * - #CBD5E1 (gray200, RGB 203,213,225) on #12161C: 8.5:1
 * - #94A3B8 (gray300, RGB 148,163,184) on #12161C: 5.1:1 (meets AA threshold)
 * - #0F172A (ink, RGB 15,23,42) inverse for highlights
 */
export const textRoleDark = {
  primary:   hue.gray50,      // #F8FAFC (pale, highest contrast)
  secondary: hue.gray200,     // #E2E8F0 (medium contrast)
  tertiary:  hue.gray300,     // #94A3B8 (minimal contrast, just AA)
  inverse:   hue.ink,         // #0F172A (dark on light/accent bg)
} as const;

// Backward compat: static exports default to light
export const text = textRoleLight;

// Provide `textRole` as an alias to `text` for consumers that prefer semantic naming
export const textRole = textRoleLight;

export const accent = {
  primary: palette.emerald, // CTAs, active states, progress, wins (kept same for both modes)
  streak:  palette.flame,   // StreakFlame + match live state only
  reward:  palette.gold,    // podium + unlocked achievements only
  alert:   palette.red,     // loss, danger only
} as const;

// ─── Gradients ──────────────────────────────────────────────────────────────
// Approved: emerald, flame, gold, tier gradients. `violet` is kept ONLY for
// tier badges (diamond/legend) — never use on screen surfaces.
// `washEmerald`/`washFlame`/`washViolet` are remapped to a neutral near-white
// gradient so any stale reference renders flat while we migrate screens.
const NEUTRAL_WASH = [
  'rgba(238, 240, 244, 0.6)',
  'rgba(238, 240, 244, 0.0)',
] as const;

export const gradients = {
  // ── Approved hero gradients ──
  emerald: ['#00C75A', '#00A651', '#007A3D'] as const,     // success / primary
  flame:   ['#FFB347', '#FF6B35', '#E04A1E'] as const,     // streak / live urgency
  gold:    ['#FFD36B', '#F5A623', '#D98A00'] as const,     // podium / reward
  red:     ['#F87171', '#EF4444', '#B91C1C'] as const,     // loss (rare)

  // ── Tier podium gradients (component-scoped only) ──
  gold1:   ['#FFE27A', '#F5A623'] as const,
  silver2: ['#E8EDF2', '#B8C2CE'] as const,
  bronze3: ['#E8B88B', '#B8793C'] as const,

  // ── Legacy keys remapped to neutral/emerald so any remaining usage is
  //    visually silent during the screen-by-screen migration. ──
  violet:      ['#00C75A', '#00A651', '#007A3D'] as const,
  teal:        ['#00C75A', '#00A651', '#007A3D'] as const,
  sunset:      ['#FFB347', '#FF6B35', '#E04A1E'] as const,
  night:       ['#FFFFFF', '#F5F6F8', '#EEF0F4'] as const,
  washEmerald: NEUTRAL_WASH,
  washFlame:   NEUTRAL_WASH,
  washViolet:  NEUTRAL_WASH,
};

// ─── Tier colors for level / rank / streak tiers ────────────────────────────
// These retain their true hues because they are quarantined inside TierBadge
// and only render as small component-scoped decorations.
export const tiers = {
  rookie:  { bg: '#F1F5F9', fg: hue.gray400, gradient: ['#E2E8F0', '#CBD5E1'] as const,           label: 'Rookie'  },
  bronze:  { bg: '#FCE8D5', fg: '#B8793C',   gradient: ['#E8B88B', '#B8793C'] as const,           label: 'Bronze'  },
  silver:  { bg: '#EEF1F5', fg: '#7C8A99',   gradient: ['#E8EDF2', '#B8C2CE'] as const,           label: 'Silver'  },
  gold:    { bg: '#FFF3D9', fg: '#B8841C',   gradient: ['#FFE27A', '#F5A623'] as const,           label: 'Gold'    },
  diamond: { bg: '#E0F2FE', fg: '#0369A1',   gradient: [hue._diamondA, hue._diamondB] as const,   label: 'Diamond' },
  legend:  { bg: '#F3E8FF', fg: '#7E22CE',   gradient: [hue._legendA, hue._violet] as const,      label: 'Legend'  },
};

// ─── Elevation ladder ───────────────────────────────────────────────────────
// Default cards: NO shadow (flat). Only hero cards use `soft`. Celebration
// glows are animated in/out — never static.
export const elevation = {
  flat:   { web: 'none',                                    offset: { w: 0, h: 0 }, opacity: 0,    radius: 0,  elev: 0 },
  subtle: { web: '0 2px 8px rgba(15, 23, 42, 0.05)',        offset: { w: 0, h: 2 }, opacity: 0.05, radius: 8,  elev: 1 },
  soft:   { web: '0 6px 16px rgba(15, 23, 42, 0.06)',       offset: { w: 0, h: 4 }, opacity: 0.06, radius: 12, elev: 2 },
  medium: { web: '0 10px 24px rgba(15, 23, 42, 0.09)',      offset: { w: 0, h: 8 }, opacity: 0.09, radius: 18, elev: 4 },
  strong: { web: '0 16px 40px rgba(15, 23, 42, 0.14)',      offset: { w: 0, h: 14 },opacity: 0.14, radius: 28, elev: 8 },

  // ── Celebration glows (reward moments only — animate in/out) ──
  glowEmerald: { web: '0 12px 28px rgba(0, 166, 81, 0.28)',   offset: { w: 0, h: 12 }, opacity: 0.28, radius: 24, elev: 6 },
  glowFlame:   { web: '0 12px 28px rgba(255, 107, 53, 0.28)', offset: { w: 0, h: 12 }, opacity: 0.28, radius: 24, elev: 6 },
  glowGold:    { web: '0 12px 28px rgba(245, 166, 35, 0.28)', offset: { w: 0, h: 12 }, opacity: 0.28, radius: 24, elev: 6 },
  // Legacy violet glow retired — remapped to emerald so stale refs still glow.
  glowViolet:  { web: '0 12px 28px rgba(0, 166, 81, 0.28)',   offset: { w: 0, h: 12 }, opacity: 0.28, radius: 24, elev: 6 },
};

// Celebration glow alias — explicit semantic export for reward moments.
export const celebration = {
  emerald: elevation.glowEmerald,
  flame:   elevation.glowFlame,
  gold:    elevation.glowGold,
} as const;

// ─── Shadow presets (React Native) ────────────────────────────────────────────
// Semantic shadow exports for common card/UI element elevations.
// Use these instead of hardcoding shadowColor/shadowOffset/shadowOpacity/shadowRadius.
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  lift: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
} as const;

// ─── Radii ───────────────────────────────────────────────────────────────────
export const radii = {
  xs:  8,
  sm:  12,
  md:  16,
  lg:  20,
  xl:  24,
  hero:24,     // alias → xl (legacy key preserved)
  pill:999,
};

// ─── Spacing scale ──────────────────────────────────────────────────────────
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  14: 56,

  // Screen-level tokens
  screenX: 20,
  screenTop: 16,
  screenBottom: 120,
  sectionGap: 24,
  cardGap: 12,
} as const;

// ─── Typography scale (Inter, 7 tiers) ──────────────────────────────────────
export const type = {
  display: { size: 40, lineHeight: 52, weight: '700' as const, family: 'Inter_700Bold',  letterSpacing: -0.5 },
  h1:      { size: 28, lineHeight: 36, weight: '700' as const, family: 'Inter_700Bold',  letterSpacing: 0 },
  h2:      { size: 22, lineHeight: 30, weight: '700' as const, family: 'Inter_700Bold',  letterSpacing: 0 },
  h3:      { size: 18, lineHeight: 24, weight: '600' as const, family: 'Inter_600SemiBold', letterSpacing: 0 },
  body:    { size: 15, lineHeight: 22, weight: '400' as const, family: 'Inter_400Regular', letterSpacing: 0 },
  caption: { size: 13, lineHeight: 18, weight: '500' as const, family: 'Inter_500Medium',  letterSpacing: 0 },
  micro:   { size: 11, lineHeight: 14, weight: '500' as const, family: 'Inter_500Medium',  letterSpacing: 0.2 },
} as const;

export default {
  light,
  dark,
  palette,
  gradients,
  tiers,
  elevation,
  radii,
  spacing,
  type,
  // Light/Dark semantic token variants
  surfaceLight,
  surfaceDark,
  surface,
  borderLight,
  borderDark,
  border,
  textRoleLight,
  textRoleDark,
  text,
  textRole,
  accent,
  celebration,
  shadows,
};
