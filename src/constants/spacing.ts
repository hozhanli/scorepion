/**
 * Spacing scale — strict 4px baseline grid.
 * Use these tokens for padding, margin, and flex gap across all components.
 * DO NOT hardcode values outside this scale (14, 18, etc.) — lint will flag.
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/**
 * Gap scale — for flex container gap prop.
 * Tuned for denser inline spacing than the primary spacing scale.
 */
export const gap = {
  1: 4,
  2: 6,
  3: 8,
  4: 12,
  5: 16,
} as const;

export type SpacingKey = keyof typeof spacing;
export type GapKey = keyof typeof gap;
