/**
 * Privacy Policy Screen
 *
 * Themed, scrollable legal policy page with theme-aware tokens.
 * Content is pulled from i18n translations (t.privacy.*).
 * Reachable from Settings → Privacy Policy.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { type } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScorpionCrest } from '@/components/ui';

interface Section {
  key: string;
  heading: string;
  body: string;
}

function getSectionsArray(t: any): Section[] {
  const privacy = t.privacy;
  return [
    { key: 'intro', heading: privacy.intro.heading, body: privacy.intro.body },
    { key: 'collect', heading: privacy.collect.heading, body: privacy.collect.body },
    { key: 'use', heading: privacy.use.heading, body: privacy.use.body },
    { key: 'sharing', heading: privacy.sharing.heading, body: privacy.sharing.body },
    { key: 'retention', heading: privacy.retention.heading, body: privacy.retention.body },
    { key: 'rights', heading: privacy.rights.heading, body: privacy.rights.body },
    { key: 'security', heading: privacy.security.heading, body: privacy.security.body },
    { key: 'children', heading: privacy.children.heading, body: privacy.children.body },
    { key: 'international', heading: privacy.international.heading, body: privacy.international.body },
    { key: 'changes', heading: privacy.changes.heading, body: privacy.changes.body },
    { key: 'contact', heading: privacy.contact.heading, body: privacy.contact.body },
  ];
}

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { surface, border, textRole, isDark } = useTheme();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const SECTIONS = getSectionsArray(t);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: surface[1] }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel={t.common.back}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={textRole.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textRole.primary }]}>
          {t.privacy.title}
        </Text>
        <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ScorpionCrest size={24} accessibilityLabel="Scorpion logo" />
        </View>
      </View>

      {/* Last Updated */}
      <Text style={[styles.lastUpdated, { color: textRole.tertiary }]}>
        {t.privacy.lastUpdated}
      </Text>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <View key={section.key} style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: textRole.primary }]}>
            {section.heading}
          </Text>
          <Text style={[styles.sectionBody, { color: textRole.secondary }]}>
            {section.body}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: type.h2.size,
    fontFamily: 'Inter_700Bold',
    lineHeight: type.h2.lineHeight,
  },
  lastUpdated: {
    fontSize: type.caption.size,
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 16,
    marginBottom: 24,
    lineHeight: type.caption.lineHeight,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: type.h3.size,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: type.h3.lineHeight,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: type.body.size,
    fontFamily: 'Inter_400Regular',
    lineHeight: type.body.lineHeight,
  },
});
