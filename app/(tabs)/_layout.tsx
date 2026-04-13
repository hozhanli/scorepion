/**
 * Tab bar — Emerald Minimalism.
 *
 * iOS 18+: native Liquid Glass tabs.
 * Fallback: white surface + 1px hairline top border (no shadow, no blur).
 * Active tint: emerald. Inactive tint: text.tertiary. Micro label + dot.
 */
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, useRouter, useSegments } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useRef } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { accent } from "@/constants/colors";
import { saveLastTab, loadLastTab } from "@/lib/nav-persistence";

function NativeTabLayout() {
  const { t } = useLanguage();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{t.tabs.today}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="matches">
        <Icon sf={{ default: "sportscourt", selected: "sportscourt.fill" }} />
        <Label>{t.tabs.matches}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="leaderboard">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>{t.tabs.standings}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="groups">
        <Icon sf={{ default: "person.3", selected: "person.3.fill" }} />
        <Label>{t.tabs.groups}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>{t.tabs.profile}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const { t } = useLanguage();
  const { surface, border, textRole } = useTheme();
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent.primary,
        tabBarInactiveTintColor: textRole.tertiary,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: surface[0],
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: border.subtle,
          elevation: 0,
          shadowOpacity: 0,
          ...(isWeb
            ? {
                height: 84,
              }
            : Platform.OS === "ios"
            ? {
                paddingBottom: safeAreaInsets.bottom,
                height: 84 + safeAreaInsets.bottom,
              }
            : {
                paddingBottom: safeAreaInsets.bottom,
                height: 72 + safeAreaInsets.bottom,
              }),
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: surface[0] },
            ]}
          />
        ),
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
          letterSpacing: 0.3,
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.today,
          tabBarAccessibilityLabel: t.tabs.today,
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              <Ionicons
                name={focused ? "today" : "today-outline"}
                size={22}
                color={color}
              />
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: t.tabs.matches,
          tabBarAccessibilityLabel: t.tabs.matches,
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              <Ionicons
                name={focused ? "football" : "football-outline"}
                size={22}
                color={color}
              />
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: t.tabs.standings,
          tabBarAccessibilityLabel: t.tabs.standings,
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              <Ionicons
                name={focused ? "podium" : "podium-outline"}
                size={22}
                color={color}
              />
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t.tabs.groups,
          tabBarAccessibilityLabel: t.tabs.groups,
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={22}
                color={color}
              />
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarAccessibilityLabel: t.tabs.profile,
          tabBarIcon: ({ color, focused }) => (
            <View style={tabStyles.iconWrap}>
              <Ionicons
                name={focused ? "person-circle" : "person-circle-outline"}
                size={22}
                color={color}
              />
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
      />
      </Tabs>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: accent.primary,
    marginTop: 3,
  },
});

function TabLayoutWithPersistence() {
  const router = useRouter();
  const segments = useSegments();
  const restoreRef = useRef(false);

  // Load and restore last tab on mount (once only)
  useEffect(() => {
    if (restoreRef.current) return;
    restoreRef.current = true;

    (async () => {
      try {
        const lastTab = await loadLastTab();
        if (lastTab) {
          // Only navigate if we're at the root tabs level
          const segs = segments as readonly string[];
          if (segs.length === 1 && segs[0] === '(tabs)') {
            router.replace(`/(tabs)/${lastTab}` as any);
          }
        }
      } catch (err) {
        console.error('nav-persistence:restore', err);
        // Fail silently; app continues with default route
      }
    })();
  }, []);

  // Save current tab whenever segments change
  useEffect(() => {
    const segs = segments as readonly string[];
    if (segs.length >= 2) {
      const firstSegment = segs[0];
      const secondSegment = segs[1];
      if (firstSegment === '(tabs)' && typeof secondSegment === 'string') {
        saveLastTab(secondSegment).catch((err) => {
          console.error('nav-persistence:save', err);
          // Fail silently; user continues without persisting
        });
      }
    }
  }, [segments]);

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

export default function TabLayout() {
  return <TabLayoutWithPersistence />;
}
