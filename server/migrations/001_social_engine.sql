-- ============================================================
-- Scorepion Migration: Social Engine + Weekly Points + Achievements
-- MySQL version. Safe to run on a fresh database.
-- ============================================================

-- 1. Add new columns to users table (MySQL has no IF NOT EXISTS for ADD COLUMN,
--    but this runs once via the migration runner so it is safe)
ALTER TABLE users ADD COLUMN weekly_points   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN monthly_points  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN rank_last_week  INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill weekly_points from recent predictions (last 7 days)
UPDATE users u
JOIN (
  SELECT p.user_id, COALESCE(CAST(SUM(p.points) AS SIGNED), 0) AS wp
  FROM predictions p
  WHERE p.settled = true
    AND p.timestamp >= FLOOR((UNIX_TIMESTAMP() - 7*24*60*60) * 1000)
  GROUP BY p.user_id
) sub ON sub.user_id = u.id
SET u.weekly_points = sub.wp;

-- 3. Backfill monthly_points from recent predictions (last 30 days)
UPDATE users u
JOIN (
  SELECT p.user_id, COALESCE(CAST(SUM(p.points) AS SIGNED), 0) AS mp
  FROM predictions p
  WHERE p.settled = true
    AND p.timestamp >= FLOOR((UNIX_TIMESTAMP() - 30*24*60*60) * 1000)
  GROUP BY p.user_id
) sub ON sub.user_id = u.id
SET u.monthly_points = sub.mp;

-- 4. Recompute global rank for all users
UPDATE users u
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) AS new_rank
  FROM users
) sub ON u.id = sub.id
SET u.rank = sub.new_rank;

-- 5. Seed rank_last_week from current rank (so delta = 0 until next Monday)
UPDATE users SET rank_last_week = `rank` WHERE rank_last_week = 0 AND `rank` > 0;

-- 6. Create group_activity table
CREATE TABLE IF NOT EXISTS group_activity (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  group_id    VARCHAR(36) NOT NULL,
  user_id     VARCHAR(36) NOT NULL,
  type        VARCHAR(255) NOT NULL,
  match_id    VARCHAR(255),
  points      INTEGER DEFAULT 0,
  metadata    JSON DEFAULT (JSON_OBJECT()),
  created_at  BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000)),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_group_activity_group_id ON group_activity(group_id);
CREATE INDEX idx_group_activity_created_at ON group_activity(created_at DESC);

-- 7. Seed group_activity from existing predictions (backfill)
INSERT IGNORE INTO group_activity (id, group_id, user_id, type, match_id, points, metadata, created_at)
SELECT
  UUID(),
  gm.group_id,
  p.user_id,
  CASE
    WHEN p.settled = true AND p.points >= 10 THEN 'exact_score'
    WHEN p.settled = true AND p.points > 0   THEN 'points_earned'
    ELSE 'prediction'
  END,
  p.match_id,
  COALESCE(p.points, 0),
  JSON_OBJECT(
    'predicted', CONCAT(p.home_score, '-', p.away_score),
    'points', COALESCE(p.points, 0)
  ),
  p.timestamp
FROM predictions p
JOIN group_members gm ON gm.user_id = p.user_id
WHERE p.timestamp >= FLOOR((UNIX_TIMESTAMP() - 7*24*60*60) * 1000);

-- 8. Backfill joined events for existing group members
INSERT IGNORE INTO group_activity (id, group_id, user_id, type, metadata, created_at)
SELECT
  UUID(),
  gm.group_id,
  gm.user_id,
  'joined',
  JSON_OBJECT(),
  gm.joined_at
FROM group_members gm
