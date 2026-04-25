import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Platform, TextInput, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { accent, radii, type } from "@/constants/colors";
import { PressableScale, Button, ScorpionCrest } from "@/components/ui";
import { entries, haptics } from "@/lib/motion";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/query-client";
import { setBirthYear, getAgeVerified } from "@/lib/storage";
import { League } from "@/lib/types";

type Step = "welcome" | "age" | "username" | "leagues" | "ready";

/**
 * Onboarding — Emerald Minimalism light-mode entry tour.
 *
 * Four-step flow (welcome → username → leagues → ready) on the same quiet
 * light surface as auth. Every surface is surface/0 white with a hairline
 * border; the only gradient is the final "ready" checkmark celebration.
 */
function LeagueChip({
  league,
  selected,
  onToggle,
  surface,
  border,
  textRole,
}: {
  league: League;
  selected: boolean;
  onToggle: () => void;
  surface: any;
  border: any;
  textRole: any;
}) {
  return (
    <PressableScale
      onPress={() => {
        haptics.selection();
        onToggle();
      }}
      haptic="none"
      pressedScale={0.98}
      style={[
        styles.leagueChip,
        { backgroundColor: surface[0], borderColor: border.subtle },
        selected && { backgroundColor: "rgba(0, 166, 81, 0.06)", borderColor: accent.primary },
      ]}
    >
      <View style={[styles.leagueIcon, selected && { backgroundColor: accent.primary }]}>
        <Ionicons
          name={league.icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={selected ? "#FFFFFF" : accent.primary}
        />
      </View>
      <View style={styles.leagueChipInfo}>
        <Text style={[styles.leagueChipName, { color: textRole.primary }]}>{league.name}</Text>
        <Text style={[styles.leagueChipCountry, { color: textRole.tertiary }]}>
          {league.country}
        </Text>
      </View>
      <View
        style={[
          styles.checkCircle,
          { borderColor: border.strong },
          selected && { backgroundColor: accent.primary, borderColor: accent.primary },
        ]}
      >
        {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
    </PressableScale>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, leagues: contextLeagues } = useApp();
  const { t } = useLanguage();
  const { surface, border, textRole } = useTheme();
  // Leagues are served from the DB via /api/football/leagues. If the list is
  // still loading (first render before the query resolves) we render with an
  // empty array and show a loader — no mock fallback.
  const leagues = contextLeagues;
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 48 : insets.top + 12;
  const botPad = Platform.OS === "web" ? 28 : insets.bottom + 16;

  const [step, setStep] = useState<Step>("welcome");
  const [birthYear, setBirthYearState] = useState<string>("");
  const [ageError, setAgeError] = useState<string | null>(null);
  const [username, setUsername] = useState(user?.username || "");
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [usernameTouched, setUsernameTouched] = useState(false);

  // Validation regex for username
  const usernameRegex = /^[a-zA-Z0-9_]{2,24}$/;

  // Compute validation state in real-time
  const validation = useMemo(() => {
    const usernameTrimmed = username.trim();
    const usernameEmpty = usernameTrimmed.length === 0;
    const usernameValid = usernameEmpty ? false : usernameRegex.test(usernameTrimmed);
    let usernameError: string | null = null;

    if (!usernameEmpty && !usernameValid) {
      if (usernameTrimmed.length < 2) {
        usernameError = "Username must be at least 2 characters";
      } else if (usernameTrimmed.length > 24) {
        usernameError = "Username must be max 24 characters";
      } else {
        usernameError = "Username can only contain letters, numbers, and underscores";
      }
    }

    const canSubmit = usernameValid;

    return {
      usernameValid,
      usernameError,
      canSubmit,
    };
  }, [username]);

  const toggleLeague = (id: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  };

  const handleComplete = async () => {
    haptics.success();
    haptics.heavy();
    try {
      await apiRequest("PUT", "/api/profile", { favoriteLeagues: selectedLeagues });
    } catch {}
    await completeOnboarding(user?.username || username.trim() || "Player", selectedLeagues);
    router.replace("/(tabs)");
  };

  const handleAgeGateSubmit = async () => {
    const year = parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (!birthYear || isNaN(year) || year < 1900 || year > currentYear) {
      setAgeError(t.compliance.ageGate.birthYearPlaceholder);
      return;
    }

    if (age < 13) {
      setAgeError(t.compliance.ageGate.tooYoung);
      return;
    }

    await setBirthYear(year);
    if (age < 18) {
      // Show parental notice but continue
      haptics.medium();
      setAgeError(null);
      setStep("username");
    } else {
      haptics.medium();
      setAgeError(null);
      setStep("username");
    }
  };

  const canProceed = () => {
    if (step === "age") return birthYear.length > 0 && !ageError;
    if (step === "username") return validation.canSubmit;
    if (step === "leagues") return selectedLeagues.length >= 1;
    return true;
  };

  const nextStep = () => {
    haptics.medium();
    if (step === "welcome") setStep("age");
    else if (step === "age") handleAgeGateSubmit();
    else if (step === "username") setStep("leagues");
    else if (step === "leagues") setStep("ready");
    else handleComplete();
  };

  const stepIndex = ["welcome", "age", "username", "leagues", "ready"].indexOf(step);

  return (
    <View style={[styles.container, { backgroundColor: surface[1] }]}>
      <View style={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 16 }]}>
        {/* Progress dots */}
        <View style={styles.progressRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]}
            />
          ))}
        </View>

        {step === "welcome" && (
          <Animated.View
            entering={FadeInDown.duration(380).springify().damping(16)}
            style={styles.stepContent}
          >
            <Animated.View
              entering={ZoomIn.duration(420).springify().damping(12)}
              style={styles.welcomeLogo}
            >
              <ScorpionCrest size={64} accessibilityLabel="Scorpion logo" />
            </Animated.View>

            <Animated.Text
              entering={entries.fadeInDown(0)}
              style={[styles.welcomeTitle, { color: textRole.primary }]}
            >
              {t.onboarding.welcome.title}
            </Animated.Text>
            <Animated.Text
              entering={entries.fadeInDown(1)}
              style={[styles.welcomeSubtitle, { color: textRole.secondary }]}
            >
              {t.onboarding.welcome.subtitle}
            </Animated.Text>

            <Animated.View
              entering={FadeInUp.delay(200).duration(380).springify().damping(16)}
              style={styles.featureList}
            >
              {[
                {
                  icon: "football-outline",
                  title: t.onboarding.welcome.predictTitle,
                  body: t.onboarding.welcome.predictBody,
                },
                {
                  icon: "podium-outline",
                  title: t.onboarding.welcome.climbTitle,
                  body: t.onboarding.welcome.climbBody,
                },
                {
                  icon: "people-outline",
                  title: t.onboarding.welcome.competeTitle,
                  body: t.onboarding.welcome.competeBody,
                },
                {
                  icon: "flame-outline",
                  title: t.onboarding.welcome.streakTitle,
                  body: t.onboarding.welcome.streakBody,
                },
              ].map((feat, i) => (
                <Animated.View
                  key={feat.title}
                  entering={FadeInUp.delay(260 + i * 70).duration(320)}
                  style={[
                    styles.featureRow,
                    { backgroundColor: surface[0], borderColor: border.subtle },
                  ]}
                >
                  <View style={styles.featureIcon}>
                    <Ionicons
                      name={feat.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={accent.primary}
                    />
                  </View>
                  <View style={styles.featureCopy}>
                    <Text style={[styles.featureTitle, { color: textRole.primary }]}>
                      {feat.title}
                    </Text>
                    <Text style={[styles.featureBody, { color: textRole.secondary }]}>
                      {feat.body}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          </Animated.View>
        )}

        {step === "age" && (
          <Animated.View
            entering={FadeInDown.duration(380).springify().damping(16)}
            style={styles.stepContent}
          >
            <Animated.View entering={entries.pop(0)} style={styles.stepIconWrap}>
              <Ionicons name="calendar" size={26} color={accent.primary} />
            </Animated.View>
            <Animated.Text
              entering={entries.fadeInDown(0)}
              style={[styles.stepTitle, { color: textRole.primary }]}
            >
              {t.compliance.ageGate.title}
            </Animated.Text>
            <Animated.Text
              entering={entries.fadeInDown(1)}
              style={[styles.stepDesc, { color: textRole.secondary }]}
            >
              {t.compliance.ageGate.subtitle}
            </Animated.Text>

            <Animated.View entering={entries.fadeInDown(2)} style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: surface[0], color: textRole.primary },
                  { borderColor: border.subtle },
                  ageError && { borderColor: accent.alert },
                ]}
                value={birthYear}
                onChangeText={(val) => {
                  setBirthYearState(val);
                  if (ageError) setAgeError(null);
                }}
                onBlur={() => {
                  if (birthYear && !ageError) {
                    const year = parseInt(birthYear, 10);
                    const currentYear = new Date().getFullYear();
                    if (year < 1900 || year > currentYear) {
                      setAgeError("Invalid year");
                    }
                  }
                }}
                placeholder={t.compliance.ageGate.birthYearPlaceholder}
                placeholderTextColor={textRole.tertiary}
                maxLength={4}
                keyboardType="number-pad"
                autoFocus
                selectionColor={accent.primary}
              />
            </Animated.View>

            {ageError && (
              <Animated.View entering={FadeInDown.duration(240)} style={[styles.inlineError]}>
                <Text style={[styles.inlineErrorText, { color: accent.alert }]}>{ageError}</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {step === "username" && (
          <Animated.View
            entering={FadeInDown.duration(380).springify().damping(16)}
            style={styles.stepContent}
          >
            <Animated.View entering={entries.pop(0)} style={styles.stepIconWrap}>
              <Ionicons name="person" size={26} color={accent.primary} />
            </Animated.View>
            <Animated.Text
              entering={entries.fadeInDown(0)}
              style={[styles.stepTitle, { color: textRole.primary }]}
            >
              {t.onboarding.username.title}
            </Animated.Text>
            <Animated.Text
              entering={entries.fadeInDown(1)}
              style={[styles.stepDesc, { color: textRole.secondary }]}
            >
              {t.onboarding.username.subtitle}
            </Animated.Text>

            <Animated.View entering={entries.fadeInDown(2)} style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: surface[0], color: textRole.primary },
                  { borderColor: border.subtle },
                  usernameTouched && validation.usernameValid && { borderColor: accent.primary },
                  usernameTouched && !validation.usernameValid && { borderColor: accent.alert },
                ]}
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (!usernameTouched) setUsernameTouched(true);
                }}
                onBlur={() => {
                  if (!usernameTouched) setUsernameTouched(true);
                }}
                placeholder={t.onboarding.username.placeholder}
                placeholderTextColor={textRole.tertiary}
                maxLength={24}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={accent.primary}
              />
              {usernameTouched && validation.usernameValid ? (
                <Animated.View entering={ZoomIn.duration(200)} style={styles.inputCheck}>
                  <Ionicons name="checkmark-circle" size={22} color={accent.primary} />
                </Animated.View>
              ) : null}
            </Animated.View>

            {usernameTouched && !validation.usernameValid && (
              <Animated.View entering={FadeInDown.duration(240)} style={[styles.inlineError]}>
                <Text style={[styles.inlineErrorText, { color: accent.alert }]}>
                  {validation.usernameError}
                </Text>
              </Animated.View>
            )}

            <Animated.View
              entering={FadeInUp.delay(160).duration(380)}
              style={styles.avatarPreview}
            >
              <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarText}>
                  {username.trim().length >= 2
                    ? username.trim().substring(0, 2).toUpperCase()
                    : "??"}
                </Text>
              </View>
              <Text style={[styles.previewName, { color: textRole.primary }]}>
                {username.trim() || "Your Name"}
              </Text>
              <View style={styles.previewBadge}>
                <Ionicons name="star" size={12} color={accent.reward} />
                <Text style={styles.previewBadgeText}>{t.onboarding.username.newPlayer}</Text>
              </View>
            </Animated.View>
          </Animated.View>
        )}

        {step === "leagues" && (
          <Animated.View
            entering={FadeInDown.duration(380).springify().damping(16)}
            style={styles.stepContent}
          >
            <Animated.View entering={entries.pop(0)} style={styles.stepIconWrap}>
              <Ionicons name="trophy" size={26} color={accent.reward} />
            </Animated.View>
            <Animated.Text
              entering={entries.fadeInDown(0)}
              style={[styles.stepTitle, { color: textRole.primary }]}
            >
              {t.onboarding.username.leagues.title}
            </Animated.Text>
            <Animated.Text
              entering={entries.fadeInDown(1)}
              style={[styles.stepDesc, { color: textRole.secondary }]}
            >
              {t.onboarding.username.leagues.subtitle}
            </Animated.Text>

            <FlatList
              data={leagues}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInUp.delay(index * 50).duration(320)}>
                  <LeagueChip
                    league={item}
                    selected={selectedLeagues.includes(item.id)}
                    onToggle={() => toggleLeague(item.id)}
                    surface={surface}
                    border={border}
                    textRole={textRole}
                  />
                </Animated.View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.leagueList}
              showsVerticalScrollIndicator={false}
              style={styles.leagueScroll}
            />

            {selectedLeagues.length > 0 ? (
              <Animated.View entering={FadeInUp.duration(240)} style={styles.selectedCount}>
                <Text style={styles.selectedCountText}>
                  {selectedLeagues.length} league{selectedLeagues.length > 1 ? "s" : ""} selected
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        )}

        {step === "ready" && (
          <Animated.View
            entering={FadeInDown.duration(420).springify().damping(14)}
            style={[styles.stepContent, styles.readyContent]}
          >
            <Animated.View
              entering={ZoomIn.delay(150).duration(480).springify().damping(10)}
              style={styles.readyIcon}
            >
              <View style={styles.readyIconInner}>
                <Ionicons name="checkmark-done" size={40} color="#FFFFFF" />
              </View>
            </Animated.View>
            <Animated.Text
              entering={entries.fadeInDown(0)}
              style={[styles.readyTitle, { color: textRole.primary }]}
            >
              {t.onboarding.ready.title}
            </Animated.Text>
            <Animated.Text
              entering={entries.fadeInDown(1)}
              style={[styles.readySubtitle, { color: textRole.secondary }]}
            >
              {t.onboarding.ready.subtitle.replace("{{username}}", username.trim() || "Player")}
            </Animated.Text>

            <Animated.View
              entering={FadeInUp.delay(240).duration(380)}
              style={[
                styles.readySummary,
                { backgroundColor: surface[0], borderColor: border.subtle },
              ]}
            >
              <View style={styles.readySummaryRow}>
                <Ionicons name="person" size={16} color={textRole.secondary} />
                <Text style={[styles.readySummaryText, { color: textRole.primary }]}>
                  {username.trim() || "Player"}
                </Text>
              </View>
              <View style={[styles.readySummaryDivider, { backgroundColor: border.subtle }]} />
              <View style={styles.readySummaryRow}>
                <Ionicons name="football" size={16} color={textRole.secondary} />
                <Text style={[styles.readySummaryText, { color: textRole.primary }]}>
                  {selectedLeagues.length} league{selectedLeagues.length > 1 ? "s" : ""}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
        )}

        {/* Bottom actions */}
        <Animated.View entering={entries.fadeInUp()} style={styles.bottomActions}>
          {step !== "welcome" ? (
            <PressableScale
              onPress={() => {
                haptics.light();
                const steps: Step[] = ["welcome", "username", "leagues", "ready"];
                setStep(steps[stepIndex - 1]);
              }}
              haptic="none"
              style={[styles.backBtn, { backgroundColor: surface[0], borderColor: border.subtle }]}
            >
              <Ionicons name="chevron-back" size={20} color={textRole.secondary} />
            </PressableScale>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              title={
                step === "ready"
                  ? t.onboarding.ready.buttonText
                  : step === "welcome"
                    ? t.onboarding.cta
                    : t.onboarding.next
              }
              onPress={step === "ready" ? handleComplete : nextStep}
              disabled={!canProceed()}
              fullWidth
              icon={step === "ready" ? "rocket" : "arrow-forward"}
              iconPosition="trailing"
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },

  progressRow: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "center",
    marginBottom: 28,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: accent.primary,
    width: 22,
  },

  stepContent: { flex: 1, justifyContent: "center" },

  // welcome
  welcomeLogo: { alignSelf: "center", marginBottom: 20 },
  welcomeTitle: {
    fontSize: type.h1.size + 6,
    fontFamily: type.h1.family,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: type.body.size,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  featureList: { marginTop: 32, gap: 14 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: { flex: 1 },
  featureTitle: {
    fontSize: type.caption.size,
    fontFamily: "Inter_700Bold",
  },
  featureBody: {
    fontSize: type.micro.size + 1,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },

  // username
  stepIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: type.h2.size + 2,
    fontFamily: type.h2.family,
    textAlign: "center",
  },
  stepDesc: {
    fontSize: type.body.size,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  inputWrap: { marginTop: 28, position: "relative" },
  input: {
    borderRadius: radii.md,
    height: 54,
    paddingHorizontal: 18,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    borderWidth: 1,
    textAlign: "center",
  },
  inputCheck: { position: "absolute", right: 16, top: 16 },
  inlineError: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  inlineErrorText: {
    fontSize: type.caption.size,
    fontFamily: "Inter_500Medium",
  },
  avatarPreview: { alignItems: "center", marginTop: 32, gap: 8 },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  previewName: {
    fontSize: type.h3.size,
    fontFamily: "Inter_600SemiBold",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 166, 35, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: type.micro.size,
    fontFamily: "Inter_600SemiBold",
    color: accent.reward,
  },

  // leagues
  leagueScroll: { flex: 1, marginTop: 18 },
  leagueList: { gap: 10, paddingBottom: 12 },
  leagueChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  leagueChipSelected: {
    borderColor: accent.primary,
    backgroundColor: "rgba(0, 166, 81, 0.06)",
  },
  leagueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  leagueIconSelected: {
    backgroundColor: accent.primary,
  },
  leagueChipInfo: { flex: 1 },
  leagueChipName: {
    fontSize: type.caption.size + 1,
    fontFamily: "Inter_600SemiBold",
  },
  leagueChipCountry: {
    fontSize: type.micro.size + 1,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleSelected: {
    borderColor: accent.primary,
    backgroundColor: accent.primary,
  },
  selectedCount: { alignSelf: "center", paddingVertical: 4 },
  selectedCountText: {
    fontSize: type.caption.size,
    fontFamily: "Inter_500Medium",
    color: accent.primary,
  },

  // ready
  readyContent: { alignItems: "center" },
  readyIcon: { marginBottom: 24 },
  readyIconInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: accent.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0, 166, 81, 0.32)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  readyTitle: {
    fontSize: type.h1.size + 2,
    fontFamily: type.h1.family,
  },
  readySubtitle: {
    fontSize: type.body.size,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  readySummary: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    marginTop: 30,
    gap: 16,
    alignItems: "center",
  },
  readySummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  readySummaryText: {
    fontSize: type.body.size,
    fontFamily: "Inter_500Medium",
  },
  readySummaryDivider: {
    width: 1,
    height: 24,
  },

  // bottom
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    alignItems: "center",
  },
  backBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
