import type { Express, Request, Response } from "express";
import { pool } from "../db";

export function registerHealthRoutes(app: Express) {
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/health/ready", async (_req: Request, res: Response) => {
    try {
      await pool.query("SELECT 1");
      res.status(200).json({ status: "ready", db: "up" });
    } catch (err) {
      res.status(503).json({
        status: "not_ready",
        db: "down",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
