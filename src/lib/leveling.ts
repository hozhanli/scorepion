/**
 * Shared leveling helper. Used by the Profile screen and the celebration
 * watcher so both agree on when a tier promotion has happened.
 *
 * The thresholds mirror the `computeLevel` function historically inlined
 * in `app/(tabs)/profile.tsx`. If profile.tsx's thresholds move, update
 * this file and vice versa.
 */

export interface LevelInfo {
  level: number;
  name: string;
  title: string;
  xp: number;
  xpForNext: number;
  xpPct: number;
  pointsToNext: number;
}

const LEVELS = [
  { threshold: 0,    max: 200,   name: 'Rookie',      title: 'Just getting started' },
  { threshold: 200,  max: 500,   name: 'Fan',         title: 'Growing your picks' },
  { threshold: 500,  max: 1000,  name: 'Rising Star', title: 'On the right track' },
  { threshold: 1000, max: 2000,  name: 'Striker',     title: 'Serious predictor' },
  { threshold: 2000, max: 4000,  name: 'Playmaker',   title: 'Master strategist' },
  { threshold: 4000, max: 8000,  name: 'Captain',     title: 'Elite predictor' },
  { threshold: 8000, max: 99999, name: 'Legend',      title: 'The greatest' },
] as const;

export function computeLevel(points: number): LevelInfo {
  const idx = LEVELS.findIndex((l) => points >= l.threshold && points < l.max);
  const currentIdx = idx >= 0 ? idx : LEVELS.length - 1;
  const info = LEVELS[currentIdx];
  const xp = points - info.threshold;
  const xpForNext = info.max - info.threshold;

  return {
    level: currentIdx + 1,
    name: info.name,
    title: info.title,
    xp,
    xpForNext,
    xpPct: Math.min(1, xp / xpForNext),
    pointsToNext: Math.max(0, info.max - points),
  };
}
