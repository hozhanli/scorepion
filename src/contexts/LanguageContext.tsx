import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKeys } from '@/lib/i18n/translations';

const STORAGE_KEY = '@scorepion_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  tt: (template: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!cancelled && stored && (stored === 'en' || stored === 'es' || stored === 'fr' || stored === 'tr' || stored === 'pt')) {
        setLanguageState(stored as Language);
      }
    }).catch(err => console.warn('i18n:load', err));
    return () => { cancelled = true; };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useMemo(() => translations[language], [language]);

  const tt = useCallback((template: string, vars?: Record<string, string | number>) => {
    if (!vars) return template;
    let result = template;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, String(value));
    });
    return result;
  }, []);

  const value = useMemo(() => ({ language, setLanguage, t, tt }), [language, setLanguage, t, tt]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
