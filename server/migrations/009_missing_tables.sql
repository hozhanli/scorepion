-- Migration 009: Create tables that were previously only applied via drizzle-kit push
-- Tables: event_log, daily_packs, boost_picks, achievements, weekly_winners

-- event_log
CREATE TABLE IF NOT EXISTS event_log (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36),
  event_type VARCHAR(255) NOT NULL,
  event_data JSON DEFAULT (JSON_OBJECT()),
  `timestamp` BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000))
);

-- daily_packs
CREATE TABLE IF NOT EXISTS daily_packs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  date VARCHAR(20) NOT NULL,
  match_ids JSON NOT NULL DEFAULT (JSON_ARRAY()),
  completed_match_ids JSON NOT NULL DEFAULT (JSON_ARRAY()),
  boost_match_id VARCHAR(255),
  total_picks INTEGER NOT NULL DEFAULT 0,
  completed_picks INTEGER NOT NULL DEFAULT 0,
  is_complete TINYINT(1) NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX daily_pack_user_date ON daily_packs(user_id, date);

-- boost_picks
CREATE TABLE IF NOT EXISTS boost_picks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  match_id VARCHAR(255) NOT NULL,
  date VARCHAR(20) NOT NULL,
  multiplier INTEGER NOT NULL DEFAULT 2,
  is_upset TINYINT(1) NOT NULL DEFAULT 0,
  original_points INTEGER DEFAULT 0,
  boosted_points INTEGER DEFAULT 0,
  settled TINYINT(1) NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX boost_user_date ON boost_picks(user_id, date);

-- achievements
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'trophy',
  color VARCHAR(20) NOT NULL DEFAULT '#FFD700',
  tier VARCHAR(20) NOT NULL DEFAULT 'bronze',
  season VARCHAR(20) NOT NULL DEFAULT '2024-25',
  period VARCHAR(50),
  metadata JSON DEFAULT (JSON_OBJECT()),
  earned_at BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- weekly_winners
CREATE TABLE IF NOT EXISTS weekly_winners (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  week_start VARCHAR(20) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  `rank` INTEGER NOT NULL DEFAULT 1,
  type VARCHAR(50) NOT NULL DEFAULT 'global',
  group_id VARCHAR(36),
  created_at BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes on foreign key columns
CREATE INDEX daily_packs_user_idx ON daily_packs(user_id);
CREATE INDEX boost_picks_user_idx ON boost_picks(user_id);
CREATE INDEX achievements_user_idx ON achievements(user_id);
CREATE INDEX weekly_winners_user_idx ON weekly_winners(user_id)
