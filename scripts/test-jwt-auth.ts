#!/usr/bin/env node

/**
 * JWT Authentication Flow Test for Scorepion App
 *
 * This script tests the complete JWT auth flow including:
 * - Registration
 * - Login
 * - Token refresh with rotation
 * - Replay detection
 * - Logout and token revocation
 *
 * REQUIREMENTS: PostgreSQL database must be running on localhost:13292
 * DATABASE_URL=postgresql://postgres:postgres@localhost:13292/scorepion
 *
 * To start database locally:
 *   docker run -d --name scorepion-db -e POSTGRES_PASSWORD=postgres \
 *     -e POSTGRES_DB=scorepion -p 13292:5432 postgres:16-alpine
 */

import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";

const BASE_URL = "http://localhost:13291";
const MAX_STARTUP_WAIT = 30000; // 30 seconds

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];
let serverProcess: ChildProcess | null = null;

function log(message: string) {
  console.log(message);
}

function error(message: string) {
  console.error(message);
}

function generateRandomUsername(): string {
  return `testjwt_${Math.random().toString(36).substring(2, 9)}`;
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true, details: "PASS" });
    log(`✓ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, details: err.message });
    log(`✗ ${name}: ${err.message}`);
  }
}

async function waitForServer(timeout: number = MAX_STARTUP_WAIT): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        method: "GET",
      });
      if (response.ok) {
        log("Server is responding");
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

async function runTests() {
  let testUsername = "";
  let testPassword = "TestPass123";
  let registerAccessToken = "";
  let registerRefreshToken = "";
  let newAccessToken = "";
  let newRefreshToken = "";
  let loginRefreshToken = "";

  // Test 1: Register
  await test("1. Register with valid credentials", async () => {
    testUsername = generateRandomUsername();
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testUsername, password: testPassword }),
    });

    if (response.status !== 201) {
      const body = await response.text();
      throw new Error(`Expected 201, got ${response.status}: ${body}`);
    }

    const data = await response.json();
    if (!data.user || !data.accessToken || !data.refreshToken) {
      throw new Error(`Missing required fields. Got: ${JSON.stringify(data)}`);
    }

    registerAccessToken = data.accessToken;
    registerRefreshToken = data.refreshToken;
  });

  // Test 2: Access /me with token
  await test("2. Access /me with valid access token", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${registerAccessToken}`,
      },
    });

    if (response.status !== 200) {
      const body = await response.text();
      throw new Error(`Expected 200, got ${response.status}: ${body}`);
    }

    const data = await response.json();
    if (!data.user || !data.user.username) {
      throw new Error(`Invalid user data: ${JSON.stringify(data)}`);
    }
  });

  // Test 3: Access /me without token
  await test("3. Access /me without auth header (should be 401)", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "GET",
    });

    if (response.status !== 401) {
      const body = await response.text();
      throw new Error(`Expected 401, got ${response.status}: ${body}`);
    }
  });

  // Test 4: Access /me with bad token
  await test("4. Access /me with invalid token (should be 401)", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid-token-12345",
      },
    });

    if (response.status !== 401) {
      const body = await response.text();
      throw new Error(`Expected 401, got ${response.status}: ${body}`);
    }
  });

  // Test 5: Refresh token
  await test("5. Refresh token to get new tokens", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: registerRefreshToken }),
    });

    if (response.status !== 200) {
      const body = await response.text();
      throw new Error(`Expected 200, got ${response.status}: ${body}`);
    }

    const data = await response.json();
    if (!data.accessToken || !data.refreshToken) {
      throw new Error(`Missing tokens in response: ${JSON.stringify(data)}`);
    }

    if (data.accessToken === registerAccessToken) {
      throw new Error("New access token should be different from old one");
    }

    if (data.refreshToken === registerRefreshToken) {
      throw new Error("New refresh token should be different from old one");
    }

    newAccessToken = data.accessToken;
    newRefreshToken = data.refreshToken;
  });

  // Test 6: Use new access token
  await test("6. Access /me with new access token", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    });

    if (response.status !== 200) {
      const body = await response.text();
      throw new Error(`Expected 200, got ${response.status}: ${body}`);
    }

    const data = await response.json();
    if (!data.user || !data.user.username) {
      throw new Error(`Invalid user data: ${JSON.stringify(data)}`);
    }
  });

  // Test 7: Old refresh token is revoked (replay detection)
  await test("7. Old refresh token should be revoked (replay detection)", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: registerRefreshToken }),
    });

    if (response.status !== 401) {
      const body = await response.text();
      throw new Error(`Expected 401 (replay detection), got ${response.status}: ${body}`);
    }
  });

  // Test 8: Login
  await test("8. Login with credentials", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testUsername, password: testPassword }),
    });

    if (response.status !== 200) {
      const body = await response.text();
      throw new Error(`Expected 200, got ${response.status}: ${body}`);
    }

    const data = await response.json();
    if (!data.user || !data.accessToken || !data.refreshToken) {
      throw new Error(`Missing required fields. Got: ${JSON.stringify(data)}`);
    }

    loginRefreshToken = data.refreshToken;
  });

  // Test 9: Logout
  await test("9. Logout with bearer token", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    });

    if (response.status !== 200) {
      const body = await response.text();
      throw new Error(`Expected 200, got ${response.status}: ${body}`);
    }
  });

  // Test 10: After logout, refresh fails
  await test("10. Refresh fails after logout", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginRefreshToken }),
    });

    if (response.status !== 401) {
      const body = await response.text();
      throw new Error(`Expected 401, got ${response.status}: ${body}`);
    }
  });

  // Print summary
  log("\n" + "=".repeat(70));
  log("TEST SUMMARY");
  log("=".repeat(70));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    const icon = result.passed ? "✓" : "✗";
    log(`${icon} ${result.name}: ${result.details}`);
  });

  log("=".repeat(70));
  log(`Total: ${results.length} tests | Passed: ${passed} | Failed: ${failed}`);
  log("=".repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  log("JWT Authentication Flow Test Suite");
  log("=".repeat(70));
  log(`Testing: ${BASE_URL}`);
  log(`Database: postgresql://postgres:postgres@localhost:13292/scorepion`);
  log("=".repeat(70));
  log("");

  // Wait for server
  log("Waiting for server to respond...");
  const serverReady = await waitForServer();

  if (!serverReady) {
    error("\nERROR: Server did not respond within 30 seconds");
    error(`Make sure the server is running:`);
    error(`  cd /sessions/lucid-elegant-heisenberg/mnt/scorepion`);
    error(`  npm run server:dev`);
    error(`\nAnd a PostgreSQL database is available at localhost:13292:`);
    error(`  docker run -d --name scorepion-db \\`);
    error(`    -e POSTGRES_PASSWORD=postgres \\`);
    error(`    -e POSTGRES_DB=scorepion \\`);
    error(`    -p 13292:5432 postgres:16-alpine`);
    process.exit(1);
  }

  log("");

  try {
    await runTests();
  } catch (err: any) {
    error(`\nFatal error: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
