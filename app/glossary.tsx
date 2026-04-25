/**
 * Glossary Screen — Full reference for all football and prediction terms.
 *
 * Accessible from Profile → "How scoring works" or Settings → "Glossary".
 * Sections: Scoring, Matches, Predictions.
 * Each term is a plain card with no shadow, 1px hairline border.
 */
import React, { useMemo } from "react";
import { View, Text, StyleSheet, SectionList, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { radii, spacing, type as typeTok } from "@/constants/colors";
import { ScreenHeader } from "@/components/ui";
import { GLOSSARY } from "@/components/ui/HelpTip";

// ─── Section definitions ────────────────────────────────────────────────────
type GlossarySection = {
  title: string;
  data: {
    key: string;
    title: string;
    body: string;
  }[];
};

const SECTIONS: GlossarySection[] = [
  {
    title: "Scoring",
    data: [
      { key: "exact", title: GLOSSARY.exact.title, body: GLOSSARY.exact.body },
      { key: "correct", title: GLOSSARY.correct.title, body: GLOSSARY.correct.body },
      { key: "missed", title: GLOSSARY.missed.title, body: GLOSSARY.missed.body },
      { key: "boost", title: GLOSSARY.boost.title, body: GLOSSARY.boost.body },
      { key: "streak", title: GLOSSARY.streak.title, body: GLOSSARY.streak.body },
      { key: "pts", title: GLOSSARY.pts.title, body: GLOSSARY.pts.body },
    ],
  },
  {
    title: "Matches",
    data: [
      { key: "w", title: GLOSSARY.w.title, body: GLOSSARY.w.body },
      { key: "d", title: GLOSSARY.d.title, body: GLOSSARY.d.body },
      { key: "l", title: GLOSSARY.l.title, body: GLOSSARY.l.body },
      { key: "p", title: GLOSSARY.p.title, body: GLOSSARY.p.body },
      { key: "gd", title: GLOSSARY.gd.title, body: GLOSSARY.gd.body },
      { key: "matchday", title: GLOSSARY.matchday.title, body: GLOSSARY.matchday.body },
      { key: "form", title: GLOSSARY.form.title, body: GLOSSARY.form.body },
      { key: "cleansheet", title: GLOSSARY.cleansheet.title, body: GLOSSARY.cleansheet.body },
      { key: "xg", title: GLOSSARY.xg.title, body: GLOSSARY.xg.body },
    ],
  },
  {
    title: "Predictions",
    data: [
      { key: "locked", title: GLOSSARY.locked.title, body: GLOSSARY.locked.body },
      { key: "dailypack", title: GLOSSARY.dailypack.title, body: GLOSSARY.dailypack.body },
      {
        key: "transferwindow",
        title: GLOSSARY.transferwindow.title,
        body: GLOSSARY.transferwindow.body,
      },
      { key: "h2h", title: GLOSSARY.h2h.title, body: GLOSSARY.h2h.body },
    ],
  },
];

// ─── Term card ──────────────────────────────────────────────────────────────
function TermCard({
  title,
  body,
  surface,
  border,
  textRole,
}: {
  title: string;
  body: string;
  surface: any;
  border: any;
  textRole: any;
}) {
  return (
    <View
      style={[
        styles.termCard,
        {
          backgroundColor: surface[0],
          borderColor: border.subtle,
        },
      ]}
    >
      <Text
        style={[styles.termTitle, { color: textRole.primary, fontFamily: "Inter_600SemiBold" }]}
      >
        {title}
      </Text>
      <Text
        style={[styles.termBody, { color: textRole.secondary, fontFamily: "Inter_400Regular" }]}
      >
        {body}
      </Text>
    </View>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ title, textRole }: { title: string; textRole: any }) {
  return (
    <Text
      style={[styles.sectionHeader, { color: textRole.tertiary, fontFamily: "Inter_500Medium" }]}
    >
      {title}
    </Text>
  );
}

export default function GlossaryScreen() {
  const insets = useSafeAreaInsets();
  const { surface, border, textRole } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: surface[1] }]}>
      <ScreenHeader title="Glossary" />

      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TermCard
            title={item.title}
            body={item.body}
            surface={surface}
            border={border}
            textRole={textRole}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <SectionHeader title={title} textRole={textRole} />
        )}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + spacing.screenBottom },
        ]}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing[3],
    paddingBottom: spacing[5],
  },
  sectionHeader: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: spacing[5],
    marginBottom: spacing[3],
    marginHorizontal: 0,
  },
  termCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginBottom: spacing[3],
  },
  termTitle: {
    fontSize: typeTok.body.size,
    lineHeight: typeTok.body.lineHeight,
    fontWeight: "600",
    marginBottom: 4,
  },
  termBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
});
