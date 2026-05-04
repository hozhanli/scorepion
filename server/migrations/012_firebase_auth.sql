-- Migration 012: Firebase Authentication
--
-- Replaces username/password JWT auth with Firebase Authentication.
-- Adds users.email, drops users.password, widens users.id to varchar(128)
-- to fit Firebase UIDs, drops the refresh_tokens table (Firebase manages
-- its own ID/refresh tokens client-side), and widens all dependent
-- user_id FK columns to varchar(128).
--
-- DESTRUCTIVE: deletes all rows from user-related tables. Run only on
-- greenfield deployments where production user data has not yet been seeded.
--
-- Strategy:
--   1. Drop FKs that reference users.id (so users.id can be ALTERed)
--   2. Delete data in dependency order (children → parents)
--      Uses DELETE FROM rather than TRUNCATE because TRUNCATE on a parent
--      with incoming FKs is rejected by InnoDB even when all children are
--      empty. DELETE respects row-level FK checks but passes when children
--      are already empty — and avoids relying on session-scoped
--      FOREIGN_KEY_CHECKS, which is unreliable across pool connections.
--   3. Restructure users (drop password, add email, widen id)
--   4. Widen user_id columns on dependent tables
--   5. Re-add FKs with their original ON DELETE behavior

-- ─── 1. Drop FKs that reference users.id ─────────────────────────────────

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'predictions' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'predictions_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE predictions DROP FOREIGN KEY predictions_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'groups' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'groups_created_by_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE `groups` DROP FOREIGN KEY groups_created_by_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_members' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'group_members_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE group_members DROP FOREIGN KEY group_members_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_packs' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'daily_packs_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE daily_packs DROP FOREIGN KEY daily_packs_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'boost_picks' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'boost_picks_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE boost_picks DROP FOREIGN KEY boost_picks_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'achievements' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'achievements_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE achievements DROP FOREIGN KEY achievements_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'weekly_winners' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'weekly_winners_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE weekly_winners DROP FOREIGN KEY weekly_winners_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_activity' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'group_activity_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE group_activity DROP FOREIGN KEY group_activity_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_log' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'event_log_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE event_log DROP FOREIGN KEY event_log_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'push_tokens' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'push_tokens_user_id_users_id_fk' LIMIT 1);
SET @sql = IF(@fk IS NOT NULL, 'ALTER TABLE push_tokens DROP FOREIGN KEY push_tokens_user_id_users_id_fk', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ─── 2. Drop refresh_tokens (Firebase manages tokens) ────────────────────
DROP TABLE IF EXISTS refresh_tokens;

-- ─── 3. Empty user-related tables in dependency order ────────────────────
-- (children → parents). DELETE FROM works without FOREIGN_KEY_CHECKS magic
-- when children are empty before their parents are deleted.
DELETE FROM predictions;
DELETE FROM group_members;
DELETE FROM group_activity;
DELETE FROM weekly_winners;
DELETE FROM daily_packs;
DELETE FROM boost_picks;
DELETE FROM achievements;
DELETE FROM event_log;
DELETE FROM push_tokens;
DELETE FROM `groups`;
DELETE FROM users;

-- ─── 4. Restructure users table ──────────────────────────────────────────
ALTER TABLE users MODIFY COLUMN id VARCHAR(128) NOT NULL;
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE users DROP COLUMN password;
ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL;
ALTER TABLE users ADD UNIQUE INDEX users_email_unique (email);

-- ─── 5. Widen user_id FK columns on dependent tables ─────────────────────
ALTER TABLE predictions     MODIFY COLUMN user_id    VARCHAR(128) NOT NULL;
ALTER TABLE `groups`        MODIFY COLUMN created_by VARCHAR(128) NOT NULL;
ALTER TABLE group_members   MODIFY COLUMN user_id    VARCHAR(128) NOT NULL;
ALTER TABLE daily_packs     MODIFY COLUMN user_id    VARCHAR(128) NOT NULL;
ALTER TABLE boost_picks     MODIFY COLUMN user_id    VARCHAR(128) NOT NULL;
ALTER TABLE achievements    MODIFY COLUMN user_id    VARCHAR(128) NOT NULL;
ALTER TABLE weekly_winners  MODIFY COLUMN user_id    VARCHAR(128) NOT NULL;
ALTER TABLE group_activity  MODIFY COLUMN user_id    VARCHAR(128) NOT NULL;
ALTER TABLE event_log       MODIFY COLUMN user_id    VARCHAR(128) NULL;
ALTER TABLE push_tokens     MODIFY COLUMN user_id    VARCHAR(128) NOT NULL;

-- ─── 6. Re-add FK constraints (preserving original ON DELETE behavior) ───
ALTER TABLE predictions ADD CONSTRAINT predictions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE `groups` ADD CONSTRAINT groups_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE group_members ADD CONSTRAINT group_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE daily_packs ADD CONSTRAINT daily_packs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE boost_picks ADD CONSTRAINT boost_picks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE achievements ADD CONSTRAINT achievements_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE weekly_winners ADD CONSTRAINT weekly_winners_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE group_activity ADD CONSTRAINT group_activity_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE event_log ADD CONSTRAINT event_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE push_tokens ADD CONSTRAINT push_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
