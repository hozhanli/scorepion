import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import * as groupService from "../services/group.service";
import * as groupRepo from "../repositories/group.repository";
import { logGroupActivity } from "../services/group-activity.service";
import { pool } from "../db";
import { asyncHandler } from "../middleware/asyncHandler";

export const groupsRouter = Router();

groupsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userGroups = await groupService.getUserGroups(req.userId!);
      return res.json(userGroups);
    } catch (err) {
      console.error("getUserGroups error:", err);
      return res.status(500).json({ message: "Failed to fetch user groups" });
    }
  }),
);

groupsRouter.get(
  "/discover",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const publicGroups = await groupService.getPublicGroups();
      return res.json(publicGroups);
    } catch (err) {
      console.error("getPublicGroups error:", err);
      return res.status(500).json({ message: "Failed to fetch public groups" });
    }
  }),
);

groupsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name, isPublic, leagueIds } = req.body;

      // Validate group name length
      if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 100) {
        return res.status(400).json({ message: "Group name must be between 1 and 100 characters" });
      }

      // Validate leagueIds array
      if (leagueIds !== undefined && leagueIds !== null) {
        if (!Array.isArray(leagueIds) || leagueIds.length > 50) {
          return res
            .status(400)
            .json({ message: "leagueIds must be an array with at most 50 items" });
        }
      }

      const group = await groupService.createGroup(
        name,
        isPublic ?? true,
        leagueIds || [],
        req.userId!,
      );
      return res.status(201).json(group);
    } catch (err: any) {
      if (err.name === "GroupError")
        return res.status(err.status || 400).json({ message: err.message });
      console.error("createGroup error:", err);
      return res.status(500).json({ message: "Failed to create group" });
    }
  }),
);

groupsRouter.post(
  "/:id/join",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const groupId = String(req.params.id ?? "").trim();
      if (!groupId || groupId.length > 50) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      await groupService.joinGroup(groupId, req.userId!);
      // Log to group activity feed
      try {
        await pool.query(
          `INSERT INTO group_activity (group_id, user_id, type, metadata, created_at)
                 VALUES (?, ?, 'joined', '{}', ?)`,
          [groupId, req.userId, Date.now()],
        );
      } catch (err: unknown) {
        if ((err as any).code !== "ER_NO_SUCH_TABLE") throw err;
        /* table may not exist yet — will be created on next migration run */
      }
      return res.json({ message: "Joined" });
    } catch (err: any) {
      if (err.name === "GroupError")
        return res.status(err.status || 400).json({ message: err.message });
      console.error("joinGroup error:", err);
      return res.status(500).json({ message: "Failed to join group" });
    }
  }),
);

groupsRouter.post(
  "/:id/leave",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const groupId = String(req.params.id ?? "").trim();
      if (!groupId || groupId.length > 50) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      await groupService.leaveGroup(groupId, req.userId!);
      return res.json({ message: "Left" });
    } catch (err: any) {
      if (err.name === "GroupError")
        return res.status(err.status || 400).json({ message: err.message });
      console.error("leaveGroup error:", err);
      return res.status(500).json({ message: "Failed to leave group" });
    }
  }),
);

groupsRouter.post(
  "/join-by-code",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (
        typeof code !== "string" ||
        code.length < 4 ||
        code.length > 12 ||
        !/^[A-Z0-9]+$/i.test(code)
      ) {
        return res.status(400).json({ message: "Invalid invite code format" });
      }
      const group = await groupService.joinGroupByCode(code, req.userId!);
      return res.json({ group });
    } catch (err: any) {
      if (err.name === "GroupError")
        return res.status(err.status || 400).json({ message: err.message });
      console.error("joinByCode error:", err);
      return res.status(500).json({ message: "Failed to join group" });
    }
  }),
);

groupsRouter.get(
  "/:id/standings",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const groupId = String(req.params.id ?? "").trim();
      if (!groupId || groupId.length > 50) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      const hasAccess = await groupRepo.canAccessGroup(groupId, req.userId!);
      if (!hasAccess) {
        return res.status(403).json({ message: "You do not have access to this group" });
      }
      const standings = await groupService.getGroupStandings(groupId);
      return res.json(standings);
    } catch (err) {
      console.error("getGroupStandings error:", err);
      return res.status(500).json({ message: "Failed to fetch standings" });
    }
  }),
);

groupsRouter.get(
  "/:id/predictions",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const groupId = String(req.params.id ?? "").trim();
      if (!groupId || groupId.length > 50) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      const hasAccess = await groupRepo.canAccessGroup(groupId, req.userId!);
      if (!hasAccess) {
        return res.status(403).json({ message: "You do not have access to this group" });
      }
      const preds = await groupService.getGroupPredictions(groupId);
      return res.json(preds);
    } catch (err) {
      console.error("getGroupPredictions error:", err);
      return res.status(500).json({ message: "Failed to fetch predictions" });
    }
  }),
);

groupsRouter.get(
  "/:id/activity",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const groupId = String(req.params.id ?? "").trim();
      if (!groupId || groupId.length > 50) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      const hasAccess = await groupRepo.canAccessGroup(groupId, req.userId!);
      if (!hasAccess) {
        return res.status(403).json({ message: "You do not have access to this group" });
      }
      const activity = await groupService.getGroupActivity(groupId);
      return res.json(activity);
    } catch (err) {
      console.error("Error fetching group activity:", err);
      return res.status(500).json({ message: "Failed to fetch group activity" });
    }
  }),
);
