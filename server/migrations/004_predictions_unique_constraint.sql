-- Add unique constraint on (user_id, match_id) for predictions table.
-- Required for ON DUPLICATE KEY UPDATE (upsert) in prediction.repository.ts.
CREATE UNIQUE INDEX IF NOT EXISTS predictions_user_match_uniq
  ON predictions (user_id, match_id)
