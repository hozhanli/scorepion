import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors, {
  ThemeColors,
  surfaceLight,
  surfaceDark,
  borderLight,
  borderDark,
  textRoleLight,
  textRoleDark,
  accent,
} from '@/constants/colors';

type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Theme-aware semantic tokens and legacy color bindings.
 *
 * MIGRATION GUIDE:
 * Components that need to respond to dark mode should destructure theme-aware
 * tokens directly from `useTheme()`:
 *   const { surface, textRole, border } = useTheme();
 *   // These flip automatically based on isDark mode
 *
 * Components importing directly from '@/constants/colors' will use the light
 * variant only:
 *   import { surface, textRole, border } from '@/constants/colors';
 *   // These are always light mode (fine for light-mode-only screens during migration)
 *
 * The `colors` field provides legacy color bindings (background, text, card, etc.)
 * for backward compatibility with existing screens.
 */
interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  // Theme-aware semantic tokens that flip with mode (can be either light or dark variant)
  surface: typeof surfaceLight | typeof surfaceDark;
  border: typeof borderLight | typeof borderDark;
  textRole: typeof textRoleLight | typeof textRoleDark;
  accent: typeof accent;
}

const THEME_KEY = '@scorepion_theme';

const ThemeContext = createContext<ThemeContextValue>({
  colors: Colors.light,
  isDark: false,
  mode: 'system',
  setMode: () => {},
  surface: surfaceLight,
  border: borderLight,
  textRole: textRoleLight,
  accent,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (!cancelled) {
        if (val === 'light' || val === 'dark' || val === 'system') {
          setModeState(val);
        }
        setLoaded(true);
      }
    }).catch(err => console.warn('theme:load', err));
    return () => { cancelled = true; };
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(THEME_KEY, m);
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  // Select theme-aware semantic tokens based on isDark
  const surface = isDark ? surfaceDark : surfaceLight;
  const border = isDark ? borderDark : borderLight;
  const textRole = isDark ? textRoleDark : textRoleLight;

  const value = useMemo(() => ({
    colors,
    isDark,
    mode,
    setMode,
    surface,
    border,
    textRole,
    accent,
  }), [isDark, mode, setMode, surface, border, textRole]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
