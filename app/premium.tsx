/**
 * PremiumScreen — Emerald Minimalism.
 *
 * Product reality: Scorepion is free. `AppContext.isPremium` is hard-coded to
 * `true`, so every "PRO" gate always passes. Rather than keep a stripe-linked
 * paywall that can never actually be reached, this screen is now an honest
 * "Everything is unlocked" thank-you / feature list.
 *
 * If a monetisation tier is ever reintroduced, re-add the pricing section
 * behind `!isPremium` and wire the CTA back to `/api/stripe/checkout`. The
 * legacy Stripe helpers (`handleCheckout`, `handleManageSubscription`) are
 * intentionally removed here — dead code in the refreshed design.
 *
 * Visual treatment:
 *   • White surface, no gradients, no shadows, no gold/diamond motifs.
 *   • Emerald crest well on top, single emerald accent.
 *   • Feature list: white rows with hairline dividers, neutral icon wells.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { accent, radii, type } from '@/constants/colors';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScorpionCrest } from '@/components/ui/ScorpionCrest';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

function getFeaturesArray(t: any): { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; desc: string }[] {
  const fl = t.premium.featuresList;
  return [
    { icon: 'analytics-outline', title: fl.analyticsTitle, desc: fl.analyticsDesc },
    { icon: 'eye-outline', title: fl.communityTitle, desc: fl.communityDesc },
    { icon: 'stats-chart-outline', title: fl.h2hTitle, desc: fl.h2hDesc },
    { icon: 'flash-outline', title: fl.streakTitle, desc: fl.streakDesc },
    { icon: 'ribbon-outline', title: fl.badgesTitle, desc: fl.badgesDesc },
    { icon: 'people-outline', title: fl.groupsTitle, desc: fl.groupsDesc },
  ];
}

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { surface, border, textRole, isDark } = useTheme();
  const FEATURES = getFeaturesArray(t);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 30 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: topPad + 12, backgroundColor: surface[0], borderBottomColor: border.subtle }]}>
        <View style={styles.navRow}>
          <PressableScale onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: surface[1], borderColor: border.subtle }]} haptic="light">
            <Ionicons name="close" size={22} color={textRole.primary} />
          </PressableScale>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.crestWrap}>
          <View style={styles.crest}>
            <ScorpionCrest
              size={72}
              fill={surface[0]}
              glyphColor={accent.primary}
              accessibilityLabel="Scorpion crest"
            />
          </View>
          <Text style={[styles.heroTitle, { color: textRole.primary }]}>{t.premium.featuresList.everythingUnlocked}</Text>
          <Text style={[styles.heroSubtitle, { color: textRole.secondary }]}>{t.premium.featuresList.tagline}</Text>
        </Animated.View>
      </View>

      <View style={styles.featuresSection}>
        <Text style={[styles.sectionTitle, { color: textRole.primary }]}>{t.premium.featuresList.sectionTitle}</Text>
        {FEATURES.map((feature, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(80 + i * 50).duration(320)}>
            <View style={[styles.featureRow, { borderBottomColor: border.subtle }, i === FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.featureIcon, { backgroundColor: surface[1], borderColor: border.subtle }]}>
                <Ionicons name={feature.icon} size={20} color={accent.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: textRole.primary }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: textRole.secondary }]}>{feature.desc}</Text>
              </View>
              <Ionicons name="checkmark" size={18} color={accent.primary} />
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.ctaSection}>
        <PressableScale
          onPress={() => router.back()}
          style={styles.ctaBtn}
          haptic="medium"
          pressedScale={0.97}
        >
          <Text style={styles.ctaBtnText}>{t.premium.featuresList.ctaBack}</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </PressableScale>
        <Text style={[styles.ctaNote, { color: textRole.tertiary }]}>{t.premium.featuresList.ctaNote}</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  navRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestWrap: {
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  crest: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 166, 81, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: type.h1.size,
    fontFamily: type.h1.family,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },

  // Features
  featuresSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: type.h3.size,
    fontFamily: type.h3.family,
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    lineHeight: 17,
  },

  // CTA
  ctaSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
    gap: 10,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radii.md,
    backgroundColor: accent.primary,
    alignSelf: 'stretch',
  },
  ctaBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  ctaNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
