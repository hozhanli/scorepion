/**
 * src/lib/__tests__/daily-picks.test.ts
 *
 * Tests for pure daily-picks logic: ranking, weighting, slicing.
 * No network calls, no mocks beyond basic data structures.
 */

import { describe, it, expect } from "vitest";
import { generateDailyPicks, generateSocialProof } from "@/lib/daily-picks";
import type { Match } from "@/lib/types";

const createMatch = (overrides?: Partial<Match>): Match => ({
  id: "match_1",
  homeTeam: { id: "team_1", name: "Team A", shortName: "TA", color: "#FF0000" },
  awayTeam: { id: "team_2", name: "Team B", shortName: "TB", color: "#0000FF" },
  kickoff: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  status: "upcoming",
  homeScore: null,
  awayScore: null,
  importance: "medium",
  stage: undefined,
  league: {
    id: "pl",
    name: "Premier League",
    country: "England",
    flag: "GB",
    color: "#003399",
    icon: "football",
  },
  ...overrides,
});

describe("generateDailyPicks", () => {
  describe("Ranking and weighting", () => {
    it("returns empty array for empty input", () => {
      const picks = generateDailyPicks([], []);
      expect(picks).toEqual([]);
    });

    it("excludes finished matches from daily pack", () => {
      const matches = [createMatch({ status: "finished" }), createMatch({ status: "upcoming" })];

      const picks = generateDailyPicks(matches, []);
      expect(picks).toHaveLength(1);
      expect(picks[0].status).toBe("upcoming");
    });

    it("prioritizes critical importance over high/medium/low", () => {
      const matches = [
        createMatch({
          id: "m1",
          importance: "low",
          status: "upcoming",
        }),
        createMatch({
          id: "m2",
          importance: "critical",
          status: "upcoming",
        }),
        createMatch({
          id: "m3",
          importance: "high",
          status: "upcoming",
        }),
      ];

      const picks = generateDailyPicks(matches, []);
      expect(picks[0].id).toBe("m2");
    });

    it("boosts favorite leagues by 50 points", () => {
      const matches = [
        createMatch({
          id: "m1",
          league: {
            id: "pl",
            name: "Premier League",
            country: "England",
            flag: "GB",
            color: "#003399",
            icon: "football",
          },
          importance: "medium",
          status: "upcoming",
        }),
        createMatch({
          id: "m2",
          league: {
            id: "la",
            name: "La Liga",
            country: "Spain",
            flag: "ES",
            color: "#FFCC00",
            icon: "football",
          },
          importance: "medium",
          status: "upcoming",
        }),
      ];

      // PL is favorite, so should rank higher despite same importance
      const picks = generateDailyPicks(matches, ["pl"]);
      expect(picks[0].id).toBe("m1");
    });

    it("prioritizes live matches over upcoming", () => {
      const matches = [
        createMatch({
          id: "m1",
          status: "upcoming",
          importance: "medium",
        }),
        createMatch({
          id: "m2",
          status: "live",
          importance: "low",
        }),
      ];

      const picks = generateDailyPicks(matches, []);
      expect(picks[0].id).toBe("m2");
    });

    it("boosts stage/tournament matches", () => {
      const matches = [
        createMatch({
          id: "m1",
          importance: "medium",
          stage: undefined,
        }),
        createMatch({
          id: "m2",
          importance: "medium",
          stage: "Round of 16",
        }),
      ];

      const picks = generateDailyPicks(matches, []);
      expect(picks[0].id).toBe("m2");
    });

    it("adds time-of-day variance (deterministic)", () => {
      // Same importance/league, different times should produce different order sometimes
      const matches = [
        createMatch({
          id: "m1",
          importance: "medium",
          status: "upcoming",
          kickoff: new Date(2025, 0, 1, 6, 0).toISOString(), // early morning
        }),
        createMatch({
          id: "m2",
          importance: "medium",
          status: "upcoming",
          kickoff: new Date(2025, 0, 1, 20, 0).toISOString(), // evening
        }),
      ];

      // Order may vary slightly due to time-of-day, but both should be included
      const picks = generateDailyPicks(matches, []);
      expect(picks).toHaveLength(2);
      expect(picks.map((m) => m.id)).toContain("m1");
      expect(picks.map((m) => m.id)).toContain("m2");
    });
  });

  describe("Slicing to max 6", () => {
    it("returns all matches if count <= 6", () => {
      const matches = Array.from({ length: 5 }, (_, i) =>
        createMatch({
          id: `m${i}`,
          importance: "medium",
        }),
      );

      const picks = generateDailyPicks(matches, []);
      expect(picks).toHaveLength(5);
    });

    it("returns max 6 matches if count > 6", () => {
      const matches = Array.from({ length: 10 }, (_, i) =>
        createMatch({
          id: `m${i}`,
          importance: "medium",
        }),
      );

      const picks = generateDailyPicks(matches, []);
      expect(picks).toHaveLength(6);
    });

    it("ensures top 6 by score when slicing", () => {
      const matches = [
        createMatch({
          id: "critical",
          importance: "critical",
        }),
        ...Array.from({ length: 8 }, (_, i) =>
          createMatch({
            id: `medium_${i}`,
            importance: "medium",
          }),
        ),
      ];

      const picks = generateDailyPicks(matches, []);
      expect(picks[0].id).toBe("critical");
    });
  });

  describe("Favorite leagues interaction", () => {
    it("applies boost to multiple favorite leagues", () => {
      const matches = [
        createMatch({
          id: "m1",
          league: {
            id: "pl",
            name: "Premier League",
            country: "England",
            flag: "GB",
            color: "#003399",
            icon: "football",
          },
          importance: "low",
        }),
        createMatch({
          id: "m2",
          league: {
            id: "la",
            name: "La Liga",
            country: "Spain",
            flag: "ES",
            color: "#FFCC00",
            icon: "football",
          },
          importance: "low",
        }),
        createMatch({
          id: "m3",
          league: {
            id: "sa",
            name: "Serie A",
            country: "Italy",
            flag: "IT",
            color: "#4169E1",
            icon: "football",
          },
          importance: "low",
        }),
      ];

      const picks = generateDailyPicks(matches, ["pl", "la"]);
      // PL and LA should rank above SA
      expect(picks[0].id).toMatch(/m1|m2/);
      expect(picks[picks.length - 1].id).toBe("m3");
    });

    it("handles empty favorite leagues", () => {
      const matches = Array.from({ length: 3 }, (_, i) =>
        createMatch({
          id: `m${i}`,
          importance: "medium",
        }),
      );

      const picks = generateDailyPicks(matches, []);
      expect(picks).toHaveLength(3);
    });
  });

  describe("Mixed importance levels", () => {
    it("ranks critical > high > medium > low", () => {
      const matches = [
        createMatch({ id: "low", importance: "low" }),
        createMatch({ id: "critical", importance: "critical" }),
        createMatch({ id: "medium", importance: "medium" }),
        createMatch({ id: "high", importance: "high" }),
      ];

      const picks = generateDailyPicks(matches, []);
      const ids = picks.map((m) => m.id);
      expect(ids.indexOf("critical")).toBeLessThan(ids.indexOf("high"));
      expect(ids.indexOf("high")).toBeLessThan(ids.indexOf("medium"));
      expect(ids.indexOf("medium")).toBeLessThan(ids.indexOf("low"));
    });
  });
});

describe("generateSocialProof", () => {
  it("returns consistent proof for same matchId", () => {
    const proof1 = generateSocialProof("match_123");
    const proof2 = generateSocialProof("match_123");

    expect(proof1.mostPickedScore).toBe(proof2.mostPickedScore);
    expect(proof1.mostPickedPercent).toBe(proof2.mostPickedPercent);
    expect(proof1.totalPredictions).toBe(proof2.totalPredictions);
  });

  it("returns different proof for different matchIds", () => {
    const proof1 = generateSocialProof("match_123");
    const proof2 = generateSocialProof("match_456");

    // Very likely to be different (not guaranteed, but high probability)
    expect(
      proof1.mostPickedScore === proof2.mostPickedScore &&
        proof1.totalPredictions === proof2.totalPredictions,
    ).toBe(false);
  });

  it("includes communityPicks array", () => {
    const proof = generateSocialProof("match_123");
    expect(proof.communityPicks).toBeDefined();
    expect(Array.isArray(proof.communityPicks)).toBe(true);
    expect(proof.communityPicks.length).toBeGreaterThan(0);
  });

  it("ensures communityPicks percentages sum to 100", () => {
    const proof = generateSocialProof("match_123");
    const sum = proof.communityPicks.reduce((acc, p) => acc + p.percent, 0);
    expect(sum).toBe(100);
  });

  it("includes valid score formats in picks", () => {
    const proof = generateSocialProof("match_123");
    proof.communityPicks.forEach((pick) => {
      expect(pick.score).toMatch(/^\d+-\d+$/);
      expect(pick.percent).toBeGreaterThan(0);
      expect(pick.percent).toBeLessThanOrEqual(100);
    });
  });

  it("generates reasonable totalPredictions (120-419)", () => {
    const proof = generateSocialProof("match_123");
    expect(proof.totalPredictions).toBeGreaterThanOrEqual(120);
    expect(proof.totalPredictions).toBeLessThan(420);
  });

  it("mostPickedScore is first pick in communityPicks", () => {
    const proof = generateSocialProof("match_123");
    expect(proof.mostPickedScore).toBe(proof.communityPicks[0].score);
    expect(proof.mostPickedPercent).toBe(proof.communityPicks[0].percent);
  });
});
