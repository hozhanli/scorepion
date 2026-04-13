/**
 * TierBadge — gamified tier/rank pill for v4.
 *
 * Shows a small pill with an icon + tier name (Rookie, Bronze, Silver,
 * Gold, Diamond, Legend). Colors pulled from constants/colors.ts tiers.
 * Used on profile header, leaderboard rows, group hero, etc.
 *
 * Now features ScorpionCrest as subtle watermark behind tier letter,
 * low-opacity version of the tier color.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tiers, radii } from '@/constants/colors';
import { ScorpionCrest } from './ScorpionCrest';

export type TierName = keyof typeof tiers;

export interface TierBadgeProps {
  tier: TierName;
  level?: number; // optional LVL number to display
  size?: 'sm' | 'md' | 'lg';
  solid?: boolean; // gradient fill if true, soft background if false
}

const ICONS: Record<TierName, keyof typeof Ionicons.glyphMap> = {
  rookie:  'star-outline',
  bronze:  'medal-outline',
  silver:  'medal',
  gold:    'trophy',
  diamond: 'diamond',
  legend:  'flame',
};

export function TierBadge({ tier, level, size = 'md', solid = true }: TierBadgeProps) {
  const cfg = tiers[tier];
  const iconName = ICONS[tier];

  const dims = {
    sm: { px: 10, py: 4,  icon: 12, font: 11, radius: radii.sm, gap: 5 },
    md: { px: 12, py: 6,  icon: 14, font: 12, radius: radii.md, gap: 6 },
    lg: { px: 16, py: 8,  icon: 16, font: 13, radius: radii.lg, gap: 7 },
  }[size];

  const label = level != null ? `LVL ${level} · ${cfg.label}` : cfg.label;

  if (solid) {
    // Low-opacity glyph color for watermark effect (white with 15% opacity)
    const watermarkColor = 'rgba(255, 255, 255, 0.15)';

    return (
      <LinearGradient
        colors={cfg.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.pill,
          {
            paddingHorizontal: dims.px,
            paddingVertical: dims.py,
            borderRadius: dims.radius,
            gap: dims.gap,
          },
        ]}
      >
        {/* ScorpionCrest watermark behind the icon */}
        <View style={[styles.crestWatermark, { width: dims.icon, height: dims.icon }]}>
          <ScorpionCrest
            size={dims.icon}
            fill={watermarkColor}
            glyphColor={watermarkColor}
            accessibilityLabel=""
          />
        </View>
        <Ionicons name={iconName} size={dims.icon} color="#FFFFFF" />
        <Text style={[styles.label, { fontSize: dims.font, color: '#FFFFFF' }]}>{label}</Text>
      </LinearGradient>
    );
  }

  // Low-opacity version of tier fg color for watermark effect
  const watermarkColor = `${cfg.fg}${Math.round(0.15 * 255).toString(16).padStart(2, '0')}`;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: cfg.bg,
          paddingHorizontal: dims.px,
          paddingVertical: dims.py,
          borderRadius: dims.radius,
          gap: dims.gap,
        },
      ]}
    >
      {/* ScorpionCrest watermark behind the icon */}
      <View style={[styles.crestWatermark, { width: dims.icon, height: dims.icon }]}>
        <ScorpionCrest
          size={dims.icon}
          fill={watermarkColor}
          glyphColor={watermarkColor}
          accessibilityLabel=""
        />
      </View>
      <Ionicons name={iconName} size={dims.icon} color={cfg.fg} />
      <Text style={[styles.label, { fontSize: dims.font, color: cfg.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  crestWatermark: {
    position: 'absolute',
    zIndex: -1,
    left: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
