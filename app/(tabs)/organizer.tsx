import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ScreenHeader } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';

export default function OrganizerDashboard() {
  const { surface, textRole } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: surface[1] }]}>
      <ScreenHeader title="Organizer Dashboard" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: textRole.primary }]}>Manage Competitions</Text>
        <Text style={[styles.subtitle, { color: textRole.secondary }]}>
          Create and manage your branded prediction competitions here.
        </Text>
        {/* Placeholder for dashboard widgets */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 20 },
});