/**
 * Migration runner — applies SQL migrations in order on server startup.
 * Safe to re-run: tracks applied migrations in _migrations table.
 */
import { pool } from "../db";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = [
  "001_social_engine.sql",
  "002_fixture_detail.sql",
  "003_add_indexes.sql",
  "004_predictions_unique_constraint.sql",
  "005_refresh_tokens.sql",
  "006_h2h_league_and_venue.sql",
  "007_push_tokens.sql",
  "008_billing.sql",
  "009_missing_tables.sql",
  "010_add_cascades.sql",
];

export async function runMigrations(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        applied_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      )
    `);

    for (const file of MIGRATIONS) {
      const already = await pool.query(`SELECT 1 FROM _migrations WHERE name = $1`, [file]);
      if (already.rows.length > 0) {
        console.log(`[Migration] Already applied: ${file}`);
        continue;
      }

      console.log(`[Migration] Applying ${file}...`);
      const sql = readFileSync(join(__dirname, file), "utf-8");

      // Run migration in a transaction
      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(`INSERT INTO _migrations (name) VALUES ($1)`, [file]);
        await pool.query("COMMIT");
        console.log(`[Migration] ✓ ${file}`);
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    }
  } catch (err) {
    // Migrations are non-fatal in dev — server still starts
    console.error("[Migration] Error:", err);
    if (process.env.NODE_ENV === "production") throw err;
  }
}
