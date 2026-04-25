import { Router, Request, Response } from "express";
import { authSchema } from "@shared/schema";
import * as authRepo from "../repositories/user-auth.repository";
import * as authService from "../services/auth.service";
import * as tokenService from "../services/token.service";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Creates a new user and issues JWT token pair.
 */
authRouter.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
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

      const accessToken = await tokenService.signAccessToken(user.id, user.username);
      const refreshToken = await tokenService.createRefreshToken(user.id);

      return res.status(201).json({
        user: safeUser,
        accessToken,
        refreshToken,
      });
    } catch (err: any) {
      if (err.name === "AuthError") {
        return res.status(err.status || 400).json({ message: err.message });
      }
      throw err;
    }
  }),
);

/**
 * POST /api/auth/login
 * Authenticates and issues JWT token pair.
 */
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

      const accessToken = await tokenService.signAccessToken(user.id, user.username);
      const refreshToken = await tokenService.createRefreshToken(user.id);

      return res.status(200).json({
        user: safeUser,
        accessToken,
        refreshToken,
      });
    } catch (err: any) {
      if (err.name === "AuthError") {
        return res.status(err.status || 401).json({ message: err.message });
      }
      throw err;
    }
  }),
);

/**
 * POST /api/auth/refresh
 * Rotates refresh token and issues new token pair.
 * This is the only endpoint that accepts a refresh token.
 */
authRouter.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({ message: "Refresh token required" });
    }

    try {
      const result = await tokenService.rotateRefreshToken(refreshToken);

      return res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err: any) {
      if (err.name === "TokenError") {
        return res.status(err.status || 401).json({ message: err.message });
      }
      throw err;
    }
  }),
);

/**
 * GET /api/auth/me
 * Returns the current user's profile (requires valid access token).
 */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authRepo.getUserById(req.userId!);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  }),
);

/**
 * POST /api/auth/logout
 * Revokes all refresh tokens for the user.
 */
authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await tokenService.revokeAllUserTokens(req.userId!);
    return res.json({ message: "Logged out" });
  }),
);
