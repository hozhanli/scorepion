-- ============================================================
-- Scorepion Migration: Performance-Critical Indexes
-- Adds indexes to frequently-queried columns for improved performance.
-- MySQL version. Uses conditional creation via prepared statements.
-- ============================================================

-- Helper: conditionally create an index if it does not already exist.
-- Each block checks information_schema.STATISTICS before creating.

-- Fixtures table indexes for filtering and sorting
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'football_fixtures' AND INDEX_NAME = 'idx_fixtures_league_id');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_fixtures_league_id ON football_fixtures(league_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'football_fixtures' AND INDEX_NAME = 'idx_fixtures_status');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_fixtures_status ON football_fixtures(status)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'football_fixtures' AND INDEX_NAME = 'idx_fixtures_kickoff');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_fixtures_kickoff ON football_fixtures(kickoff)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Predictions table indexes for user/match lookups and settlement status
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'predictions' AND INDEX_NAME = 'idx_predictions_user_id');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_predictions_user_id ON predictions(user_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'predictions' AND INDEX_NAME = 'idx_predictions_match_id');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_predictions_match_id ON predictions(match_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'predictions' AND INDEX_NAME = 'idx_predictions_settled');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_predictions_settled ON predictions(settled)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Standings table composite index for league + season queries
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'football_standings' AND INDEX_NAME = 'idx_standings_league_season');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_standings_league_season ON football_standings(league_id, season)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Group members indexes for group and user lookups
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_members' AND INDEX_NAME = 'idx_group_members_group_id');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_group_members_group_id ON group_members(group_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_members' AND INDEX_NAME = 'idx_group_members_user_id');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_group_members_user_id ON group_members(user_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Users table index for leaderboard/ranking by total points
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_total_points');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_users_total_points ON users(total_points DESC)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Sync log composite index for filtering syncs by type, status, and recent activity
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sync_log' AND INDEX_NAME = 'idx_sync_log_type_status');
SET @sql = IF(@idx = 0, 'CREATE INDEX idx_sync_log_type_status ON sync_log(sync_type, status, synced_at DESC)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt
