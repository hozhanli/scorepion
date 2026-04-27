-- Migration 010: Add ON DELETE CASCADE to all foreign keys that are missing it.
-- MySQL version: fresh setup, so we drop-if-exists then add.
-- Covers: predictions, groups, group_members, daily_packs, boost_picks,
--         achievements, weekly_winners.

-- 1. predictions.user_id -> users.id
-- Drop both possible constraint names then recreate
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'predictions'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME IN ('predictions_user_id_users_id_fk', 'predictions_user_id_fkey')
           LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE predictions DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE predictions
  ADD CONSTRAINT predictions_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. groups.created_by -> users.id
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'groups'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME IN ('groups_created_by_users_id_fk', 'groups_created_by_fkey')
           LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE `groups` DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `groups`
  ADD CONSTRAINT groups_created_by_users_id_fk
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- 3. group_members.group_id -> groups.id
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_members'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME IN ('group_members_group_id_groups_id_fk', 'group_members_group_id_fkey')
           LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE group_members DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE group_members
  ADD CONSTRAINT group_members_group_id_groups_id_fk
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE;

-- 4. group_members.user_id -> users.id
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_members'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME IN ('group_members_user_id_users_id_fk', 'group_members_user_id_fkey')
           LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE group_members DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE group_members
  ADD CONSTRAINT group_members_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. daily_packs.user_id -> users.id
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_packs'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME IN ('daily_packs_user_id_users_id_fk', 'daily_packs_user_id_fkey')
           LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE daily_packs DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE daily_packs
  ADD CONSTRAINT daily_packs_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. boost_picks.user_id -> users.id
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'boost_picks'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME IN ('boost_picks_user_id_users_id_fk', 'boost_picks_user_id_fkey')
           LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE boost_picks DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE boost_picks
  ADD CONSTRAINT boost_picks_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. achievements.user_id -> users.id
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'achievements'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME IN ('achievements_user_id_users_id_fk', 'achievements_user_id_fkey')
           LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE achievements DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE achievements
  ADD CONSTRAINT achievements_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 8. weekly_winners.user_id -> users.id
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'weekly_winners'
             AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND CONSTRAINT_NAME IN ('weekly_winners_user_id_users_id_fk', 'weekly_winners_user_id_fkey')
           LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE weekly_winners DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE weekly_winners
  ADD CONSTRAINT weekly_winners_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
