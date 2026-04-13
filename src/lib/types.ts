export interface League {
    id: string;
    name: string;
    country: string;
    flag: string;
    color: string;
    icon: string;
    logo?: string;
}

export interface Team {
    id: string;
    name: string;
    shortName: string;
    color: string;
    logo?: string;
}

export type TournamentStage = 'Group Stage' | 'Round of 16' | 'Quarter-finals' | 'Semi-finals' | 'Final';

export type MatchImportance = 'low' | 'medium' | 'high' | 'critical';
export type MatchTag = 'Derby' | 'Top 4' | 'Relegation' | 'Upset Alert' | 'Final' | 'Knockout' | 'Big Match' | 'Title Race';

export interface Match {
    id: string;
    league: League;
    homeTeam: Team;
    awayTeam: Team;
    homeScore: number | null;
    awayScore: number | null;
    status: 'upcoming' | 'live' | 'finished';
    statusShort?: string;
    kickoff: string;
    minute?: number;
    venue?: string;
    referee?: string;
    stage?: TournamentStage;
    group?: string;
    round?: string;
    season?: number | string;
    importance?: MatchImportance;
    tags?: MatchTag[];
}

export interface SocialProof {
    mostPickedScore: string;
    mostPickedPercent: number;
    totalPredictions: number;
    communityPicks: { score: string; percent: number }[];
}

export interface LeaderboardEntry {
    rank: number;
    username: string;
    avatar: string;
    points: number;
    correct: number;
    total: number;
    streak: number;
    change: number;
}

export interface StandingRow {
    position: number;
    team: Team;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    form: ('W' | 'D' | 'L')[];
    group?: string | number;
}

export interface TopScorer {
    rank: number;
    playerName: string;
    playerPhoto?: string;
    team: Team;
    goals: number;
    assists: number;
    matches: number;
}

export interface H2HMatch {
    date: string;
    homeTeam: Team;
    awayTeam: Team;
    homeScore: number;
    awayScore: number;
    competition: string;
}
