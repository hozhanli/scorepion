import * as crypto from "crypto";

const BASE_URL = "http://localhost:13291";

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

const results: TestResult[] = [];

function generateRandomId(): string {
  return crypto.randomBytes(4).toString("hex");
}

async function registerUser(username: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

async function testEndpoint(
  name: string,
  method: string,
  path: string,
  token: string | null = null,
  body: Record<string, unknown> | null = null,
  expectedStatus: number | number[] = 200,
): Promise<void> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const statusesToCheck = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const passed = statusesToCheck.includes(response.status);

    let details = "";
    try {
      const responseBody = await response.text();
      if (responseBody) {
        details = `Response: ${responseBody.substring(0, 100)}`;
      }
    } catch {
      // Ignore
    }

    results.push({
      name,
      passed,
      expected: `${statusesToCheck.join(" or ")}`,
      actual: `${response.status}`,
      details,
    });
  } catch (error) {
    results.push({
      name,
      passed: false,
      expected: `${Array.isArray(expectedStatus) ? expectedStatus.join(" or ") : expectedStatus}`,
      actual: "ERROR",
      details: `${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function main() {
  console.log("Starting protected routes tests...\n");

  // Step 1: Register a user
  console.log("Step 1: Registering test user...");
  const username = `routetest_${generateRandomId()}`;
  const password = "RouteTest123";

  let accessToken: string;
  try {
    accessToken = await registerUser(username, password);
    console.log(`Successfully registered user: ${username}`);
    console.log(`Access token: ${accessToken.substring(0, 20)}...\n`);
  } catch (error) {
    console.error(`Failed to register user: ${error}`);
    process.exit(1);
  }

  // Step 2: Test protected endpoints WITH token (should return 200 or valid data)
  console.log("Step 2: Testing protected endpoints WITH Bearer token...");
  await testEndpoint(
    "GET /api/predictions (with token)",
    "GET",
    "/api/predictions",
    accessToken,
    null,
    [200, 400],
  );
  await testEndpoint(
    "GET /api/retention/chase?period=alltime (with token)",
    "GET",
    "/api/retention/chase?period=alltime",
    accessToken,
    null,
    [200, 400],
  );
  await testEndpoint(
    "GET /api/retention/achievements (with token)",
    "GET",
    "/api/retention/achievements",
    accessToken,
    null,
    [200, 400],
  );
  await testEndpoint(
    "GET /api/auth/me (with token)",
    "GET",
    "/api/auth/me",
    accessToken,
    null,
    [200, 400],
  );
  await testEndpoint(
    "GET /api/user/stats (with token)",
    "GET",
    "/api/user/stats",
    accessToken,
    null,
    [200, 400],
  );
  await testEndpoint(
    "GET /api/leaderboard (with token)",
    "GET",
    "/api/leaderboard",
    accessToken,
    null,
    [200, 400],
  );

  // Step 3: Test protected endpoints WITHOUT token (should return 401)
  console.log("\nStep 3: Testing protected endpoints WITHOUT Bearer token...");
  await testEndpoint(
    "GET /api/predictions (without token)",
    "GET",
    "/api/predictions",
    null,
    null,
    401,
  );
  await testEndpoint(
    "GET /api/retention/chase (without token)",
    "GET",
    "/api/retention/chase",
    null,
    null,
    401,
  );
  await testEndpoint(
    "GET /api/retention/achievements (without token)",
    "GET",
    "/api/retention/achievements",
    null,
    null,
    401,
  );
  await testEndpoint("GET /api/auth/me (without token)", "GET", "/api/auth/me", null, null, 401);
  await testEndpoint(
    "GET /api/user/stats (without token)",
    "GET",
    "/api/user/stats",
    null,
    null,
    401,
  );

  // Step 4: Test /api/leaderboard without token (should return 200 - public endpoint)
  console.log("\nStep 4: Testing public leaderboard endpoint...");
  await testEndpoint(
    "GET /api/leaderboard (without token - should be public)",
    "GET",
    "/api/leaderboard",
    null,
    null,
    200,
  );

  // Step 5: Test POST /api/predictions with Bearer token (should return 404, not 401)
  console.log("\nStep 5: Testing POST /api/predictions with Bearer token...");
  await testEndpoint(
    "POST /api/predictions (with token - should return 404)",
    "POST",
    "/api/predictions",
    accessToken,
    {
      matchId: "fake-match-123",
      homeScore: 1,
      awayScore: 0,
    },
    404,
  );

  // Print results
  console.log("\n" + "=".repeat(80));
  console.log("TEST RESULTS");
  console.log("=".repeat(80) + "\n");

  let passCount = 0;
  let failCount = 0;

  results.forEach((result) => {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`[${status}] ${result.name}`);
    if (!result.passed) {
      console.log(`      Expected: ${result.expected}, Got: ${result.actual}`);
      if (result.details) {
        console.log(`      ${result.details}`);
      }
      failCount++;
    } else {
      passCount++;
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed out of ${results.length} tests`);
  console.log("=".repeat(80));

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
