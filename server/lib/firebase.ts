/**
 * Firebase Admin SDK accessor.
 *
 * Used server-side to verify Firebase ID tokens and manage user identities
 * (see `middleware/auth.ts`, `routes/account.routes.ts`). Initialization is
 * lazy and idempotent — the first call wires up the SDK using credentials
 * from one of:
 *
 *   - `FIREBASE_SERVICE_ACCOUNT_JSON`  — full service account JSON inlined
 *     into an env var (preferred in containers / CI where filesystem access
 *     is awkward).
 *   - `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to a service account
 *     JSON on disk. The Admin SDK reads it via `applicationDefault()`.
 */

import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let cached: Auth | null = null;

function init(): Auth {
  if (cached) return cached;

  if (getApps().length === 0) {
    const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (inlineJson) {
      let parsed: { project_id?: string };
      try {
        parsed = JSON.parse(inlineJson);
      } catch (err) {
        throw new Error(
          `FIREBASE_SERVICE_ACCOUNT_JSON is set but not valid JSON: ${(err as Error).message}`,
        );
      }
      initializeApp({ credential: cert(parsed as object), projectId: parsed.project_id });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  }

  cached = getAuth();
  return cached;
}

/**
 * Returns the Firebase Auth admin instance, initializing the SDK on first call.
 * Prefer this over caching the return value — the function is cheap after the
 * first call and keeps initialization order explicit at every call site.
 */
export function firebaseAuth(): Auth {
  return init();
}
