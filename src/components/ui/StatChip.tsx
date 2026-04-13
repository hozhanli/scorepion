/**
 * StatChip — compact inline stat chip for v4.
 *
 * A small pill showing an icon + value + label (e.g., "🎯 72% acc",
 * "🔥 12 streak"). Built for use inside rows and cards where a full
 * MetricCard is overkill.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StatChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label?: string;
  color?: string;
  background?: string;
  size?: 'sm' | 'md';
}

export function StatChip({
  icon,
  value,
  label,
  color = '#0F172A',
  background = 'rgba(15, 23, 42, 0.05)',
  size = 'md',
}: StatChipProps) {
  const dims = size === 'sm'
    ? { py: 4, px: 8, icon: 11, font: 11 }
    : { py: 6, px: 10, icon: 13, font: 12 };

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: background, paddingVertical: dims.py, paddingHorizontal: dims.px },
      ]}
    >
      <Ionicons name={icon} size={dims.icon} color={color} />
      <Text style={[styles.value, { color, fontSize: dims.font }]}>
        {value}
      </Text>
      {label ? (
        <Text style={[styles.label, { color, fontSize: dims.font - 1, opacity: 0.7 }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  value: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.1,
  },
  label: {
    fontFamily: 'Inter_500Medium',
  },
});
