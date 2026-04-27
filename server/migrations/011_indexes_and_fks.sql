-- Migration 011: Add missing foreign keys, indexes, and fix push_tokens timestamp type.
-- MySQL version. Fresh setup — no conditional PL/pgSQL blocks needed.

-- ============================================================
-- 1. FK: weekly_winners.group_id -> groups.id ON DELETE CASCADE
-- ============================================================
-- Check if constraint already exists before adding
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'weekly_winners'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME = 'weekly_winners_group_id_groups_id_fk'
           LIMIT 1);
SET @sql = IF(@fk IS NULL,
  'ALTER TABLE weekly_winners ADD CONSTRAINT weekly_winners_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. FK: event_log.user_id -> users.id ON DELETE SET NULL
-- ============================================================
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_log'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME = 'event_log_user_id_users_id_fk'
           LIMIT 1);
SET @sql = IF(@fk IS NULL,
  'ALTER TABLE event_log ADD CONSTRAINT event_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. push_tokens.created_at is already BIGINT in MySQL migration 007
--    (no conversion needed — push_tokens.created_at is already BIGINT)
-- ============================================================

-- ============================================================
-- 4. Missing indexes (conditional creation for MySQL compatibility)
-- ============================================================

-- event_log: index on user_id
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_log' AND INDEX_NAME = 'event_log_user_idx');
SET @sql = IF(@idx = 0, 'CREATE INDEX event_log_user_idx ON event_log (user_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- event_log: index on timestamp DESC
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_log' AND INDEX_NAME = 'event_log_timestamp_idx');
SET @sql = IF(@idx = 0, 'CREATE INDEX event_log_timestamp_idx ON event_log (`timestamp` DESC)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- daily_packs: index on date DESC
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_packs' AND INDEX_NAME = 'daily_packs_date_idx');
SET @sql = IF(@idx = 0, 'CREATE INDEX daily_packs_date_idx ON daily_packs (date DESC)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- boost_picks: index on date DESC
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'boost_picks' AND INDEX_NAME = 'boost_picks_date_idx');
SET @sql = IF(@idx = 0, 'CREATE INDEX boost_picks_date_idx ON boost_picks (date DESC)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- predictions: composite index on (settled, timestamp)
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'predictions' AND INDEX_NAME = 'predictions_settled_timestamp_idx');
SET @sql = IF(@idx = 0, 'CREATE INDEX predictions_settled_timestamp_idx ON predictions (settled, `timestamp`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- group_activity: composite index on (group_id, created_at DESC)
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_activity' AND INDEX_NAME = 'group_activity_group_created_idx');
SET @sql = IF(@idx = 0, 'CREATE INDEX group_activity_group_created_idx ON group_activity (group_id, created_at DESC)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 5. Unique constraint on group_members(group_id, user_id)
-- ============================================================
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_members' AND INDEX_NAME = 'group_members_group_user_uniq');
SET @sql = IF(@idx = 0, 'CREATE UNIQUE INDEX group_members_group_user_uniq ON group_members (group_id, user_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt
