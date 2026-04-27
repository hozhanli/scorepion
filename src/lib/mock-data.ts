/**
 * @deprecated
 *
 * This module used to generate 170 fake fixtures, 5 fake leaderboard users,
 * 60 hardcoded teams, 15 static leagues, and synthetic standings/scorers so
 * the app could run without a populated database.
 *
 * All of that mock data has been removed. The app now renders exclusively
 * from the MySQL database, which is populated by the API-Football sync
 * (server/services/sync.ts). Types live in `./types`; the pure logic that
 * used to live here (daily-pick ranking, social-proof deterministic fallback)
 * lives in `./daily-picks`.
 *
 * Import from those instead:
 *
 *   import type { Match, League, Team } from '@/lib/types';
 *   import { generateDailyPicks } from '@/lib/daily-picks';
 *   import { useFootballLeagues } from '@/lib/football-api';
 *
 * This stub remains only as a redirect for any stale imports; it will be
 * deleted once we're sure nothing references it.
 */
export type {
  League,
  Team,
  Match,
  StandingRow,
  TopScorer,
  LeaderboardEntry,
  SocialProof,
  H2HMatch,
  TournamentStage,
  MatchImportance,
  MatchTag,
} from "./types";
export { generateDailyPicks, generateSocialProof } from "./daily-picks";
