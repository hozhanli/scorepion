-- ============================================================
-- Scorepion Migration: Social Engine + Weekly Points + Achievements
-- Run this on your PostgreSQL database before deploying.
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- 1. Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_points   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_points  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_last_week  INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill weekly_points from recent predictions (last 7 days)
UPDATE users u
SET weekly_points = COALESCE((
  SELECT SUM(p.points)::int
  FROM predictions p
  WHERE p.user_id = u.id
    AND p.settled = true
    AND p.timestamp >= EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days') * 1000
), 0);

-- 3. Backfill monthly_points from recent predictions (last 30 days)
UPDATE users u
SET monthly_points = COALESCE((
  SELECT SUM(p.points)::int
  FROM predictions p
  WHERE p.user_id = u.id
    AND p.settled = true
    AND p.timestamp >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days') * 1000
), 0);

-- 4. Recompute global rank for all users
UPDATE users u
SET rank = sub.new_rank
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) AS new_rank
  FROM users
) sub
WHERE u.id = sub.id;

-- 5. Seed rank_last_week from current rank (so delta = 0 until next Monday)
UPDATE users SET rank_last_week = rank WHERE rank_last_week = 0 AND rank > 0;

-- 6. Create group_activity table
CREATE TABLE IF NOT EXISTS group_activity (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    VARCHAR NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL,
  match_id    TEXT,
  points      INTEGER DEFAULT 0,
  metadata    JSONB   DEFAULT '{}',
  created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_group_activity_group_id ON group_activity(group_id);
CREATE INDEX IF NOT EXISTS idx_group_activity_created_at ON group_activity(created_at DESC);

-- 7. Seed group_activity from existing predictions (backfill)
INSERT INTO group_activity (group_id, user_id, type, match_id, points, metadata, created_at)
SELECT
  gm.group_id,
  p.user_id,
  CASE
    WHEN p.settled = true AND p.points >= 10 THEN 'exact_score'
    WHEN p.settled = true AND p.points > 0   THEN 'points_earned'
    ELSE 'prediction'
  END as type,
  p.match_id,
  COALESCE(p.points, 0),
  jsonb_build_object(
    'predicted', CONCAT(p.home_score, '-', p.away_score),
    'points', COALESCE(p.points, 0)
  ),
  p.timestamp
FROM predictions p
JOIN group_members gm ON gm.user_id = p.user_id
WHERE p.timestamp >= EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days') * 1000
ON CONFLICT DO NOTHING;

-- 8. Backfill joined events for existing group members
INSERT INTO group_activity (group_id, user_id, type, metadata, created_at)
SELECT
  gm.group_id,
  gm.user_id,
  'joined',
  '{}',
  gm.joined_at
FROM group_members gm
ON CONFLICT DO NOTHING;

COMMENT ON TABLE group_activity IS 'Social feed events for groups — used to drive the live activity feed';
COMMENT ON COLUMN users.weekly_points  IS 'Points earned this week, reset every Monday by the cron job';
COMMENT ON COLUMN users.monthly_points IS 'Points earned this month, reset on the 1st by the cron job';
COMMENT ON COLUMN users.rank_last_week IS 'Global rank as of last Monday — used to compute rank delta arrows';
