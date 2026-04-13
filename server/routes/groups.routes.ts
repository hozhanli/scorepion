import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import * as groupService from "../services/group.service";
import { logGroupActivity } from "../services/group-activity.service";
import { pool } from "../db";
import { asyncHandler } from "../middleware/asyncHandler";

export const groupsRouter = Router();

groupsRouter.get("/", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const userGroups = await groupService.getUserGroups(req.session.userId!);
        return res.json(userGroups);
    } catch (err) {
        console.error("getUserGroups error:", err);
        return res.status(500).json({ message: "Failed to fetch user groups" });
    }
}));

groupsRouter.get("/discover", asyncHandler(async (_req: Request, res: Response) => {
    try {
        const publicGroups = await groupService.getPublicGroups();
        return res.json(publicGroups);
    } catch (err) {
        console.error("getPublicGroups error:", err);
        return res.status(500).json({ message: "Failed to fetch public groups" });
    }
}));

groupsRouter.post("/", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { name, isPublic, leagueIds } = req.body;
        const group = await groupService.createGroup(name, isPublic ?? true, leagueIds || [], req.session.userId!);
        return res.status(201).json(group);
    } catch (err: any) {
        if (err.name === "GroupError") return res.status(err.status || 400).json({ message: err.message });
        console.error("createGroup error:", err);
        return res.status(500).json({ message: "Failed to create group" });
    }
}));

groupsRouter.post("/:id/join", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id as string;
        await groupService.joinGroup(groupId, req.session.userId!);
        // Log to group activity feed
        try {
            await pool.query(
                `INSERT INTO group_activity (group_id, user_id, type, metadata, created_at)
                 VALUES ($1, $2, 'joined', '{}', $3)`,
                [groupId, req.session.userId, Date.now()]
            );
        } catch { /* table may not exist yet — will be created on next migration run */ }
        return res.json({ message: "Joined" });
    } catch (err: any) {
        if (err.name === "GroupError") return res.status(err.status || 400).json({ message: err.message });
        console.error("joinGroup error:", err);
        return res.status(500).json({ message: "Failed to join group" });
    }
}));

groupsRouter.post("/:id/leave", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id as string;
        await groupService.leaveGroup(groupId, req.session.userId!);
        return res.json({ message: "Left" });
    } catch (err: any) {
        if (err.name === "GroupError") return res.status(err.status || 400).json({ message: err.message });
        console.error("leaveGroup error:", err);
        return res.status(500).json({ message: "Failed to leave group" });
    }
}));

groupsRouter.post("/join-by-code", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const group = await groupService.joinGroupByCode(code, req.session.userId!);
        return res.json({ group });
    } catch (err: any) {
        if (err.name === "GroupError") return res.status(err.status || 400).json({ message: err.message });
        console.error("joinByCode error:", err);
        return res.status(500).json({ message: "Failed to join group" });
    }
}));

groupsRouter.get("/:id/standings", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id as string;
        const standings = await groupService.getGroupStandings(groupId);
        return res.json(standings);
    } catch (err) {
        console.error("getGroupStandings error:", err);
        return res.status(500).json({ message: "Failed to fetch standings" });
    }
}));

groupsRouter.get("/:id/predictions", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id as string;
        const preds = await groupService.getGroupPredictions(groupId);
        return res.json(preds);
    } catch (err) {
        console.error("getGroupPredictions error:", err);
        return res.status(500).json({ message: "Failed to fetch predictions" });
    }
}));

groupsRouter.get("/:id/activity", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const groupId = req.params.id as string;
        const activity = await groupService.getGroupActivity(groupId);
        return res.json(activity);
    } catch (err) {
        console.error("Error fetching group activity:", err);
        return res.status(500).json({ message: "Failed to fetch group activity" });
    }
}));
