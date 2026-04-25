import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
  Switch,
  Modal,
  Linking,
} from "react-native";
import { crossAlert } from "@/lib/cross-alert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors, { accent, radii } from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS, Language } from "@/lib/i18n/translations";
import { ScorpionCrest } from "@/components/ui";

type ThemeMode = "system" | "light" | "dark";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();
  const { logout } = useAuth();
  const { colors, isDark, mode, setMode, surface, border, textRole } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile?.username || "");
  const [notifications, setNotifications] = useState(true);
  const [liveAlerts, setLiveAlerts] = useState(true);

  // Restore persisted notification preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("settings:notifications");
        if (saved) {
          const parsed = JSON.parse(saved);
          setNotifications(parsed.notifications ?? true);
          setLiveAlerts(parsed.liveAlerts ?? true);
        }
      } catch (err) {
        console.warn("Failed to restore notification settings:", err);
      }
    })();
  }, []);

  // Toggles persist preferences to AsyncStorage.
  // When a push notification backend is added, wire expo-notifications here.
  const toggleNotifications = useCallback(
    async (value: boolean) => {
      setNotifications(value);
      await AsyncStorage.setItem(
        "settings:notifications",
        JSON.stringify({ notifications: value, liveAlerts }),
      );
    },
    [liveAlerts],
  );

  const toggleLiveAlerts = useCallback(
    async (value: boolean) => {
      setLiveAlerts(value);
      await AsyncStorage.setItem(
        "settings:notifications",
        JSON.stringify({ notifications, liveAlerts: value }),
      );
    },
    [notifications],
  );
  const [showLangPicker, setShowLangPicker] = useState(false);
  const currentLangLabel = LANGUAGE_OPTIONS.find((l) => l.code === language)?.label || "English";

  const handleSaveName = useCallback(async () => {
    if (tempName.trim() && profile) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateProfile({
        username: tempName.trim(),
        avatar: tempName.trim().substring(0, 2).toUpperCase(),
      });
      setEditingName(false);
    }
  }, [tempName, profile, updateProfile]);

  const themeModes: { key: ThemeMode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: "system", icon: "phone-portrait-outline", label: t.profile.system },
    { key: "light", icon: "sunny-outline", label: t.profile.light },
    { key: "dark", icon: "moon-outline", label: t.profile.dark },
  ];

  const settingSections = [
    {
      title: t.profile.notifications,
      items: [
        {
          icon: "notifications" as const,
          iconColor: Colors.palette.blue,
          label: t.profile.matchReminders,
          type: "switch" as const,
          value: notifications,
          onToggle: () => toggleNotifications(!notifications),
        },
        {
          icon: "flash" as const,
          iconColor: Colors.palette.orange,
          label: t.profile.liveAlerts,
          type: "switch" as const,
          value: liveAlerts,
          onToggle: () => toggleLiveAlerts(!liveAlerts),
        },
      ],
    },
    {
      title: t.profile.preferences,
      items: [
        {
          icon: "language" as const,
          iconColor: Colors.palette.emerald,
          label: t.profile.language,
          type: "select" as const,
          value: currentLangLabel,
          onPress: () => setShowLangPicker(true),
        },
      ],
    },
    {
      title: t.profile.about,
      items: [
        {
          icon: "calculator" as const,
          iconColor: Colors.palette.emerald,
          label: t.profile.howScoringWorks,
          type: "link" as const,
          onPress: () => router.push("/scoring" as Href),
        },
        {
          icon: "information-circle" as const,
          iconColor: Colors.palette.gray400,
          label: t.profile.version,
          type: "info" as const,
          value: "1.0.0",
        },
        {
          icon: "shield-checkmark" as const,
          iconColor: Colors.palette.emerald,
          label: t.profile.privacyPolicy,
          type: "link" as const,
          onPress: () => router.push("/privacy" as Href),
        },
        {
          icon: "document-text" as const,
          iconColor: Colors.palette.blue,
          label: t.profile.termsOfService,
          type: "link" as const,
          onPress: () => router.push("/terms" as Href),
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t.a11y.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textRole.primary }]}>{t.profile.settings}</Text>
        <View style={{ width: 40, alignItems: "center", justifyContent: "center" }}>
          <ScorpionCrest size={28} accessibilityLabel="Scorpion logo" />
        </View>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarEdit}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: textRole.inverse }]}>
              {profile?.avatar || "SP"}
            </Text>
          </View>
        </View>

        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: surface[0],
                  color: textRole.primary,
                  borderColor: border.subtle,
                },
              ]}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter username"
              placeholderTextColor={Colors.palette.gray300}
              maxLength={20}
              autoFocus
            />
            <Pressable
              onPress={handleSaveName}
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="checkmark" size={20} color={textRole.inverse} />
            </Pressable>
            <Pressable
              onPress={() => {
                setEditingName(false);
                setTempName(profile?.username || "");
              }}
            >
              <Ionicons name="close" size={22} color={textRole.tertiary} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditingName(true)} style={styles.nameRow}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile?.username || "Player"}
            </Text>
            <Ionicons name="create-outline" size={16} color={Colors.palette.gray300} />
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textRole.tertiary }]}>
          {t.profile.appearance}
        </Text>
        <View
          style={[styles.sectionCard, { backgroundColor: surface[0], borderColor: border.subtle }]}
        >
          <View style={styles.themeRow}>
            {themeModes.map((tm) => {
              const isActive = mode === tm.key;
              return (
                <Pressable
                  key={tm.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode(tm.key);
                  }}
                  style={[
                    styles.themeOption,
                    { borderColor: isActive ? Colors.palette.emerald : colors.cardBorder },
                    isActive && { backgroundColor: `${Colors.palette.emerald}12` },
                  ]}
                >
                  <Ionicons
                    name={tm.icon}
                    size={20}
                    color={isActive ? Colors.palette.emerald : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: isActive ? Colors.palette.emerald : colors.textSecondary },
                      isActive && { fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    {tm.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {settingSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textRole.tertiary }]}>{section.title}</Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: surface[0], borderColor: border.subtle },
            ]}
          >
            {section.items.map((item, idx) => (
              <React.Fragment key={item.label}>
                {idx > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                )}
                <Pressable
                  style={styles.settingRow}
                  onPress={"onPress" in item ? item.onPress : undefined}
                  disabled={item.type === "switch" || item.type === "info"}
                >
                  <View style={[styles.settingIcon, { backgroundColor: `${item.iconColor}15` }]}>
                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                  </View>
                  <Text style={[styles.settingLabel, { color: textRole.primary }]}>
                    {item.label}
                  </Text>
                  {item.type === "switch" && "onToggle" in item && (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onToggle}
                      trackColor={{
                        false: isDark ? Colors.palette.gray500 : Colors.palette.gray200,
                        true: accent.primary,
                      }}
                      thumbColor={textRole.inverse}
                    />
                  )}
                  {item.type === "select" && (
                    <View style={styles.selectRow}>
                      <Text style={[styles.selectValue, { color: textRole.tertiary }]}>
                        {item.value}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.palette.gray300} />
                    </View>
                  )}
                  {item.type === "info" && (
                    <Text style={[styles.infoValue, { color: textRole.tertiary }]}>
                      {item.value}
                    </Text>
                  )}
                  {item.type === "link" && (
                    <Ionicons name="chevron-forward" size={16} color={Colors.palette.gray300} />
                  )}
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textRole.tertiary }]}>{t.profile.account}</Text>
        <Pressable
          onPress={() => {
            crossAlert(t.profile.signOut, t.profile.signOutConfirm, [
              { text: t.profile.cancel, style: "cancel" },
              {
                text: t.profile.signOut,
                style: "destructive",
                onPress: async () => {
                  if (Platform.OS !== "web")
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await logout();
                  router.replace("/auth");
                },
              },
            ]);
          }}
          style={({ pressed }) => [
            styles.logoutBtn,
            { backgroundColor: surface[0], borderColor: border.subtle },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.palette.red} />
          <Text style={styles.logoutText}>{t.profile.signOut}</Text>
        </Pressable>
      </View>

      <Modal visible={showLangPicker} transparent animationType="fade">
        <Pressable style={styles.langOverlay} onPress={() => setShowLangPicker(false)}>
          <Pressable
            style={[styles.langSheet, { backgroundColor: surface[0], borderColor: border.subtle }]}
          >
            <View style={styles.langHandle} />
            <Text style={[styles.langTitle, { color: textRole.primary }]}>
              {t.profile.language}
            </Text>
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = language === opt.code;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLanguage(opt.code);
                    setShowLangPicker(false);
                  }}
                  style={[
                    styles.langOption,
                    active && { backgroundColor: `${Colors.palette.emerald}12` },
                  ]}
                >
                  <Text style={[styles.langFlag, { color: textRole.tertiary }]}>{opt.flag}</Text>
                  <Text
                    style={[
                      styles.langLabel,
                      { color: textRole.primary },
                      active && {
                        color: Colors.palette.emerald,
                        fontFamily: "Inter_600SemiBold" as const,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.palette.emerald} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// Emerald Minimalism tokens only — no hex literals, no shadows, no off-scale
// radii. The sectionCard and logoutBtn previously carried soft drop shadows;
// the quarantine allows only the CelebrationToast at z-9999 to cast a shadow,
// so those cards now lean on the 1px hairline border for separation.
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  profileSection: { alignItems: "center", paddingVertical: 20 },
  avatarEdit: { position: "relative" as const },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, fontFamily: "Inter_700Bold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  nameInput: {
    flex: 1,
    borderRadius: radii.sm,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  themeRow: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.sm,
    borderWidth: 1.5,
  },
  themeLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginLeft: 60 },
  selectRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  selectValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 16,
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: accent.alert },
  langOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.40)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  langSheet: {
    width: "100%",
    maxWidth: 340,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  langHandle: {
    width: 36,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: Colors.palette.gray200,
    marginBottom: 16,
  },
  langTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.sm,
    marginBottom: 4,
  },
  langFlag: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    width: 28,
  },
  langLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
