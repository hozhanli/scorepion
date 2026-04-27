#!/usr/bin/env npx tsx
/**
 * month-simulation.ts — Simulates 30 days of Scorepion usage with 5 user personas.
 *
 * Orchestrates:
 *   1. Full DB reset (drop all → drizzle push → migrations → seed)
 *   2. Real data sync from API-Football (if key present)
 *   3. 30-day simulation with 5 concurrent personas
 *   4. Evaluation report per persona + overall system health
 *
 * Run:
 *   # Terminal 1: Start server
 *   npm run dev
 *
 *   # Terminal 2: Run simulation
 *   npx tsx scripts/month-simulation.ts
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import { execSync } from "child_process";

const DATABASE_URL = process.env.DATABASE_URL!;
const PORT = process.env.PORT || "13291";
const BASE = `http://localhost:${PORT}`;

const pool = mysql.createPool(DATABASE_URL);

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const DAY = 86_400_000;
const now = Date.now();

interface PersonaReport {
  name: string;
  role: string;
  daysActive: number;
  predictionsSubmitted: number;
  predictionsUpdated: number;
  predictionsSettled: number;
  pointsEarned: number;
  groupsJoined: number;
  streakMax: number;
  errors: string[];
  uxIssues: string[];
  rating: number; // 1-10
  verdict: string;
}

let sessionCookies: Record<string, string> = {};

async function api(persona: string, method: string, path: string, body?: any) {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (sessionCookies[persona]) headers["Cookie"] = sessionCookies[persona];

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) sessionCookies[persona] = setCookie.split(";")[0];

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

function log(msg: string) {
  console.log(`    ${msg}`);
}
function section(title: string) {
  console.log(`\n${"━".repeat(64)}`);
  console.log(`  ${title}`);
  console.log(`${"━".repeat(64)}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 1: Full DB Reset
// ═══════════════════════════════════════════════════════════════════════════

async function resetAndSeed() {
  section("PHASE 1 — Database Reset & Seed");

  log("Dropping all tables...");
  await pool.query(`SET FOREIGN_KEY_CHECKS = 0`);
  const [tables] = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()`,
  );
  for (const row of tables as any[]) {
    await pool.query(`DROP TABLE IF EXISTS \`${row.table_name}\``);
  }
  await pool.query(`SET FOREIGN_KEY_CHECKS = 1`);
  log("✓ All tables dropped");

  log("Pushing Drizzle schema...");
  try {
    execSync("npx drizzle-kit push --force 2>&1", { cwd: process.cwd(), stdio: "pipe" });
    log("✓ Schema pushed");
  } catch (e: any) {
    log("Schema push output: " + (e.stdout?.toString()?.slice(-200) || e.message));
  }

  log("Running SQL migrations...");
  const { runMigrations } = await import("../server/migrations/runner");
  await runMigrations();
  log("✓ Migrations applied");

  // Verify unique constraint
  const [idxRows] = await pool.query(
    `SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'predictions' AND index_name = 'predictions_user_match_uniq' LIMIT 1`,
  );
  if ((idxRows as any[]).length === 0) {
    await pool.query(
      `CREATE UNIQUE INDEX predictions_user_match_uniq ON predictions (user_id, match_id)`,
    );
    log("✓ predictions_user_match_uniq created manually");
  } else {
    log("✓ predictions_user_match_uniq verified");
  }

  log("Seeding dev data...");
  try {
    execSync("npx tsx scripts/seed-dev-data.ts 2>&1", { cwd: process.cwd(), stdio: "pipe" });
    log("✓ Dev data seeded");
  } catch (e: any) {
    log("Seed output: " + (e.stdout?.toString()?.slice(-200) || e.message));
  }

  // Sync real data if API key available
  if (process.env.FOOTBALL_API_KEY && process.env.FOOTBALL_API_KEY !== "your-api-key-here") {
    log("Syncing real data from API-Football...");
    try {
      const sync = await import("../server/services/sync");
      await sync.seedLeagues();
      for (const lid of ["pl", "la", "sa"]) {
        try {
          await sync.syncFixturesForLeague(lid);
        } catch {}
        try {
          await sync.syncStandingsForLeague(lid);
        } catch {}
        try {
          await sync.syncTopScorersForLeague(lid);
        } catch {}
      }
      log("✓ Real data synced");
    } catch (e: any) {
      log(`⚠ Real data sync partial: ${e.message}`);
    }
  }

  // Generate extra fixtures spanning the full month for simulation
  log("Generating 30-day fixture spread for simulation...");
  const [teamRows] = await pool.query(`SELECT api_football_id FROM football_teams LIMIT 40`);
  const teamIds = (teamRows as any[]).map((r) => r.api_football_id);
  let fid = 900000;

  for (let day = -7; day <= 30; day++) {
    const date = new Date(now + day * DAY);
    const hours = [13, 16, 18, 20][Math.abs(day) % 4];
    date.setHours(hours, 0, 0, 0);

    const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
    const matchCount = day <= 0 ? 4 : day % 7 === 0 ? 6 : 3; // more on weekends

    for (let m = 0; m < matchCount && m * 2 + 1 < shuffled.length; m++) {
      const home = shuffled[m * 2];
      const away = shuffled[m * 2 + 1];
      const isFinished = day < 0;
      const hs = isFinished ? Math.floor(Math.random() * 4) : null;
      const as = isFinished ? Math.floor(Math.random() * 3) : null;

      await pool.query(
        `
        INSERT IGNORE INTO football_fixtures (api_fixture_id, league_id, home_team_id, away_team_id,
          home_score, away_score, status, status_short, minute, kickoff, venue, referee, round, season, updated_at)
        VALUES (?, 'pl', ?, ?, ?, ?, ?, ?, ?, ?, 'Stadium', 'Referee', 'Sim', 2024, ?)
      `,
        [
          fid++,
          home,
          away,
          hs,
          as,
          isFinished ? "finished" : "upcoming",
          isFinished ? "FT" : "NS",
          isFinished ? 90 : null,
          date.toISOString(),
          now,
        ],
      );
    }
  }
  log("✓ 30-day fixture spread generated");

  const [statsRows] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM football_fixtures) as fixtures,
      (SELECT COUNT(*) FROM football_fixtures WHERE status='upcoming') as upcoming,
      (SELECT COUNT(*) FROM football_fixtures WHERE status='finished') as finished,
      (SELECT COUNT(*) FROM football_teams) as teams,
      (SELECT COUNT(*) FROM football_leagues) as leagues
  `);
  const s = (statsRows as any[])[0];
  log(
    `DB: ${s.leagues} leagues, ${s.teams} teams, ${s.fixtures} fixtures (${s.upcoming} upcoming, ${s.finished} finished)`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 2: Persona Definitions
// ═══════════════════════════════════════════════════════════════════════════

interface Persona {
  name: string;
  username: string;
  role: string;
  activityLevel: number; // 0-1, chance of being active on a given day
  predictionAccuracy: number; // 0-1, how often they predict close to actual
  updatesOften: boolean;
  joinsGroups: boolean;
  checkLeaderboard: boolean;
}

const PERSONAS: Persona[] = [
  {
    name: "Ali (Casual Fan)",
    username: "ali_casual_" + Date.now(),
    role: "Casual user who checks the app 3-4 times a week",
    activityLevel: 0.5,
    predictionAccuracy: 0.3,
    updatesOften: false,
    joinsGroups: false,
    checkLeaderboard: true,
  },
  {
    name: "Mehmet (Power User)",
    username: "mehmet_power_" + Date.now(),
    role: "Daily power user, predicts every match, updates scores, joins groups",
    activityLevel: 0.95,
    predictionAccuracy: 0.5,
    updatesOften: true,
    joinsGroups: true,
    checkLeaderboard: true,
  },
  {
    name: "Ayşe (Weekend Warrior)",
    username: "ayse_weekend_" + Date.now(),
    role: "Only uses on match days (weekends), makes 3-5 predictions",
    activityLevel: 0.3,
    predictionAccuracy: 0.4,
    updatesOften: false,
    joinsGroups: true,
    checkLeaderboard: false,
  },
  {
    name: "Carlos (International Fan)",
    username: "carlos_intl_" + Date.now(),
    role: "Follows La Liga + PL, very active, tests multi-league features",
    activityLevel: 0.85,
    predictionAccuracy: 0.6,
    updatesOften: true,
    joinsGroups: true,
    checkLeaderboard: true,
  },
  {
    name: "Yuki (New User)",
    username: "yuki_new_" + Date.now(),
    role: "Just downloaded the app, exploring features, makes mistakes",
    activityLevel: 0.7,
    predictionAccuracy: 0.2,
    updatesOften: false,
    joinsGroups: false,
    checkLeaderboard: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Phase 3: Month-long Simulation
// ═══════════════════════════════════════════════════════════════════════════

async function simulateMonth() {
  section("PHASE 2 — Registering 5 Personas");

  for (const p of PERSONAS) {
    const { status, data } = await api(p.username, "POST", "/api/auth/register", {
      username: p.username,
      password: "test1234",
    });
    if (status === 200 || status === 201) {
      log(`✓ ${p.name} registered (${p.username})`);
    } else {
      log(`✗ ${p.name} registration failed: ${status} ${JSON.stringify(data)}`);
    }

    // Set favorite leagues
    await api(p.username, "PUT", "/api/profile", { favoriteLeagues: ["pl", "la"] });
  }

  section("PHASE 3 — Simulating 30 Days of Usage");

  const reports: PersonaReport[] = PERSONAS.map((p) => ({
    name: p.name,
    role: p.role,
    daysActive: 0,
    predictionsSubmitted: 0,
    predictionsUpdated: 0,
    predictionsSettled: 0,
    pointsEarned: 0,
    groupsJoined: 0,
    streakMax: 0,
    errors: [],
    uxIssues: [],
    rating: 0,
    verdict: "",
  }));

  // Get all fixtures sorted by date
  const [allFixtureRows] = await pool.query(`
    SELECT api_fixture_id, home_team_id, away_team_id, home_score, away_score,
           status, kickoff
    FROM football_fixtures
    ORDER BY kickoff ASC
  `);

  const upcomingPool = (allFixtureRows as any[]).filter((f) => f.status === "upcoming");
  const finishedPool = (allFixtureRows as any[]).filter((f) => f.status === "finished");

  // Simulate day by day
  for (let day = 1; day <= 30; day++) {
    const isWeekend = day % 7 === 0 || day % 7 === 6;
    const dayLabel = `Day ${String(day).padStart(2, "0")}`;

    // Get fixtures available for this "day" (pick from upcoming pool)
    const dayFixtures = upcomingPool.splice(0, isWeekend ? 5 : 3);

    let dayActivity = "";

    for (let pi = 0; pi < PERSONAS.length; pi++) {
      const persona = PERSONAS[pi];
      const report = reports[pi];

      // Decide if this persona is active today
      const activeChance = isWeekend ? persona.activityLevel + 0.2 : persona.activityLevel;
      if (Math.random() > activeChance) continue;

      report.daysActive++;

      // ── Browse fixtures ──
      const { status: fixStatus } = await api(persona.username, "GET", "/api/football/fixtures");
      if (fixStatus !== 200) {
        report.errors.push(`${dayLabel}: GET /fixtures returned ${fixStatus}`);
      }

      // ── Make predictions ──
      const predCount = Math.min(dayFixtures.length, persona.activityLevel > 0.8 ? 5 : 2);
      for (let fi = 0; fi < predCount && fi < dayFixtures.length; fi++) {
        const fix = dayFixtures[fi];
        const matchId = String(fix.api_fixture_id);
        const hs = Math.floor(Math.random() * 4);
        const as = Math.floor(Math.random() * 3);

        const { status: predStatus, data: predData } = await api(
          persona.username,
          "POST",
          "/api/predictions",
          { matchId, homeScore: hs, awayScore: as },
        );

        if (predStatus === 200) {
          report.predictionsSubmitted++;
        } else if (predStatus === 403) {
          // Match already started — expected
        } else {
          report.errors.push(
            `${dayLabel}: POST /predictions ${matchId} → ${predStatus}: ${JSON.stringify(predData)?.slice(0, 80)}`,
          );
        }

        // Update prediction (if this persona updates often)
        if (persona.updatesOften && Math.random() > 0.5) {
          const newHs = Math.floor(Math.random() * 4);
          const newAs = Math.floor(Math.random() * 3);
          const { status: upStatus, data: upData } = await api(
            persona.username,
            "POST",
            "/api/predictions",
            { matchId, homeScore: newHs, awayScore: newAs },
          );
          if (upStatus === 200) {
            report.predictionsUpdated++;
          } else if (upStatus !== 403) {
            report.errors.push(
              `${dayLabel}: UPDATE prediction ${matchId} → ${upStatus}: ${JSON.stringify(upData)?.slice(0, 80)}`,
            );
          }
        }
      }

      // ── Check leaderboard ──
      if (persona.checkLeaderboard) {
        const { status: lbStatus } = await api(persona.username, "GET", "/api/leaderboard");
        if (lbStatus !== 200) {
          report.errors.push(`${dayLabel}: GET /leaderboard → ${lbStatus}`);
        }
      }

      // ── Join a group (once) ──
      if (persona.joinsGroups && report.groupsJoined === 0 && day <= 5) {
        const { data: groups } = await api(persona.username, "GET", "/api/groups/discover");
        if (Array.isArray(groups) && groups.length > 0 && groups[0].code) {
          const { status: joinStatus } = await api(
            persona.username,
            "POST",
            "/api/groups/join-by-code",
            { code: groups[0].code },
          );
          if (joinStatus === 200 || joinStatus === 201) {
            report.groupsJoined++;
          }
        }
      }

      // ── Check profile / stats ──
      if (day % 5 === 0) {
        const { status: statsStatus, data: statsData } = await api(
          persona.username,
          "GET",
          "/api/user/stats",
        );
        if (statsStatus === 200 && statsData) {
          report.pointsEarned = statsData.totalPoints || 0;
          report.streakMax = Math.max(report.streakMax, statsData.bestStreak || 0);
        }
      }

      // ── Retention: daily pack ──
      if (dayFixtures.length > 0) {
        const { status: dpStatus } = await api(
          persona.username,
          "POST",
          "/api/retention/daily-pack/complete",
          { matchId: String(dayFixtures[0].api_fixture_id) },
        );
        // 404 = no pack for today, expected and not an error
        if (dpStatus !== 200 && dpStatus !== 404) {
          report.errors.push(`${dayLabel}: daily-pack/complete → ${dpStatus}`);
        }
      }

      // ── Yuki-specific: test error paths ──
      if (persona.name.includes("Yuki") && day <= 3) {
        // Try submitting with missing fields
        const { status: badStatus } = await api(persona.username, "POST", "/api/predictions", {
          matchId: "999",
        });
        if (badStatus !== 400) {
          report.uxIssues.push(`Missing field validation: expected 400, got ${badStatus}`);
        }

        // Try accessing without login
        const savedCookie = sessionCookies[persona.username];
        sessionCookies[persona.username] = "";
        const { status: noAuthStatus } = await api(persona.username, "GET", "/api/profile");
        sessionCookies[persona.username] = savedCookie;
        if (noAuthStatus !== 401) {
          report.uxIssues.push(`Unauthed /profile: expected 401, got ${noAuthStatus}`);
        }
      }

      dayActivity += `${persona.name.split(" ")[0]} `;
    }

    // ── Settle finished fixtures (simulate server cron every 5 days) ──
    if (day % 5 === 0 && finishedPool.length > 0) {
      const batch = finishedPool.splice(0, 10);
      for (const fix of batch) {
        if (fix.home_score == null) continue;
        // Manually settle predictions for this fixture
        const [predRows] = await pool.query(
          `SELECT id, user_id, home_score, away_score FROM predictions WHERE match_id = ? AND settled = false`,
          [String(fix.api_fixture_id)],
        );
        for (const pred of predRows as any[]) {
          let pts = 0;
          const exactMatch =
            pred.home_score === fix.home_score && pred.away_score === fix.away_score;
          const correctResult =
            Math.sign(pred.home_score - pred.away_score) ===
            Math.sign(fix.home_score - fix.away_score);
          const correctDiff = pred.home_score - pred.away_score === fix.home_score - fix.away_score;

          if (exactMatch) pts = 10;
          else if (correctResult && correctDiff) pts = 8;
          else if (correctResult) pts = 5;
          else if (correctDiff) pts = 3;

          await pool.query(`UPDATE predictions SET settled = true, points = ? WHERE id = ?`, [
            pts,
            pred.id,
          ]);
          await pool.query(`UPDATE users SET total_points = total_points + ? WHERE id = ?`, [
            pts,
            pred.user_id,
          ]);

          // Track in reports
          for (const r of reports) {
            const persona = PERSONAS[reports.indexOf(r)];
            if (sessionCookies[persona.username]) {
              // We don't have userId mapped to persona easily, but we'll get final stats later
            }
          }
        }
      }
    }

    // Progress indicator
    const bar = "█".repeat(Math.floor((day / 30) * 20)).padEnd(20, "░");
    process.stdout.write(`\r  [${bar}] Day ${day}/30 — Active: ${dayActivity.trim() || "none"}`);
  }

  console.log("\n");

  // ── Collect final stats for each persona ──
  section("PHASE 4 — Collecting Final Stats");

  for (let pi = 0; pi < PERSONAS.length; pi++) {
    const persona = PERSONAS[pi];
    const report = reports[pi];

    const { data: stats } = await api(persona.username, "GET", "/api/user/stats");
    if (stats) {
      report.pointsEarned = stats.totalPoints || 0;
      report.streakMax = Math.max(report.streakMax, stats.bestStreak || 0);
    }

    const { data: preds } = await api(persona.username, "GET", "/api/predictions");
    if (Array.isArray(preds)) {
      report.predictionsSettled = preds.filter((p: any) => p.settled).length;
    }

    // Generate rating and verdict
    const errorRate = report.errors.length / Math.max(report.daysActive, 1);
    if (errorRate === 0) report.rating = 9;
    else if (errorRate < 0.1) report.rating = 8;
    else if (errorRate < 0.3) report.rating = 6;
    else if (errorRate < 0.5) report.rating = 4;
    else report.rating = 2;

    // Adjust for UX issues
    report.rating = Math.max(1, report.rating - report.uxIssues.length);

    // Verdict
    if (report.rating >= 8) report.verdict = "Excellent experience. App works reliably.";
    else if (report.rating >= 6) report.verdict = "Good but with occasional hiccups.";
    else if (report.rating >= 4) report.verdict = "Usable but frustrating at times.";
    else report.verdict = "Poor experience — needs significant fixes.";
  }

  return reports;
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Report
// ═══════════════════════════════════════════════════════════════════════════

function printReport(reports: PersonaReport[]) {
  section("FINAL EVALUATION REPORT — 30-Day Simulation");

  for (const r of reports) {
    console.log(`\n  ┌─ ${r.name} (${r.role})`);
    console.log(`  │  Days active:        ${r.daysActive}/30`);
    console.log(`  │  Predictions made:   ${r.predictionsSubmitted}`);
    console.log(`  │  Predictions updated: ${r.predictionsUpdated}`);
    console.log(`  │  Predictions settled: ${r.predictionsSettled}`);
    console.log(`  │  Points earned:      ${r.pointsEarned}`);
    console.log(`  │  Groups joined:      ${r.groupsJoined}`);
    console.log(`  │  Best streak:        ${r.streakMax}`);
    console.log(`  │  Errors encountered: ${r.errors.length}`);
    if (r.errors.length > 0) {
      const shown = r.errors.slice(0, 5);
      shown.forEach((e) => console.log(`  │    ⚠ ${e}`));
      if (r.errors.length > 5) console.log(`  │    ... and ${r.errors.length - 5} more`);
    }
    if (r.uxIssues.length > 0) {
      console.log(`  │  UX Issues:`);
      r.uxIssues.forEach((i) => console.log(`  │    ⚠ ${i}`));
    }
    console.log(
      `  │  Rating:  ${"★".repeat(r.rating)}${"☆".repeat(10 - r.rating)} (${r.rating}/10)`,
    );
    console.log(`  └─ Verdict: ${r.verdict}`);
  }

  // Overall summary
  const avgRating = reports.reduce((sum, r) => sum + r.rating, 0) / reports.length;
  const totalErrors = reports.reduce((sum, r) => sum + r.errors.length, 0);
  const totalPredictions = reports.reduce((sum, r) => sum + r.predictionsSubmitted, 0);
  const totalUpdates = reports.reduce((sum, r) => sum + r.predictionsUpdated, 0);

  console.log(`\n${"━".repeat(64)}`);
  console.log(`  OVERALL SYSTEM SCORE: ${avgRating.toFixed(1)}/10`);
  console.log(`${"━".repeat(64)}`);
  console.log(`  Total predictions:  ${totalPredictions} submitted, ${totalUpdates} updated`);
  console.log(`  Total errors:       ${totalErrors} across ${reports.length} personas`);
  console.log(`  Error categories:`);

  // Categorize errors
  const errorCats: Record<string, number> = {};
  for (const r of reports) {
    for (const e of r.errors) {
      const cat = e.includes("500")
        ? "Server 500"
        : e.includes("403")
          ? "Auth/Lock"
          : e.includes("400")
            ? "Validation"
            : e.includes("404")
              ? "Not Found"
              : e.includes("predictions")
                ? "Prediction"
                : "Other";
      errorCats[cat] = (errorCats[cat] || 0) + 1;
    }
  }
  for (const [cat, count] of Object.entries(errorCats)) {
    console.log(`    ${cat}: ${count}`);
  }

  console.log(`\n  Key Findings:`);
  if (totalErrors === 0) {
    console.log(`    ✓ Zero errors across all personas — system is stable`);
  }
  if (totalUpdates > 0) {
    console.log(`    ✓ Prediction updates (upsert) working correctly`);
  }
  const uniqueUx = [...new Set(reports.flatMap((r) => r.uxIssues))];
  if (uniqueUx.length > 0) {
    console.log(`    ⚠ UX Issues found:`);
    uniqueUx.forEach((i) => console.log(`      - ${i}`));
  }

  console.log(`\n${"━".repeat(64)}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  SCOREPION — 30-Day Mock Simulation (5 Personas)           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  // Preflight: check server
  try {
    const res = await fetch(`${BASE}/health`);
    if (!res.ok) throw new Error(`${res.status}`);
    log(`Server running at ${BASE}`);
  } catch {
    console.error(`\n  ✗ Server not reachable at ${BASE}`);
    console.error("    Start: npm run dev   then re-run this script.\n");
    process.exit(1);
  }

  await resetAndSeed();
  const reports = await simulateMonth();
  printReport(reports);

  await pool.end();
  process.exit(reports.some((r) => r.rating < 4) ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
