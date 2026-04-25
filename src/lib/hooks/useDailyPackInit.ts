/**
 * useDailyPackInit – Single Responsibility hook.
 *
 * Encapsulates all local (AsyncStorage) daily-pack initialisation logic
 * so AppContext is not responsible for it.
 *
 * Dependency Inversion: consumers depend on the hook's stable API, not on
 * the storage details or date calculations.
 */
import { useCallback } from "react";
import { DailyPackState, getDailyPack, saveDailyPack } from "@/lib/storage";
import { getTodayString, getWeekStart } from "@/lib/time-utils";
import type { Match } from "@/lib/types";
import { generateDailyPicks } from "@/lib/daily-picks";

export function useDailyPackInit(matches: Match[]) {
  const initDailyPack = useCallback(
    async (favLeagues: string[], setDailyPack: (pack: DailyPackState) => void): Promise<void> => {
      const existing = await getDailyPack();
      const today = getTodayString();
      const weekStart = getWeekStart();

      // Already initialised for today — restore from storage.
      if (existing && existing.date === today) {
        setDailyPack(existing);
        return;
      }

      // Calculate new streak based on whether yesterday's pack was completed.
      const prevStreak = existing?.streak ?? 0;
      const prevBest = existing?.bestStreak ?? 0;
      const wasCompleted = existing?.picks.every((p) => p.completed) ?? false;
      const newStreak = wasCompleted ? prevStreak + 1 : 0;

      const picks = generateDailyPicks(matches, favLeagues);
      const newPack: DailyPackState = {
        date: today,
        picks: picks.map((m) => ({ matchId: m.id, completed: false, boosted: false })),
        streak: newStreak,
        bestStreak: Math.max(prevBest, newStreak),
        boostUsed: false,
        weeklyPoints: existing?.weekStartDate === weekStart ? (existing?.weeklyPoints ?? 0) : 0,
        weekStartDate: weekStart,
      };

      await saveDailyPack(newPack);
      setDailyPack(newPack);
    },
    [matches],
  );

  return { initDailyPack };
}
