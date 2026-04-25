import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { accent, radii, type as typeTok } from "@/constants/colors";
import { PressableScale, Button, ScreenHeader } from "@/components/ui";
import { entries, haptics } from "@/lib/motion";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { showErrorToast } from "@/lib/error-toast";

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const { deleteAccount, profile } = useApp();
  const { t } = useLanguage();
  const { surface, border, textRole } = useTheme();
  const [typedUsername, setTypedUsername] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const username = profile?.username || "";
  const isConfirmed = typedUsername === username;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      haptics.heavy();
      await deleteAccount();
      haptics.success();
      showErrorToast({
        title: t.compliance.deleteAccount.success,
      });
      router.replace("/");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showErrorToast({
        title: t.compliance.deleteAccount.failure,
      });
      setIsDeleting(false);
    }
  };

  const topPad = Platform.OS === "web" ? 48 : insets.top + 12;
  const botPad = Platform.OS === "web" ? 28 : insets.bottom + 16;

  return (
    <View style={[styles.container, { backgroundColor: surface[1] }]}>
      <ScreenHeader
        title={t.compliance.deleteAccount.title}
        left={
          <PressableScale
            onPress={() => router.back()}
            haptic="light"
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="chevron-back" size={24} color={textRole.primary} />
          </PressableScale>
        }
      />
      <ScrollView
        contentContainerStyle={[{ paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(380).springify().damping(16)}>
            <View
              style={[
                styles.warningBox,
                { backgroundColor: "rgba(220, 38, 38, 0.08)", borderColor: accent.alert },
              ]}
            >
              <Ionicons name="alert-circle" size={24} color={accent.alert} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.warningTitle, { color: accent.alert }]}>
                  {t.compliance.deleteAccount.title}
                </Text>
                <Text style={[styles.warningText, { color: textRole.secondary }]}>
                  {t.compliance.deleteAccount.warningIntro}
                </Text>
              </View>
            </View>

            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: textRole.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: textRole.primary }]}>
                  {t.compliance.deleteAccount.warningItem1}
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: textRole.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: textRole.primary }]}>
                  {t.compliance.deleteAccount.warningItem2}
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bullet, { color: textRole.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: textRole.primary }]}>
                  {t.compliance.deleteAccount.warningItem3}
                </Text>
              </View>
            </View>

            <Text style={[styles.warningOutro, { color: accent.alert }]}>
              {t.compliance.deleteAccount.warningOutro}
            </Text>

            <View style={styles.confirmSection}>
              <Text style={[styles.confirmLabel, { color: textRole.secondary }]}>
                {t.compliance.deleteAccount.typeToConfirm}
              </Text>
              <TextInput
                style={[
                  styles.confirmInput,
                  {
                    backgroundColor: surface[0],
                    color: textRole.primary,
                    borderColor: border.subtle,
                  },
                  isConfirmed && { borderColor: accent.primary },
                ]}
                value={typedUsername}
                onChangeText={setTypedUsername}
                placeholder={username}
                placeholderTextColor={textRole.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={accent.primary}
              />
              <Text style={[styles.confirmHint, { color: textRole.tertiary }]}>
                Type &quot;{username}&quot; to enable delete
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={[styles.bottomActions, { paddingBottom: botPad }]}>
        <PressableScale
          onPress={() => router.back()}
          haptic="light"
          style={[styles.cancelBtn, { borderColor: border.subtle, backgroundColor: surface[0] }]}
        >
          <Text style={[styles.cancelText, { color: textRole.primary }]}>
            {t.compliance.deleteAccount.cancel}
          </Text>
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Button
            title={t.compliance.deleteAccount.confirmButton}
            onPress={handleDelete}
            disabled={!isConfirmed || isDeleting}
            fullWidth
            icon="trash"
            iconPosition="leading"
            loading={isDeleting}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24 },

  warningBox: {
    flexDirection: "row",
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  warningTitle: {
    fontSize: typeTok.caption.size + 2,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  warningText: {
    fontSize: typeTok.body.size - 2,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  bulletList: { gap: 12 },
  bulletItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: typeTok.body.size,
    fontFamily: "Inter_600SemiBold",
    marginTop: -2,
  },
  bulletText: {
    flex: 1,
    fontSize: typeTok.body.size - 1,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  warningOutro: {
    fontSize: typeTok.body.size - 2,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },

  confirmSection: { gap: 12 },
  confirmLabel: {
    fontSize: typeTok.caption.size,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  confirmInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: typeTok.body.size,
    fontFamily: "Inter_500Medium",
  },
  confirmHint: {
    fontSize: typeTok.micro.size,
    fontFamily: "Inter_400Regular",
    marginTop: -6,
  },

  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: "center",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: typeTok.caption.size + 1,
    fontFamily: "Inter_600SemiBold",
  },
});
