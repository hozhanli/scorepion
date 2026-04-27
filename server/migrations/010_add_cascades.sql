-- Migration 010: Add ON DELETE CASCADE to all foreign keys that are missing it.
-- Safe to run multiple times — uses DO blocks with IF EXISTS guards.
-- Covers: predictions, groups, group_members, daily_packs, boost_picks,
--         achievements, weekly_winners.
-- (group_activity, refresh_tokens, push_tokens already have ON DELETE CASCADE
--  from migrations 001, 005, 007.)

-- Helper: For each FK we drop the old constraint (if it exists) and recreate
-- it with ON DELETE CASCADE. We try both the Drizzle naming convention
-- ({table}_{col}_{ref_table}_{ref_col}_fk) and the PostgreSQL default
-- ({table}_{col}_fkey).

-- 1. predictions.user_id → users.id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'predictions_user_id_users_id_fk'
               AND table_name = 'predictions') THEN
    ALTER TABLE predictions DROP CONSTRAINT predictions_user_id_users_id_fk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'predictions_user_id_fkey'
               AND table_name = 'predictions') THEN
    ALTER TABLE predictions DROP CONSTRAINT predictions_user_id_fkey;
  END IF;
  ALTER TABLE predictions
    ADD CONSTRAINT predictions_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- 2. groups.created_by → users.id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'groups_created_by_users_id_fk'
               AND table_name = 'groups') THEN
    ALTER TABLE groups DROP CONSTRAINT groups_created_by_users_id_fk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'groups_created_by_fkey'
               AND table_name = 'groups') THEN
    ALTER TABLE groups DROP CONSTRAINT groups_created_by_fkey;
  END IF;
  ALTER TABLE groups
    ADD CONSTRAINT groups_created_by_users_id_fk
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- 3. group_members.group_id → groups.id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'group_members_group_id_groups_id_fk'
               AND table_name = 'group_members') THEN
    ALTER TABLE group_members DROP CONSTRAINT group_members_group_id_groups_id_fk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'group_members_group_id_fkey'
               AND table_name = 'group_members') THEN
    ALTER TABLE group_members DROP CONSTRAINT group_members_group_id_fkey;
  END IF;
  ALTER TABLE group_members
    ADD CONSTRAINT group_members_group_id_groups_id_fk
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
END $$;

-- 4. group_members.user_id → users.id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'group_members_user_id_users_id_fk'
               AND table_name = 'group_members') THEN
    ALTER TABLE group_members DROP CONSTRAINT group_members_user_id_users_id_fk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'group_members_user_id_fkey'
               AND table_name = 'group_members') THEN
    ALTER TABLE group_members DROP CONSTRAINT group_members_user_id_fkey;
  END IF;
  ALTER TABLE group_members
    ADD CONSTRAINT group_members_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- 5. daily_packs.user_id → users.id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'daily_packs_user_id_users_id_fk'
               AND table_name = 'daily_packs') THEN
    ALTER TABLE daily_packs DROP CONSTRAINT daily_packs_user_id_users_id_fk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'daily_packs_user_id_fkey'
               AND table_name = 'daily_packs') THEN
    ALTER TABLE daily_packs DROP CONSTRAINT daily_packs_user_id_fkey;
  END IF;
  ALTER TABLE daily_packs
    ADD CONSTRAINT daily_packs_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- 6. boost_picks.user_id → users.id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'boost_picks_user_id_users_id_fk'
               AND table_name = 'boost_picks') THEN
    ALTER TABLE boost_picks DROP CONSTRAINT boost_picks_user_id_users_id_fk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'boost_picks_user_id_fkey'
               AND table_name = 'boost_picks') THEN
    ALTER TABLE boost_picks DROP CONSTRAINT boost_picks_user_id_fkey;
  END IF;
  ALTER TABLE boost_picks
    ADD CONSTRAINT boost_picks_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- 7. achievements.user_id → users.id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'achievements_user_id_users_id_fk'
               AND table_name = 'achievements') THEN
    ALTER TABLE achievements DROP CONSTRAINT achievements_user_id_users_id_fk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'achievements_user_id_fkey'
               AND table_name = 'achievements') THEN
    ALTER TABLE achievements DROP CONSTRAINT achievements_user_id_fkey;
  END IF;
  ALTER TABLE achievements
    ADD CONSTRAINT achievements_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- 8. weekly_winners.user_id → users.id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'weekly_winners_user_id_users_id_fk'
               AND table_name = 'weekly_winners') THEN
    ALTER TABLE weekly_winners DROP CONSTRAINT weekly_winners_user_id_users_id_fk;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'weekly_winners_user_id_fkey'
               AND table_name = 'weekly_winners') THEN
    ALTER TABLE weekly_winners DROP CONSTRAINT weekly_winners_user_id_fkey;
  END IF;
  ALTER TABLE weekly_winners
    ADD CONSTRAINT weekly_winners_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;
