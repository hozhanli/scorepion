/**
 * Terms of Service Screen
 *
 * Themed, scrollable legal policy page with theme-aware tokens.
 * Content is pulled from i18n translations (t.terms.*).
 * Reachable from Settings → Terms of Service.
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
  const terms = t.terms;
  return [
    { key: 'acceptance', heading: terms.acceptance.heading, body: terms.acceptance.body },
    { key: 'eligibility', heading: terms.eligibility.heading, body: terms.eligibility.body },
    { key: 'account', heading: terms.account.heading, body: terms.account.body },
    { key: 'conduct', heading: terms.conduct.heading, body: terms.conduct.body },
    { key: 'predictions', heading: terms.predictions.heading, body: terms.predictions.body },
    { key: 'ip', heading: terms.ip.heading, body: terms.ip.body },
    { key: 'thirdParty', heading: terms.thirdParty.heading, body: terms.thirdParty.body },
    { key: 'disclaimers', heading: terms.disclaimers.heading, body: terms.disclaimers.body },
    { key: 'liability', heading: terms.liability.heading, body: terms.liability.body },
    { key: 'termination', heading: terms.termination.heading, body: terms.termination.body },
    { key: 'law', heading: terms.law.heading, body: terms.law.body },
    { key: 'changes', heading: terms.changes.heading, body: terms.changes.body },
    { key: 'contact', heading: terms.contact.heading, body: terms.contact.body },
  ];
}

export default function TermsOfServiceScreen() {
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
          {t.terms.title}
        </Text>
        <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ScorpionCrest size={24} accessibilityLabel="Scorpion logo" />
        </View>
      </View>

      {/* Last Updated */}
      <Text style={[styles.lastUpdated, { color: textRole.tertiary }]}>
        {t.terms.lastUpdated}
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
