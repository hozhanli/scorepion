-- ============================================================
-- Scorepion Migration: Performance-Critical Indexes
-- Adds indexes to frequently-queried columns for improved performance.
-- MySQL version. Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

-- Fixtures table indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_fixtures_league_id ON football_fixtures(league_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON football_fixtures(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_kickoff ON football_fixtures(kickoff);

-- Predictions table indexes for user/match lookups and settlement status
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_settled ON predictions(settled);

-- Standings table composite index for league + season queries
CREATE INDEX IF NOT EXISTS idx_standings_league_season ON football_standings(league_id, season);

-- Group members indexes for group and user lookups
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Users table index for leaderboard/ranking by total points
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);

-- Sync log composite index for filtering syncs by type, status, and recent activity
CREATE INDEX IF NOT EXISTS idx_sync_log_type_status ON sync_log(sync_type, status, synced_at DESC)
