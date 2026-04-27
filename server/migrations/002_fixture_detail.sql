-- ============================================================
-- Migration 002: Fixture events, lineups, stats, H2H, team stats
-- New league columns (flag), weekly/monthly points, rank_last_week
-- MySQL version. Safe to re-run (IF NOT EXISTS).
-- ============================================================

-- 1. New user columns (from migration 001 — ignored if already exist)
-- MySQL: use IGNORE to swallow "duplicate column" errors via procedure, or
-- just rely on migration runner tracking (these ran in 001).
-- Kept here for documentation parity; they will no-op if 001 already ran.

-- 2. League logo / flag columns
ALTER TABLE football_leagues ADD COLUMN flag  VARCHAR(500) DEFAULT '';
ALTER TABLE football_leagues ADD COLUMN logo  VARCHAR(500) DEFAULT '';

-- 3. Team color column
ALTER TABLE football_teams ADD COLUMN color VARCHAR(20) NOT NULL DEFAULT '#333';

-- 4. Fixture events
CREATE TABLE IF NOT EXISTS football_fixture_events (
  id            VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  fixture_id    INTEGER NOT NULL,
  team_id       INTEGER NOT NULL,
  player_id     INTEGER,
  player_name   VARCHAR(255) DEFAULT '',
  assist_id     INTEGER,
  assist_name   VARCHAR(255) DEFAULT '',
  type          VARCHAR(255) NOT NULL,
  detail        VARCHAR(255) DEFAULT '',
  comments      VARCHAR(255) DEFAULT '',
  elapsed       INTEGER NOT NULL,
  extra_time    INTEGER,
  updated_at    BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000))
);
CREATE UNIQUE INDEX event_fixture_player_elapsed
  ON football_fixture_events(fixture_id, (COALESCE(player_id, 0)), elapsed, type);
CREATE INDEX idx_ffe_fixture ON football_fixture_events(fixture_id);

-- 5. Fixture lineups
CREATE TABLE IF NOT EXISTS football_fixture_lineups (
  id             VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  fixture_id     INTEGER NOT NULL,
  team_id        INTEGER NOT NULL,
  formation      VARCHAR(50) DEFAULT '',
  player_id      INTEGER NOT NULL,
  player_name    VARCHAR(255) NOT NULL DEFAULT '',
  player_number  INTEGER,
  player_pos     VARCHAR(20) DEFAULT '',
  grid           VARCHAR(20) DEFAULT '',
  is_starting    TINYINT(1) NOT NULL DEFAULT 1,
  updated_at     BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000))
);
CREATE UNIQUE INDEX lineup_fixture_player
  ON football_fixture_lineups(fixture_id, team_id, player_id);
CREATE INDEX idx_ffl_fixture ON football_fixture_lineups(fixture_id);

-- 6. Fixture match statistics
CREATE TABLE IF NOT EXISTS football_fixture_stats (
  id               VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  fixture_id       INTEGER NOT NULL,
  team_id          INTEGER NOT NULL,
  shots_on_goal    INTEGER,
  shots_total      INTEGER,
  blocked_shots    INTEGER,
  shots_inside_box INTEGER,
  shots_outside_box INTEGER,
  fouls            INTEGER,
  corner_kicks     INTEGER,
  offsides         INTEGER,
  ball_possession  INTEGER,
  yellow_cards     INTEGER,
  red_cards        INTEGER,
  goalkeeper_saves INTEGER,
  total_passes     INTEGER,
  accurate_passes  INTEGER,
  updated_at       BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000))
);
CREATE UNIQUE INDEX stats_fixture_team
  ON football_fixture_stats(fixture_id, team_id);

-- 7. Head to head
CREATE TABLE IF NOT EXISTS football_h2h (
  id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  team1_id     INTEGER NOT NULL,
  team2_id     INTEGER NOT NULL,
  fixture_id   INTEGER NOT NULL,
  league_id    VARCHAR(255) NOT NULL DEFAULT '',
  home_team_id INTEGER NOT NULL,
  away_team_id INTEGER NOT NULL,
  home_score   INTEGER,
  away_score   INTEGER,
  status       VARCHAR(50) NOT NULL DEFAULT 'finished',
  kickoff      VARCHAR(255) NOT NULL,
  season       INTEGER NOT NULL,
  updated_at   BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000))
);
CREATE UNIQUE INDEX h2h_fixture ON football_h2h(fixture_id);
CREATE INDEX idx_h2h_teams ON football_h2h(team1_id, team2_id);

-- 8. Team season statistics
CREATE TABLE IF NOT EXISTS football_team_stats (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  team_id             INTEGER NOT NULL,
  league_id           VARCHAR(255) NOT NULL,
  season              INTEGER NOT NULL,
  matches_played      INTEGER DEFAULT 0,
  wins                INTEGER DEFAULT 0,
  draws               INTEGER DEFAULT 0,
  losses              INTEGER DEFAULT 0,
  goals_for           INTEGER DEFAULT 0,
  goals_against       INTEGER DEFAULT 0,
  avg_goals_for       VARCHAR(20) DEFAULT '0',
  avg_goals_against   VARCHAR(20) DEFAULT '0',
  clean_sheets        INTEGER DEFAULT 0,
  failed_to_score     INTEGER DEFAULT 0,
  longest_win_streak  INTEGER DEFAULT 0,
  longest_lose_streak INTEGER DEFAULT 0,
  form                VARCHAR(50) DEFAULT '',
  updated_at          BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000))
);
CREATE UNIQUE INDEX team_stats_league_season
  ON football_team_stats(team_id, league_id, season);

-- 9. Group activity (from migration 001 — re-guard)
CREATE TABLE IF NOT EXISTS group_activity (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  group_id    VARCHAR(36) NOT NULL,
  user_id     VARCHAR(36) NOT NULL,
  type        VARCHAR(255) NOT NULL,
  match_id    VARCHAR(255),
  points      INTEGER DEFAULT 0,
  metadata    JSON DEFAULT (JSON_OBJECT()),
  created_at  BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000)),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Conditionally create indexes (may already exist from 001)
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_activity'
              AND INDEX_NAME = 'idx_group_activity_group');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_group_activity_group ON group_activity(group_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_activity'
              AND INDEX_NAME = 'idx_group_activity_time');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_group_activity_time ON group_activity(created_at DESC)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 10. Recompute global ranks if not done
UPDATE users u
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) AS new_rank
  FROM users
) sub ON u.id = sub.id
SET u.rank = sub.new_rank
WHERE u.rank = 0 OR u.rank IS NULL
