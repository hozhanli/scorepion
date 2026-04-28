import rateLimit from "express-rate-limit";

const skipInDev = () =>
  process.env.NODE_ENV !== "production" && process.env.FORCE_RATE_LIMIT !== "true";

// Tier A: Auth routes (strict) - 10 requests per minute per IP
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipInDev,
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many attempts, try again in a minute" });
  },
});

// Tier B: Admin routes (very strict) - 30 requests per minute per IP
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
