/* eslint-disable import/no-unresolved */
/**
 * server/__tests__/scoring.test.ts
 *
 * Critical-path tests for the prediction scoring engine.
 * Exercises: exact match, correct result, draws, boosts, edge cases.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@server/db";
import { footballFixtures, footballStandings, predictions, users } from "@shared/schema";
import { SCORING } from "@server/config";
import { settlePredictions } from "@server/services/sync";
import { eq, and } from "drizzle-orm";

describe("Scoring Engine", () => {
  let userId: string;
  let fixtureId: string;

  beforeEach(async () => {
    // Create a test user
    const [testUser] = await db
      .insert(users)
      .values({
        username: `tu_${Date.now().toString(36)}`,
        password: "hashed_pw",
        avatar: "TU",
      })
      .returning();
    userId = testUser.id;

    // Create a test fixture (not live, not finished initially)
    const [fixture] = await db
      .insert(footballFixtures)
      .values({
        apiFixtureId: 999000 + Math.floor(Math.random() * 1000),
        leagueId: "pl",
        homeTeamId: 1,
        awayTeamId: 2,
        homeScore: null,
        awayScore: null,
        status: "upcoming",
        statusShort: "NS",
        minute: 0,
        kickoff: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        venue: "Test Stadium",
        referee: "Test Ref",
        round: "1",
        season: 2025,
        updatedAt: Date.now(),
      })
      .returning();
    fixtureId = String(fixture.apiFixtureId);

    // Add standings for upset bonus tests
    await db
      .insert(footballStandings)
      .values({
        leagueId: "pl",
        teamId: 1,
        position: 1,
        played: 10,
        won: 8,
        drawn: 1,
        lost: 1,
        goalsFor: 25,
        goalsAgainst: 5,
        goalDifference: 20,
        points: 25,
        form: "WWWWW",
        season: 2025,
        group: null,
        updatedAt: Date.now(),
      })
      .onConflictDoNothing();

    await db
      .insert(footballStandings)
      .values({
        leagueId: "pl",
        teamId: 2,
        position: 15,
        played: 10,
        won: 2,
        drawn: 2,
        lost: 6,
        goalsFor: 8,
        goalsAgainst: 18,
        goalDifference: -10,
        points: 8,
        form: "LDLDL",
        season: 2025,
        group: null,
        updatedAt: Date.now(),
      })
      .onConflictDoNothing();
  });

  afterEach(async () => {
    // Cleanup predictions
    await db.delete(predictions).where(eq(predictions.userId, userId));
    // Cleanup user
    await db.delete(users).where(eq(users.id, userId));
    // Cleanup fixtures
    await db.delete(footballFixtures).where(eq(footballFixtures.id, fixtureId));
  });

  describe("Exact match scoring", () => {
    it("awards EXACT_SCORE_POINTS for exact prediction 2-1", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 2,
        awayScore: 1,
        settled: false,
        points: 0,
      });

      // Finish the fixture with exact score
      await db
        .update(footballFixtures)
        .set({
          homeScore: 2,
          awayScore: 1,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.EXACT_SCORE_POINTS);
    });

    it("awards EXACT_SCORE_POINTS for exact prediction 0-0", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 0,
        awayScore: 0,
        settled: false,
        points: 0,
        timestamp: Date.now(),
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 0,
          awayScore: 0,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.EXACT_SCORE_POINTS);
    });
  });

  describe("Correct result with goal difference", () => {
    it("awards CORRECT_RESULT_WITH_GD for correct result + matching GD: pred 2-1, actual 3-2", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 2,
        awayScore: 1,
        settled: false,
        points: 0,
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 3,
          awayScore: 2,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.CORRECT_RESULT_WITH_GD);
    });

    it("awards CORRECT_RESULT_WITH_GD for draw with matching GD: pred 1-1, actual 2-2", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 1,
        awayScore: 1,
        settled: false,
        points: 0,
        timestamp: Date.now(),
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 2,
          awayScore: 2,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.CORRECT_RESULT_WITH_GD);
    });
  });

  describe("Correct result only", () => {
    it("awards CORRECT_RESULT for correct home win different GD: pred 2-1, actual 3-0", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 2,
        awayScore: 1,
        settled: false,
        points: 0,
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 3,
          awayScore: 0,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.CORRECT_RESULT);
    });

    it("awards CORRECT_RESULT for correct away win: pred 1-2, actual 0-3", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 1,
        awayScore: 2,
        settled: false,
        points: 0,
        timestamp: Date.now(),
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 0,
          awayScore: 3,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.CORRECT_RESULT);
    });
  });

  describe("Misses and zero points", () => {
    it("awards 0 points for completely wrong prediction: pred 2-1, actual 1-2", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 2,
        awayScore: 1,
        settled: false,
        points: 0,
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 1,
          awayScore: 2,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(0);
    });
  });

  describe("Prediction lock enforcement", () => {
    it("does not settle predictions for matches not yet finished", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 2,
        awayScore: 1,
        settled: false,
        points: 0,
      });

      // Leave fixture in 'upcoming' status
      const settled = await settlePredictions();
      expect(settled).toBe(0);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.settled).toBe(false);
    });

    it("does not settle predictions with null scores", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 2,
        awayScore: 1,
        settled: false,
        points: 0,
      });

      // Mark finished but with null scores (abandoned match)
      await db
        .update(footballFixtures)
        .set({
          homeScore: null,
          awayScore: null,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(0);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.settled).toBe(false);
    });
  });

  describe("Goal difference edge cases", () => {
    it("awards GOAL_DIFFERENCE_ONLY when GD matches but result differs: pred 2-1 (GD=1), actual 1-0 (GD=1, but away win not draw)", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 2,
        awayScore: 1,
        settled: false,
        points: 0,
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 1,
          awayScore: 0,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.GOAL_DIFFERENCE_ONLY);
    });
  });

  describe("Total goals close bonus", () => {
    it("awards TOTAL_GOALS_CLOSE for pred 2-2 (4 total), actual 3-1 (4 total)", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 2,
        awayScore: 2,
        settled: false,
        points: 0,
        timestamp: Date.now(),
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 3,
          awayScore: 1,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.TOTAL_GOALS_CLOSE);
    });

    it("awards TOTAL_GOALS_CLOSE for pred 1-1 (2 total), actual 0-3 (3 total - within 1)", async () => {
      await db.insert(predictions).values({
        userId,
        matchId: fixtureId,
        homeScore: 1,
        awayScore: 1,
        settled: false,
        points: 0,
        timestamp: Date.now(),
      });

      await db
        .update(footballFixtures)
        .set({
          homeScore: 0,
          awayScore: 3,
          status: "finished",
          statusShort: "FT",
          updatedAt: Date.now(),
        })
        .where(eq(footballFixtures.apiFixtureId, parseInt(fixtureId)));

      const settled = await settlePredictions();
      expect(settled).toBe(1);

      const [pred] = await db
        .select()
        .from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, fixtureId)));
      expect(pred.points).toBe(SCORING.TOTAL_GOALS_CLOSE);
    });
  });
});
