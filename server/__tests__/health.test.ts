import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { registerHealthRoutes } from "../routes/health";

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const app = express();
    registerHealthRoutes(app);

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });
});
