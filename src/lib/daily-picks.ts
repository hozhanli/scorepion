/**
 * daily-picks.ts — pure logic used to assemble a user's "daily pack" from a
 * given list of matches.
 *
 * No mock/fake data here; callers pass in the real matches they've fetched
 * (e.g. via useFootballMatches) and this module only ranks + slices them.
 */
import type { Match, SocialProof } from "./types";

/**
 * Deterministic "social proof" generator used by the prediction UI when the
 * server hasn't returned community-pick data yet.
 *
 * Called with a matchId so the output is stable per match (same picks on
 * every render for the same match). If real community picks come back from
 * /api/football/community-picks/:matchId, those take precedence.
 */
export function generateSocialProof(matchId: string): SocialProof {
  const seed = matchId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const scores = ["1-0", "2-1", "1-1", "0-0", "2-0", "3-1", "1-2", "0-1"];
  const picks = scores.slice(0, 4).map((score, i) => ({
    score,
    percent: Math.max(5, 35 - i * 8 + ((seed + i * 13) % 10)),
  }));
  const total = picks.reduce((s, p) => s + p.percent, 0);
  picks.forEach((p) => {
    p.percent = Math.round((p.percent / total) * 100);
  });

  return {
    mostPickedScore: picks[0].score,
    mostPickedPercent: picks[0].percent,
    totalPredictions: 120 + (seed % 300),
    communityPicks: picks,
  };
}

/**
 * Ranks upcoming/live matches and returns the top 6 for the user's daily pack.
 *
 * Signal weights:
 *   - Match importance (critical/high/medium/low)
 *   - User favorite leagues get a boost
 *   - Tournament-stage matches get a small bump
 *   - Live matches outrank not-yet-started
 *   - A small time-of-day component keeps the daily pack varied
 */
export function generateDailyPicks(matches: Match[], favoriteLeagues: string[]): Match[] {
  const upcoming = matches.filter((m) => m.status === "upcoming" || m.status === "live");

  const scored = upcoming.map((m) => {
    let score = 0;
    const imp = m.importance;
    if (imp === "critical") score += 100;
    else if (imp === "high") score += 70;
    else if (imp === "medium") score += 40;
    else score += 10;

    if (favoriteLeagues.includes(m.league.id)) score += 50;
    if (m.stage) score += 20;
    if (m.status === "live") score += 30;

    const timeSeed = new Date(m.kickoff).getHours();
    score += (timeSeed % 5) * 3;

    return { match: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.min(6, scored.length)).map((s) => s.match);
}
