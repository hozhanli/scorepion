import { sql } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  int,
  bigint,
  boolean,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }).notNull().default(""),
  totalPoints: int("total_points").notNull().default(0),
  weeklyPoints: int("weekly_points").notNull().default(0),
  monthlyPoints: int("monthly_points").notNull().default(0),
  correctPredictions: int("correct_predictions").notNull().default(0),
  totalPredictions: int("total_predictions").notNull().default(0),
  streak: int("streak").notNull().default(0),
  bestStreak: int("best_streak").notNull().default(0),
  rank: int("rank").notNull().default(0),
  rankLastWeek: int("rank_last_week").notNull().default(0),
  favoriteLeagues: json("favorite_leagues").$type<string[]>().notNull().default([]),
  joinedAt: bigint("joined_at", { mode: "number" })
    .notNull()
    .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  isPremium: boolean("is_premium").notNull().default(false),
});

export const predictions = mysqlTable(
  "predictions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: varchar("match_id", { length: 255 }).notNull(),
    homeScore: int("home_score").notNull(),
    awayScore: int("away_score").notNull(),
    points: int("points").notNull().default(0),
    settled: boolean("settled").default(false),
    timestamp: bigint("timestamp", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    index("predictions_user_idx").on(table.userId),
    uniqueIndex("predictions_user_match_uniq").on(table.userId, table.matchId),
    index("predictions_settled_timestamp_idx").on(table.settled, table.timestamp),
    index("predictions_settled_idx").on(table.settled),
  ],
);

export const groups = mysqlTable("groups", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  isPublic: boolean("is_public").notNull().default(true),
  memberCount: int("member_count").notNull().default(1),
  leagueIds: json("league_ids").$type<string[]>().notNull().default([]),
  createdBy: varchar("created_by", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: bigint("created_at", { mode: "number" })
    .notNull()
    .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
});

export const groupMembers = mysqlTable(
  "group_members",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    groupId: varchar("group_id", { length: 36 })
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: bigint("joined_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    index("group_members_user_idx").on(table.userId),
    index("group_members_group_idx").on(table.groupId),
    uniqueIndex("group_members_group_user_uniq").on(table.groupId, table.userId),
  ],
);

export const footballLeagues = mysqlTable("football_leagues", {
  id: varchar("id", { length: 255 }).primaryKey(),
  apiFootballId: int("api_football_id").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 255 }).notNull(),
  logo: varchar("logo", { length: 500 }).default(""),
  flag: varchar("flag", { length: 500 }).default(""),
  color: varchar("color", { length: 50 }).notNull().default("#333"),
  icon: varchar("icon", { length: 50 }).notNull().default("football"),
  season: int("season").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("League"),
});

export const footballTeams = mysqlTable("football_teams", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  apiFootballId: int("api_football_id").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 255 }).notNull().default(""),
  logo: varchar("logo", { length: 500 }).default(""),
  color: varchar("color", { length: 50 }).notNull().default("#333"),
});

export const footballFixtures = mysqlTable(
  "football_fixtures",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    apiFixtureId: int("api_fixture_id").notNull().unique(),
    leagueId: varchar("league_id", { length: 255 }).notNull(),
    homeTeamId: int("home_team_id").notNull(),
    awayTeamId: int("away_team_id").notNull(),
    homeScore: int("home_score"),
    awayScore: int("away_score"),
    status: varchar("status", { length: 50 }).notNull().default("upcoming"),
    statusShort: varchar("status_short", { length: 50 }).notNull().default("NS"),
    minute: int("minute"),
    kickoff: varchar("kickoff", { length: 255 }).notNull(),
    venue: varchar("venue", { length: 255 }).default(""),
    referee: varchar("referee", { length: 255 }).default(""),
    round: varchar("round", { length: 255 }).default(""),
    season: int("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [index("fixtures_league_idx").on(table.leagueId)],
);

export const footballStandings = mysqlTable(
  "football_standings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    leagueId: varchar("league_id", { length: 255 }).notNull(),
    teamId: int("team_id").notNull(),
    position: int("position").notNull(),
    played: int("played").notNull().default(0),
    won: int("won").notNull().default(0),
    drawn: int("drawn").notNull().default(0),
    lost: int("lost").notNull().default(0),
    goalsFor: int("goals_for").notNull().default(0),
    goalsAgainst: int("goals_against").notNull().default(0),
    goalDifference: int("goal_difference").notNull().default(0),
    points: int("points").notNull().default(0),
    form: varchar("form", { length: 50 }).default(""),
    season: int("season").notNull(),
    group: varchar("group_name", { length: 255 }),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    uniqueIndex("standings_league_team_season").on(table.leagueId, table.teamId, table.season),
  ],
);

export const footballTopScorers = mysqlTable(
  "football_top_scorers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    leagueId: varchar("league_id", { length: 255 }).notNull(),
    playerId: int("player_id").notNull(),
    playerName: varchar("player_name", { length: 255 }).notNull(),
    playerPhoto: varchar("player_photo", { length: 500 }).default(""),
    teamId: int("team_id").notNull(),
    goals: int("goals").notNull().default(0),
    assists: int("assists").notNull().default(0),
    matches: int("matches").notNull().default(0),
    season: int("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    uniqueIndex("scorers_league_player_season").on(table.leagueId, table.playerId, table.season),
  ],
);

export const footballTopAssists = mysqlTable(
  "football_top_assists",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    leagueId: varchar("league_id", { length: 255 }).notNull(),
    playerId: int("player_id").notNull(),
    playerName: varchar("player_name", { length: 255 }).notNull(),
    playerPhoto: varchar("player_photo", { length: 500 }).default(""),
    teamId: int("team_id").notNull(),
    assists: int("assists").notNull().default(0),
    goals: int("goals").notNull().default(0),
    matches: int("matches").notNull().default(0),
    season: int("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    uniqueIndex("assists_league_player_season").on(table.leagueId, table.playerId, table.season),
  ],
);

export const footballTopYellowCards = mysqlTable(
  "football_top_yellow_cards",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    leagueId: varchar("league_id", { length: 255 }).notNull(),
    playerId: int("player_id").notNull(),
    playerName: varchar("player_name", { length: 255 }).notNull(),
    playerPhoto: varchar("player_photo", { length: 500 }).default(""),
    teamId: int("team_id").notNull(),
    yellowCards: int("yellow_cards").notNull().default(0),
    matches: int("matches").notNull().default(0),
    season: int("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    uniqueIndex("yellow_league_player_season").on(table.leagueId, table.playerId, table.season),
  ],
);

export const footballTopRedCards = mysqlTable(
  "football_top_red_cards",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    leagueId: varchar("league_id", { length: 255 }).notNull(),
    playerId: int("player_id").notNull(),
    playerName: varchar("player_name", { length: 255 }).notNull(),
    playerPhoto: varchar("player_photo", { length: 500 }).default(""),
    teamId: int("team_id").notNull(),
    redCards: int("red_cards").notNull().default(0),
    matches: int("matches").notNull().default(0),
    season: int("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    uniqueIndex("red_league_player_season").on(table.leagueId, table.playerId, table.season),
  ],
);

export const footballInjuries = mysqlTable("football_injuries", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  leagueId: varchar("league_id", { length: 255 }).notNull(),
  playerId: int("player_id").notNull(),
  playerName: varchar("player_name", { length: 255 }).notNull(),
  playerPhoto: varchar("player_photo", { length: 500 }).default(""),
  teamId: int("team_id").notNull(),
  type: varchar("type", { length: 50 }).notNull().default(""),
  reason: varchar("reason", { length: 1000 }).notNull().default(""),
  fixtureId: int("fixture_id"),
  fixtureDate: varchar("fixture_date", { length: 255 }).default(""),
  season: int("season").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" })
    .notNull()
    .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
});

export const footballTransfers = mysqlTable("football_transfers", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  leagueId: varchar("league_id", { length: 255 }).notNull(),
  playerId: int("player_id").notNull(),
  playerName: varchar("player_name", { length: 255 }).notNull(),
  playerPhoto: varchar("player_photo", { length: 500 }).default(""),
  teamInId: int("team_in_id"),
  teamInName: varchar("team_in_name", { length: 255 }).default(""),
  teamInLogo: varchar("team_in_logo", { length: 500 }).default(""),
  teamOutId: int("team_out_id"),
  teamOutName: varchar("team_out_name", { length: 255 }).default(""),
  teamOutLogo: varchar("team_out_logo", { length: 500 }).default(""),
  transferDate: varchar("transfer_date", { length: 255 }).default(""),
  transferType: varchar("transfer_type", { length: 50 }).default(""),
  season: int("season").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" })
    .notNull()
    .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
});

export const syncLog = mysqlTable("sync_log", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  syncType: varchar("sync_type", { length: 255 }).notNull(),
  leagueId: varchar("league_id", { length: 255 }),
  requestCount: int("request_count").notNull().default(0),
  status: varchar("status", { length: 50 }).notNull().default("success"),
  error: varchar("error", { length: 1000 }),
  syncedAt: bigint("synced_at", { mode: "number" })
    .notNull()
    .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
});

export const dailyPacks = mysqlTable(
  "daily_packs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 255 }).notNull(),
    matchIds: json("match_ids").$type<string[]>().notNull().default([]),
    completedMatchIds: json("completed_match_ids").$type<string[]>().notNull().default([]),
    boostMatchId: varchar("boost_match_id", { length: 255 }),
    totalPicks: int("total_picks").notNull().default(0),
    completedPicks: int("completed_picks").notNull().default(0),
    isComplete: boolean("is_complete").notNull().default(false),
    pointsEarned: int("points_earned").notNull().default(0),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    uniqueIndex("daily_pack_user_date").on(table.userId, table.date),
    index("daily_packs_date_idx").on(table.date),
  ],
);

export const boostPicks = mysqlTable(
  "boost_picks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: varchar("match_id", { length: 255 }).notNull(),
    date: varchar("date", { length: 255 }).notNull(),
    multiplier: int("multiplier").notNull().default(2),
    isUpset: boolean("is_upset").notNull().default(false),
    originalPoints: int("original_points").notNull().default(0),
    boostedPoints: int("boosted_points").notNull().default(0),
    settled: boolean("settled").notNull().default(false),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    uniqueIndex("boost_user_date").on(table.userId, table.date),
    index("boost_picks_date_idx").on(table.date),
  ],
);

export const achievements = mysqlTable("achievements", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }).notNull().default(""),
  icon: varchar("icon", { length: 50 }).notNull().default("trophy"),
  color: varchar("color", { length: 50 }).notNull().default("#FFD700"),
  tier: varchar("tier", { length: 50 }).notNull().default("bronze"),
  season: varchar("season", { length: 50 }).notNull().default("2024-25"),
  period: varchar("period", { length: 255 }),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  earnedAt: bigint("earned_at", { mode: "number" })
    .notNull()
    .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
});

export const weeklyWinners = mysqlTable("weekly_winners", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weekStart: varchar("week_start", { length: 255 }).notNull(),
  points: int("points").notNull().default(0),
  rank: int("rank").notNull().default(1),
  type: varchar("type", { length: 50 }).notNull().default("global"),
  groupId: varchar("group_id", { length: 36 }).references(() => groups.id, { onDelete: "cascade" }),
  createdAt: bigint("created_at", { mode: "number" })
    .notNull()
    .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
});

export const footballFixtureEvents = mysqlTable(
  "football_fixture_events",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    fixtureId: int("fixture_id").notNull(),
    teamId: int("team_id").notNull(),
    playerId: int("player_id"),
    playerName: varchar("player_name", { length: 255 }).default(""),
    assistId: int("assist_id"),
    assistName: varchar("assist_name", { length: 255 }).default(""),
    type: varchar("type", { length: 50 }).notNull(), // "Goal" | "Card" | "subst" | "Var"
    detail: varchar("detail", { length: 255 }).default(""), // "Normal Goal" | "Yellow Card" etc.
    comments: varchar("comments", { length: 1000 }).default(""),
    elapsed: int("elapsed").notNull(),
    extraTime: int("extra_time"),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (t) => [
    uniqueIndex("event_fixture_player_elapsed").on(t.fixtureId, t.playerId, t.elapsed, t.type),
  ],
);

export const footballFixtureLineups = mysqlTable(
  "football_fixture_lineups",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    fixtureId: int("fixture_id").notNull(),
    teamId: int("team_id").notNull(),
    formation: varchar("formation", { length: 50 }).default(""),
    playerId: int("player_id").notNull(),
    playerName: varchar("player_name", { length: 255 }).notNull().default(""),
    playerNumber: int("player_number"),
    playerPos: varchar("player_pos", { length: 50 }).default(""), // "G" | "D" | "M" | "F"
    grid: varchar("grid", { length: 50 }).default(""), // e.g. "1:1"
    isStarting: boolean("is_starting").notNull().default(true),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (t) => [uniqueIndex("lineup_fixture_player").on(t.fixtureId, t.teamId, t.playerId)],
);

export const footballFixtureStats = mysqlTable(
  "football_fixture_stats",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    fixtureId: int("fixture_id").notNull(),
    teamId: int("team_id").notNull(),
    shotsOnGoal: int("shots_on_goal"),
    shotsTotal: int("shots_total"),
    blockedShots: int("blocked_shots"),
    shotsInsideBox: int("shots_inside_box"),
    shotsOutsideBox: int("shots_outside_box"),
    fouls: int("fouls"),
    cornerKicks: int("corner_kicks"),
    offsides: int("offsides"),
    ballPossession: int("ball_possession"),
    yellowCards: int("yellow_cards"),
    redCards: int("red_cards"),
    goalkeeperSaves: int("goalkeeper_saves"),
    totalPasses: int("total_passes"),
    accuratePasses: int("accurate_passes"),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (t) => [uniqueIndex("stats_fixture_team").on(t.fixtureId, t.teamId)],
);

export const footballH2H = mysqlTable(
  "football_h2h",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    team1Id: int("team1_id").notNull(),
    team2Id: int("team2_id").notNull(),
    fixtureId: int("fixture_id").notNull(),
    leagueId: varchar("league_id", { length: 255 }).notNull().default(""),
    leagueName: varchar("league_name", { length: 255 }).notNull().default(""),
    homeTeamId: int("home_team_id").notNull(),
    awayTeamId: int("away_team_id").notNull(),
    homeScore: int("home_score"),
    awayScore: int("away_score"),
    status: varchar("status", { length: 50 }).notNull().default("finished"),
    kickoff: varchar("kickoff", { length: 255 }).notNull(),
    venue: varchar("venue", { length: 255 }).default(""),
    season: int("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (t) => [uniqueIndex("h2h_fixture").on(t.fixtureId)],
);

export const footballTeamStats = mysqlTable(
  "football_team_stats",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    teamId: int("team_id").notNull(),
    leagueId: varchar("league_id", { length: 255 }).notNull(),
    season: int("season").notNull(),
    matchesPlayed: int("matches_played").default(0),
    wins: int("wins").default(0),
    draws: int("draws").default(0),
    losses: int("losses").default(0),
    goalsFor: int("goals_for").default(0),
    goalsAgainst: int("goals_against").default(0),
    avgGoalsFor: varchar("avg_goals_for", { length: 255 }).default("0"),
    avgGoalsAgainst: varchar("avg_goals_against", { length: 255 }).default("0"),
    cleanSheets: int("clean_sheets").default(0),
    failedToScore: int("failed_to_score").default(0),
    longestWinStreak: int("longest_win_streak").default(0),
    longestLoseStreak: int("longest_lose_streak").default(0),
    form: varchar("form", { length: 50 }).default(""),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (t) => [uniqueIndex("team_stats_league_season").on(t.teamId, t.leagueId, t.season)],
);

export const groupActivity = mysqlTable(
  "group_activity",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    groupId: varchar("group_id", { length: 36 })
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'prediction' | 'exact_score' | 'points_earned' | 'streak' | 'boost_pick' | 'achievement' | 'rank_change' | 'weekly_winner' | 'joined'
    matchId: varchar("match_id", { length: 255 }),
    points: int("points").default(0),
    metadata: json("metadata").$type<Record<string, any>>().default({}),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [index("group_activity_group_created_idx").on(table.groupId, table.createdAt)],
);

export const refreshTokens = mysqlTable(
  "refresh_tokens",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    familyId: varchar("family_id", { length: 255 }).notNull(),
    revoked: boolean("revoked").notNull().default(false),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (t) => [
    uniqueIndex("refresh_tokens_hash_idx").on(t.tokenHash),
    index("refresh_tokens_user_idx").on(t.userId),
    index("refresh_tokens_family_idx").on(t.familyId),
  ],
);

export const eventLog = mysqlTable(
  "event_log",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
    eventType: varchar("event_type", { length: 255 }).notNull(),
    eventData: json("event_data").$type<Record<string, any>>().default({}),
    timestamp: bigint("timestamp", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (table) => [
    index("event_log_user_idx").on(table.userId),
    index("event_log_timestamp_idx").on(table.timestamp),
  ],
);

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const authSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type FootballLeague = typeof footballLeagues.$inferSelect;
export type FootballTeam = typeof footballTeams.$inferSelect;
export type FootballFixture = typeof footballFixtures.$inferSelect;
export type FootballStanding = typeof footballStandings.$inferSelect;
export type FootballTopScorer = typeof footballTopScorers.$inferSelect;
export type FootballTopAssist = typeof footballTopAssists.$inferSelect;
export type FootballTopYellowCard = typeof footballTopYellowCards.$inferSelect;
export type FootballTopRedCard = typeof footballTopRedCards.$inferSelect;
export type FootballInjury = typeof footballInjuries.$inferSelect;
export const pushTokens = mysqlTable(
  "push_tokens",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 50 }), // "ios" | "android" | "web"
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`(FLOOR(UNIX_TIMESTAMP() * 1000))`),
  },
  (t) => [uniqueIndex("push_tokens_user_token_unique").on(t.userId, t.token)],
);

export type FootballTransfer = typeof footballTransfers.$inferSelect;
export type SyncLog = typeof syncLog.$inferSelect;
export type DailyPack = typeof dailyPacks.$inferSelect;
export type BoostPick = typeof boostPicks.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type WeeklyWinner = typeof weeklyWinners.$inferSelect;
export type GroupActivity = typeof groupActivity.$inferSelect;
export type EventLogEntry = typeof eventLog.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type FootballFixtureEvent = typeof footballFixtureEvents.$inferSelect;
export type FootballFixtureLineup = typeof footballFixtureLineups.$inferSelect;
export type FootballFixtureStat = typeof footballFixtureStats.$inferSelect;
export type FootballH2H = typeof footballH2H.$inferSelect;
export type FootballTeamStat = typeof footballTeamStats.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
