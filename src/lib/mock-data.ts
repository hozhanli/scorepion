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
  kickoff: string;
  minute?: number;
  venue?: string;
  referee?: string;
  stage?: TournamentStage;
  group?: string;
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

const LEAGUES: League[] = [
  // Top 5
  { id: 'pl',  name: 'Premier League',          country: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#3D195B', icon: 'football' },
  { id: 'la',  name: 'La Liga',                 country: 'Spain',       flag: '🇪🇸', color: '#EE8707', icon: 'football-outline' },
  { id: 'sa',  name: 'Serie A',                 country: 'Italy',       flag: '🇮🇹', color: '#024494', icon: 'shield' },
  { id: 'bl',  name: 'Bundesliga',              country: 'Germany',     flag: '🇩🇪', color: '#D20515', icon: 'trophy' },
  { id: 'l1',  name: 'Ligue 1',                 country: 'France',      flag: '🇫🇷', color: '#091C3E', icon: 'star' },
  // Other leagues
  { id: 'tsl', name: 'Süper Lig',               country: 'Turkey',      flag: '🇹🇷', color: '#E30A17', icon: 'flag' },
  { id: 'erd', name: 'Eredivisie',              country: 'Netherlands', flag: '🇳🇱', color: '#F36D21', icon: 'football' },
  { id: 'prl', name: 'Primeira Liga',           country: 'Portugal',    flag: '🇵🇹', color: '#006600', icon: 'football' },
  { id: 'spl', name: 'Scottish Premiership',    country: 'Scotland',    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', color: '#005BAA', icon: 'football' },
  { id: 'mls', name: 'MLS',                     country: 'USA',         flag: '🇺🇸', color: '#002B5C', icon: 'football' },
  // Americas
  { id: 'ligamx',      name: 'Liga MX',          country: 'Mexico',      flag: '🇲🇽', color: '#003D82', icon: 'football' },
  { id: 'brasileirao', name: 'Brasileirão Série A', country: 'Brazil',   flag: '🇧🇷', color: '#FFB81C', icon: 'football' },
  // Africa
  { id: 'egypt-pl',    name: 'Egyptian Premier League', country: 'Egypt', flag: '🇪🇬', color: '#CE1126', icon: 'football' },
  // UEFA
  { id: 'ucl', name: 'UEFA Champions League',   country: 'Europe',      flag: '🇪🇺', color: '#1A237E', icon: 'globe' },
  { id: 'uel', name: 'UEFA Europa League',       country: 'Europe',      flag: '🇪🇺', color: '#F68E1F', icon: 'planet' },
  { id: 'uce', name: 'UEFA Conference League',  country: 'Europe',      flag: '🇪🇺', color: '#2E7D32', icon: 'shield-checkmark' },
  // International
  { id: 'unl', name: 'UEFA Nations League',     country: 'Europe',      flag: '🇪🇺', color: '#0D1B2A', icon: 'globe' },
  { id: 'wc',  name: 'FIFA World Cup',           country: 'World',       flag: '🌍', color: '#8B0000', icon: 'trophy' },
];

const TEAMS: Record<string, Team[]> = {
  pl: [
    { id: 'ars', name: 'Arsenal', shortName: 'ARS', color: '#EF0107' },
    { id: 'che', name: 'Chelsea', shortName: 'CHE', color: '#034694' },
    { id: 'liv', name: 'Liverpool', shortName: 'LIV', color: '#C8102E' },
    { id: 'mci', name: 'Manchester City', shortName: 'MCI', color: '#6CABDD' },
    { id: 'mun', name: 'Manchester United', shortName: 'MUN', color: '#DA291C' },
    { id: 'tot', name: 'Tottenham', shortName: 'TOT', color: '#132257' },
    { id: 'new', name: 'Newcastle', shortName: 'NEW', color: '#241F20' },
    { id: 'avl', name: 'Aston Villa', shortName: 'AVL', color: '#670E36' },
  ],
  la: [
    { id: 'rma', name: 'Real Madrid', shortName: 'RMA', color: '#FEBE10' },
    { id: 'bar', name: 'Barcelona', shortName: 'BAR', color: '#A50044' },
    { id: 'atm', name: 'Atlético Madrid', shortName: 'ATM', color: '#CB3524' },
    { id: 'sev', name: 'Sevilla', shortName: 'SEV', color: '#F43333' },
  ],
  sa: [
    { id: 'juv', name: 'Juventus', shortName: 'JUV', color: '#000000' },
    { id: 'int', name: 'Internazionale', shortName: 'INT', color: '#010E80' },
    { id: 'acm', name: 'AC Milan', shortName: 'ACM', color: '#FB090B' },
    { id: 'nap', name: 'Napoli', shortName: 'NAP', color: '#12A0D7' },
  ],
  bl: [
    { id: 'bay', name: 'FC Bayern München', shortName: 'FCB', color: '#DC052D' },
    { id: 'bvb', name: 'Borussia Dortmund', shortName: 'BVB', color: '#FDE100' },
    { id: 'rbl', name: 'RB Leipzig', shortName: 'RBL', color: '#DD0741' },
    { id: 'lev', name: 'Leverkusen', shortName: 'LEV', color: '#E32221' },
  ],
  l1: [
    { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', color: '#004170' },
    { id: 'oly', name: 'Marseille', shortName: 'OLY', color: '#2FAEE0' },
    { id: 'lyn', name: 'Lyon', shortName: 'LYN', color: '#1D4696' },
    { id: 'mon', name: 'Monaco', shortName: 'MON', color: '#E7242D' },
  ],
  ucl: [
    { id: 'rma', name: 'Real Madrid', shortName: 'RMA', color: '#FEBE10' },
    { id: 'mci', name: 'Manchester City', shortName: 'MCI', color: '#6CABDD' },
    { id: 'bay', name: 'FC Bayern München', shortName: 'FCB', color: '#DC052D' },
    { id: 'bar', name: 'Barcelona', shortName: 'BAR', color: '#A50044' },
    { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', color: '#004170' },
    { id: 'int', name: 'Internazionale', shortName: 'INT', color: '#010E80' },
    { id: 'ars', name: 'Arsenal', shortName: 'ARS', color: '#EF0107' },
    { id: 'bvb', name: 'Borussia Dortmund', shortName: 'BVB', color: '#FDE100' },
    { id: 'atm', name: 'Atlético Madrid', shortName: 'ATM', color: '#CB3524' },
    { id: 'liv', name: 'Liverpool', shortName: 'LIV', color: '#C8102E' },
    { id: 'nap', name: 'Napoli', shortName: 'NAP', color: '#12A0D7' },
    { id: 'lev', name: 'Leverkusen', shortName: 'LEV', color: '#E32221' },
  ],
  uel: [
    { id: 'tot', name: 'Tottenham', shortName: 'TOT', color: '#132257' },
    { id: 'rbl', name: 'RB Leipzig', shortName: 'RBL', color: '#DD0741' },
    { id: 'lyn', name: 'Lyon', shortName: 'LYN', color: '#1D4696' },
    { id: 'sev', name: 'Sevilla', shortName: 'SEV', color: '#F43333' },
    { id: 'avl', name: 'Aston Villa', shortName: 'AVL', color: '#670E36' },
    { id: 'mon', name: 'Monaco', shortName: 'MON', color: '#E7242D' },
    { id: 'acm', name: 'AC Milan', shortName: 'ACM', color: '#FB090B' },
    { id: 'new', name: 'Newcastle', shortName: 'NEW', color: '#241F20' },
  ],
  ligamx: [
    { id: 'ame', name: 'Club América', shortName: 'AME', color: '#FFD700' },
    { id: 'mty', name: 'Monterrey', shortName: 'MTY', color: '#003D82' },
    { id: 'tig', name: 'Tigres UANL', shortName: 'TIG', color: '#FF8C00' },
    { id: 'chv', name: 'Chivas Guadalajara', shortName: 'CHV', color: '#C60C30' },
    { id: 'crz', name: 'Cruz Azul', shortName: 'CRZ', color: '#0066CC' },
    { id: 'pac', name: 'Pachuca', shortName: 'PAC', color: '#002D74' },
  ],
  brasileirao: [
    { id: 'pal', name: 'Palmeiras', shortName: 'PAL', color: '#006437' },
    { id: 'fla', name: 'Flamengo', shortName: 'FLA', color: '#E51B23' },
    { id: 'sao', name: 'São Paulo', shortName: 'SAO', color: '#DC0000' },
    { id: 'cor', name: 'Corinthians', shortName: 'COR', color: '#FFFFFF' },
    { id: 'san', name: 'Santos', shortName: 'SAN', color: '#FFFFFF' },
    { id: 'gre', name: 'Grêmio', shortName: 'GRE', color: '#003366' },
  ],
  'egypt-pl': [
    { id: 'ahl', name: 'Al Ahly', shortName: 'AHL', color: '#C8102E' },
    { id: 'zam', name: 'Zamalek', shortName: 'ZAM', color: '#FFFFFF' },
    { id: 'pyr', name: 'Pyramids FC', shortName: 'PYR', color: '#FDB913' },
    { id: 'ism', name: 'Ismaily', shortName: 'ISM', color: '#003DA5' },
  ],
};

const VENUES: Record<string, string> = {
  ars: 'Emirates Stadium', che: 'Stamford Bridge', liv: 'Anfield', mci: 'Etihad Stadium',
  mun: 'Old Trafford', tot: 'Tottenham Hotspur Stadium', new: "St James' Park", avl: 'Villa Park',
  rma: 'Santiago Bernabeu', bar: 'Camp Nou', atm: 'Civitas Metropolitano', sev: 'Ramon Sanchez-Pizjuan',
  juv: 'Allianz Stadium', int: 'San Siro', acm: 'San Siro', nap: 'Stadio Diego Maradona',
  bay: 'Allianz Arena', bvb: 'Signal Iduna Park', rbl: 'Red Bull Arena', lev: 'BayArena',
  psg: 'Parc des Princes', oly: 'Stade Velodrome', lyn: 'Groupama Stadium', mon: 'Stade Louis II',
};

const REFEREES = [
  'Michael Oliver', 'Anthony Taylor', 'Craig Pawson', 'Stuart Attwell',
  'Simon Hooper', 'Robert Jones', 'David Coote', 'Paul Tierney',
  'Daniele Orsato', 'Felix Zwayer', 'Clement Turpin', 'Slavko Vincic',
];

function generateMatches(): Match[] {
  const matches: Match[] = [];
  const now = new Date();
  const domesticLeagues = ['pl', 'la', 'sa', 'bl', 'l1', 'ligamx', 'brasileirao', 'egypt-pl'];
  let globalIdx = 0;

  domesticLeagues.forEach((leagueId) => {
    const teams = TEAMS[leagueId];
    const league = LEAGUES.find(l => l.id === leagueId)!;
    for (let i = 0; i < teams.length; i += 2) {
      if (!teams[i + 1]) continue;
      const idx = globalIdx++;
      const hour = 12 + (idx % 8);
      const kickoff = new Date(now);
      kickoff.setHours(hour, idx % 2 === 0 ? 0 : 30, 0, 0);

      let status: Match['status'] = 'upcoming';
      let homeScore: number | null = null;
      let awayScore: number | null = null;
      let minute: number | undefined;

      if (idx < 2) {
        status = 'finished';
        homeScore = Math.floor(Math.random() * 4);
        awayScore = Math.floor(Math.random() * 3);
      } else if (idx < 4) {
        status = 'live';
        homeScore = Math.floor(Math.random() * 3);
        awayScore = Math.floor(Math.random() * 3);
        minute = 20 + Math.floor(Math.random() * 60);
      }

      matches.push({
        id: `${teams[i].id}_${teams[i + 1].id}_${leagueId}`,
        league,
        homeTeam: teams[i],
        awayTeam: teams[i + 1],
        homeScore,
        awayScore,
        status,
        kickoff: kickoff.toISOString(),
        minute,
        venue: VENUES[teams[i].id] || 'Stadium',
        referee: REFEREES[idx % REFEREES.length],
      });
    }
  });

  const tournamentLeagues = ['ucl', 'uel'];
  tournamentLeagues.forEach((leagueId) => {
    const teams = TEAMS[leagueId];
    const league = LEAGUES.find(l => l.id === leagueId)!;
    const groups = ['A', 'B', 'C', 'D'];

    groups.forEach((groupName, gi) => {
      const t1 = teams[gi * 2];
      const t2 = teams[gi * 2 + 1];
      if (!t1 || !t2) return;
      const idx = globalIdx++;
      const kickoff = new Date(now);
      kickoff.setHours(20, gi % 2 === 0 ? 0 : 45, 0, 0);
      kickoff.setDate(kickoff.getDate() - 3);

      matches.push({
        id: `${t1.id}_${t2.id}_${leagueId}_gs`,
        league,
        homeTeam: t1,
        awayTeam: t2,
        homeScore: Math.floor(Math.random() * 4),
        awayScore: Math.floor(Math.random() * 3),
        status: 'finished',
        kickoff: kickoff.toISOString(),
        venue: VENUES[t1.id] || 'Stadium',
        referee: REFEREES[idx % REFEREES.length],
        stage: 'Group Stage',
        group: `Group ${groupName}`,
      });
    });

    const knockoutStages: { stage: TournamentStage; teamPairs: [number, number][] }[] = leagueId === 'ucl'
      ? [
          { stage: 'Round of 16', teamPairs: [[0, 5], [2, 7], [4, 3], [6, 1]] },
          { stage: 'Quarter-finals', teamPairs: [[0, 3], [2, 1]] },
          { stage: 'Semi-finals', teamPairs: [[0, 2]] },
        ]
      : [
          { stage: 'Round of 16', teamPairs: [[0, 3], [4, 7]] },
          { stage: 'Quarter-finals', teamPairs: [[0, 7]] },
          { stage: 'Semi-finals', teamPairs: [[4, 3]] },
        ];

    knockoutStages.forEach((ks) => {
      ks.teamPairs.forEach((pair, pi) => {
        const t1 = teams[pair[0]];
        const t2 = teams[pair[1]];
        if (!t1 || !t2) return;
        const idx = globalIdx++;
        const dayOffset = ks.stage === 'Round of 16' ? 7 : ks.stage === 'Quarter-finals' ? 14 : 21;
        const kickoff = new Date(now);
        kickoff.setDate(kickoff.getDate() + dayOffset + pi);
        kickoff.setHours(21, 0, 0, 0);

        let status: Match['status'] = 'upcoming';
        let homeScore: number | null = null;
        let awayScore: number | null = null;
        let minute: number | undefined;

        if (ks.stage === 'Round of 16' && pi === 0) {
          status = 'live';
          homeScore = Math.floor(Math.random() * 3);
          awayScore = Math.floor(Math.random() * 2);
          minute = 35 + Math.floor(Math.random() * 40);
        }

        matches.push({
          id: `${t1.id}_${t2.id}_${leagueId}_${ks.stage.replace(/\s/g, '')}`,
          league,
          homeTeam: t1,
          awayTeam: t2,
          homeScore,
          awayScore,
          status,
          kickoff: kickoff.toISOString(),
          minute,
          venue: VENUES[t1.id] || 'Stadium',
          referee: REFEREES[idx % REFEREES.length],
          stage: ks.stage,
        });
      });
    });

    if (leagueId === 'ucl' && teams.length >= 4) {
      const idx = globalIdx++;
      const kickoff = new Date(now);
      kickoff.setDate(kickoff.getDate() + 35);
      kickoff.setHours(21, 0, 0, 0);
      matches.push({
        id: `${teams[0].id}_${teams[2].id}_${leagueId}_final`,
        league,
        homeTeam: teams[0],
        awayTeam: teams[2],
        homeScore: null,
        awayScore: null,
        status: 'upcoming',
        kickoff: kickoff.toISOString(),
        venue: 'Allianz Arena',
        referee: REFEREES[idx % REFEREES.length],
        stage: 'Final',
      });
    }
  });

  return matches;
}

function generateLeaderboard(): LeaderboardEntry[] {
  const names = [
    'GoalKing99', 'PredictorPro', 'FootyGenius', 'ScoreWizard',
    'MatchMaster', 'BetBrain', 'TacticsTom', 'StrikerSam',
    'GoalMachine', 'PitchPerfect', 'NetFinder', 'TopBins',
    'WinStreak', 'CupHero', 'LeagueBoss', 'DerbyDay',
    'HatTrick', 'CleanSheet', 'GoldenBoot', 'FinalScore',
  ];

  return names.map((name, i) => ({
    rank: i + 1,
    username: name,
    avatar: name.substring(0, 2).toUpperCase(),
    points: 2500 - i * 87 + Math.floor(Math.random() * 40),
    correct: 60 - i * 2 + Math.floor(Math.random() * 5),
    total: 85 + Math.floor(Math.random() * 10),
    streak: Math.max(0, 8 - i + Math.floor(Math.random() * 3)),
    change: Math.floor(Math.random() * 5) - 2,
  }));
}

function generateStandings(leagueId: string): StandingRow[] {
  const teams = TEAMS[leagueId];
  if (!teams) return [];

  const allTeams = [...teams];
  const formOptions: ('W' | 'D' | 'L')[] = ['W', 'D', 'L'];

  return allTeams.map((team, i) => {
    const seed = team.id.charCodeAt(0) + team.id.charCodeAt(1) + i;
    const played = 25 + (seed % 5);
    const won = Math.max(4, Math.floor(played * (0.7 - i * 0.07)) + (seed % 3));
    const drawn = Math.floor(played * 0.15) + (seed % 4);
    const lost = played - won - drawn;
    const goalsFor = won * 2 + drawn + Math.floor(seed % 15) + 10;
    const goalsAgainst = lost * 2 + drawn + Math.floor(seed % 10) + 5;
    const form: ('W' | 'D' | 'L')[] = [];
    for (let j = 0; j < 5; j++) {
      form.push(formOptions[(seed + j * 3) % 3]);
    }

    return {
      position: i + 1,
      team,
      played,
      won: Math.max(0, won),
      drawn: Math.max(0, drawn),
      lost: Math.max(0, lost),
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: Math.max(0, won) * 3 + Math.max(0, drawn),
    form,
    };
  }).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
    .map((row, i) => ({ ...row, position: i + 1 }));
}

const TOP_SCORER_NAMES: Record<string, string[]> = {
  pl: ['Erling Haaland', 'Mohamed Salah', 'Alexander Isak', 'Cole Palmer', 'Ollie Watkins', 'Bryan Mbeumo', 'Nicolas Jackson', 'Dominic Solanke'],
  la: ['Robert Lewandowski', 'Kylian Mbappe', 'Raphinha', 'Antoine Griezmann'],
  sa: ['Marcus Thuram', 'Mateo Retegui', 'Dusan Vlahovic', 'Romelu Lukaku'],
  bl: ['Harry Kane', 'Serhou Guirassy', 'Patrik Schick', 'Florian Wirtz'],
  l1: ['Bradley Barcola', 'Jonathan David', 'Mason Greenwood', 'Folarin Balogun'],
  ligamx: ['Cristiano Ronaldo Jr', 'Santiago Giménez', 'Rogerio', 'Ángel Sepúlveda'],
  brasileirao: ['Neymar', 'Vinicius Jr', 'Gabriel Jesus', 'Rodrygo'],
  'egypt-pl': ['Mohamed Sherif', 'Mohamed Kahraba', 'Mohamed Hany', 'Tarek Hamed'],
  ucl: ['Erling Haaland', 'Kylian Mbappe', 'Harry Kane', 'Raphinha', 'Robert Lewandowski', 'Mohamed Salah'],
  uel: ['Cole Palmer', 'Romelu Lukaku', 'Ollie Watkins', 'Jonathan David'],
};

function generateTopScorers(leagueId: string): TopScorer[] {
  const teams = TEAMS[leagueId];
  const names = TOP_SCORER_NAMES[leagueId];
  if (!teams || !names) return [];

  return names.map((name, i) => {
    const seed = name.charCodeAt(0) + name.charCodeAt(2);
    return {
      rank: i + 1,
      playerName: name,
      team: teams[i % teams.length],
      goals: Math.max(3, 22 - i * 3 + (seed % 4)),
      assists: Math.max(0, 8 - i + (seed % 5)),
      matches: 24 + (seed % 6),
    };
  }).sort((a, b) => b.goals - a.goals)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

function generateH2H(homeTeam: Team, awayTeam: Team): H2HMatch[] {
  const results: H2HMatch[] = [];
  const now = new Date();
  const competitions = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Champions League', 'League Cup'];

  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (30 + i * 65));
    const seed = homeTeam.id.charCodeAt(0) + awayTeam.id.charCodeAt(0) + i * 7;
    const isHomeFirst = i % 2 === 0;

    results.push({
      date: date.toISOString(),
      homeTeam: isHomeFirst ? homeTeam : awayTeam,
      awayTeam: isHomeFirst ? awayTeam : homeTeam,
      homeScore: (seed + i) % 4,
      awayScore: (seed + i + 2) % 3,
      competition: competitions[i % competitions.length],
    });
  }

  return results;
}

const DERBY_PAIRS: Record<string, string[]> = {
  ars: ['tot', 'che'],
  che: ['ars', 'tot'],
  tot: ['ars', 'che'],
  liv: ['mun'],
  mun: ['liv', 'mci'],
  mci: ['mun'],
  rma: ['bar', 'atm'],
  bar: ['rma'],
  atm: ['rma'],
  int: ['acm'],
  acm: ['int'],
  bay: ['bvb'],
  bvb: ['bay'],
  psg: ['oly', 'lyn'],
  oly: ['psg'],
};

function assignMatchImportance(match: Match): Match {
  const tags: MatchTag[] = [];
  let importance: MatchImportance = 'low';

  const homeId = match.homeTeam.id;
  const awayId = match.awayTeam.id;
  const isDerby = DERBY_PAIRS[homeId]?.includes(awayId) || DERBY_PAIRS[awayId]?.includes(homeId);

  if (isDerby) {
    tags.push('Derby');
    importance = 'high';
  }

  if (match.stage === 'Final') {
    tags.push('Final');
    importance = 'critical';
  } else if (match.stage === 'Semi-finals' || match.stage === 'Quarter-finals') {
    tags.push('Knockout');
    importance = importance === 'high' ? 'critical' : 'high';
  } else if (match.stage === 'Round of 16') {
    tags.push('Knockout');
    if (importance === 'low') importance = 'medium';
  }

  const bigTeams = ['rma', 'bar', 'bay', 'mci', 'liv', 'ars', 'psg'];
  const bothBig = bigTeams.includes(homeId) && bigTeams.includes(awayId);
  if (bothBig && !isDerby) {
    tags.push('Big Match');
    importance = importance === 'low' ? 'high' : importance;
  }

  if (tags.length === 0) {
    const seed = homeId.charCodeAt(0) + awayId.charCodeAt(0);
    if (seed % 5 === 0) {
      tags.push('Upset Alert');
      importance = 'medium';
    } else if (seed % 3 === 0) {
      tags.push('Top 4');
      importance = 'medium';
    }
  }

  if (importance === 'low' && match.league.id === 'ucl') {
    importance = 'medium';
  }

  return { ...match, importance, tags: tags.length > 0 ? tags : undefined };
}

function generateSocialProof(matchId: string): SocialProof {
  const seed = matchId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const scores = ['1-0', '2-1', '1-1', '0-0', '2-0', '3-1', '1-2', '0-1'];
  const picks = scores.slice(0, 4).map((score, i) => ({
    score,
    percent: Math.max(5, 35 - i * 8 + (seed + i * 13) % 10),
  }));
  const total = picks.reduce((s, p) => s + p.percent, 0);
  picks.forEach(p => { p.percent = Math.round((p.percent / total) * 100); });

  return {
    mostPickedScore: picks[0].score,
    mostPickedPercent: picks[0].percent,
    totalPredictions: 120 + (seed % 300),
    communityPicks: picks,
  };
}

function generateDailyPicks(matches: Match[], favoriteLeagues: string[]): Match[] {
  const upcoming = matches.filter(m => m.status === 'upcoming' || m.status === 'live');

  const scored = upcoming.map(m => {
    let score = 0;
    const imp = m.importance;
    if (imp === 'critical') score += 100;
    else if (imp === 'high') score += 70;
    else if (imp === 'medium') score += 40;
    else score += 10;

    if (favoriteLeagues.includes(m.league.id)) score += 50;
    if (m.stage) score += 20;
    if (m.status === 'live') score += 30;

    const timeSeed = new Date(m.kickoff).getHours();
    score += (timeSeed % 5) * 3;

    return { match: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.min(6, scored.length)).map(s => s.match);
}

export const MOCK_MATCHES = generateMatches().map(assignMatchImportance);
export const MOCK_LEADERBOARD = generateLeaderboard();
export { generateSocialProof, generateDailyPicks };

export function getStandings(leagueId: string): StandingRow[] {
  return generateStandings(leagueId);
}

export function getTopScorers(leagueId: string): TopScorer[] {
  return generateTopScorers(leagueId);
}

/** @deprecated Use useFixtureH2H hook — data now served from DB */
export function getH2H(homeTeam: Team, awayTeam: Team): H2HMatch[] {
  return generateH2H(homeTeam, awayTeam);
}

export function getLeagueById(id: string): League | undefined {
  return LEAGUES.find(l => l.id === id);
}

export function getTeamsForLeague(leagueId: string): Team[] {
  return TEAMS[leagueId] || [];
}

export { LEAGUES, TEAMS };
