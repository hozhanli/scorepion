import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import * as userService from "../services/user.service";
import { asyncHandler } from "../middleware/asyncHandler";

export const profileRouter = Router();

profileRouter.get("/", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const user = await userService.getUserProfile(req.session.userId!);
        return res.json(user);
    } catch (err: any) {
        if (err.name === "UserError") return res.status(err.status || 404).json({ message: err.message });
        console.error("Profile GET error:", err);
        return res.status(500).json({ message: "Failed to fetch profile" });
    }
}));

profileRouter.put("/", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const updated = await userService.updateUserProfile(req.session.userId!, req.body);
        return res.json(updated);
    } catch (err: any) {
        if (err.name === "UserError") return res.status(err.status || 404).json({ message: err.message });
        console.error("Profile PUT error:", err);
        return res.status(500).json({ message: "Failed to update profile" });
    }
}));
