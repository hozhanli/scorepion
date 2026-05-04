/**
 * Express authentication & authorization middleware.
 *
 * Verifies Firebase ID tokens from the Authorization: Bearer header and
 * attaches the resolved user identity to the request. The Admin SDK is
 * lazily initialized on first verify call (see ../lib/firebase.ts).
 *
 * Single Responsibility: middleware concerns are isolated from route handlers.
 */
import type { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { firebaseAuth } from "../lib/firebase";

// Extend Express Request to carry the verified Firebase identity.
declare global {
  namespace Express {
    interface Request {
      userId?: string; // Firebase UID
      userEmail?: string; // Verified email from the ID token
    }
  }
}

// ---------------------------------------------------------------------------
// Firebase ID-token auth
// ---------------------------------------------------------------------------

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const token = authHeader.slice(7); // Strip "Bearer "

  try {
    // Offline verification using cached Firebase public keys — no per-request
    // RPC. Revoked sessions / disabled accounts continue to work until their
    // ID token expires (max 1 hour). For sensitive operations that need
    // immediate revocation, pass `true` as the second arg at that call site.
    const decoded = await firebaseAuth().verifyIdToken(token);
    req.userId = decoded.uid;
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ---------------------------------------------------------------------------
// Admin guard with simple in-memory rate limiting
// ---------------------------------------------------------------------------

const adminAttempts = new Map<string, { count: number; resetAt: number }>();
const ADMIN_RATE_LIMIT = parseInt(process.env.ADMIN_RATE_LIMIT ?? "10", 10);
const ADMIN_RATE_WINDOW_MS = parseInt(process.env.ADMIN_RATE_WINDOW_MS ?? "60000", 10);

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of adminAttempts) {
    if (now > entry.resetAt) {
      adminAttempts.delete(ip);
    }
  }
}, 60_000);

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";
  const now = Date.now();
  let entry = adminAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + ADMIN_RATE_WINDOW_MS };
    adminAttempts.set(ip, entry);
  }

  entry.count++;
  if (entry.count > ADMIN_RATE_LIMIT) {
    res.status(429).json({ message: "Too many attempts, try again later" });
    return;
  }

  const provided = req.headers["x-admin-secret"] as string | undefined;
  if (!provided) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const secretBuf = Buffer.from(adminSecret, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (secretBuf.length !== providedBuf.length || !crypto.timingSafeEqual(secretBuf, providedBuf)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
}
