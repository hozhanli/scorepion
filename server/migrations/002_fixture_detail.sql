-- ============================================================
-- Migration 002: Fixture events, lineups, stats, H2H, team stats
-- New league columns (flag), weekly/monthly points, rank_last_week
-- Run with: psql $DATABASE_URL -f this_file.sql
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ============================================================

-- 1. New user columns (from migration 001 — add IF NOT EXISTS guards)
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_points   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_points  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_last_week  INTEGER NOT NULL DEFAULT 0;

-- 2. League logo / flag columns
ALTER TABLE football_leagues ADD COLUMN IF NOT EXISTS flag  TEXT DEFAULT '';
ALTER TABLE football_leagues ADD COLUMN IF NOT EXISTS logo  TEXT DEFAULT '';

-- 3. Team color column (some inserts now include color)
ALTER TABLE football_teams ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#333';

-- 4. Fixture events
CREATE TABLE IF NOT EXISTS football_fixture_events (
  id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id    INTEGER NOT NULL,
  team_id       INTEGER NOT NULL,
  player_id     INTEGER,
  player_name   TEXT DEFAULT '',
  assist_id     INTEGER,
  assist_name   TEXT DEFAULT '',
  type          TEXT NOT NULL,
  detail        TEXT DEFAULT '',
  comments      TEXT DEFAULT '',
  elapsed       INTEGER NOT NULL,
  extra_time    INTEGER,
  updated_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS event_fixture_player_elapsed
  ON football_fixture_events(fixture_id, COALESCE(player_id, 0), elapsed, type);
CREATE INDEX IF NOT EXISTS idx_ffe_fixture ON football_fixture_events(fixture_id);

-- 5. Fixture lineups
CREATE TABLE IF NOT EXISTS football_fixture_lineups (
  id             VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id     INTEGER NOT NULL,
  team_id        INTEGER NOT NULL,
  formation      TEXT DEFAULT '',
  player_id      INTEGER NOT NULL,
  player_name    TEXT NOT NULL DEFAULT '',
  player_number  INTEGER,
  player_pos     TEXT DEFAULT '',
  grid           TEXT DEFAULT '',
  is_starting    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at     BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS lineup_fixture_player
  ON football_fixture_lineups(fixture_id, team_id, player_id);
CREATE INDEX IF NOT EXISTS idx_ffl_fixture ON football_fixture_lineups(fixture_id);

-- 6. Fixture match statistics
CREATE TABLE IF NOT EXISTS football_fixture_stats (
  id               VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
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
  updated_at       BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS stats_fixture_team
  ON football_fixture_stats(fixture_id, team_id);

-- 7. Head to head
CREATE TABLE IF NOT EXISTS football_h2h (
  id           VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  team1_id     INTEGER NOT NULL,
  team2_id     INTEGER NOT NULL,
  fixture_id   INTEGER NOT NULL,
  league_id    VARCHAR NOT NULL DEFAULT '',
  home_team_id INTEGER NOT NULL,
  away_team_id INTEGER NOT NULL,
  home_score   INTEGER,
  away_score   INTEGER,
  status       TEXT NOT NULL DEFAULT 'finished',
  kickoff      TEXT NOT NULL,
  season       INTEGER NOT NULL,
  updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS h2h_fixture ON football_h2h(fixture_id);
CREATE INDEX IF NOT EXISTS idx_h2h_teams ON football_h2h(team1_id, team2_id);

-- 8. Team season statistics
CREATE TABLE IF NOT EXISTS football_team_stats (
  id                  VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id             INTEGER NOT NULL,
  league_id           VARCHAR NOT NULL,
  season              INTEGER NOT NULL,
  matches_played      INTEGER DEFAULT 0,
  wins                INTEGER DEFAULT 0,
  draws               INTEGER DEFAULT 0,
  losses              INTEGER DEFAULT 0,
  goals_for           INTEGER DEFAULT 0,
  goals_against       INTEGER DEFAULT 0,
  avg_goals_for       TEXT DEFAULT '0',
  avg_goals_against   TEXT DEFAULT '0',
  clean_sheets        INTEGER DEFAULT 0,
  failed_to_score     INTEGER DEFAULT 0,
  longest_win_streak  INTEGER DEFAULT 0,
  longest_lose_streak INTEGER DEFAULT 0,
  form                TEXT DEFAULT '',
  updated_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS team_stats_league_season
  ON football_team_stats(team_id, league_id, season);

-- 9. Group activity (from migration 001 — re-guard)
CREATE TABLE IF NOT EXISTS group_activity (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    VARCHAR NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     VARCHAR NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  type        TEXT    NOT NULL,
  match_id    TEXT,
  points      INTEGER DEFAULT 0,
  metadata    JSONB   DEFAULT '{}',
  created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_group_activity_group  ON group_activity(group_id);
CREATE INDEX IF NOT EXISTS idx_group_activity_time   ON group_activity(created_at DESC);

-- 10. Recompute global ranks if not done
UPDATE users u
SET rank = sub.new_rank
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) AS new_rank
  FROM users
) sub
WHERE u.id = sub.id AND (u.rank = 0 OR u.rank IS NULL);

COMMENT ON TABLE football_fixture_events  IS 'Goals, cards, substitutions per fixture';
COMMENT ON TABLE football_fixture_lineups IS 'Starting XI + subs per fixture';
COMMENT ON TABLE football_fixture_stats   IS 'Match statistics (possession, shots, etc.) per fixture';
COMMENT ON TABLE football_h2h             IS 'Head-to-head historical results (any two teams)';
COMMENT ON TABLE football_team_stats      IS 'Season statistics per team per league';
