-- JWT refresh token storage for token rotation.
-- Tokens are stored as SHA-256 hashes (never raw).
-- family_id groups tokens from the same login session for replay detection.

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  TEXT NOT NULL,
  user_id     VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   TEXT NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT false,
  expires_at  BIGINT NOT NULL,
  created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_hash_idx ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON refresh_tokens (family_id);
