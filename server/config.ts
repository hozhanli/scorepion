/**
 * config.ts — Centralized configuration and constants
 *
 * Contains all magic strings, scoring values, sync intervals,
 * system usernames, and API configuration in one place.
 */

// ── Scoring Constants ───────────────────────────────────────────────────────

export const SCORING = {
  EXACT_SCORE_POINTS: 10,           // Perfect prediction: exact home and away scores
  CORRECT_RESULT_WITH_GD: 8,        // Correct result (H/A/D) and goal difference
  CORRECT_RESULT: 5,                // Correct result (H/A/D) only
  GOAL_DIFFERENCE_ONLY: 3,          // Goal difference matches but result wrong
  TOTAL_GOALS_CLOSE: 1,             // Total goals within 1 of actual
  UPSET_BONUS: 5,                   // Bonus for correctly predicting upset
  STREAK_MILESTONES: [3, 7, 14, 30, 60], // Streaks that trigger notifications
} as const;

// ── Sync & Poll Intervals ───────────────────────────────────────────────────

export const SYNC_INTERVALS = {
  FIXTURES_FREE_MS: 12 * 60 * 60 * 1000,      // 12 hours (free plan)
  FIXTURES_PRO_MS: 6 * 60 * 60 * 1000,        // 6 hours (pro plan)
  STANDINGS_FREE_MS: 12 * 60 * 60 * 1000,     // 12 hours (free plan)
  STANDINGS_PRO_MS: 6 * 60 * 60 * 1000,       // 6 hours (pro plan)
  TOP_SCORERS_FREE_MS: 24 * 60 * 60 * 1000,   // 24 hours (free plan)
  TOP_SCORERS_PRO_MS: 12 * 60 * 60 * 1000,    // 12 hours (pro plan)
  LIVE_POLL_MS: 60 * 1000,                    // 60 seconds for live game polling
  SETTLEMENT_POLL_MS: 5 * 60 * 1000,           // 5 minutes for settlement checks
  RETENTION_CHECK_MS: 3 * 60 * 60 * 1000,     // 3 hours for retention checks
} as const;

// ── System Configuration ────────────────────────────────────────────────────

export const SYSTEM_USERNAME = "scorepion_system";

// ── API Configuration ──────────────────────────────────────────────────────

export const API_PLAN_CONFIG = {
  FREE: {
    name: "free",
    dailyLimit: 100,
    safetyBuffer: 10,
    ratePerMinute: 10, // API hard limit
  },
  PRO: {
    name: "pro",
    dailyLimit: 7500,
    safetyBuffer: 200,
    ratePerMinute: 10, // API hard limit
  },
} as const;
