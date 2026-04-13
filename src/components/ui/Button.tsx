/**
 * Button — Canonical primary/secondary/tertiary button primitive.
 *
 * Consolidates every ad-hoc button (LinearGradient CTAs, styled Pressables,
 * text links) across the app into a single source of truth.
 *
 *   primary   — solid emerald, white text, 54px tall, e1 shadow
 *   secondary — white fill, hairline border, emerald text, 54px tall
 *   tertiary  — transparent, emerald text, 44px tall (links)
 *   danger    — solid red, white text, 54px tall
 *
 * Every press uses PressableScale with haptics.medium. Loading state shows
 * an ActivityIndicator in the button color. Icon slot (leading or trailing).
 */
import React from 'react';
import { Text, View, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accent, radii, type } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  variant?: Variant;
  size?: Size;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'leading' | 'trailing';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  haptic?: 'none' | 'light' | 'medium' | 'heavy' | 'selection';
  accessibilityLabel?: string;
}

const HEIGHTS: Record<Size, number> = { sm: 40, md: 48, lg: 54 };

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'leading',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
  haptic = 'medium',
  accessibilityLabel,
}: ButtonProps) {
  const { surface, border } = useTheme();
  const height = HEIGHTS[size];
  const isDisabled = disabled || loading;
  const tone = colorsFor(variant, isDisabled, surface, border);
  const a11yLabel = accessibilityLabel ?? title;

  return (
    <PressableScale
      onPress={isDisabled ? undefined : onPress}
      haptic={isDisabled ? 'none' : haptic}
      pressedScale={0.96}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        {
          height,
          backgroundColor: tone.bg,
          borderColor: tone.border,
          borderWidth: tone.border === 'transparent' ? 0 : 1,
          borderRadius: size === 'lg' ? radii.md : radii.sm,
          paddingHorizontal: size === 'lg' ? 24 : 16,
          opacity: isDisabled ? 0.55 : 1,
        },
        fullWidth && styles.full,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tone.fg} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'leading' ? (
            <Ionicons name={icon} size={18} color={tone.fg} style={{ marginRight: 8 }} />
          ) : null}
          <Text
            style={[
              styles.label,
              {
                color: tone.fg,
                fontSize: size === 'sm' ? type.caption.size : 15,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {icon && iconPosition === 'trailing' ? (
            <Ionicons name={icon} size={18} color={tone.fg} style={{ marginLeft: 8 }} />
          ) : null}
        </View>
      )}
    </PressableScale>
  );
}

function colorsFor(variant: Variant, disabled: boolean, surface: any, border: any) {
  if (variant === 'primary') return { bg: accent.primary, fg: '#FFFFFF', border: 'transparent' };
  if (variant === 'danger') return { bg: accent.alert, fg: '#FFFFFF', border: 'transparent' };
  if (variant === 'secondary') return { bg: surface[0], fg: accent.primary, border: border.subtle };
  return { bg: 'transparent', fg: accent.primary, border: 'transparent' };
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch', width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { letterSpacing: 0 },
});

