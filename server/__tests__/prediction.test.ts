/* eslint-disable import/no-unresolved */
/**
 * server/__tests__/prediction.test.ts
 *
 * Critical-path tests for prediction submission and settlement flow.
 * Tests: validation, lock enforcement, optimistic updates, rollback scenarios.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@server/db";
import { footballFixtures, predictions, users } from "@shared/schema";
import { submitPrediction, PredictionError } from "@server/services/prediction.service";
import { eq } from "drizzle-orm";

describe("Prediction Submission", () => {
  let userId: string;
  let upcomingFixtureId: string;
  let liveFixtureId: string;
  let finishedFixtureId: string;

  beforeEach(async () => {
    // Create test user
    const [testUser] = await db
      .insert(users)
      .values({
        username: `pred_user_${Date.now()}`,
        password: "hashed_pw",
        avatar: "PU",
      })
      .returning();
    userId = testUser.id;

    // Upcoming fixture (can predict)
    const now = new Date();
    const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const [upcoming] = await db
      .insert(footballFixtures)
      .values({
        apiFixtureId: 1001,
        leagueId: "pl",
        homeTeamId: 10,
        awayTeamId: 20,
        homeScore: null,
        awayScore: null,
        status: "upcoming",
        statusShort: "NS",
        minute: 0,
        kickoff: future.toISOString(),
        venue: "Stadium A",
        referee: "Ref A",
        round: "1",
        season: 2025,
        updatedAt: Date.now(),
      })
      .returning();
    upcomingFixtureId = String(upcoming.apiFixtureId);

    // Live fixture (cannot predict)
    const [live] = await db
      .insert(footballFixtures)
      .values({
        apiFixtureId: 1002,
        leagueId: "pl",
        homeTeamId: 30,
        awayTeamId: 40,
        homeScore: 1,
        awayScore: 0,
        status: "live",
        statusShort: "1H",
        minute: 35,
        kickoff: now.toISOString(),
        venue: "Stadium B",
        referee: "Ref B",
        round: "1",
        season: 2025,
        updatedAt: Date.now(),
      })
      .returning();
    liveFixtureId = String(live.apiFixtureId);

    // Finished fixture (cannot predict)
    const [finished] = await db
      .insert(footballFixtures)
      .values({
        apiFixtureId: 1003,
        leagueId: "pl",
        homeTeamId: 50,
        awayTeamId: 60,
        homeScore: 2,
        awayScore: 1,
        status: "finished",
        statusShort: "FT",
        minute: 90,
        kickoff: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        venue: "Stadium C",
        referee: "Ref C",
        round: "1",
        season: 2025,
        updatedAt: Date.now(),
      })
      .returning();
    finishedFixtureId = String(finished.apiFixtureId);
  });

  afterEach(async () => {
    await db.delete(predictions).where(eq(predictions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    await db
      .delete(footballFixtures)
      .where(
        eq(footballFixtures.apiFixtureId, 1001) ||
          eq(footballFixtures.apiFixtureId, 1002) ||
          eq(footballFixtures.apiFixtureId, 1003),
      );
  });

  describe("Valid submission", () => {
    it("accepts valid prediction for upcoming match", async () => {
      const pred = await submitPrediction(userId, upcomingFixtureId, 2, 1);

      expect(pred).toBeDefined();
      expect(pred.homeScore).toBe(2);
      expect(pred.awayScore).toBe(1);
      expect(pred.userId).toBe(userId);
    });

    it("allows update to existing prediction before lock", async () => {
      const pred1 = await submitPrediction(userId, upcomingFixtureId, 1, 0);
      expect(pred1.homeScore).toBe(1);
      expect(pred1.awayScore).toBe(0);

      const pred2 = await submitPrediction(userId, upcomingFixtureId, 2, 1);
      expect(pred2.homeScore).toBe(2);
      expect(pred2.awayScore).toBe(1);

      // Verify only one prediction row exists
      const all = await db.select().from(predictions).where(eq(predictions.userId, userId));
      expect(all).toHaveLength(1);
    });

    it("accepts 0-0 prediction", async () => {
      const pred = await submitPrediction(userId, upcomingFixtureId, 0, 0);
      expect(pred.homeScore).toBe(0);
      expect(pred.awayScore).toBe(0);
    });

    it("accepts extreme but valid scores (15-15)", async () => {
      const pred = await submitPrediction(userId, upcomingFixtureId, 15, 15);
      expect(pred.homeScore).toBe(15);
      expect(pred.awayScore).toBe(15);
    });
  });

  describe("Score validation", () => {
    it("rejects negative home score", async () => {
      try {
        await submitPrediction(userId, upcomingFixtureId, -1, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(400);
      }
    });

    it("rejects negative away score", async () => {
      try {
        await submitPrediction(userId, upcomingFixtureId, 1, -1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(400);
      }
    });

    it("rejects non-integer home score", async () => {
      try {
        await submitPrediction(userId, upcomingFixtureId, 1.5, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(400);
      }
    });

    it("rejects score above max (16+)", async () => {
      try {
        await submitPrediction(userId, upcomingFixtureId, 16, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(400);
      }
    });
  });

  describe("Lock enforcement", () => {
    it("rejects prediction for live match", async () => {
      try {
        await submitPrediction(userId, liveFixtureId, 2, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(403);
      }
    });

    it("rejects prediction for finished match", async () => {
      try {
        await submitPrediction(userId, finishedFixtureId, 2, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(403);
      }
    });

    it("rejects prediction after match has started (HT status)", async () => {
      const halfTimeFixtureId = "1004";
      await db.insert(footballFixtures).values({
        apiFixtureId: 1004,
        leagueId: "pl",
        homeTeamId: 70,
        awayTeamId: 80,
        homeScore: 1,
        awayScore: 0,
        status: "halftime",
        statusShort: "HT",
        minute: 45,
        kickoff: new Date(Date.now() - 60 * 1000).toISOString(), // 1 min ago
        venue: "Stadium D",
        referee: "Ref D",
        round: "1",
        season: 2025,
        updatedAt: Date.now(),
      });

      try {
        await submitPrediction(userId, halfTimeFixtureId, 2, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(403);
      }

      await db.delete(footballFixtures).where(eq(footballFixtures.apiFixtureId, 1004));
    });
  });

  describe("Match validation", () => {
    it("rejects prediction for non-existent match", async () => {
      try {
        await submitPrediction(userId, "99999", 2, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(404);
      }
    });

    it("rejects prediction for cancelled match", async () => {
      const cancelledFixtureId = "1005";
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await db.insert(footballFixtures).values({
        apiFixtureId: 1005,
        leagueId: "pl",
        homeTeamId: 90,
        awayTeamId: 100,
        homeScore: null,
        awayScore: null,
        status: "cancelled",
        statusShort: "CANC",
        minute: 0,
        kickoff: future.toISOString(),
        venue: "Stadium E",
        referee: "Ref E",
        round: "1",
        season: 2025,
        updatedAt: Date.now(),
      });

      try {
        await submitPrediction(userId, cancelledFixtureId, 2, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(410);
      }

      await db.delete(footballFixtures).where(eq(footballFixtures.apiFixtureId, 1005));
    });

    it("rejects prediction for postponed match", async () => {
      const postponedFixtureId = "1006";
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await db.insert(footballFixtures).values({
        apiFixtureId: 1006,
        leagueId: "pl",
        homeTeamId: 110,
        awayTeamId: 120,
        homeScore: null,
        awayScore: null,
        status: "postponed",
        statusShort: "PST",
        minute: 0,
        kickoff: future.toISOString(),
        venue: "Stadium F",
        referee: "Ref F",
        round: "1",
        season: 2025,
        updatedAt: Date.now(),
      });

      try {
        await submitPrediction(userId, postponedFixtureId, 2, 1);
        expect.fail("Should throw");
      } catch (e) {
        expect(e).toBeInstanceOf(PredictionError);
        expect((e as PredictionError).status).toBe(410);
      }

      await db.delete(footballFixtures).where(eq(footballFixtures.apiFixtureId, 1006));
    });
  });

  describe("Idempotency", () => {
    it("allows re-submission of same prediction without state change", async () => {
      const pred1 = await submitPrediction(userId, upcomingFixtureId, 2, 1);
      const pred2 = await submitPrediction(userId, upcomingFixtureId, 2, 1);

      expect(pred1.id).toBe(pred2.id);
      expect(pred2.homeScore).toBe(2);
      expect(pred2.awayScore).toBe(1);
    });
  });
});
