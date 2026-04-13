import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar").notNull().default(""),
  totalPoints: integer("total_points").notNull().default(0),
  weeklyPoints: integer("weekly_points").notNull().default(0),
  monthlyPoints: integer("monthly_points").notNull().default(0),
  correctPredictions: integer("correct_predictions").notNull().default(0),
  totalPredictions: integer("total_predictions").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  rank: integer("rank").notNull().default(0),
  rankLastWeek: integer("rank_last_week").notNull().default(0),
  favoriteLeagues: jsonb("favorite_leagues").$type<string[]>().notNull().default([]),
  joinedAt: bigint("joined_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isPremium: boolean("is_premium").notNull().default(false),
});

export const predictions = pgTable(
  "predictions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    matchId: text("match_id").notNull(),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    points: integer("points").default(0),
    settled: boolean("settled").default(false),
    timestamp: bigint("timestamp", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [
    index("predictions_user_idx").on(table.userId),
    uniqueIndex("predictions_user_match_uniq").on(table.userId, table.matchId),
  ],
);

export const groups = pgTable("groups", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  isPublic: boolean("is_public").notNull().default(true),
  memberCount: integer("member_count").notNull().default(1),
  leagueIds: jsonb("league_ids").$type<string[]>().notNull().default([]),
  createdBy: varchar("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: bigint("created_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

export const groupMembers = pgTable(
  "group_members",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    groupId: varchar("group_id")
      .notNull()
      .references(() => groups.id),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    joinedAt: bigint("joined_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [
    index("group_members_user_idx").on(table.userId),
    index("group_members_group_idx").on(table.groupId),
  ],
);

export const footballLeagues = pgTable("football_leagues", {
  id: varchar("id").primaryKey(),
  apiFootballId: integer("api_football_id").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  logo: text("logo").default(""),
  flag: text("flag").default(""),
  color: text("color").notNull().default("#333"),
  icon: text("icon").notNull().default("football"),
  season: integer("season").notNull(),
  type: text("type").notNull().default("League"),
});

export const footballTeams = pgTable("football_teams", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  apiFootballId: integer("api_football_id").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull().default(""),
  logo: text("logo").default(""),
  color: text("color").notNull().default("#333"),
});

export const footballFixtures = pgTable("football_fixtures", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  apiFixtureId: integer("api_fixture_id").notNull().unique(),
  leagueId: varchar("league_id").notNull(),
  homeTeamId: integer("home_team_id").notNull(),
  awayTeamId: integer("away_team_id").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default("upcoming"),
  statusShort: text("status_short").notNull().default("NS"),
  minute: integer("minute"),
  kickoff: text("kickoff").notNull(),
  venue: text("venue").default(""),
  referee: text("referee").default(""),
  round: text("round").default(""),
  season: integer("season").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

export const footballStandings = pgTable(
  "football_standings",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    leagueId: varchar("league_id").notNull(),
    teamId: integer("team_id").notNull(),
    position: integer("position").notNull(),
    played: integer("played").notNull().default(0),
    won: integer("won").notNull().default(0),
    drawn: integer("drawn").notNull().default(0),
    lost: integer("lost").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    goalDifference: integer("goal_difference").notNull().default(0),
    points: integer("points").notNull().default(0),
    form: text("form").default(""),
    season: integer("season").notNull(),
    group: text("group_name"),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [
    uniqueIndex("standings_league_team_season").on(table.leagueId, table.teamId, table.season),
  ],
);

export const footballTopScorers = pgTable(
  "football_top_scorers",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    leagueId: varchar("league_id").notNull(),
    playerId: integer("player_id").notNull(),
    playerName: text("player_name").notNull(),
    playerPhoto: text("player_photo").default(""),
    teamId: integer("team_id").notNull(),
    goals: integer("goals").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    matches: integer("matches").notNull().default(0),
    season: integer("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [
    uniqueIndex("scorers_league_player_season").on(table.leagueId, table.playerId, table.season),
  ],
);

export const footballTopAssists = pgTable(
  "football_top_assists",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    leagueId: varchar("league_id").notNull(),
    playerId: integer("player_id").notNull(),
    playerName: text("player_name").notNull(),
    playerPhoto: text("player_photo").default(""),
    teamId: integer("team_id").notNull(),
    assists: integer("assists").notNull().default(0),
    goals: integer("goals").notNull().default(0),
    matches: integer("matches").notNull().default(0),
    season: integer("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [
    uniqueIndex("assists_league_player_season").on(table.leagueId, table.playerId, table.season),
  ],
);

export const footballTopYellowCards = pgTable(
  "football_top_yellow_cards",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    leagueId: varchar("league_id").notNull(),
    playerId: integer("player_id").notNull(),
    playerName: text("player_name").notNull(),
    playerPhoto: text("player_photo").default(""),
    teamId: integer("team_id").notNull(),
    yellowCards: integer("yellow_cards").notNull().default(0),
    matches: integer("matches").notNull().default(0),
    season: integer("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [
    uniqueIndex("yellow_league_player_season").on(table.leagueId, table.playerId, table.season),
  ],
);

export const footballTopRedCards = pgTable(
  "football_top_red_cards",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    leagueId: varchar("league_id").notNull(),
    playerId: integer("player_id").notNull(),
    playerName: text("player_name").notNull(),
    playerPhoto: text("player_photo").default(""),
    teamId: integer("team_id").notNull(),
    redCards: integer("red_cards").notNull().default(0),
    matches: integer("matches").notNull().default(0),
    season: integer("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [
    uniqueIndex("red_league_player_season").on(table.leagueId, table.playerId, table.season),
  ],
);

export const footballInjuries = pgTable("football_injuries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull(),
  playerId: integer("player_id").notNull(),
  playerName: text("player_name").notNull(),
  playerPhoto: text("player_photo").default(""),
  teamId: integer("team_id").notNull(),
  type: text("type").notNull().default(""),
  reason: text("reason").notNull().default(""),
  fixtureId: integer("fixture_id"),
  fixtureDate: text("fixture_date").default(""),
  season: integer("season").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

export const footballTransfers = pgTable("football_transfers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").notNull(),
  playerId: integer("player_id").notNull(),
  playerName: text("player_name").notNull(),
  playerPhoto: text("player_photo").default(""),
  teamInId: integer("team_in_id"),
  teamInName: text("team_in_name").default(""),
  teamInLogo: text("team_in_logo").default(""),
  teamOutId: integer("team_out_id"),
  teamOutName: text("team_out_name").default(""),
  teamOutLogo: text("team_out_logo").default(""),
  transferDate: text("transfer_date").default(""),
  transferType: text("transfer_type").default(""),
  season: integer("season").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

export const syncLog = pgTable("sync_log", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  syncType: text("sync_type").notNull(),
  leagueId: varchar("league_id"),
  requestCount: integer("request_count").notNull().default(0),
  status: text("status").notNull().default("success"),
  error: text("error"),
  syncedAt: bigint("synced_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

export const dailyPacks = pgTable(
  "daily_packs",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    date: text("date").notNull(),
    matchIds: jsonb("match_ids").$type<string[]>().notNull().default([]),
    completedMatchIds: jsonb("completed_match_ids").$type<string[]>().notNull().default([]),
    boostMatchId: text("boost_match_id"),
    totalPicks: integer("total_picks").notNull().default(0),
    completedPicks: integer("completed_picks").notNull().default(0),
    isComplete: boolean("is_complete").notNull().default(false),
    pointsEarned: integer("points_earned").notNull().default(0),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [uniqueIndex("daily_pack_user_date").on(table.userId, table.date)],
);

export const boostPicks = pgTable(
  "boost_picks",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    matchId: text("match_id").notNull(),
    date: text("date").notNull(),
    multiplier: integer("multiplier").notNull().default(2),
    isUpset: boolean("is_upset").notNull().default(false),
    originalPoints: integer("original_points").default(0),
    boostedPoints: integer("boosted_points").default(0),
    settled: boolean("settled").notNull().default(false),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (table) => [uniqueIndex("boost_user_date").on(table.userId, table.date)],
);

export const achievements = pgTable("achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("trophy"),
  color: text("color").notNull().default("#FFD700"),
  tier: text("tier").notNull().default("bronze"),
  season: text("season").notNull().default("2024-25"),
  period: text("period"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  earnedAt: bigint("earned_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

export const weeklyWinners = pgTable("weekly_winners", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  weekStart: text("week_start").notNull(),
  points: integer("points").notNull().default(0),
  rank: integer("rank").notNull().default(1),
  type: text("type").notNull().default("global"),
  groupId: varchar("group_id"),
  createdAt: bigint("created_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

export const footballFixtureEvents = pgTable(
  "football_fixture_events",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    fixtureId: integer("fixture_id").notNull(),
    teamId: integer("team_id").notNull(),
    playerId: integer("player_id"),
    playerName: text("player_name").default(""),
    assistId: integer("assist_id"),
    assistName: text("assist_name").default(""),
    type: text("type").notNull(), // "Goal" | "Card" | "subst" | "Var"
    detail: text("detail").default(""), // "Normal Goal" | "Yellow Card" etc.
    comments: text("comments").default(""),
    elapsed: integer("elapsed").notNull(),
    extraTime: integer("extra_time"),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (t) => [
    uniqueIndex("event_fixture_player_elapsed").on(t.fixtureId, t.playerId, t.elapsed, t.type),
  ],
);

export const footballFixtureLineups = pgTable(
  "football_fixture_lineups",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    fixtureId: integer("fixture_id").notNull(),
    teamId: integer("team_id").notNull(),
    formation: text("formation").default(""),
    playerId: integer("player_id").notNull(),
    playerName: text("player_name").notNull().default(""),
    playerNumber: integer("player_number"),
    playerPos: text("player_pos").default(""), // "G" | "D" | "M" | "F"
    grid: text("grid").default(""), // e.g. "1:1"
    isStarting: boolean("is_starting").notNull().default(true),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (t) => [uniqueIndex("lineup_fixture_player").on(t.fixtureId, t.teamId, t.playerId)],
);

export const footballFixtureStats = pgTable(
  "football_fixture_stats",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    fixtureId: integer("fixture_id").notNull(),
    teamId: integer("team_id").notNull(),
    shotsOnGoal: integer("shots_on_goal"),
    shotsTotal: integer("shots_total"),
    blockedShots: integer("blocked_shots"),
    shotsInsideBox: integer("shots_inside_box"),
    shotsOutsideBox: integer("shots_outside_box"),
    fouls: integer("fouls"),
    cornerKicks: integer("corner_kicks"),
    offsides: integer("offsides"),
    ballPossession: integer("ball_possession"),
    yellowCards: integer("yellow_cards"),
    redCards: integer("red_cards"),
    goalkeeperSaves: integer("goalkeeper_saves"),
    totalPasses: integer("total_passes"),
    accuratePasses: integer("accurate_passes"),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (t) => [uniqueIndex("stats_fixture_team").on(t.fixtureId, t.teamId)],
);

export const footballH2H = pgTable(
  "football_h2h",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    team1Id: integer("team1_id").notNull(),
    team2Id: integer("team2_id").notNull(),
    fixtureId: integer("fixture_id").notNull(),
    leagueId: varchar("league_id").notNull().default(""),
    homeTeamId: integer("home_team_id").notNull(),
    awayTeamId: integer("away_team_id").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    status: text("status").notNull().default("finished"),
    kickoff: text("kickoff").notNull(),
    season: integer("season").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (t) => [uniqueIndex("h2h_fixture").on(t.fixtureId)],
);

export const footballTeamStats = pgTable(
  "football_team_stats",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    teamId: integer("team_id").notNull(),
    leagueId: varchar("league_id").notNull(),
    season: integer("season").notNull(),
    matchesPlayed: integer("matches_played").default(0),
    wins: integer("wins").default(0),
    draws: integer("draws").default(0),
    losses: integer("losses").default(0),
    goalsFor: integer("goals_for").default(0),
    goalsAgainst: integer("goals_against").default(0),
    avgGoalsFor: text("avg_goals_for").default("0"),
    avgGoalsAgainst: text("avg_goals_against").default("0"),
    cleanSheets: integer("clean_sheets").default(0),
    failedToScore: integer("failed_to_score").default(0),
    longestWinStreak: integer("longest_win_streak").default(0),
    longestLoseStreak: integer("longest_lose_streak").default(0),
    form: text("form").default(""),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now()) * 1000`),
  },
  (t) => [uniqueIndex("team_stats_league_season").on(t.teamId, t.leagueId, t.season)],
);

export const groupActivity = pgTable("group_activity", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id")
    .notNull()
    .references(() => groups.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // 'prediction' | 'exact_score' | 'points_earned' | 'streak' | 'boost_pick' | 'achievement' | 'rank_change' | 'weekly_winner' | 'joined'
  matchId: text("match_id"),
  points: integer("points").default(0),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: bigint("created_at", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

export const eventLog = pgTable("event_log", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data").$type<Record<string, any>>().default({}),
  timestamp: bigint("timestamp", { mode: "number" })
    .notNull()
    .default(sql`extract(epoch from now()) * 1000`),
});

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
export type FootballTransfer = typeof footballTransfers.$inferSelect;
export type SyncLog = typeof syncLog.$inferSelect;
export type DailyPack = typeof dailyPacks.$inferSelect;
export type BoostPick = typeof boostPicks.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type WeeklyWinner = typeof weeklyWinners.$inferSelect;
export type GroupActivity = typeof groupActivity.$inferSelect;
export type EventLogEntry = typeof eventLog.$inferSelect;
export type FootballFixtureEvent = typeof footballFixtureEvents.$inferSelect;
export type FootballFixtureLineup = typeof footballFixtureLineups.$inferSelect;
export type FootballFixtureStat = typeof footballFixtureStats.$inferSelect;
export type FootballH2H = typeof footballH2H.$inferSelect;
export type FootballTeamStat = typeof footballTeamStats.$inferSelect;
