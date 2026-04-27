-- Add unique constraint on (user_id, match_id) for predictions table.
-- Required for ON DUPLICATE KEY UPDATE (upsert) in prediction.repository.ts.
SET @idx = (SELECT COUNT(1) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'predictions'
              AND INDEX_NAME = 'predictions_user_match_uniq');
SET @sql = IF(@idx = 0, 'CREATE UNIQUE INDEX predictions_user_match_uniq ON predictions (user_id, match_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt
