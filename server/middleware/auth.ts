/**
 * Express authentication & authorization middleware.
 *
 * Single Responsibility Principle: middleware concerns are isolated from
 * route handler business logic. Routes import these via dependency injection
 * rather than defining them inline.
 *
 * Open/Closed Principle: add new guards (e.g. requirePremium) here without
 * touching routes.ts.
 */
import type { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

// ---------------------------------------------------------------------------
// Session-based auth
// ---------------------------------------------------------------------------

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session.userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// Admin guard with simple in-memory rate limiting
// ---------------------------------------------------------------------------

const adminAttempts = new Map<string, { count: number; resetAt: number }>();
const ADMIN_RATE_LIMIT = 10; // max attempts per window
const ADMIN_RATE_WINDOW_MS = 60_000; // 1 minute

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  // Rate-limit by IP
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

  // Timing-safe comparison to prevent timing attacks
  const secretBuf = Buffer.from(adminSecret, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (
    secretBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(secretBuf, providedBuf)
  ) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
}
