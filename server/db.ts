import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || "20"),
  idleTimeout: 30000,
});

export const db = drizzle(pool, { schema });
export { pool };
