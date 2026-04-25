/**
 * src/lib/__tests__/leveling.test.ts
 *
 * Tests for pure leveling logic: level computation, thresholds, XP tracking.
 */

import { describe, it, expect } from "vitest";
import { computeLevel } from "@/lib/leveling";

describe("computeLevel", () => {
  describe("Level thresholds", () => {
    it("level 1 (Rookie) at 0 points", () => {
      const info = computeLevel(0);
      expect(info.level).toBe(1);
      expect(info.name).toBe("Rookie");
      expect(info.title).toBe("Just getting started");
    });

    it("level 1 (Rookie) at 199 points", () => {
      const info = computeLevel(199);
      expect(info.level).toBe(1);
      expect(info.name).toBe("Rookie");
    });

    it("level 2 (Fan) at 200 points", () => {
      const info = computeLevel(200);
      expect(info.level).toBe(2);
      expect(info.name).toBe("Fan");
      expect(info.title).toBe("Growing your picks");
    });

    it("level 3 (Rising Star) at 500 points", () => {
      const info = computeLevel(500);
      expect(info.level).toBe(3);
      expect(info.name).toBe("Rising Star");
      expect(info.title).toBe("On the right track");
    });

    it("level 4 (Striker) at 1000 points", () => {
      const info = computeLevel(1000);
      expect(info.level).toBe(4);
      expect(info.name).toBe("Striker");
      expect(info.title).toBe("Serious predictor");
    });

    it("level 5 (Playmaker) at 2000 points", () => {
      const info = computeLevel(2000);
      expect(info.level).toBe(5);
      expect(info.name).toBe("Playmaker");
      expect(info.title).toBe("Master strategist");
    });

    it("level 6 (Captain) at 4000 points", () => {
      const info = computeLevel(4000);
      expect(info.level).toBe(6);
      expect(info.name).toBe("Captain");
      expect(info.title).toBe("Elite predictor");
    });

    it("level 7 (Legend) at 8000 points", () => {
      const info = computeLevel(8000);
      expect(info.level).toBe(7);
      expect(info.name).toBe("Legend");
      expect(info.title).toBe("The greatest");
    });

    it("level 7 (Legend) stays at 99999 points", () => {
      const info = computeLevel(99999);
      expect(info.level).toBe(7);
      expect(info.name).toBe("Legend");
    });
  });

  describe("XP progress within level", () => {
    it("computes XP progress correctly for level 1", () => {
      const info = computeLevel(50);
      expect(info.xp).toBe(50); // 50 - 0
      expect(info.xpForNext).toBe(200); // 200 - 0
      expect(info.xpPct).toBeCloseTo(50 / 200); // 0.25
    });

    it("computes XP progress correctly for level 2", () => {
      const info = computeLevel(300);
      expect(info.xp).toBe(100); // 300 - 200
      expect(info.xpForNext).toBe(300); // 500 - 200
      expect(info.xpPct).toBeCloseTo(100 / 300); // 0.333...
    });

    it("computes XP progress correctly at level start", () => {
      const info = computeLevel(500);
      expect(info.xp).toBe(0); // 500 - 500
      expect(info.xpForNext).toBe(500); // 1000 - 500
      expect(info.xpPct).toBe(0);
    });

    it("computes XP progress correctly near level end", () => {
      const info = computeLevel(999);
      expect(info.xp).toBe(499); // 999 - 500
      expect(info.xpForNext).toBe(500); // 1000 - 500
      expect(info.xpPct).toBeCloseTo(499 / 500); // 0.998
    });
  });

  describe("Points to next level", () => {
    it("calculates points needed at level 1 start", () => {
      const info = computeLevel(0);
      expect(info.pointsToNext).toBe(200);
    });

    it("calculates points needed at level 1 halfway", () => {
      const info = computeLevel(100);
      expect(info.pointsToNext).toBe(100); // 200 - 100
    });

    it("calculates points needed at level 2 start", () => {
      const info = computeLevel(200);
      expect(info.pointsToNext).toBe(300); // 500 - 200
    });

    it("calculates 0 points to next at legend level", () => {
      const info = computeLevel(8000);
      expect(info.pointsToNext).toBe(0);
    });

    it("calculates 0 points to next when exceeding legend threshold", () => {
      const info = computeLevel(99999);
      expect(info.pointsToNext).toBe(0);
    });
  });

  describe("XP percentage clamping", () => {
    it("clamps xpPct to 1.0 at level cap", () => {
      const info = computeLevel(8000);
      expect(info.xpPct).toBe(1);
    });

    it("clamps xpPct to 1.0 beyond level cap", () => {
      const info = computeLevel(99999);
      expect(info.xpPct).toBe(1);
    });

    it("ensures xpPct is never negative", () => {
      const info = computeLevel(0);
      expect(info.xpPct).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Monotonicity and continuity", () => {
    it("level does not decrease with increasing points", () => {
      const levels = [0, 100, 200, 500, 1000, 2000, 4000, 8000, 10000].map(computeLevel);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].level).toBeGreaterThanOrEqual(levels[i - 1].level);
      }
    });

    it("xp percentage increases monotonically within a level", () => {
      const points = [200, 250, 300, 350, 400, 450, 499];
      const xpPcts = points.map((p) => computeLevel(p).xpPct);
      for (let i = 1; i < xpPcts.length; i++) {
        expect(xpPcts[i]).toBeGreaterThanOrEqual(xpPcts[i - 1]);
      }
    });

    it("points to next decreases monotonically within a level", () => {
      const points = [200, 250, 300, 350, 400, 450, 499];
      const ptToNext = points.map((p) => computeLevel(p).pointsToNext);
      for (let i = 1; i < ptToNext.length; i++) {
        expect(ptToNext[i]).toBeLessThanOrEqual(ptToNext[i - 1]);
      }
    });
  });

  describe("Boundary cases", () => {
    it("handles exact threshold transition from level 1 to 2", () => {
      const before = computeLevel(199);
      const after = computeLevel(200);

      expect(before.level).toBe(1);
      expect(after.level).toBe(2);
      expect(before.xp).toBe(199);
      expect(after.xp).toBe(0);
    });

    it("handles exact threshold transition from level 3 to 4", () => {
      const before = computeLevel(999);
      const after = computeLevel(1000);

      expect(before.level).toBe(3);
      expect(after.level).toBe(4);
      expect(after.xp).toBe(0);
    });

    it("handles maximum realistic points (not infinite)", () => {
      const info = computeLevel(100000);
      expect(info.level).toBe(7);
      expect(info.xpPct).toBe(1);
    });
  });

  describe("Return object completeness", () => {
    it("includes all required fields", () => {
      const info = computeLevel(500);

      expect(info).toHaveProperty("level");
      expect(info).toHaveProperty("name");
      expect(info).toHaveProperty("title");
      expect(info).toHaveProperty("xp");
      expect(info).toHaveProperty("xpForNext");
      expect(info).toHaveProperty("xpPct");
      expect(info).toHaveProperty("pointsToNext");
    });

    it("has correct types for all fields", () => {
      const info = computeLevel(500);

      expect(typeof info.level).toBe("number");
      expect(typeof info.name).toBe("string");
      expect(typeof info.title).toBe("string");
      expect(typeof info.xp).toBe("number");
      expect(typeof info.xpForNext).toBe("number");
      expect(typeof info.xpPct).toBe("number");
      expect(typeof info.pointsToNext).toBe("number");
    });
  });
});
