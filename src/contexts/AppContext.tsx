import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  Prediction,
  UserProfile,
  Group,
  DailyPackState,
  DailyPick,
  getPredictions,
  savePrediction as storePrediction,
  getUserProfile,
  saveUserProfile,
  getGroups,
  saveGroups,
  getOnboardingDone,
  setOnboardingDone as markOnboardingDone,
  saveFavoriteLeagues,
  getFavoriteLeagues,
  getIsPremium,
  setIsPremium as storePremium,
  getDailyPack,
  saveDailyPack,
  pruneStaleDrafts,
} from "@/lib/storage";
import type { Match, League } from "@/lib/types";
import { generateDailyPicks } from "@/lib/daily-picks";
import {
  useFootballMatches,
  useFootballLeagues,
  useDailyPack as useBackendDailyPack,
} from "@/lib/football-api";
import { queryClient, apiRequest } from "@/lib/query-client";
import { getTodayString, getWeekStart } from "@/lib/time-utils";
import { useDailyPackInit } from "@/lib/hooks/useDailyPackInit";
import { useAuth } from "@/contexts/AuthContext";
import { showErrorToast } from "@/lib/error-toast";
import { useCelebration } from "@/components/ui/CelebrationToast";

interface ErrorState {
  message: string;
  retry?: () => void;
  timestamp: number;
}

interface AppContextValue {
  matches: Match[];
  leagues: League[];
  predictions: Record<string, Prediction>;
  profile: UserProfile | null;
  groups: Group[];
  isLoading: boolean;
  onboardingDone: boolean;
  favoriteLeagues: string[];
  isPremium: boolean;
  dailyPack: DailyPackState | null;
  dailyPickMatches: Match[];
  lastError: ErrorState | null;
  liveMatchCount: number;
  submitPrediction: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    boosted?: boolean,
  ) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  joinGroup: (group: Group) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  createGroup: (name: string, isPublic: boolean, leagueIds: string[]) => Promise<void>;
  completeOnboarding: (username: string, leagueIds: string[]) => Promise<void>;
  setFavoriteLeagues: (ids: string[]) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  refreshData: () => Promise<void>;
  toggleBoostPick: (matchId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { celebrate } = useCelebration();
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingDone, setOnboardingDoneState] = useState(false);
  const [favoriteLeagues, setFavoriteLeaguesState] = useState<string[]>([]);
  // All features are free — isPremium always true
  const [isPremium, setIsPremiumState] = useState(true);
  const [dailyPack, setDailyPack] = useState<DailyPackState | null>(null);
  const [lastError, setLastError] = useState<ErrorState | null>(null);
  const pendingMatchIds = useRef(new Set<string>());
  const dailyPackRef = useRef(dailyPack);
  const profileRef = useRef(profile);
  const submitPredictionRef = useRef<AppContextValue["submitPrediction"]>(null as any);
  // Dedup sets for commiseration toasts
  const announcedMisses = useRef(new Set<string>());
  const lastStreakResetAnnounced = useRef<number | null>(null);
  const lastRankDropAnnounced = useRef<{ timestamp: number; rank: number } | null>(null);
  const previousStreak = useRef<number>(0);
  const previousRank = useRef<number>(0);

  const {
    data: apiMatches,
    isLoading: matchesLoading,
    refetch: refetchMatches,
  } = useFootballMatches();
  const { data: apiLeagues } = useFootballLeagues();
  // Matches + leagues come exclusively from the backend (fed by API-Football
  // sync → Postgres → /api/football/*). No client-side fallback data — an
  // empty array surfaces honestly as an empty state in the UI.
  const matches = useMemo<Match[]>(
    () => (apiMatches && apiMatches.length > 0 ? apiMatches : []),
    [apiMatches],
  );
  const leagues = useMemo<League[]>(
    () => (Array.isArray(apiLeagues) ? (apiLeagues as League[]) : []),
    [apiLeagues],
  );

  const dailyPickMatches = useMemo(() => {
    if (!dailyPack) return generateDailyPicks(matches, favoriteLeagues);
    // Check if daily pack is from a different day and reset if needed
    const today = getTodayString();
    if (dailyPack.date !== today) {
      return generateDailyPicks(matches, favoriteLeagues);
    }
    const pickIds = dailyPack.picks.map((p) => p.matchId);
    const matched = pickIds
      .map((id) => matches.find((m) => m.id === id))
      .filter(Boolean) as Match[];
    if (matched.length > 0) return matched;
    return generateDailyPicks(matches, favoriteLeagues);
  }, [dailyPack, favoriteLeagues, matches]);

  // Compute live match count for tab badge
  const liveMatchCount = useMemo(
    () => matches.filter((m) => m.status === "live").length,
    [matches],
  );

  const { initDailyPack: _initDailyPackFromHook } = useDailyPackInit(matches);

  // Update dailyPackRef whenever dailyPack changes
  useEffect(() => {
    dailyPackRef.current = dailyPack;
  }, [dailyPack]);

  // Update profileRef whenever profile changes
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Observe prediction settlements for miss toast
  useEffect(() => {
    const now = Date.now();
    Object.entries(predictions).forEach(([matchId, pred]) => {
      // Fire miss toast if: prediction settled with 0 points AND not yet announced
      if (pred.settled && pred.points === 0 && !announcedMisses.current.has(matchId)) {
        announcedMisses.current.add(matchId);
        // Find the match to get team names
        const match = matches.find((m) => m.id === matchId);
        if (match) {
          const homeScore = match.homeScore ?? 0;
          const awayScore = match.awayScore ?? 0;
          celebrate({
            variant: "miss",
            title: "Close, but no.",
            subtitle: `${match.homeTeam.shortName} ${homeScore}–${awayScore} ${match.awayTeam.shortName} — you picked ${pred.homeScore}–${pred.awayScore}`,
          });
        }
      }
    });
  }, [predictions, matches, celebrate]);

  // Observe streak resets for streak_reset toast (only if streak >= 2 days previously)
  useEffect(() => {
    if (!dailyPackRef.current) return;
    const currentStreak = dailyPackRef.current.streak ?? 0;

    // Fire if streak went from >= 2 to 0 AND not yet announced this session
    if (
      previousStreak.current >= 2 &&
      currentStreak === 0 &&
      lastStreakResetAnnounced.current === null
    ) {
      lastStreakResetAnnounced.current = Date.now();
      celebrate({
        variant: "streak_reset",
        title: "Streak ended",
        subtitle: `Your ${previousStreak.current}-day streak reset. Start fresh this week.`,
      });
    }
    previousStreak.current = currentStreak;
  }, [dailyPack, celebrate]);

  // Observe rank drops for rank_drop toast (drop of 2+ spots)
  useEffect(() => {
    if (!profile) return;
    const currentRank = profile.rank ?? 0;
    const rankDelta = currentRank - previousRank.current;

    // Fire if rank dropped by 2+ spots AND not already announced within 5 seconds
    if (
      rankDelta >= 2 &&
      previousRank.current > 0 && // Skip on initial mount when previousRank is 0
      (lastRankDropAnnounced.current === null ||
        Date.now() - lastRankDropAnnounced.current.timestamp > 5000)
    ) {
      lastRankDropAnnounced.current = { timestamp: Date.now(), rank: currentRank };
      celebrate({
        variant: "rank_drop",
        title: `Down ${rankDelta} spots`,
        subtitle: `You dropped from #${previousRank.current} to #${currentRank}. Climb back this weekend.`,
      });
    }
    if (rankDelta !== 0) {
      previousRank.current = currentRank;
    }
  }, [profile, celebrate]);

  const initDailyPack = useCallback(
    async (favLeagues: string[]) => {
      await _initDailyPackFromHook(favLeagues, setDailyPack);
    },
    [_initDailyPackFromHook],
  );

  const loadData = useCallback(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await pruneStaleDrafts();
      const [localPreds, prof, grps, obDone, favLeagues, premium] = await Promise.all([
        getPredictions(),
        getUserProfile(),
        getGroups(),
        getOnboardingDone(),
        getFavoriteLeagues(),
        getIsPremium(),
      ]);
      if (!cancelled) {
        setPredictions(localPreds);
        setProfile(prof);
        setGroups(grps);
        setOnboardingDoneState(obDone);
        setFavoriteLeaguesState(favLeagues);
        setIsPremiumState(premium);
      }
      await initDailyPack(favLeagues);

      try {
        const res = await apiRequest("GET", "/api/predictions");
        const dbPreds = await res.json();
        if (!cancelled && Array.isArray(dbPreds) && dbPreds.length > 0) {
          const merged: Record<string, Prediction> = { ...localPreds };
          for (const p of dbPreds) {
            merged[p.matchId] = {
              matchId: p.matchId,
              homeScore: p.homeScore,
              awayScore: p.awayScore,
              timestamp: p.timestamp,
              points: p.points ?? undefined,
              settled: p.settled ?? false,
              boosted: false,
            };
          }
          if (!cancelled) {
            setPredictions(merged);
          }
        }
      } catch (error) {
        console.warn("Failed to load predictions:", error);
      }

      try {
        const res = await apiRequest("GET", "/api/auth/me");
        const data = await res.json();
        if (!cancelled && data?.user && prof) {
          const serverProfile: UserProfile = {
            ...prof,
            id: data.user.id,
            totalPoints: data.user.totalPoints ?? prof.totalPoints,
            correctPredictions: data.user.correctPredictions ?? prof.correctPredictions,
            totalPredictions: data.user.totalPredictions ?? prof.totalPredictions,
            streak: data.user.streak ?? prof.streak,
            bestStreak: data.user.bestStreak ?? prof.bestStreak,
          };
          await saveUserProfile(serverProfile);
          if (!cancelled) {
            setProfile(serverProfile);
          }
        }
      } catch (error) {
        console.warn("AppContext:loadData auth/me", { error });
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initDailyPack]);

  useEffect(() => {
    // Only fetch server data when the user is authenticated and auth is resolved
    if (authLoading || !isAuthenticated) {
      setIsLoading(false);
      return;
    }
    const cleanup = loadData();
    return cleanup;
  }, [loadData, isAuthenticated, authLoading]);

  const completeOnboarding = useCallback(
    async (username: string, leagueIds: string[]) => {
      const newProfile: UserProfile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        username,
        avatar: username.substring(0, 2).toUpperCase(),
        totalPoints: 0,
        correctPredictions: 0,
        totalPredictions: 0,
        streak: 0,
        bestStreak: 0,
        rank: 0,
        joinedAt: Date.now(),
        favoriteLeagues: leagueIds,
      };
      await saveUserProfile(newProfile);
      await markOnboardingDone();
      await saveFavoriteLeagues(leagueIds);
      setProfile(newProfile);
      setOnboardingDoneState(true);
      setFavoriteLeaguesState(leagueIds);
      await initDailyPack(leagueIds);
    },
    [initDailyPack],
  );

  const submitPrediction = useCallback(
    async (matchId: string, homeScore: number, awayScore: number, boosted?: boolean) => {
      // Guard against rapid submit on same matchId
      if (pendingMatchIds.current.has(matchId)) {
        console.warn("AppContext:submitPrediction guard", {
          matchId,
          message: "submit already in-flight",
        });
        return;
      }
      pendingMatchIds.current.add(matchId);

      try {
        const pred: Prediction = {
          matchId,
          homeScore,
          awayScore,
          timestamp: Date.now(),
          boosted: boosted || false,
        };
        await storePrediction(pred);
        setPredictions((prev) => ({ ...prev, [matchId]: pred }));

        try {
          const res = await apiRequest("POST", "/api/predictions", {
            matchId,
            homeScore,
            awayScore,
          });
          const dbPred = await res.json();
          if (dbPred && dbPred.id) {
            setPredictions((prev) => ({ ...prev, [matchId]: { ...pred, ...dbPred } }));
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error("AppContext:submitPrediction server sync", { matchId, errMsg });
          setLastError({
            message: `Failed to sync prediction to server: ${errMsg}`,
            timestamp: Date.now(),
          });
          showErrorToast({
            title: "Prediction didn't save",
            message: "We'll retry automatically. Check back soon.",
            retry: () => submitPredictionRef.current(matchId, homeScore, awayScore, boosted),
          });
        }

        if (profileRef.current) {
          const updated = {
            ...profileRef.current,
            totalPredictions: (profileRef.current.totalPredictions ?? 0) + 1,
          };
          await saveUserProfile(updated);
          setProfile(updated);
        }

        if (dailyPackRef.current) {
          const pickIndex = dailyPackRef.current.picks.findIndex((p) => p.matchId === matchId);
          if (pickIndex >= 0) {
            const updatedPicks = [...dailyPackRef.current.picks];
            updatedPicks[pickIndex] = {
              ...updatedPicks[pickIndex],
              completed: true,
              boosted: boosted || false,
            };
            const updatedPack: DailyPackState = {
              ...dailyPackRef.current,
              picks: updatedPicks,
            };
            await saveDailyPack(updatedPack);
            setDailyPack(updatedPack);
          }
        }

        try {
          await apiRequest("POST", "/api/retention/daily-pack/complete", { matchId });
        } catch (err) {
          const dpErrMsg = err instanceof Error ? err.message : String(err);
          // 404 = no daily pack for today — expected when packs haven't been generated yet
          const is404 = dpErrMsg.startsWith("404");
          if (!is404) {
            console.error("AppContext:submitPrediction daily-pack complete", {
              matchId,
              errMsg: dpErrMsg,
            });
            setLastError({
              message: `Failed to complete daily pack event: ${dpErrMsg}`,
              timestamp: Date.now(),
            });
          }
        }

        if (boosted) {
          try {
            await apiRequest("POST", "/api/retention/boost", { matchId });
          } catch (err) {
            const boostErrMsg = err instanceof Error ? err.message : String(err);
            console.error("AppContext:submitPrediction boost", { matchId, errMsg: boostErrMsg });
            setLastError({
              message: `Failed to record boost event: ${boostErrMsg}`,
              timestamp: Date.now(),
            });
          }
        }

        queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/retention/achievements"] });
        queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      } finally {
        pendingMatchIds.current.delete(matchId);
      }
    },
    [],
  );

  // Keep ref in sync so the retry handler in showErrorToast always calls the
  // latest version of submitPrediction (avoids stale recursive closure).
  useEffect(() => {
    submitPredictionRef.current = submitPrediction;
  }, [submitPrediction]);

  const toggleBoostPick = useCallback(async (matchId: string) => {
    const current = dailyPackRef.current;
    if (!current) return;
    const previous = current;
    const updatedPicks = current.picks.map((p: DailyPick) => ({
      ...p,
      boosted: p.matchId === matchId ? !p.boosted : false,
    }));
    const updatedPack: DailyPackState = {
      ...current,
      picks: updatedPicks,
      boostUsed: updatedPicks.some((p: DailyPick) => p.boosted),
    };
    // Optimistic local update — the UI updates immediately.
    await saveDailyPack(updatedPack);
    setDailyPack(updatedPack);

    // Sync to server; on failure, roll back and show error toast.
    try {
      await apiRequest("POST", "/api/retention/boost", { matchId });
    } catch (err) {
      console.error("AppContext:toggleBoostPick", { matchId, err });
      await saveDailyPack(previous);
      setDailyPack(previous);
      setLastError({
        message: "Failed to toggle boost; reverted",
        timestamp: Date.now(),
      });
      showErrorToast({
        title: "Boost didn't apply",
        message: "Your prediction is still safe. Try again?",
        retry: () => apiRequest("POST", "/api/retention/boost", { matchId }).catch(() => {}),
      });
      throw err;
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!profile) return;
      const updated = { ...profile, ...updates };
      await saveUserProfile(updated);
      setProfile(updated);
    },
    [profile],
  );

  const joinGroup = useCallback(
    async (group: Group) => {
      if (groups.some((g) => g.id === group.id)) return; // Already joined
      const updated = [...groups, { ...group, joined: true }];
      await saveGroups(updated);
      setGroups(updated);
    },
    [groups],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      const updated = groups.filter((g) => g.id !== groupId);
      await saveGroups(updated);
      setGroups(updated);
    },
    [groups],
  );

  const createGroup = useCallback(
    async (name: string, isPublic: boolean, leagueIds: string[]) => {
      const newGroup: Group = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        code: Math.random().toString(36).substr(2, 6).toUpperCase(),
        isPublic,
        memberCount: 1,
        createdAt: Date.now(),
        joined: true,
        leagueIds,
      };
      const updated = [...groups, newGroup];
      await saveGroups(updated);
      setGroups(updated);
    },
    [groups],
  );

  const setFavLeagues = useCallback(
    async (ids: string[]) => {
      await saveFavoriteLeagues(ids);
      setFavoriteLeaguesState(ids);
      if (profile) {
        const updated = { ...profile, favoriteLeagues: ids };
        await saveUserProfile(updated);
        setProfile(updated);
      }
    },
    [profile],
  );

  const upgradeToPremium = useCallback(async () => {
    await storePremium(true);
    setIsPremiumState(true);
  }, []);

  const refreshDataWithApi = useCallback(async () => {
    await refetchMatches();
    await loadData();
  }, [refetchMatches, loadData]);

  const { logout } = useAuth();

  const deleteAccount = useCallback(async () => {
    try {
      const res = await apiRequest("DELETE", "/api/account");
      if (!res.ok) throw new Error("Delete failed");
      // Clear all local state + storage
      await import("@react-native-async-storage/async-storage").then(({ default: AsyncStorage }) =>
        AsyncStorage.clear(),
      );
      logout();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete account: ${errMsg}`);
    }
  }, [logout]);

  const value = useMemo(
    () => ({
      matches,
      leagues,
      predictions,
      profile,
      groups,
      isLoading,
      onboardingDone,
      favoriteLeagues,
      isPremium,
      dailyPack,
      dailyPickMatches,
      lastError,
      liveMatchCount,
      submitPrediction,
      updateProfile,
      joinGroup,
      leaveGroup,
      createGroup,
      completeOnboarding,
      setFavoriteLeagues: setFavLeagues,
      upgradeToPremium,
      refreshData: refreshDataWithApi,
      toggleBoostPick,
      deleteAccount,
    }),
    [
      matches,
      leagues,
      predictions,
      profile,
      groups,
      isLoading,
      onboardingDone,
      favoriteLeagues,
      isPremium,
      dailyPack,
      dailyPickMatches,
      lastError,
      liveMatchCount,
      submitPrediction,
      updateProfile,
      joinGroup,
      leaveGroup,
      createGroup,
      completeOnboarding,
      setFavLeagues,
      upgradeToPremium,
      refreshDataWithApi,
      toggleBoostPick,
      deleteAccount,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
