/**
 * lib/football-api.ts — React Query hooks for all football data
 *
 * POLLING STRATEGY FOR LIVE SCORES
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Backend: Server syncs live fixtures with API-Football every 30s (startLivePolling).
 *
 * Frontend: Dynamic polling tiers based on match presence:
 *   • useFootballMatches() with status="live" filter: always 20s (mirrors server cadence)
 *   • useFootballMatches() unfiltered, but contains LIVE match(es): 20s
 *   • useFootballMatches() unfiltered, no LIVE matches: 60s (keep-fresh idle polling)
 *   • useFootballMatches() with status="finished": no auto-refetch (immutable)
 *
 * Detail hooks (events, stats, lineups):
 *   • useFixtureEvents() & useFixtureMatchStats(): 60s while match is live or open
 *   • useFixtureLineups(): 5min (lineups set pre-kickoff, change only on subs)
 *
 * Worst-case end-to-end latency:
 *   Server polling (0–30s) + Client polling (0–20s for live) = 0–50s max for live.
 *   For idle mixed-list feed: Server (0–30s) + Client (0–60s) = 0–90s max.
 *
 * Stale times (cache invalidation windows):
 *   Live matches:    20s  (close to backend cadence)
 *   Fixtures:        5min  (server syncs every 6h, but live status can change)
 *   Standings:       30min (server syncs every 6h)
 *   Top players:     2h   (server syncs every 12h)
 *   Injuries/H2H:    4h   (server syncs every 24h)
 *   Events/lineups:  30s  (can change during live play)
 *
 * Note: League API ID mappings are managed server-side. Client-side league IDs
 * are synchronized with the server's LEAGUE_API_IDS mapping.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Match, StandingRow, TopScorer, League, Team } from "./types";

// ── Known team colors ─────────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
  Arsenal: "#EF0107",
  Chelsea: "#034694",
  Liverpool: "#C8102E",
  "Manchester City": "#6CABDD",
  "Man City": "#6CABDD",
  "Manchester United": "#DA291C",
  "Man United": "#DA291C",
  Tottenham: "#132257",
  "Tottenham Hotspur": "#132257",
  Newcastle: "#241F20",
  "Newcastle United": "#241F20",
  "Aston Villa": "#670E36",
  "West Ham": "#7A263A",
  "West Ham United": "#7A263A",
  Brighton: "#0057B8",
  "Brighton & Hove Albion": "#0057B8",
  Fulham: "#000000",
  "Crystal Palace": "#1B458F",
  Brentford: "#E30613",
  Wolverhampton: "#FDB913",
  Wolves: "#FDB913",
  Everton: "#003399",
  "Nottingham Forest": "#DD0000",
  Bournemouth: "#DA291C",
  "AFC Bournemouth": "#DA291C",
  "Leicester City": "#003090",
  Ipswich: "#0044AA",
  "Ipswich Town": "#0044AA",
  Southampton: "#D71920",
  // La Liga
  Barcelona: "#A50044",
  "Real Madrid": "#FEBE10",
  "Atletico Madrid": "#CB3524",
  Sevilla: "#F43333",
  "Real Betis": "#00954C",
  Villarreal: "#FFCD00",
  // Serie A
  Juventus: "#000000",
  "Inter Milan": "#009ADD",
  Inter: "#009ADD",
  "AC Milan": "#FB090B",
  Milan: "#FB090B",
  Napoli: "#12A0D7",
  "AS Roma": "#8E1F2F",
  Roma: "#8E1F2F",
  Lazio: "#87D8F7",
  // Bundesliga
  "Bayern Munich": "#DC052D",
  "Bayern München": "#DC052D",
  Dortmund: "#FDE100",
  "Borussia Dortmund": "#FDE100",
  "RB Leipzig": "#DD0741",
  "Bayer Leverkusen": "#E32221",
  // Ligue 1
  PSG: "#004170",
  "Paris Saint-Germain": "#004170",
  "Paris SG": "#004170",
  Marseille: "#2FAEE0",
  Lyon: "#1D4696",
  Monaco: "#E7242D",
  Lille: "#E2001A",
  Nice: "#000000",
};

function applyTeamColor(team: Team): Team {
  if (team?.color && team.color !== "#333") return team;
  const known = TEAM_COLORS[team?.name ?? ""];
  if (known) return { ...team, color: known };
  // Generate consistent color from name
  let hash = 0;
  for (let i = 0; i < (team?.name?.length ?? 0); i++) {
    hash = team.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return { ...team, color: `hsl(${h},60%,40%)` };
}

// ── Transform helpers ─────────────────────────────────────────────────────────

function transformFixture(f: any): Match {
  return {
    id: String(f.id ?? f.apiFixtureId),
    league: f.league,
    homeTeam: applyTeamColor(f.homeTeam),
    awayTeam: applyTeamColor(f.awayTeam),
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    status: f.status,
    statusShort: f.statusShort,
    kickoff: f.kickoff,
    minute: f.minute ?? undefined,
    venue: f.venue ?? undefined,
    referee: f.referee ?? undefined,
    round: f.round ?? undefined,
    season: f.season ?? undefined,
  };
}

function transformStanding(r: any): StandingRow {
  return {
    position: r.position,
    team: applyTeamColor(r.team),
    played: r.played,
    won: r.won,
    drawn: r.drawn,
    lost: r.lost,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    goalDifference: r.goalDifference,
    points: r.points,
    form: Array.isArray(r.form) ? r.form : [],
    group: r.group,
  };
}

function transformScorer(s: any): TopScorer {
  return {
    rank: s.rank,
    playerName: s.playerName,
    playerPhoto: s.playerPhoto ?? "",
    team: applyTeamColor(s.team),
    goals: s.goals,
    assists: s.assists,
    matches: s.matches,
  };
}

// ── Stale time constants ──────────────────────────────────────────────────────
const ST_LIVE = 20_000; // 20s (matches server's live polling)
const ST_FIXTURES = 5 * 60_000; // 5min
const ST_STANDING = 30 * 60_000; // 30min
const ST_PLAYERS = 2 * 60 * 60_000; // 2h
const ST_LONG = 4 * 60 * 60_000; // 4h

// ── Refetch intervals ─────────────────────────────────────────────────────────
const REFETCH_LIVE = 20_000; // 20s for live matches
const REFETCH_IDLE = 60_000; // 60s for background keep-fresh

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useFootballLeagues() {
  return useQuery<League[]>({
    queryKey: ["/api/football/leagues"],
    staleTime: 24 * 60 * 60_000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useFootballMatches(options?: { leagueId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (options?.leagueId) params.set("league", options.leagueId);
  if (options?.status) params.set("status", options.status);
  const qs = params.toString();

  // Dynamic refetch based on live-match presence and filter:
  //   - Explicit "live" filter: always 20s (mirrors server cadence)
  //   - "finished" filter: no auto-refetch (immutable results)
  //   - Unfiltered but contains LIVE match(es): 20s (tight)
  //   - Unfiltered, no LIVE matches: 60s (idle background keep-fresh)
  //
  // The server's live poller writes to MySQL every 30s. Client polling at 20s
  // when any match is live keeps the UI within 50s of backend reality. Idle polling
  // at 60s keeps mixed-list feeds current without excess requests.
  const hasLiveFilter = options?.status === "live";
  const isFinishedOnly = options?.status === "finished";

  return useQuery<Match[]>({
    queryKey: [`/api/football/fixtures${qs ? `?${qs}` : ""}`],
    staleTime: hasLiveFilter ? ST_LIVE : ST_FIXTURES,
    select: (data: any) => (Array.isArray(data) ? data.map(transformFixture) : []),
    refetchInterval: (query) => {
      // Never refetch finished-only lists
      if (isFinishedOnly) return false;
      // Always 20s if explicit live filter
      if (hasLiveFilter) return REFETCH_LIVE;
      // For unfiltered lists, check if any match is live
      const data = query.state.data as Match[] | undefined;
      const anyLive = Array.isArray(data) && data.some((m) => m.status === "live");
      return anyLive ? REFETCH_LIVE : REFETCH_IDLE;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useFootballStandings(leagueId: string) {
  return useQuery<StandingRow[]>({
    queryKey: [`/api/football/standings/${leagueId}`],
    staleTime: ST_STANDING,
    enabled: !!leagueId,
    select: (data: any) => (Array.isArray(data) ? data.map(transformStanding) : []),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useFootballTopScorers(leagueId: string) {
  return useQuery<TopScorer[]>({
    queryKey: [`/api/football/top-scorers/${leagueId}`],
    staleTime: ST_PLAYERS,
    enabled: !!leagueId,
    select: (data: any) => (Array.isArray(data) ? data.map(transformScorer) : []),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useFootballTopAssists(leagueId: string) {
  return useQuery<any[]>({
    queryKey: [`/api/football/top-assists/${leagueId}`],
    staleTime: ST_PLAYERS,
    enabled: !!leagueId,
    select: (data: any) =>
      Array.isArray(data) ? data.map((r) => ({ ...r, team: applyTeamColor(r.team) })) : [],
    retry: 2,
    retryDelay: 1000,
  });
}

export function useFootballTopYellowCards(leagueId: string) {
  return useQuery<any[]>({
    queryKey: [`/api/football/top-yellow-cards/${leagueId}`],
    staleTime: ST_PLAYERS,
    enabled: !!leagueId,
    select: (data: any) =>
      Array.isArray(data) ? data.map((r) => ({ ...r, team: applyTeamColor(r.team) })) : [],
    retry: 2,
    retryDelay: 1000,
  });
}

export function useFootballTopRedCards(leagueId: string) {
  return useQuery<any[]>({
    queryKey: [`/api/football/top-red-cards/${leagueId}`],
    staleTime: ST_PLAYERS,
    enabled: !!leagueId,
    select: (data: any) =>
      Array.isArray(data) ? data.map((r) => ({ ...r, team: applyTeamColor(r.team) })) : [],
    retry: 2,
    retryDelay: 1000,
  });
}

export function useFootballInjuries(leagueId: string) {
  return useQuery<any[]>({
    queryKey: [`/api/football/injuries/${leagueId}`],
    staleTime: ST_LONG,
    enabled: !!leagueId,
    select: (data: any) =>
      Array.isArray(data) ? data.map((r) => ({ ...r, team: applyTeamColor(r.team) })) : [],
    retry: 2,
    retryDelay: 1000,
  });
}

export function useFootballTransfers(leagueId: string) {
  return useQuery<any[]>({
    queryKey: [`/api/football/transfers/${leagueId}`],
    staleTime: ST_LONG,
    enabled: !!leagueId,
    retry: 2,
    retryDelay: 1000,
  });
}

// ── NEW: Fixture detail hooks ─────────────────────────────────────────────────

// Events and stats update throughout a live match — poll them every 60s while
// the match-detail screen is open. Server-side sync is idempotent and throttled
// to one upstream API-Football call per 60s per fixture, so this is cheap.
export function useFixtureEvents(fixtureApiId: string | number | undefined) {
  return useQuery<any[]>({
    queryKey: [`/api/football/fixtures/${fixtureApiId}/events`],
    staleTime: ST_LIVE, // 20s — events can change mid-play
    refetchInterval: 60_000, // pull fresh every minute while screen is open
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: !!fixtureApiId,
    select: (data: any) => (Array.isArray(data) ? data : []),
    retry: 2,
    retryDelay: 1000,
  });
}

// Lineups are set ~30min pre-kickoff and change only on substitutions (which
// come through the events hook anyway). Refetch every 5min — enough to catch
// late lineup announcements, not wasteful.
export function useFixtureLineups(fixtureApiId: string | number | undefined) {
  return useQuery<any[]>({
    queryKey: [`/api/football/fixtures/${fixtureApiId}/lineups`],
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
    enabled: !!fixtureApiId,
    select: (data: any) =>
      Array.isArray(data)
        ? data.map((team: any) => ({
            ...team,
            team: applyTeamColor(team.team),
          }))
        : [],
    retry: 2,
    retryDelay: 1000,
  });
}

// Match stats (possession, shots, corners, cards) tick up throughout play —
// same cadence as events.
export function useFixtureMatchStats(fixtureApiId: string | number | undefined) {
  return useQuery<any[]>({
    queryKey: [`/api/football/fixtures/${fixtureApiId}/stats`],
    staleTime: ST_LIVE,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: !!fixtureApiId,
    select: (data: any) =>
      Array.isArray(data)
        ? data.map((t: any) => ({
            ...t,
            team: applyTeamColor(t.team),
          }))
        : [],
    retry: 2,
    retryDelay: 1000,
  });
}

// ── Fixture detail by ID ──────────────────────────────────────────────────────
// Fetches a single fixture from the fixtures list using a client-side filter.
// Inherits aggressive polling from useFootballMatches: 20s when live, 60s idle.
// Returns both the match and query metadata (isFetching, dataUpdatedAt) for
// the SyncIndicator component.
export function useFixtureById(fixtureId: string | undefined) {
  const { data: allMatches, isFetching, dataUpdatedAt } = useFootballMatches();

  const match = useMemo(() => {
    return Array.isArray(allMatches) ? allMatches.find((m) => m.id === fixtureId) : undefined;
  }, [allMatches, fixtureId]);

  return {
    data: match,
    isFetching,
    dataUpdatedAt,
  };
}

// ── NEW: H2H hook ─────────────────────────────────────────────────────────────

// H2H history doesn't change within a single session. Long stale time, no
// refetch interval — the first open fetches it, subsequent opens reuse cache.
export function useFixtureH2H(homeTeamId: string | undefined, awayTeamId: string | undefined) {
  return useQuery<any[]>({
    queryKey: [`/api/football/h2h/${homeTeamId}/${awayTeamId}`],
    staleTime: ST_LONG,
    enabled: !!homeTeamId && !!awayTeamId,
    select: (data: any) => (Array.isArray(data) ? data : []),
    retry: 2,
    retryDelay: 1000,
  });
}

// ── Team stats hook ───────────────────────────────────────────────────────────

export function useTeamStats(teamId: string | undefined) {
  return useQuery<any>({
    queryKey: [`/api/football/team-stats/${teamId}`],
    staleTime: ST_LONG,
    enabled: !!teamId,
    retry: 2,
    retryDelay: 1000,
  });
}

// ── Community picks ───────────────────────────────────────────────────────────

export function useCommunityPicks(matchId: string | undefined) {
  return useQuery<any>({
    queryKey: [`/api/football/community-picks/${matchId}`],
    staleTime: ST_FIXTURES,
    enabled: !!matchId,
    retry: 2,
    retryDelay: 1000,
  });
}

// ── Leaderboard + user hooks ──────────────────────────────────────────────────

export function useLeaderboard(period: "weekly" | "monthly" | "alltime") {
  return useQuery<any[]>({
    queryKey: [`/api/leaderboard?period=${period}`],
    staleTime: 60_000,
    select: (data: any) => (Array.isArray(data) ? data : []),
    retry: 2,
    retryDelay: 1000,
  });
}

export interface UserStats {
  streak: number;
  bestStreak: number;
  weeklyPoints: number;
  totalPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  rank: number;
  resetDays: string;
}

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    staleTime: 30_000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useChaseData(period = "alltime") {
  return useQuery<any>({
    queryKey: [`/api/retention/chase?period=${period}`],
    staleTime: 60_000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useWeeklyWinners() {
  return useQuery<any[]>({
    queryKey: ["/api/retention/weekly-winners"],
    staleTime: 5 * 60_000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useAchievements() {
  return useQuery<any>({
    queryKey: ["/api/retention/achievements"],
    staleTime: 60_000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function usePerformanceInsights() {
  return useQuery<any>({
    queryKey: ["/api/retention/insights"],
    staleTime: 2 * 60_000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDailyPack(favoriteLeagues: string[]) {
  const leagues = favoriteLeagues.join(",");
  return useQuery<any>({
    queryKey: [`/api/retention/daily-pack?leagues=${leagues}`],
    staleTime: 30_000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useEnhancedGroupActivity(groupId: string) {
  return useQuery<any[]>({
    queryKey: [`/api/retention/group-activity/${groupId}`],
    staleTime: 30_000,
    enabled: !!groupId,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useMatchImportance(matchId: string) {
  return useQuery<any>({
    queryKey: [`/api/retention/match-importance/${matchId}`],
    staleTime: 10 * 60_000,
    enabled: !!matchId,
    retry: 2,
    retryDelay: 1000,
  });
}
