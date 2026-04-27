import rateLimit from "express-rate-limit";

// Tier A: Auth routes (strict) - 10 requests per minute per IP
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { message: "Too many attempts, try again in a minute" },
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests toward the limit
  skip: () => process.env.NODE_ENV !== "production" && process.env.FORCE_RATE_LIMIT !== "true",
  keyGenerator: (req) => req.ip || "unknown",
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many attempts, try again in a minute" });
  },
});

// Tier B: Admin routes (very strict) - 30 requests per minute per IP
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: { message: "Too many requests, please slow down" },
  standardHeaders: false,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production" && process.env.FORCE_RATE_LIMIT !== "true",
  keyGenerator: (req) => req.ip || "unknown",
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many requests, please slow down" });
  },
});

// Tier C: Write routes (moderate) - 60 requests per minute per IP
export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { message: "Too many requests, please slow down" },
  standardHeaders: false,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production" && process.env.FORCE_RATE_LIMIT !== "true",
  keyGenerator: (req) => req.ip || "unknown",
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many requests, please slow down" });
  },
});

// Tier D: Read routes (loose) - 300 requests per minute per IP
export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  message: { message: "Too many requests, please slow down" },
  standardHeaders: false,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production" && process.env.FORCE_RATE_LIMIT !== "true",
  keyGenerator: (req) => req.ip || "unknown",
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many requests, please slow down" });
  },
});
