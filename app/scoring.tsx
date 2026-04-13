/**
 * ScoringGuideScreen — "How scoring works" transparency page.
 *
 * Written in Emerald Minimalism: white surface, hairline dividers, a single
 * emerald accent per rule. No gradients, no hex literals. Reachable from
 * Settings → "How scoring works".
 *
 * The copy is authored to match the server-side scoring rules in
 * `server/services/predictions.service.ts`. If those rules change, update
 * the RULES array here in lock-step.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { accent, radii, type } from '@/constants/colors';
import { PressableScale } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface Rule {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  points: string;
  description: string;
}

function getRulesArray(t: any): Rule[] {
  const rules = t.scoring.rules;
  return [
    {
      icon: 'star',
      title: rules.exactTitle,
      points: rules.exactPoints,
      description: rules.exactDesc,
    },
    {
      icon: 'checkmark-circle',
      title: rules.correctTitle,
      points: rules.correctPoints,
      description: rules.correctDesc,
    },
    {
      icon: 'close-circle',
      title: rules.wrongTitle,
      points: rules.wrongPoints,
      description: rules.wrongDesc,
    },
    {
      icon: 'flash',
      title: rules.boostTitle,
      points: rules.boostPoints,
      description: rules.boostDesc,
    },
    {
      icon: 'flame',
      title: rules.streakTitle,
      points: rules.streakPoints,
      description: rules.streakDesc,
    },
    {
      icon: 'trophy',
      title: rules.weeklyTitle,
      points: rules.weeklyPoints,
      description: rules.weeklyDesc,
    },
  ];
}

export default function ScoringGuideScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { surface, border, textRole, isDark } = useTheme();
  const RULES = getRulesArray(t);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: surface[0], borderBottomColor: border.subtle }]}>
        <PressableScale
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: surface[1], borderColor: border.subtle }]}
          haptic="light"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={textRole.primary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: textRole.primary }]}>{t.scoring.headerTitle}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Intro */}
      <Animated.View entering={FadeInDown.duration(320)} style={styles.intro}>
        <View style={styles.introIcon}>
          <Ionicons name="book" size={26} color={accent.primary} />
        </View>
        <Text style={[styles.introTitle, { color: textRole.primary }]}>{t.scoring.introTitle}</Text>
        <Text style={[styles.introText, { color: textRole.secondary }]}>{t.scoring.introText}</Text>
      </Animated.View>

      {/* Rules */}
      <View style={styles.rulesWrap}>
        {RULES.map((rule, i) => (
          <Animated.View key={rule.title} entering={FadeInDown.delay(80 + i * 50).duration(320)}>
            <View style={[styles.rule, { backgroundColor: surface[0], borderColor: border.subtle }]}>
              <View style={[styles.ruleIconWell, { backgroundColor: surface[1], borderColor: border.subtle }]}>
                <Ionicons name={rule.icon} size={20} color={accent.primary} />
              </View>
              <View style={styles.ruleBody}>
                <View style={styles.ruleTitleRow}>
                  <Text style={[styles.ruleTitle, { color: textRole.primary }]}>{rule.title}</Text>
                  <Text style={styles.rulePoints}>{rule.points}</Text>
                </View>
                <Text style={[styles.ruleDescription, { color: textRole.secondary }]}>{rule.description}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Worked example */}
      <Animated.View entering={FadeInDown.delay(500).duration(320)}>
        <Text style={[styles.exampleHeader, { color: textRole.primary }]}>{t.scoring.exampleHeader}</Text>
        <View style={[styles.exampleCard, { backgroundColor: surface[1], borderColor: border.subtle }]}>
          <Text style={[styles.exampleIntro, { color: textRole.primary }]}>{t.scoring.exampleIntro}</Text>
          <View style={styles.exampleRow}>
            <View style={[styles.exampleBullet, { backgroundColor: surface[0], borderColor: border.subtle }]}>
              <Ionicons name="star" size={14} color={accent.primary} />
            </View>
            <Text style={[styles.exampleLine, { color: textRole.secondary }]}>
              <Text style={[styles.exampleBold, { color: textRole.primary }]}>2 – 1</Text> {t.scoring.exampleExact}
            </Text>
          </View>
          <View style={styles.exampleRow}>
            <View style={[styles.exampleBullet, { backgroundColor: surface[0], borderColor: border.subtle }]}>
              <Ionicons name="checkmark-circle" size={14} color={accent.primary} />
            </View>
            <Text style={[styles.exampleLine, { color: textRole.secondary }]}>
              <Text style={[styles.exampleBold, { color: textRole.primary }]}>3 – 1</Text>
              {t.scoring.exampleCorrect}
              <Text style={[styles.exampleBold, { color: textRole.primary }]}>2 – 0</Text>
              {t.scoring.exampleCorrectSuffix}
            </Text>
          </View>
          <View style={styles.exampleRow}>
            <View style={[styles.exampleBullet, { backgroundColor: surface[0], borderColor: border.subtle }]}>
              <Ionicons name="close-circle" size={14} color={textRole.tertiary} />
            </View>
            <Text style={[styles.exampleLine, { color: textRole.secondary }]}>
              <Text style={[styles.exampleBold, { color: textRole.primary }]}>1 – 2</Text>
              {t.scoring.exampleCorrect}
              <Text style={[styles.exampleBold, { color: textRole.primary }]}>1 – 1</Text>
              {t.scoring.exampleWrongSuffix}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer note */}
      <Text style={[styles.footer, { color: textRole.tertiary }]}>{t.scoring.footer}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: type.h3.size,
    fontFamily: type.h3.family,
    letterSpacing: -0.2,
  },

  // Intro
  intro: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 10,
  },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 166, 81, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  introTitle: {
    fontSize: type.h2.size,
    fontFamily: type.h2.family,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  introText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },

  // Rules
  rulesWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  rule: {
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
  },
  ruleIconWell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleBody: {
    flex: 1,
    gap: 4,
  },
  ruleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  ruleTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  rulePoints: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: accent.primary,
    letterSpacing: 0.2,
  },
  ruleDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    marginTop: 2,
  },

  // Example
  exampleHeader: {
    fontSize: type.h3.size,
    fontFamily: type.h3.family,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 10,
  },
  exampleCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    gap: 10,
  },
  exampleIntro: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  exampleBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  exampleLine: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  exampleBold: {
    fontFamily: 'Inter_700Bold',
  },

  // Footer
  footer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 28,
    lineHeight: 16,
  },
});
