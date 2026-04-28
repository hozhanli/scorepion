import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import Colors, { accent, radii, type, spacing } from "@/constants/colors";
import { useAuth, type AuthErrorKey } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PressableScale, Button, ScorpionCrest } from "@/components/ui";
import { haptics } from "@/lib/motion";

/**
 * Auth — Emerald Minimalism light-mode entry.
 *
 * Replaces the dark-navy gradient + decorative orbs with a quiet, premium
 * light surface: emerald logo lockup → H1 wordmark → segmented mode switch →
 * 54px white inputs with emerald focus → solid emerald CTA.
 */
export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const { surface, border, textRole } = useTheme();
  const { t } = useLanguage();
  const topPad = Platform.OS === "web" ? 48 : insets.top + 12;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom + 16;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"username" | "password" | null>(null);
  const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false,
  });

  const usernameRegex = /^[a-zA-Z0-9_]{2,20}$/;
  const passwordLetterRegex = /[a-zA-Z]/;
  const passwordNumberRegex = /[0-9]/;

  // Compute validation state in real-time
  const validation = useMemo(() => {
    const usernameTrimmed = username.trim();
    const usernameEmpty = usernameTrimmed.length === 0;
    const usernameValid = usernameEmpty ? false : usernameRegex.test(usernameTrimmed);
    let usernameError: string | null = null;

    if (!usernameEmpty && !usernameValid) {
      if (usernameTrimmed.length < 2) {
        usernameError = t.errors.usernameTooShort;
      } else if (usernameTrimmed.length > 20) {
        usernameError = t.errors.usernameTooLong;
      } else {
        usernameError = t.errors.usernameInvalidChars;
      }
    }

    const passwordLongEnough = password.length >= 8;
    const hasLetter = passwordLetterRegex.test(password);
    const hasNumber = passwordNumberRegex.test(password);
    const passwordValid = passwordLongEnough && hasLetter && hasNumber;
    let passwordError: string | null = null;

    if (password.length > 0 && !passwordValid) {
      if (!passwordLongEnough) {
        passwordError = t.errors.passwordTooShort;
      } else if (!hasLetter) {
        passwordError = t.errors.passwordNeedsLetter;
      } else {
        passwordError = t.errors.passwordNeedsNumber;
      }
    }

    const canSubmit = usernameValid && passwordValid;

    return {
      usernameValid,
      usernameError,
      passwordValid,
      passwordError,
      canSubmit,
    };
  }, [username, password, mode]);

  const handleSubmit = async () => {
    if (!validation.canSubmit) return;
    setError("");
    setLoading(true);
    haptics.medium();

    try {
      if (mode === "login") {
        await login(username.trim(), password);
        router.replace("/(tabs)");
      } else {
        await register(username.trim(), password);
        router.replace("/onboarding");
      }
    } catch (err: any) {
      const key: AuthErrorKey = err?.errorKey || "generic";
      setError(t.errors[key] || t.errors.generic);
      haptics.warning();
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
            { paddingTop: topPad + 24, paddingBottom: botPad + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo lockup */}
          <Animated.View
            entering={ZoomIn.duration(420).springify().damping(12)}
            style={styles.logoWrap}
          >
            <ScorpionCrest size={64} accessibilityLabel="Scorpion logo" />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(380).springify().damping(16)}>
            <Text style={[styles.wordmark, { color: textRole.primary }]}>Scorepion</Text>
            <Text style={[styles.tagline, { color: textRole.secondary }]}>{t.auth.tagline}</Text>
          </Animated.View>

          {/* Mode segmented control */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(380).springify().damping(16)}
            style={[styles.modeRow, { backgroundColor: surface[2] }]}
          >
            <ModeTab
              label={t.auth.signIn}
              active={mode === "login"}
              onPress={() => {
                setMode("login");
                setError("");
              }}
              surface={surface}
              textRole={textRole}
            />
            <ModeTab
              label={t.auth.createAccount}
              active={mode === "register"}
              onPress={() => {
                setMode("register");
                setError("");
              }}
              surface={surface}
              textRole={textRole}
            />
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(260).duration(380).springify().damping(16)}
            style={styles.form}
          >
            <FieldLabel textRole={textRole}>{t.auth.username}</FieldLabel>
            <View
              style={[
                styles.inputGroup,
                { backgroundColor: surface[0], borderColor: border.subtle },
                focused === "username" && { borderColor: accent.primary },
                !error &&
                  touched.username &&
                  validation.usernameValid && { borderColor: accent.primary },
                touched.username && !validation.usernameValid && { borderColor: accent.alert },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={
                  !error && touched.username && validation.usernameValid
                    ? accent.primary
                    : focused === "username"
                      ? accent.primary
                      : textRole.tertiary
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: textRole.primary }]}
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  setError("");
                }}
                placeholder={t.auth.usernamePlaceholder}
                placeholderTextColor={textRole.tertiary}
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocused("username")}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, username: true }));
                  setFocused((f) => (f === "username" ? null : f));
                }}
                selectionColor={accent.primary}
                accessibilityLabel={`Username${touched.username && !validation.usernameValid ? ` - ${validation.usernameError}` : ""}`}
              />
              {!error && touched.username && validation.usernameValid && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={accent.primary}
                  style={{ marginLeft: 8 }}
                  accessibilityLabel="Username is valid"
                />
              )}
            </View>

            {touched.username && !validation.usernameValid && (
              <Animated.View entering={FadeInDown.duration(240)} style={[styles.inlineError]}>
                <Text style={[styles.inlineErrorText, { color: accent.alert }]}>
                  {validation.usernameError}
                </Text>
              </Animated.View>
            )}

            <View style={{ height: 14 }} />

            <FieldLabel textRole={textRole}>{t.auth.password}</FieldLabel>
            <View
              style={[
                styles.inputGroup,
                { backgroundColor: surface[0], borderColor: border.subtle },
                focused === "password" && { borderColor: accent.primary },
                !error &&
                  touched.password &&
                  validation.passwordValid && { borderColor: accent.primary },
                touched.password && !validation.passwordValid && { borderColor: accent.alert },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={
                  !error && touched.password && validation.passwordValid
                    ? accent.primary
                    : focused === "password"
                      ? accent.primary
                      : textRole.tertiary
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1, color: textRole.primary }]}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
                placeholder={
                  mode === "register"
                    ? t.auth.passwordPlaceholderRegister
                    : t.auth.passwordPlaceholder
                }
                placeholderTextColor={textRole.tertiary}
                secureTextEntry={!showPassword}
                maxLength={100}
                autoCapitalize="none"
                onFocus={() => setFocused("password")}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, password: true }));
                  setFocused((f) => (f === "password" ? null : f));
                }}
                selectionColor={accent.primary}
                accessibilityLabel={`Password${touched.password && !validation.passwordValid ? ` - ${validation.passwordError}` : ""}`}
              />
              {!error && touched.password && validation.passwordValid && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={accent.primary}
                  style={{ marginRight: 8 }}
                  accessibilityLabel="Password is valid"
                />
              )}
              <PressableScale
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                haptic="selection"
                pressedScale={0.9}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={textRole.tertiary}
                />
              </PressableScale>
            </View>

            {touched.password && !validation.passwordValid && (
              <Animated.View entering={FadeInDown.duration(240)} style={[styles.inlineError]}>
                <Text style={[styles.inlineErrorText, { color: accent.alert }]}>
                  {validation.passwordError}
                </Text>
              </Animated.View>
            )}

            {error ? (
              <Animated.View entering={FadeInDown.duration(240)} style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={accent.alert} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <View style={{ height: 20 }} />
            <Button
              title={loading ? "" : mode === "login" ? t.auth.signIn : t.auth.createAccount}
              onPress={handleSubmit}
              disabled={!validation.canSubmit}
              loading={loading}
              fullWidth
              icon="arrow-forward"
              iconPosition="trailing"
              accessibilityLabel={mode === "login" ? "Sign in button" : "Create account button"}
            />

            {mode === "register" ? (
              <Text style={[styles.hint, { color: textRole.tertiary }]}>
                {t.auth.usernameHint} · {t.auth.passwordHint}
              </Text>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldLabel({ children, textRole }: { children: React.ReactNode; textRole: any }) {
  return <Text style={[styles.fieldLabel, { color: textRole.secondary }]}>{children}</Text>;
}

function ModeTab({
  label,
  active,
  onPress,
  surface,
  textRole,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  surface: any;
  textRole: any;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      pressedScale={0.98}
      style={[styles.modeTab, active && { backgroundColor: surface[0] }]}
    >
      <Text style={[styles.modeText, { color: active ? textRole.primary : textRole.secondary }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  logoWrap: { alignItems: "center", marginBottom: 20 },

  wordmark: {
    fontSize: type.h1.size + 4,
    fontFamily: type.h1.family,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: type.caption.size,
    fontFamily: type.caption.family,
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.3,
  },

  modeRow: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginTop: 32,
  },
  modeTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeTabActive: {
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  modeText: {
    fontSize: type.caption.size,
    fontFamily: "Inter_600SemiBold",
  },
  modeTextActive: {},

  form: { marginTop: 28 },

  fieldLabel: {
    fontSize: type.micro.size,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 2,
  },

  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    height: 54,
    paddingHorizontal: 14,
  },
  inputGroupFocus: {
    borderColor: accent.primary,
  },
  inputGroupError: {
    borderColor: accent.alert,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingVertical: 0,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
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

  inlineError: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  inlineErrorText: {
    fontSize: type.caption.size,
    fontFamily: "Inter_500Medium",
  },

  hint: {
    marginTop: 12,
    fontSize: type.micro.size,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});

// Silence unused imports under strict type-check — these stay available for
// future additive work without churning the import block.
void spacing;
void Colors;
