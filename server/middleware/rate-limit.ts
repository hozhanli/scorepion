import rateLimit from "express-rate-limit";

const skipInDev = () =>
  process.env.NODE_ENV !== "production" && process.env.FORCE_RATE_LIMIT !== "true";

// Note: there's no "auth" tier anymore — credential checking is handled by
// Firebase, which has its own rate limiting upstream. The remaining /api/auth
// surface (/sync, /me) falls under the catch-all read tier.

// Tier A: Admin routes (very strict) - 30 requests per minute per IP
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: false,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many requests, please slow down" });
  },
});

// Tier C: Write routes (moderate) - 60 requests per minute per IP
export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: false,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many requests, please slow down" });
  },
});

// Tier D: Read routes (loose) - 300 requests per minute per IP
export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: false,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many requests, please slow down" });
  },
});
