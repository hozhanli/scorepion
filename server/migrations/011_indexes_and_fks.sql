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
-- 4. Missing indexes
-- ============================================================

-- event_log: index on user_id
CREATE INDEX IF NOT EXISTS event_log_user_idx
  ON event_log (user_id);

-- event_log: index on timestamp DESC
CREATE INDEX IF NOT EXISTS event_log_timestamp_idx
  ON event_log (`timestamp` DESC);

-- daily_packs: index on date DESC
CREATE INDEX IF NOT EXISTS daily_packs_date_idx
  ON daily_packs (date DESC);

-- boost_picks: index on date DESC
CREATE INDEX IF NOT EXISTS boost_picks_date_idx
  ON boost_picks (date DESC);

-- predictions: composite index on (settled, timestamp)
CREATE INDEX IF NOT EXISTS predictions_settled_timestamp_idx
  ON predictions (settled, `timestamp`);

-- group_activity: composite index on (group_id, created_at DESC)
CREATE INDEX IF NOT EXISTS group_activity_group_created_idx
  ON group_activity (group_id, created_at DESC);

-- ============================================================
-- 5. Unique constraint on group_members(group_id, user_id)
-- ============================================================
-- MySQL 8.0.29+ supports CREATE UNIQUE INDEX IF NOT EXISTS
CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_user_uniq
  ON group_members (group_id, user_id)
