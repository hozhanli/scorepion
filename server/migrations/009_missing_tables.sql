-- Migration 009: Create tables that were previously only applied via drizzle-kit push
-- Tables: event_log, daily_packs, boost_picks, achievements, weekly_winners

-- event_log
CREATE TABLE IF NOT EXISTS event_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  "timestamp" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- daily_packs
CREATE TABLE IF NOT EXISTS daily_packs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  match_ids JSONB NOT NULL DEFAULT '[]',
  completed_match_ids JSONB NOT NULL DEFAULT '[]',
  boost_match_id TEXT,
  total_picks INTEGER NOT NULL DEFAULT 0,
  completed_picks INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_pack_user_date ON daily_packs(user_id, date);

-- boost_picks
CREATE TABLE IF NOT EXISTS boost_picks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  match_id TEXT NOT NULL,
  date TEXT NOT NULL,
  multiplier INTEGER NOT NULL DEFAULT 2,
  is_upset BOOLEAN NOT NULL DEFAULT FALSE,
  original_points INTEGER DEFAULT 0,
  boosted_points INTEGER DEFAULT 0,
  settled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS boost_user_date ON boost_picks(user_id, date);

-- achievements
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'trophy',
  color TEXT NOT NULL DEFAULT '#FFD700',
  tier TEXT NOT NULL DEFAULT 'bronze',
  season TEXT NOT NULL DEFAULT '2024-25',
  period TEXT,
  metadata JSONB DEFAULT '{}',
  earned_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- weekly_winners
CREATE TABLE IF NOT EXISTS weekly_winners (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  week_start TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'global',
  group_id VARCHAR,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- Indexes on foreign key columns
CREATE INDEX IF NOT EXISTS daily_packs_user_idx ON daily_packs(user_id);
CREATE INDEX IF NOT EXISTS boost_picks_user_idx ON boost_picks(user_id);
CREATE INDEX IF NOT EXISTS achievements_user_idx ON achievements(user_id);
CREATE INDEX IF NOT EXISTS weekly_winners_user_idx ON weekly_winners(user_id);
