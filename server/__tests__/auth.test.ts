/* eslint-disable import/no-unresolved */
/**
 * server/__tests__/auth.test.ts
 *
 * Critical-path tests for authentication routes.
 * Tests: register, login, refresh, logout, token validation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { Express } from "express";
import { db } from "@server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as tokenService from "@server/services/token.service";

// We'll need to create a minimal Express app with the auth routes
let app: Express;
let testUser = {
  username: `testuser_${Date.now()}`,
  password: "ValidPassword123!",
};

beforeEach(async () => {
  // Create Express app with auth routes
  const { Router } = await import("express");
  const { authRouter } = await import("@server/routes/auth.routes");

  const express = await import("express");
  app = express.default();

  app.use(express.json());
  app.use("/api/auth", authRouter);

  // Clean up any previous test users
  await db.delete(users).where(eq(users.username, testUser.username));
});

afterEach(async () => {
  // Cleanup test users
  await db.delete(users).where(eq(users.username, testUser.username));
});

describe("POST /api/auth/register", () => {
  it("creates new user and returns tokens with 201", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: testUser.username,
      password: testUser.password,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects duplicate username with 409", async () => {
    // First registration
    await request(app).post("/api/auth/register").send({
      username: testUser.username,
      password: testUser.password,
    });

    // Second registration with same username
    const res = await request(app).post("/api/auth/register").send({
      username: testUser.username,
      password: "DifferentPassword123!",
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/already taken|duplicate/i);
  });

  it("accepts optional favoriteLeagues array", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: testUser.username,
        password: testUser.password,
        favoriteLeagues: ["pl", "la"],
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
  });

  it("rejects request missing username", async () => {
    const res = await request(app).post("/api/auth/register").send({
      password: testUser.password,
    });

    expect(res.status).toBe(400);
  });

  it("rejects request missing password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: testUser.username,
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    // Pre-create a user for login tests
    await request(app).post("/api/auth/register").send({
      username: testUser.username,
      password: testUser.password,
    });
  });

  it("authenticates with correct credentials and returns tokens", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: testUser.username,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user.username).toBe(testUser.username);
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: testUser.username,
      password: "WrongPassword123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid|incorrect/i);
  });

  it("rejects login with non-existent username", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "nonexistent_user",
      password: testUser.password,
    });

    expect(res.status).toBe(401);
  });

  it("rejects request missing username", async () => {
    const res = await request(app).post("/api/auth/login").send({
      password: testUser.password,
    });

    expect(res.status).toBe(400);
  });

  it("rejects request missing password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: testUser.username,
    });

    expect(res.status).toBe(400);
  });

  it("returns different tokens on each login", async () => {
    const res1 = await request(app).post("/api/auth/login").send({
      username: testUser.username,
      password: testUser.password,
    });

    const res2 = await request(app).post("/api/auth/login").send({
      username: testUser.username,
      password: testUser.password,
    });

    expect(res1.body.accessToken).not.toBe(res2.body.accessToken);
    expect(res1.body.refreshToken).not.toBe(res2.body.refreshToken);
  });
});

describe("POST /api/auth/refresh", () => {
  let validRefreshToken: string;

  beforeEach(async () => {
    // Create and login user to get refresh token
    const res = await request(app).post("/api/auth/register").send({
      username: testUser.username,
      password: testUser.password,
    });

    validRefreshToken = res.body.refreshToken;
  });

  it("returns new token pair with valid refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: validRefreshToken,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    // New tokens should differ from original
    expect(res.body.accessToken).not.toBe(validRefreshToken);
  });

  it("rejects request with missing refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/refresh token/i);
  });

  it("rejects request with invalid refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "invalid_token_string",
    });

    expect(res.status).toBe(401);
  });

  it("rejects request with malformed refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "not.a.jwt",
    });

    expect(res.status).toBe(401);
  });

  it("allows rotating refresh token multiple times", async () => {
    const res1 = await request(app).post("/api/auth/refresh").send({
      refreshToken: validRefreshToken,
    });

    expect(res1.status).toBe(200);

    const res2 = await request(app).post("/api/auth/refresh").send({
      refreshToken: res1.body.refreshToken,
    });

    expect(res2.status).toBe(200);
    expect(res2.body.refreshToken).not.toBe(res1.body.refreshToken);
  });
});

describe("GET /api/auth/me", () => {
  let accessToken: string;

  beforeEach(async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: testUser.username,
      password: testUser.password,
    });

    accessToken = res.body.accessToken;
  });

  it("returns current user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects request without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("rejects request with invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer invalid_token");

    expect(res.status).toBe(401);
  });

  it("rejects request with malformed auth header", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "InvalidFormat");

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  let accessToken: string;

  beforeEach(async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: testUser.username,
      password: testUser.password,
    });

    accessToken = res.body.accessToken;
  });

  it("revokes tokens and returns success", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it("rejects logout without valid token", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(401);
  });

  it("prevents refresh token use after logout", async () => {
    const loginRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: `logout_test_${Date.now()}`,
        password: testUser.password,
      });

    const refreshToken = loginRes.body.refreshToken;

    // Logout
    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    // Try to refresh
    const refreshRes = await request(app).post("/api/auth/refresh").send({ refreshToken });

    expect(refreshRes.status).toBe(401);

    // Cleanup
    await db.delete(users).where(eq(users.username, `logout_test_${Date.now()}`));
  });
});
