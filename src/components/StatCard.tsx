import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors, { radii, shadows } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string | number;
  bgColor?: string;
}

export function StatCard({ icon, iconColor, label, value, bgColor }: StatCardProps) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }, bgColor ? { backgroundColor: bgColor } : undefined]}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: radii.md,
    padding: 14,
    alignItems: 'center',
    gap: 5,
    ...shadows.card,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.light.text,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.palette.gray300,
    textAlign: 'center',
  },
});
