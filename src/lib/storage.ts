import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PREDICTIONS: 'scorepion_predictions',
  USER_PROFILE: 'scorepion_profile',
  GROUPS: 'scorepion_groups',
  FAVORITES: 'scorepion_favorites',
  ONBOARDING_DONE: 'scorepion_onboarding_done',
  FAVORITE_LEAGUES: 'scorepion_favorite_leagues',
  IS_PREMIUM: 'scorepion_is_premium',
  DAILY_PACK: 'scorepion_daily_pack',
  LAST_VISIT: 'scorepion_last_visit',
  COLLAPSED_SECTIONS: 'scorepion_collapsed_sections',
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

export async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error('storage:getItem', { key, err });
    return fallback;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('storage:setItem', { key, err });
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
