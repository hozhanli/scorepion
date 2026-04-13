import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScreenHeader, Button } from '@/components/ui';
import { type as typeConstants } from '@/constants/colors';

export default function NotFoundScreen() {
  const { surface, textRole } = useTheme();
  const { t } = useLanguage();

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: surface[1] }]} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={t.notFound.title} animate={false} />
      <View style={styles.content}>
        <Text style={[styles.body, { color: textRole.secondary }]}>{t.notFound.body}</Text>
        <View style={styles.buttonWrap}>
          <Button
            title={t.notFound.goHome}
            onPress={handleGoHome}
            fullWidth
            icon="home"
            iconPosition="trailing"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    fontSize: typeConstants.body.size,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonWrap: {
    width: '100%',
  },
});
