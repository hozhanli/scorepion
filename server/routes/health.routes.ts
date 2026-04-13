import { Router, Request, Response } from "express";
import { pool } from "../db";
import { getApiPlan, getRemainingRequests } from "../services/football-api";

export const healthRouter = Router();

healthRouter.get("/", async (req: Request, res: Response) => {
  try {
    // Check database connection
    const result = await pool.query("SELECT NOW()");
    const dbConnected = !!result.rows.length;

    // Calculate uptime
    const uptime = process.uptime();

    // Get API plan and remaining requests
    const apiPlan = getApiPlan();
    const remainingRequests = getRemainingRequests();

    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        minutes: Math.floor(uptime / 60),
        hours: Math.floor(uptime / 3600),
      },
      database: {
        connected: dbConnected,
      },
      api: {
        plan: apiPlan,
        remainingRequests,
      },
    });
  } catch (error) {
    console.error("[Health Check] Error:", error);
    return res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Failed to retrieve health status",
    });
  }
});
