import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  PREDICTIONS: "scorepion_predictions",
  USER_PROFILE: "scorepion_profile",
  GROUPS: "scorepion_groups",
  FAVORITES: "scorepion_favorites",
  ONBOARDING_DONE: "scorepion_onboarding_done",
  FAVORITE_LEAGUES: "scorepion_favorite_leagues",
  IS_PREMIUM: "scorepion_is_premium",
  DAILY_PACK: "scorepion_daily_pack",
  LAST_VISIT: "scorepion_last_visit",
  COLLAPSED_SECTIONS: "scorepion_collapsed_sections",
  PREDICTION_DRAFTS: "scorepion_prediction_drafts",
  AGE_VERIFIED: "scorepion_age_verified",
  BIRTH_YEAR: "scorepion_birth_year",
};

export interface Prediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
  timestamp: number;
  points?: number;
  settled?: boolean;
  boosted?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  streak: number;
  bestStreak: number;
  rank: number;
  joinedAt: number;
  favoriteLeagues: string[];
}

export interface Group {
  id: string;
  name: string;
  code: string;
  isPublic: boolean;
  memberCount: number;
  createdAt: number;
  joined: boolean;
  leagueIds: string[];
}

export interface DailyPick {
  matchId: string;
  completed: boolean;
  boosted: boolean;
}

export interface DailyPackState {
  date: string;
  picks: DailyPick[];
  streak: number;
  bestStreak: number;
  boostUsed: boolean;
  weeklyPoints: number;
  weekStartDate: string;
}

export interface PredictionDraft {
  home: number;
  away: number;
  updatedAt: number;
}

export async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("storage:getItem", { key, err });
    return fallback;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("storage:setItem", { key, err });
    // Fail gracefully; caller continues without persisting
  }
}

export async function getPredictions(): Promise<Record<string, Prediction>> {
  return getItem(KEYS.PREDICTIONS, {});
}

export async function savePrediction(prediction: Prediction): Promise<void> {
  const preds = await getPredictions();
  preds[prediction.matchId] = prediction;
  await setItem(KEYS.PREDICTIONS, preds);
}

export async function getUserProfile(): Promise<UserProfile | null> {
  return getItem<UserProfile | null>(KEYS.USER_PROFILE, null);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await setItem(KEYS.USER_PROFILE, profile);
}

export async function getGroups(): Promise<Group[]> {
  return getItem(KEYS.GROUPS, []);
}

export async function saveGroups(groups: Group[]): Promise<void> {
  await setItem(KEYS.GROUPS, groups);
}

export async function getOnboardingDone(): Promise<boolean> {
  return getItem(KEYS.ONBOARDING_DONE, false);
}

export async function setOnboardingDone(): Promise<void> {
  await setItem(KEYS.ONBOARDING_DONE, true);
}

export async function getFavoriteLeagues(): Promise<string[]> {
  return getItem(KEYS.FAVORITE_LEAGUES, []);
}

export async function saveFavoriteLeagues(ids: string[]): Promise<void> {
  await setItem(KEYS.FAVORITE_LEAGUES, ids);
}

export async function getIsPremium(): Promise<boolean> {
  return getItem(KEYS.IS_PREMIUM, false);
}

export async function setIsPremium(val: boolean): Promise<void> {
  await setItem(KEYS.IS_PREMIUM, val);
}

export async function getDailyPack(): Promise<DailyPackState | null> {
  return getItem<DailyPackState | null>(KEYS.DAILY_PACK, null);
}

export async function saveDailyPack(pack: DailyPackState): Promise<void> {
  await setItem(KEYS.DAILY_PACK, pack);
}

/**
 * Last-visit timestamp, used to decide whether to show the welcome-back
 * banner and which "points since last time" window to summarise. Stored as
 * a unix millisecond epoch.
 */
export async function getLastVisit(): Promise<number | null> {
  return getItem<number | null>(KEYS.LAST_VISIT, null);
}

export async function setLastVisit(ts: number): Promise<void> {
  await setItem(KEYS.LAST_VISIT, ts);
}

/**
 * Persisted state of which Matches-screen sections the user has collapsed.
 * Stored as an array of keys (e.g. `date_2026-04-12`, `date_2026-04-12_league_pl`)
 * and rehydrated into a Set at mount. Surfaced after Sven's Round 2 complaint
 * that his Bundesliga-only filter did not survive an app restart.
 */
export async function getCollapsedSections(): Promise<string[]> {
  return getItem<string[]>(KEYS.COLLAPSED_SECTIONS, []);
}

export async function saveCollapsedSections(keys: string[]): Promise<void> {
  await setItem(KEYS.COLLAPSED_SECTIONS, keys);
}

/**
 * Draft-save helpers for score predictions. Drafts are stored per matchId and
 * include home/away scores plus updatedAt timestamp. If a user leaves the match
 * detail page without locking in, their entered scores are restored on next visit.
 */
export async function getPredictionDrafts(): Promise<Record<string, PredictionDraft>> {
  return getItem(KEYS.PREDICTION_DRAFTS, {});
}

export async function getPredictionDraft(
  matchId: string,
): Promise<{ home: number; away: number } | null> {
  const drafts = await getPredictionDrafts();
  const draft = drafts[matchId];
  return draft ? { home: draft.home, away: draft.away } : null;
}

export async function savePredictionDraft(
  matchId: string,
  home: number,
  away: number,
): Promise<void> {
  const drafts = await getPredictionDrafts();
  drafts[matchId] = { home, away, updatedAt: Date.now() };
  await setItem(KEYS.PREDICTION_DRAFTS, drafts);
}

export async function clearPredictionDraft(matchId: string): Promise<void> {
  const drafts = await getPredictionDrafts();
  delete drafts[matchId];
  await setItem(KEYS.PREDICTION_DRAFTS, drafts);
}

/**
 * Removes draft predictions older than 7 days. Called once per app startup
 * in AppContext.loadData() to keep AsyncStorage clean.
 */
export async function pruneStaleDrafts(): Promise<void> {
  const drafts = await getPredictionDrafts();
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  let pruned = false;

  for (const [matchId, draft] of Object.entries(drafts)) {
    if (now - draft.updatedAt > SEVEN_DAYS) {
      delete drafts[matchId];
      pruned = true;
    }
  }

  if (pruned) {
    await setItem(KEYS.PREDICTION_DRAFTS, drafts);
  }
}

/**
 * Age verification helpers for COPPA compliance.
 * Birth year is stored locally (not sent to server) for privacy.
 */
export async function setBirthYear(year: number): Promise<void> {
  await setItem(KEYS.BIRTH_YEAR, year);
}

export async function getBirthYear(): Promise<number | null> {
  return getItem<number | null>(KEYS.BIRTH_YEAR, null);
}

export async function setAgeVerified(v: boolean): Promise<void> {
  await setItem(KEYS.AGE_VERIFIED, v);
}

export async function getAgeVerified(): Promise<boolean> {
  return getItem(KEYS.AGE_VERIFIED, false);
}
