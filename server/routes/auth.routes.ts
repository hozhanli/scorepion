import { Router, Request, Response } from "express";
import { authSchema } from "@shared/schema";
import * as authRepo from "../repositories/user-auth.repository";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../middleware/asyncHandler";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      // Surface the first Zod error for better UX
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({ message: firstIssue?.message || "Invalid input" });
    }

    const { username, password } = parsed.data;
    const favoriteLeagues: string[] = req.body.favoriteLeagues || [];

    try {
      const { user, safeUser } = await authService.registerUser(
        username,
        password,
        favoriteLeagues,
      );

      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });

      return res.status(201).json({ user: safeUser });
    } catch (err: any) {
      if (err.name === "AuthError") {
        return res.status(err.status || 400).json({ message: err.message });
      }
      throw err;
    }
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { username, password } = parsed.data;

    try {
      const { user, safeUser } = await authService.authenticateUser(username, password);

      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });

      return res.status(200).json({ user: safeUser });
    } catch (err: any) {
      if (err.name === "AuthError") {
        return res.status(err.status || 401).json({ message: err.message });
      }
      throw err;
    }
  }),
);

authRouter.get(
  "/me",
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await authRepo.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  }),
);

authRouter.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});
