/**
 * JWT Token Service — jose-based access + refresh token management.
 *
 * Architecture:
 *   - Access tokens:  short-lived JWTs (30 min), signed with HS256, stateless verification.
 *   - Refresh tokens: long-lived (30 days), stored in DB, single-use with rotation.
 *   - On each refresh, the old token is revoked and a new pair is issued.
 *   - Token families: if a revoked refresh token is reused (replay attack),
 *     the entire family is invalidated, forcing re-login.
 *
 * Best practices followed:
 *   - Asymmetric-ready (swap to RS256 by changing key generation)
 *   - Refresh token rotation prevents token theft from going undetected
 *   - Family-based revocation catches replay attacks
 *   - Constant-time token lookup via SHA-256 hash (never store raw tokens)
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { randomBytes, createHash, randomUUID } from "crypto";
import { pool } from "../db";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_EXPIRY = "30m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_TOKEN_BYTES = 48; // 384-bit entropy

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  if (!secret) {
    console.warn("[Token] No JWT_SECRET set — using fallback (tokens will not survive restarts)");
    // Deterministic fallback for dev so tokens survive hot-reloads
    return new TextEncoder().encode("dev-only-jwt-secret-do-not-use-in-prod");
  }
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Access Token
// ---------------------------------------------------------------------------

export interface AccessTokenPayload extends JWTPayload {
  sub: string; // userId
  username: string;
}

export async function signAccessToken(userId: string, username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(randomUUID()) // unique ID per token — prevents identical JWTs on rapid re-issue
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer("scorepion")
    .setAudience("scorepion-app")
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    issuer: "scorepion",
    audience: "scorepion-app",
  });
  return payload as AccessTokenPayload;
}

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

/** Hash a raw refresh token for DB storage (never store raw). */
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Generate a cryptographically random refresh token.
 * Returns both the raw token (sent to client) and its hash (stored in DB).
 */
function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

/**
 * Create a new refresh token family (on login/register).
 * Returns the raw token to send to the client.
 */
export async function createRefreshToken(userId: string): Promise<string> {
  const familyId = randomBytes(16).toString("hex");
  const { raw, hash } = generateRefreshToken();
  const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  await pool.query(
    `INSERT INTO refresh_tokens (token_hash, user_id, family_id, expires_at)
     VALUES (?, ?, ?, ?)`,
    [hash, userId, familyId, expiresAt],
  );

  return raw;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
}

/**
 * Rotate a refresh token: revoke the old one and issue a new pair.
 *
 * Security: if the incoming token is already revoked, this is a replay attack.
 * We revoke the ENTIRE family and throw, forcing the user to re-authenticate.
 */
export async function rotateRefreshToken(rawToken: string): Promise<RefreshResult> {
  const hash = hashToken(rawToken);
  const client = await pool.getConnection();

  try {
    await client.query("BEGIN");

    // Look up the token (lock the row)
    const [resultRows] = await client.query(
      `SELECT id, user_id, family_id, revoked, expires_at
       FROM refresh_tokens
       WHERE token_hash = ?
       FOR UPDATE`,
      [hash],
    ) as any;

    if (resultRows.length === 0) {
      await client.query("ROLLBACK");
      throw new TokenError("Invalid refresh token", 401);
    }

    const row = resultRows[0];

    // Replay detection: if this token was already used/revoked, nuke the family
    if (row.revoked) {
      await client.query(`UPDATE refresh_tokens SET revoked = true WHERE family_id = ?`, [
        row.family_id,
      ]);
      await client.query("COMMIT");
      throw new TokenError("Refresh token reuse detected — session revoked", 401);
    }

    // Check expiry
    if (Date.now() > Number(row.expires_at)) {
      await client.query(`UPDATE refresh_tokens SET revoked = true WHERE id = ?`, [row.id]);
      await client.query("COMMIT");
      throw new TokenError("Refresh token expired", 401);
    }

    // Revoke old token
    await client.query(`UPDATE refresh_tokens SET revoked = true WHERE id = ?`, [row.id]);

    // Issue new refresh token in the same family
    const { raw: newRaw, hash: newHash } = generateRefreshToken();
    const newExpiresAt = Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    await client.query(
      `INSERT INTO refresh_tokens (token_hash, user_id, family_id, expires_at)
       VALUES (?, ?, ?, ?)`,
      [newHash, row.user_id, row.family_id, newExpiresAt],
    );

    // Get username for access token
    const [userResultRows] = await client.query(`SELECT username FROM users WHERE id = ?`, [
      row.user_id,
    ]) as any;

    if (userResultRows.length === 0) {
      await client.query("ROLLBACK");
      throw new TokenError("User not found", 401);
    }

    await client.query("COMMIT");

    const username = userResultRows[0].username;
    const accessToken = await signAccessToken(row.user_id, username);

    return {
      accessToken,
      refreshToken: newRaw,
      userId: row.user_id,
      username,
    };
  } catch (err) {
    if (!(err instanceof TokenError)) {
      await client.query("ROLLBACK");
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Revoke all refresh tokens for a user (on logout or password change).
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked = true WHERE user_id = ? AND revoked = false`,
    [userId],
  );
}

/**
 * Cleanup expired/revoked tokens (call periodically via cron).
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const [result] = await pool.query(
    `DELETE FROM refresh_tokens WHERE revoked = true OR expires_at < ?`,
    [Date.now()],
  ) as any;
  return result.affectedRows ?? 0;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class TokenError extends Error {
  public status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "TokenError";
    this.status = status;
  }
}
