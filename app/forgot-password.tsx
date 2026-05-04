import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { accent, radii, type } from "@/constants/colors";
import { useAuth, type AuthErrorKey } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PressableScale, Button } from "@/components/ui";
import { haptics } from "@/lib/motion";

/**
 * Forgot password — sends a Firebase password reset email.
 *
 * For privacy, "user not found" is treated as success: revealing whether an
 * email is registered would enable account enumeration. Genuine input errors
 * (invalid format, network, rate limit) are surfaced inline.
 */
export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { sendPasswordReset } = useAuth();
  const { surface, border, textRole } = useTheme();
  const { t } = useLanguage();
  const topPad = Platform.OS === "web" ? 48 : insets.top + 12;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom + 16;

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validation = useMemo(() => {
    const trimmed = email.trim();
    const empty = trimmed.length === 0;
    const valid = empty ? false : emailRegex.test(trimmed);
    const inlineError = !empty && !valid ? t.errors.emailInvalid : null;
    return { valid, inlineError };
  }, [email, t]);

  const handleSubmit = async () => {
    if (!validation.valid || loading) return;
    setError("");
    setLoading(true);
    haptics.medium();
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err: any) {
      // Treat user-not-found as success to avoid email enumeration.
      const key: AuthErrorKey = err?.errorKey || "resetEmailFailed";
      if (key === "userNotFound") {
        setSent(true);
      } else {
        setError(t.errors[key] || t.errors.generic);
        haptics.warning();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: surface[1] }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topPad + 8, paddingBottom: botPad + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PressableScale
            onPress={() => router.back()}
            haptic="selection"
            pressedScale={0.9}
            style={styles.backBtn}
            accessibilityLabel={t.auth.backToSignIn}
          >
            <Ionicons name="chevron-back" size={26} color={textRole.primary} />
          </PressableScale>

          <Animated.View entering={FadeInDown.duration(380).springify().damping(16)}>
            <Text style={[styles.title, { color: textRole.primary }]}>
              {t.auth.forgotPasswordTitle}
            </Text>
            <Text style={[styles.subtitle, { color: textRole.secondary }]}>
              {sent ? t.auth.resetEmailSent : t.auth.forgotPasswordSubtitle}
            </Text>
          </Animated.View>

          {!sent ? (
            <Animated.View
              entering={FadeInUp.delay(160).duration(380).springify().damping(16)}
              style={styles.form}
            >
              <View
                style={[
                  styles.inputGroup,
                  { backgroundColor: surface[0], borderColor: border.subtle },
                  focused && { borderColor: accent.primary },
                  !error && touched && validation.valid && { borderColor: accent.primary },
                  touched && !validation.valid && { borderColor: accent.alert },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={
                    !error && touched && validation.valid
                      ? accent.primary
                      : focused
                        ? accent.primary
                        : textRole.tertiary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: textRole.primary }]}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setError("");
                  }}
                  placeholder={t.auth.emailPlaceholder}
                  placeholderTextColor={textRole.tertiary}
                  maxLength={255}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setTouched(true);
                    setFocused(false);
                  }}
                  selectionColor={accent.primary}
                  accessibilityLabel="Email"
                  autoFocus
                />
              </View>

              {touched && !validation.valid && (
                <Animated.View entering={FadeInDown.duration(240)} style={styles.inlineError}>
                  <Text style={[styles.inlineErrorText, { color: accent.alert }]}>
                    {validation.inlineError}
                  </Text>
                </Animated.View>
              )}

              {error ? (
                <Animated.View entering={FadeInDown.duration(240)} style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={accent.alert} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              <View style={{ height: 24 }} />
              <Button
                title={loading ? "" : t.auth.sendResetEmail}
                onPress={handleSubmit}
                disabled={!validation.valid}
                loading={loading}
                fullWidth
                icon="paper-plane"
                iconPosition="trailing"
                accessibilityLabel={t.auth.sendResetEmail}
              />
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInUp.delay(120).duration(380).springify().damping(16)}
              style={styles.form}
            >
              <View style={[styles.successBox, { backgroundColor: surface[0] }]}>
                <Ionicons name="checkmark-circle" size={28} color={accent.primary} />
                <Text style={[styles.successText, { color: textRole.primary }]}>
                  {t.auth.resetEmailSent}
                </Text>
              </View>

              <View style={{ height: 16 }} />
              <Button
                title={t.auth.backToSignIn}
                onPress={() => router.replace("/auth")}
                fullWidth
                icon="arrow-back"
                iconPosition="leading"
                accessibilityLabel={t.auth.backToSignIn}
              />
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "flex-start",
  },

  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
    marginBottom: 12,
  },

  title: {
    fontSize: type.h1.size,
    fontFamily: type.h1.family,
    letterSpacing: -0.4,
    marginTop: 8,
  },
  subtitle: {
    fontSize: type.body.size,
    fontFamily: type.body.family,
    marginTop: 8,
    lineHeight: 22,
  },

  form: { marginTop: 28 },

  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    height: 54,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingVertical: 0,
  },

  inlineError: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  inlineErrorText: {
    fontSize: type.caption.size,
    fontFamily: "Inter_500Medium",
  },

  errorBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  errorText: {
    fontSize: type.caption.size,
    fontFamily: "Inter_500Medium",
    color: accent.alert,
    flex: 1,
  },

  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: radii.md,
  },
  successText: {
    flex: 1,
    fontSize: type.body.size,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
});
