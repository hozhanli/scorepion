import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

interface PremiumLockProps {
  title?: string;
  compact?: boolean;
}

export function PremiumLock({ title = 'Premium Feature', compact = false }: PremiumLockProps) {
  const { colors, isDark } = useTheme();
  if (compact) {
    return (
      <Pressable
        onPress={() => router.push('/premium')}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      >
        <View style={styles.compactBadge}>
          <Ionicons name="lock-closed" size={9} color="#B8860B" />
          <Text style={styles.compactText}>PRO</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push('/premium')}
      style={({ pressed }) => [pressed && { opacity: 0.9 }]}
    >
      <View style={styles.card}>
        <View style={styles.lockIconWrap}>
          <Ionicons name="lock-closed" size={18} color="#B8860B" />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={styles.subtitle}>Upgrade to unlock</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.palette.gray300} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  lockIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,215,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.light.text },
  subtitle: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.palette.gray300, marginTop: 2 },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  compactText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#B8860B',
    letterSpacing: 0.5,
  },
});
