/**
 * ConnectionBanner — Shows a dismissible warning when the API server is unreachable.
 * Pings /api/health on mount and periodically retries. Hides once connected.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors, { radii, shadows } from '@/constants/colors';
import { getApiUrl } from '@/lib/query-client';
import { useLanguage } from '@/contexts/LanguageContext';

export function ConnectionBanner() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const checkConnection = useCallback(async () => {
    try {
      const base = getApiUrl();
      const res = await fetch(`${base}api/health`, { method: 'GET' });
      if (res.ok) {
        setOffline(false);
        return;
      }
      setOffline(true);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const id = setInterval(checkConnection, 15_000);
    return () => clearInterval(id);
  }, [checkConnection]);

  if (!offline || dismissed) return null;

  const topOffset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={[styles.banner, { top: topOffset }]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
        <Text style={styles.text}>Can't reach server — running offline</Text>
      </View>
      <Pressable
        onPress={() => setDismissed(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t.a11y.close}
      >
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.palette.orange,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
    ...shadows.subtle,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  text: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
