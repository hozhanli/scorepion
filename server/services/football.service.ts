import * as footballRepo from "../repositories/football.repository";

export class FootballError extends Error {
  public status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "FootballError";
  }
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface FixtureFilters {
  league?: string;
  status?: string;
  date?: string;
}

// ---------------------------------------------------------------------------
// Service functions — thin delegation with explicit types
// ---------------------------------------------------------------------------

export const getAllLeagues = () => footballRepo.getAllLeagues();

export const getFixtures = (filters: FixtureFilters) =>
  footballRepo.getFixtures(filters);

export const getStandings = (leagueId: string) =>
  footballRepo.getStandings(leagueId);

export const getTopScorers = (leagueId: string) =>
  footballRepo.getTopScorers(leagueId);

export const getTopAssists = (leagueId: string) =>
  footballRepo.getTopAssists(leagueId);

export const getTopYellowCards = (leagueId: string) =>
  footballRepo.getTopYellowCards(leagueId);

export const getTopRedCards = (leagueId: string) =>
  footballRepo.getTopRedCards(leagueId);

export const getInjuries = (leagueId: string) =>
  footballRepo.getInjuries(leagueId);

export const getTransfers = (leagueId: string) =>
  footballRepo.getTransfers(leagueId);

export const getCommunityPicks = (matchId: string) =>
  footballRepo.getCommunityPicks(matchId);

export const getFixtureEvents = (fixtureId: number) =>
  footballRepo.getFixtureEvents(fixtureId);

export const getFixtureLineups = (fixtureId: number) =>
  footballRepo.getFixtureLineups(fixtureId);

export const getFixtureMatchStats = (fixtureId: number) =>
  footballRepo.getFixtureMatchStats(fixtureId);

export const getH2H = (team1Id: number, team2Id: number) =>
  footballRepo.getH2H(team1Id, team2Id);

export async function getTeamStats(teamIdRaw: string | number) {
  const id = typeof teamIdRaw === "number" ? teamIdRaw : parseInt(teamIdRaw, 10);
  if (isNaN(id)) throw new FootballError("Invalid team ID", 400);
  return footballRepo.getTeamStats(id);
}
