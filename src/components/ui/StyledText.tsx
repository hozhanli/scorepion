/**
 * StyledText — Canonical typography primitive that locks consumers to the design system scale.
 *
 * Purpose: Enforce the 7-tier type scale across the entire app. Every text element
 * should use StyledText with an explicit `variant` instead of ad-hoc `fontSize`/`fontWeight`.
 * This ensures visual consistency, predictable line heights, and correct font family
 * mapping for Android (where custom fonts require explicit fontFamily, not fontWeight).
 *
 * The scale (Inter):
 *   display  40px / 700 / lineHeight 52
 *   h1       28px / 700 / lineHeight 36
 *   h2       22px / 700 / lineHeight 30
 *   h3       18px / 600 / lineHeight 24
 *   body     15px / 400 / lineHeight 22
 *   caption  13px / 500 / lineHeight 18
 *   micro    11px / 500 / lineHeight 14
 *
 * Color roles (semantic, respects theme):
 *   primary   — #0F172A (ink, 15.3:1 WCAG AA)
 *   secondary — #334155 (gray500, 9.8:1 WCAG AA)
 *   tertiary  — #64748B (gray400, 4.78:1 WCAG AA)
 *   inverse   — #FFFFFF (white, for dark backgrounds)
 *   accent    — emerald (CTAs, highlights)
 *
 * Usage:
 *   <StyledText variant="h1">Welcome</StyledText>
 *   <StyledText variant="body" role="secondary">Subtitle</StyledText>
 *   <StyledText variant="caption" color="#FF6B35">Alert</StyledText>
 *   <StyledText variant="label" weight="700">Bold label</StyledText>
 *
 * Migration path: Replace all <Text style={{ fontSize: X, fontWeight: Y }} />
 * with <StyledText variant="..." />. Consumers must NOT use ad-hoc style
 * overrides for font size or weight; use `weight` prop instead.
 */

import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { type as typeTokens, text as textTokens, accent } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

export type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'micro';
export type Role = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent';
export type Weight = '400' | '500' | '600' | '700';

export interface StyledTextProps {
  variant: Variant;
  role?: Role;
  color?: string;
  weight?: Weight;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  selectable?: boolean;
}

/**
 * Map weight enum to Inter font family names (required for Android custom fonts).
 */
function fontFamilyForWeight(weight: Weight): string {
  switch (weight) {
    case '400':
      return 'Inter_400Regular';
    case '500':
      return 'Inter_500Medium';
    case '600':
      return 'Inter_600SemiBold';
    case '700':
      return 'Inter_700Bold';
    default:
      return 'Inter_400Regular';
  }
}

/**
 * Resolve semantic role to a color value, respecting theme.
 */
function colorForRole(role: Role, theme: ReturnType<typeof useTheme>): string {
  switch (role) {
    case 'primary':
      return theme.colors.text;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'tertiary':
      return theme.colors.textTertiary;
    case 'inverse':
      return theme.colors.textInverse;
    case 'accent':
      return theme.colors.tint;
    default:
      return theme.colors.text;
  }
}

export default function StyledText({
  variant,
  role = 'primary',
  color,
  weight,
  align = 'left',
  numberOfLines,
  style,
  children,
  testID,
  accessibilityLabel,
  onPress,
  selectable,
}: StyledTextProps) {
  const theme = useTheme();

  // Get the token for this variant (size, lineHeight, default weight, letterSpacing)
  const token = typeTokens[variant];

  // Use custom weight if provided; otherwise use variant default
  const finalWeight: Weight = weight || (token.weight as Weight);
  const finalColor = color || colorForRole(role, theme);

  return (
    <Text
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      selectable={selectable}
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: token.size,
          lineHeight: token.lineHeight,
          fontFamily: fontFamilyForWeight(finalWeight),
          color: finalColor,
          textAlign: align,
          letterSpacing: token.letterSpacing,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
