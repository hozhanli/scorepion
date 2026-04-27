-- JWT refresh token storage for token rotation.
-- Tokens are stored as SHA-256 hashes (never raw).
-- family_id groups tokens from the same login session for replay detection.

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  token_hash  VARCHAR(255) NOT NULL,
  user_id     VARCHAR(36) NOT NULL,
  family_id   VARCHAR(255) NOT NULL,
  revoked     TINYINT(1) NOT NULL DEFAULT 0,
  expires_at  BIGINT NOT NULL,
  created_at  BIGINT NOT NULL DEFAULT (FLOOR(UNIX_TIMESTAMP() * 1000)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX refresh_tokens_hash_idx ON refresh_tokens (token_hash);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id)
