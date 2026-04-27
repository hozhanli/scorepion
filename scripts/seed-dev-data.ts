/**
 * seed-dev-data.ts — Populates the database with realistic football data for development.
 *
 * Use when the API is unavailable or to test the UI without spending API credits.
 * Run: npx tsx scripts/seed-dev-data.ts
 */

import "dotenv/config";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Make sure your .env file exists.");
  process.exit(1);
}

const pool = mysql.createPool(process.env.DATABASE_URL);

const now = Date.now();
const DAY = 86400000;

// ── Premier League Teams (2024-25) ─────────────────────────────────────────
const PL_TEAMS = [
  { id: 33, name: "Manchester United", short: "MUN", logo: "https://media.api-sports.io/football/teams/33.png" },
  { id: 34, name: "Newcastle United", short: "NEW", logo: "https://media.api-sports.io/football/teams/34.png" },
  { id: 35, name: "Bournemouth", short: "BOU", logo: "https://media.api-sports.io/football/teams/35.png" },
  { id: 36, name: "Fulham", short: "FUL", logo: "https://media.api-sports.io/football/teams/36.png" },
  { id: 39, name: "Wolverhampton", short: "WOL", logo: "https://media.api-sports.io/football/teams/39.png" },
  { id: 40, name: "Liverpool", short: "LIV", logo: "https://media.api-sports.io/football/teams/40.png" },
  { id: 42, name: "Arsenal", short: "ARS", logo: "https://media.api-sports.io/football/teams/42.png" },
  { id: 45, name: "Everton", short: "EVE", logo: "https://media.api-sports.io/football/teams/45.png" },
  { id: 46, name: "Leicester City", short: "LEI", logo: "https://media.api-sports.io/football/teams/46.png" },
  { id: 47, name: "Tottenham Hotspur", short: "TOT", logo: "https://media.api-sports.io/football/teams/47.png" },
  { id: 48, name: "West Ham United", short: "WHU", logo: "https://media.api-sports.io/football/teams/48.png" },
  { id: 49, name: "Chelsea", short: "CHE", logo: "https://media.api-sports.io/football/teams/49.png" },
  { id: 50, name: "Manchester City", short: "MCI", logo: "https://media.api-sports.io/football/teams/50.png" },
  { id: 51, name: "Brighton", short: "BHA", logo: "https://media.api-sports.io/football/teams/51.png" },
  { id: 52, name: "Crystal Palace", short: "CRY", logo: "https://media.api-sports.io/football/teams/52.png" },
  { id: 55, name: "Brentford", short: "BRE", logo: "https://media.api-sports.io/football/teams/55.png" },
  { id: 62, name: "Aston Villa", short: "AVL", logo: "https://media.api-sports.io/football/teams/62.png" },
  { id: 63, name: "Ipswich Town", short: "IPS", logo: "https://media.api-sports.io/football/teams/63.png" },
  { id: 65, name: "Nottingham Forest", short: "NFO", logo: "https://media.api-sports.io/football/teams/65.png" },
  { id: 41, name: "Southampton", short: "SOU", logo: "https://media.api-sports.io/football/teams/41.png" },
];

// ── La Liga Teams ────────────────────────────────────────────────────────────
const LA_TEAMS = [
  { id: 529, name: "Barcelona", short: "BAR", logo: "https://media.api-sports.io/football/teams/529.png" },
  { id: 541, name: "Real Madrid", short: "RMA", logo: "https://media.api-sports.io/football/teams/541.png" },
  { id: 530, name: "Atletico Madrid", short: "ATM", logo: "https://media.api-sports.io/football/teams/530.png" },
  { id: 531, name: "Athletic Bilbao", short: "ATH", logo: "https://media.api-sports.io/football/teams/531.png" },
  { id: 532, name: "Valencia", short: "VAL", logo: "https://media.api-sports.io/football/teams/532.png" },
  { id: 533, name: "Villarreal", short: "VIL", logo: "https://media.api-sports.io/football/teams/533.png" },
  { id: 536, name: "Sevilla", short: "SEV", logo: "https://media.api-sports.io/football/teams/536.png" },
  { id: 543, name: "Real Betis", short: "BET", logo: "https://media.api-sports.io/football/teams/543.png" },
  { id: 548, name: "Real Sociedad", short: "RSO", logo: "https://media.api-sports.io/football/teams/548.png" },
  { id: 540, name: "Espanyol", short: "ESP", logo: "https://media.api-sports.io/football/teams/540.png" },
  { id: 538, name: "Celta Vigo", short: "CEL", logo: "https://media.api-sports.io/football/teams/538.png" },
  { id: 534, name: "Las Palmas", short: "LPA", logo: "https://media.api-sports.io/football/teams/534.png" },
  { id: 542, name: "Getafe", short: "GET", logo: "https://media.api-sports.io/football/teams/542.png" },
  { id: 546, name: "Osasuna", short: "OSA", logo: "https://media.api-sports.io/football/teams/546.png" },
  { id: 539, name: "Leganes", short: "LEG", logo: "https://media.api-sports.io/football/teams/539.png" },
  { id: 535, name: "Mallorca", short: "MLL", logo: "https://media.api-sports.io/football/teams/535.png" },
  { id: 537, name: "Girona", short: "GIR", logo: "https://media.api-sports.io/football/teams/537.png" },
  { id: 544, name: "Rayo Vallecano", short: "RAY", logo: "https://media.api-sports.io/football/teams/544.png" },
  { id: 547, name: "Alaves", short: "ALA", logo: "https://media.api-sports.io/football/teams/547.png" },
  { id: 545, name: "Real Valladolid", short: "VLL", logo: "https://media.api-sports.io/football/teams/545.png" },
];

// ── Serie A Teams ────────────────────────────────────────────────────────────
const SA_TEAMS = [
  { id: 489, name: "AC Milan", short: "MIL", logo: "https://media.api-sports.io/football/teams/489.png" },
  { id: 505, name: "Inter Milan", short: "INT", logo: "https://media.api-sports.io/football/teams/505.png" },
  { id: 496, name: "Juventus", short: "JUV", logo: "https://media.api-sports.io/football/teams/496.png" },
  { id: 492, name: "Napoli", short: "NAP", logo: "https://media.api-sports.io/football/teams/492.png" },
  { id: 497, name: "Roma", short: "ROM", logo: "https://media.api-sports.io/football/teams/497.png" },
  { id: 487, name: "Lazio", short: "LAZ", logo: "https://media.api-sports.io/football/teams/487.png" },
  { id: 499, name: "Atalanta", short: "ATA", logo: "https://media.api-sports.io/football/teams/499.png" },
  { id: 502, name: "Fiorentina", short: "FIO", logo: "https://media.api-sports.io/football/teams/502.png" },
  { id: 500, name: "Bologna", short: "BOL", logo: "https://media.api-sports.io/football/teams/500.png" },
  { id: 503, name: "Torino", short: "TOR", logo: "https://media.api-sports.io/football/teams/503.png" },
  { id: 504, name: "Verona", short: "VER", logo: "https://media.api-sports.io/football/teams/504.png" },
  { id: 488, name: "Sassuolo", short: "SAS", logo: "https://media.api-sports.io/football/teams/488.png" },
  { id: 490, name: "Cagliari", short: "CAG", logo: "https://media.api-sports.io/football/teams/490.png" },
  { id: 494, name: "Udinese", short: "UDI", logo: "https://media.api-sports.io/football/teams/494.png" },
  { id: 495, name: "Genoa", short: "GEN", logo: "https://media.api-sports.io/football/teams/495.png" },
  { id: 498, name: "Sampdoria", short: "SAM", logo: "https://media.api-sports.io/football/teams/498.png" },
  { id: 501, name: "Parma", short: "PAR", logo: "https://media.api-sports.io/football/teams/501.png" },
  { id: 511, name: "Empoli", short: "EMP", logo: "https://media.api-sports.io/football/teams/511.png" },
  { id: 867, name: "Lecce", short: "LEC", logo: "https://media.api-sports.io/football/teams/867.png" },
  { id: 514, name: "Como", short: "COM", logo: "https://media.api-sports.io/football/teams/514.png" },
];

const TOP_SCORERS: Record<string, Array<{playerId: number; name: string; photo: string; teamId: number; goals: number; assists: number; matches: number}>> = {
  pl: [
    { playerId: 1100, name: "Mohamed Salah", photo: "https://media.api-sports.io/football/players/1100.png", teamId: 40, goals: 22, assists: 13, matches: 33 },
    { playerId: 1467, name: "Alexander Isak", photo: "https://media.api-sports.io/football/players/1467.png", teamId: 34, goals: 18, assists: 4, matches: 30 },
    { playerId: 909, name: "Erling Haaland", photo: "https://media.api-sports.io/football/players/909.png", teamId: 50, goals: 17, assists: 3, matches: 28 },
    { playerId: 1460, name: "Bryan Mbeumo", photo: "https://media.api-sports.io/football/players/1460.png", teamId: 55, goals: 16, assists: 7, matches: 32 },
    { playerId: 184, name: "Cole Palmer", photo: "https://media.api-sports.io/football/players/184.png", teamId: 49, goals: 15, assists: 10, matches: 31 },
  ],
  la: [
    { playerId: 154, name: "Robert Lewandowski", photo: "https://media.api-sports.io/football/players/154.png", teamId: 529, goals: 26, assists: 5, matches: 34 },
    { playerId: 1455, name: "Raphinha", photo: "https://media.api-sports.io/football/players/1455.png", teamId: 529, goals: 16, assists: 11, matches: 33 },
    { playerId: 735, name: "Kylian Mbappe", photo: "https://media.api-sports.io/football/players/735.png", teamId: 541, goals: 15, assists: 5, matches: 31 },
    { playerId: 152, name: "Antoine Griezmann", photo: "https://media.api-sports.io/football/players/152.png", teamId: 530, goals: 14, assists: 8, matches: 32 },
    { playerId: 1457, name: "Vinicius Junior", photo: "https://media.api-sports.io/football/players/1457.png", teamId: 541, goals: 13, assists: 9, matches: 30 },
  ],
  sa: [
    { playerId: 301, name: "Marcus Thuram", photo: "https://media.api-sports.io/football/players/301.png", teamId: 505, goals: 16, assists: 6, matches: 31 },
    { playerId: 306, name: "Mateo Retegui", photo: "https://media.api-sports.io/football/players/306.png", teamId: 499, goals: 15, assists: 4, matches: 30 },
    { playerId: 310, name: "Lautaro Martinez", photo: "https://media.api-sports.io/football/players/310.png", teamId: 505, goals: 13, assists: 5, matches: 28 },
    { playerId: 308, name: "Dusan Vlahovic", photo: "https://media.api-sports.io/football/players/308.png", teamId: 496, goals: 12, assists: 3, matches: 30 },
    { playerId: 312, name: "Ademola Lookman", photo: "https://media.api-sports.io/football/players/312.png", teamId: 499, goals: 11, assists: 7, matches: 29 },
  ],
};

function generateStandings(teams: typeof PL_TEAMS, leagueId: string) {
  // Generate realistic standings
  return teams.map((team, i) => {
    const played = 32 + Math.floor(Math.random() * 3);
    const won = Math.max(0, Math.floor((teams.length - i) * 1.5) + Math.floor(Math.random() * 4) - 2);
    const drawn = Math.floor(Math.random() * 8) + 2;
    const lost = played - won - drawn;
    const gf = won * 2 + drawn + Math.floor(Math.random() * 10);
    const ga = lost * 2 + drawn + Math.floor(Math.random() * 8);
    const forms = ["W", "D", "L"];
    const form = Array.from({length: 5}, () => forms[Math.floor(Math.random() * 3)]).join("");

    return {
      leagueId,
      teamId: team.id,
      position: i + 1,
      played,
      won,
      drawn,
      lost,
      goalsFor: gf,
      goalsAgainst: ga,
      goalDifference: gf - ga,
      points: won * 3 + drawn,
      form,
      season: 2024,
    };
  }).sort((a, b) => b.points - a.points).map((s, i) => ({ ...s, position: i + 1 }));
}

function generateFixtures(teams: typeof PL_TEAMS, leagueId: string, startFixtureId: number) {
  const fixtures: any[] = [];
  let fixtureId = startFixtureId;

  // Generate some finished matches (past week)
  for (let dayBack = 7; dayBack >= 1; dayBack--) {
    const matchDay = new Date(now - dayBack * DAY);
    matchDay.setHours(15, 0, 0, 0);

    // 2-3 matches per day
    const matchCount = 2 + Math.floor(Math.random() * 2);
    const shuffled = [...teams].sort(() => Math.random() - 0.5);

    for (let j = 0; j < matchCount && j * 2 + 1 < shuffled.length; j++) {
      const home = shuffled[j * 2];
      const away = shuffled[j * 2 + 1];
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 3);

      fixtures.push({
        apiFixtureId: fixtureId++,
        leagueId,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore,
        awayScore,
        status: "finished",
        statusShort: "FT",
        minute: 90,
        kickoff: matchDay.toISOString(),
        venue: `${home.name} Stadium`,
        referee: "M. Oliver",
        round: `Regular Season - ${30 + dayBack}`,
        season: 2024,
      });
    }
  }

  // Generate upcoming matches (next 2 weeks)
  for (let dayFwd = 0; dayFwd <= 14; dayFwd++) {
    const matchDay = new Date(now + dayFwd * DAY);
    const hours = [12, 15, 17, 20][Math.floor(Math.random() * 4)];
    matchDay.setHours(hours, 0, 0, 0);

    // 2-4 matches per day
    const matchCount = dayFwd === 0 ? 4 : 2 + Math.floor(Math.random() * 2);
    const shuffled = [...teams].sort(() => Math.random() - 0.5);

    for (let j = 0; j < matchCount && j * 2 + 1 < shuffled.length; j++) {
      const home = shuffled[j * 2];
      const away = shuffled[j * 2 + 1];

      fixtures.push({
        apiFixtureId: fixtureId++,
        leagueId,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: null,
        awayScore: null,
        status: "upcoming",
        statusShort: "NS",
        minute: null,
        kickoff: matchDay.toISOString(),
        venue: `${home.name} Stadium`,
        referee: "",
        round: `Regular Season - ${34 + Math.floor(dayFwd / 3)}`,
        season: 2024,
      });
    }
  }

  return fixtures;
}

async function seed() {
  console.log("Starting dev data seed...");

  // Seed leagues (same as sync.ts seedLeagues)
  const leagues = [
    { id: "pl", apiId: 39, name: "Premier League", country: "England", color: "#3D195B", icon: "football", type: "League" },
    { id: "la", apiId: 140, name: "La Liga", country: "Spain", color: "#EE8707", icon: "football-outline", type: "League" },
    { id: "sa", apiId: 135, name: "Serie A", country: "Italy", color: "#024494", icon: "shield", type: "League" },
    { id: "bl", apiId: 78, name: "Bundesliga", country: "Germany", color: "#D20515", icon: "trophy", type: "League" },
    { id: "l1", apiId: 61, name: "Ligue 1", country: "France", color: "#091C3E", icon: "star", type: "League" },
    { id: "tsl", apiId: 203, name: "Süper Lig", country: "Turkey", color: "#E30A17", icon: "flag", type: "League" },
    { id: "ucl", apiId: 2, name: "UEFA Champions League", country: "Europe", color: "#1A237E", icon: "globe", type: "Cup" },
    { id: "uel", apiId: 3, name: "UEFA Europa League", country: "Europe", color: "#F68E1F", icon: "planet", type: "Cup" },
  ];

  for (const l of leagues) {
    await pool.query(`
      INSERT IGNORE INTO football_leagues (id, api_football_id, name, country, logo, flag, color, icon, season, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2024, ?)
    `, [l.id, l.apiId, l.name, l.country,
        `https://media.api-sports.io/football/leagues/${l.apiId}.png`,
        `https://media.api-sports.io/flags/${l.country.toLowerCase()}.svg`,
        l.color, l.icon, l.type]);
  }
  console.log("✓ Leagues seeded");

  // Seed teams
  const allTeams = [...PL_TEAMS, ...LA_TEAMS, ...SA_TEAMS];
  for (const t of allTeams) {
    await pool.query(`
      INSERT IGNORE INTO football_teams (api_football_id, name, short_name, logo, color)
      VALUES (?, ?, ?, ?, '#333')
    `, [t.id, t.name, t.short, t.logo]);
  }
  console.log(`✓ ${allTeams.length} teams seeded`);

  // Seed standings
  const plStandings = generateStandings(PL_TEAMS, "pl");
  const laStandings = generateStandings(LA_TEAMS, "la");
  const saStandings = generateStandings(SA_TEAMS, "sa");

  // Clear old standings
  await pool.query(`DELETE FROM football_standings WHERE league_id IN ('pl','la','sa')`);

  for (const s of [...plStandings, ...laStandings, ...saStandings]) {
    await pool.query(`
      INSERT INTO football_standings (league_id, team_id, position, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, form, season, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [s.leagueId, s.teamId, s.position, s.played, s.won, s.drawn, s.lost, s.goalsFor, s.goalsAgainst, s.goalDifference, s.points, s.form, s.season, now]);
  }
  console.log("✓ Standings seeded");

  // Seed fixtures
  const plFixtures = generateFixtures(PL_TEAMS, "pl", 100000);
  const laFixtures = generateFixtures(LA_TEAMS, "la", 200000);
  const saFixtures = generateFixtures(SA_TEAMS, "sa", 300000);

  for (const f of [...plFixtures, ...laFixtures, ...saFixtures]) {
    await pool.query(`
      INSERT IGNORE INTO football_fixtures (api_fixture_id, league_id, home_team_id, away_team_id, home_score, away_score, status, status_short, minute, kickoff, venue, referee, round, season, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [f.apiFixtureId, f.leagueId, f.homeTeamId, f.awayTeamId, f.homeScore, f.awayScore, f.status, f.statusShort, f.minute, f.kickoff, f.venue, f.referee, f.round, f.season, now]);
  }
  console.log(`✓ ${plFixtures.length + laFixtures.length + saFixtures.length} fixtures seeded`);

  // Seed top scorers
  for (const [leagueId, scorers] of Object.entries(TOP_SCORERS)) {
    await pool.query(`DELETE FROM football_top_scorers WHERE league_id = ?`, [leagueId]);
    for (const s of scorers) {
      await pool.query(`
        INSERT INTO football_top_scorers (league_id, player_id, player_name, player_photo, team_id, goals, assists, matches, season, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2024, ?)
      `, [leagueId, s.playerId, s.name, s.photo, s.teamId, s.goals, s.assists, s.matches, now]);
    }
  }
  console.log("✓ Top scorers seeded");

  // Create system user + league groups
  await pool.query(`
    INSERT INTO users (username, password, avatar)
    VALUES ('scorepion_system', 'SYSTEM_NO_LOGIN', '')
    ON DUPLICATE KEY UPDATE username = 'scorepion_system'
  `);
  const [sysRows] = await pool.query(`SELECT id FROM users WHERE username = 'scorepion_system'`);
  const systemUserId = (sysRows as any[])[0].id;

  const groupInfos = [
    { name: "Premier League Fans", code: "PLFC01", leagueIds: ["pl"] },
    { name: "La Liga Lovers", code: "LALV02", leagueIds: ["la"] },
    { name: "Serie A Squad", code: "SRSQ05", leagueIds: ["sa"] },
  ];

  for (const g of groupInfos) {
    await pool.query(`
      INSERT IGNORE INTO \`groups\` (name, code, is_public, member_count, league_ids, created_by, created_at)
      VALUES (?, ?, true, 0, ?, ?, ?)
    `, [g.name, g.code, JSON.stringify(g.leagueIds), systemUserId, now]);
  }
  console.log("✓ Groups seeded");

  // Seed some fake leaderboard users
  const fakeUsers = [
    { username: "GoalMaster99", points: 385, correct: 42, total: 95, streak: 5, bestStreak: 12 },
    { username: "PredictorKing", points: 312, correct: 36, total: 88, streak: 3, bestStreak: 9 },
    { username: "FutbolGuru", points: 278, correct: 30, total: 82, streak: 0, bestStreak: 7 },
    { username: "ScoreWizard", points: 245, correct: 27, total: 76, streak: 2, bestStreak: 6 },
    { username: "MatchDay_Pro", points: 198, correct: 22, total: 68, streak: 1, bestStreak: 5 },
  ];

  for (let i = 0; i < fakeUsers.length; i++) {
    const u = fakeUsers[i];
    await pool.query(`
      INSERT INTO users (username, password, avatar, total_points, weekly_points, monthly_points, correct_predictions, total_predictions, streak, best_streak, \`rank\`, favorite_leagues)
      VALUES (?, 'FAKE_NO_LOGIN', '', ?, ?, ?, ?, ?, ?, ?, ?, '["pl","la"]')
      ON DUPLICATE KEY UPDATE total_points = VALUES(total_points), \`rank\` = VALUES(\`rank\`)
    `, [u.username, u.points, Math.floor(u.points / 4), Math.floor(u.points / 2), u.correct, u.total, u.streak, u.bestStreak, i + 1]);
  }
  console.log("✓ Leaderboard users seeded");

  // Add sync log entries so the cron knows data was synced
  for (const leagueId of ["pl", "la", "sa"]) {
    for (const syncType of ["fixtures", "standings", "top_scorers"]) {
      await pool.query(`
        INSERT INTO sync_log (sync_type, league_id, request_count, status, synced_at)
        VALUES (?, ?, 1, 'success', ?)
      `, [syncType, leagueId, now]);
    }
  }
  console.log("✓ Sync log entries created");

  console.log("\n✅ Dev data seed complete!");
  console.log(`   - 3 leagues with 20 teams each`);
  console.log(`   - ~${plFixtures.length + laFixtures.length + saFixtures.length} fixtures (past + upcoming)`);
  console.log(`   - Standings for all 3 leagues`);
  console.log(`   - Top scorers for all 3 leagues`);
  console.log(`   - 5 leaderboard users`);
  console.log(`   - 3 public groups`);

  await pool.end();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
