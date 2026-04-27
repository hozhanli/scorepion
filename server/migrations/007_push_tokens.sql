CREATE TABLE IF NOT EXISTS push_tokens (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  platform VARCHAR(50),
  created_at BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX push_tokens_user_token_unique ON push_tokens(user_id, token)
