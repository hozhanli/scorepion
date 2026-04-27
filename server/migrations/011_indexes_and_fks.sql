-- Migration 011: Add missing foreign keys, indexes, and fix push_tokens timestamp type.
-- Safe to run multiple times — uses DO blocks and IF NOT EXISTS guards.

-- ============================================================
-- 1. FK: weekly_winners.group_id → groups.id ON DELETE CASCADE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'weekly_winners_group_id_groups_id_fk'
      AND table_name = 'weekly_winners'
  ) THEN
    ALTER TABLE weekly_winners
      ADD CONSTRAINT weekly_winners_group_id_groups_id_fk
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 2. FK: event_log.user_id → users.id ON DELETE SET NULL
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'event_log_user_id_users_id_fk'
      AND table_name = 'event_log'
  ) THEN
    ALTER TABLE event_log
      ADD CONSTRAINT event_log_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 3. Alter push_tokens.created_at from TIMESTAMP to BIGINT
--    Convert existing data: EXTRACT(EPOCH FROM created_at) * 1000
-- ============================================================
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'push_tokens' AND column_name = 'created_at';

  -- Only migrate if column is still a timestamp type
  IF col_type IS NOT NULL AND col_type LIKE 'timestamp%' THEN
    -- Add a temporary column
    ALTER TABLE push_tokens ADD COLUMN created_at_new BIGINT;

    -- Migrate existing data
    UPDATE push_tokens
    SET created_at_new = EXTRACT(EPOCH FROM created_at) * 1000;

    -- Drop old column and rename new one
    ALTER TABLE push_tokens DROP COLUMN created_at;
    ALTER TABLE push_tokens RENAME COLUMN created_at_new TO created_at;

    -- Set default and NOT NULL
    ALTER TABLE push_tokens
      ALTER COLUMN created_at SET DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000);
    ALTER TABLE push_tokens
      ALTER COLUMN created_at SET NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 4. Missing indexes
-- ============================================================

-- event_log: index on user_id
CREATE INDEX IF NOT EXISTS event_log_user_idx
  ON event_log (user_id);

-- event_log: index on timestamp DESC
CREATE INDEX IF NOT EXISTS event_log_timestamp_idx
  ON event_log (timestamp DESC);

-- daily_packs: index on date DESC
CREATE INDEX IF NOT EXISTS daily_packs_date_idx
  ON daily_packs (date DESC);

-- boost_picks: index on date DESC
CREATE INDEX IF NOT EXISTS boost_picks_date_idx
  ON boost_picks (date DESC);

-- predictions: composite index on (settled, timestamp)
CREATE INDEX IF NOT EXISTS predictions_settled_timestamp_idx
  ON predictions (settled, timestamp);

-- group_activity: composite index on (group_id, created_at DESC)
CREATE INDEX IF NOT EXISTS group_activity_group_created_idx
  ON group_activity (group_id, created_at DESC);

-- ============================================================
-- 5. Unique constraint on group_members(group_id, user_id)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'group_members'
      AND indexname = 'group_members_group_user_uniq'
  ) THEN
    CREATE UNIQUE INDEX group_members_group_user_uniq
      ON group_members (group_id, user_id);
  END IF;
END $$;
