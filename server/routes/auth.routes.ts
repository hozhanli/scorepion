/**
 * Auth routes — Firebase-backed.
 *
 * Login, registration (credential check + token issuance), refresh, and
 * logout are all handled client-side by the Firebase SDK. The server only:
 *
 *   - POST /api/auth/sync  → creates the local user profile row immediately
 *                            after Firebase signup. Idempotent.
 *   - GET  /api/auth/me    → returns the current user's profile.
 *
 * Account deletion lives in routes/account.routes.ts and uses the Admin SDK
 * to revoke the Firebase identity alongside the local rows.
 */
import { Router, Request, Response } from "express";
import { syncUserSchema } from "@shared/schema";
import * as authRepo from "../repositories/user-auth.repository";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

export const authRouter = Router();

/**
 * POST /api/auth/sync
 *
 * Called by the client right after a successful Firebase
 * createUserWithEmailAndPassword. Verifies the ID token, ensures username
 * uniqueness, and inserts the local profile row.
 *
 * Idempotent: if a row already exists for this UID, returns it. On username
 * conflict (409), the client deletes the just-created Firebase account and
 * prompts for a different username — see AuthContext.register.
 */
authRouter.post(
  "/sync",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = syncUserSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({ message: firstIssue?.message || "Invalid input" });
    }

    const { username, favoriteLeagues = [] } = parsed.data;
    const uid = req.userId!;
    const email = req.userEmail;

    if (!email) {
      // The Firebase project is configured for email/password only — a
      // missing email on the verified token is anomalous.
      return res.status(400).json({ message: "Email not present on Firebase account" });
    }

    const existing = await authRepo.getUserById(uid);
    if (existing) {
      return res.status(200).json({ user: existing });
    }

    const usernameTaken = await authRepo.getUserByUsername(username);
    if (usernameTaken) {
      return res.status(409).json({ message: "Username already taken" });
    }

    try {
      const user = await authRepo.createUser(uid, username, email, favoriteLeagues);
      return res.status(201).json({ user });
    } catch (err: any) {
      // Race: another request inserted the same username between our check
      // and our insert. Surface as 409 so the client can prompt for a
      // different username.
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Username already taken" });
      }
      throw err;
    }
  }),
);

/**
 * GET /api/auth/me
 * Returns the current user's profile.
 */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authRepo.getUserById(req.userId!);
    if (!user) {
      // Firebase user exists but no local profile — onboarding incomplete.
      // The client signs out and prompts the user to register again.
      return res.status(404).json({ message: "Profile not found", needsSync: true });
    }
    return res.json({ user });
  }),
);
