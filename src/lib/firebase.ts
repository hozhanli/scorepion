/**
 * Firebase client singleton.
 *
 * @react-native-firebase auto-initializes the default app from the bundled
 * `google-services.json` (Android) — no explicit `initializeApp` call is
 * needed. This file just centralizes the auth instance export so the rest
 * of the codebase has one canonical source.
 */

import { getAuth } from "@react-native-firebase/auth";

export const auth = getAuth();

/**
 * Map a Firebase auth error code to the existing `AuthErrorKey` shape used
 * by the auth screen translations. Keeping the mapping centralized here so
 * UI code stays free of Firebase-specific strings.
 */
export type AuthErrorKey =
  | "networkError"
  | "wrongCredentials"
  | "usernameTaken"
  | "emailTaken"
  | "emailInvalid"
  | "weakPassword"
  | "userNotFound"
  | "tooManyAttempts"
  | "loginFailed"
  | "registerFailed"
  | "resetEmailFailed"
  | "generic";

export function firebaseErrorToKey(
  error: unknown,
  context: "login" | "register" | "reset",
): AuthErrorKey {
  const code: string | undefined = (error as any)?.code;
  switch (code) {
    case "auth/network-request-failed":
      return "networkError";
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "wrongCredentials";
    case "auth/user-not-found":
      return "userNotFound";
    case "auth/email-already-in-use":
      return "emailTaken";
    case "auth/invalid-email":
      return "emailInvalid";
    case "auth/weak-password":
      return "weakPassword";
    case "auth/too-many-requests":
      return "tooManyAttempts";
    default:
      if (context === "login") return "loginFailed";
      if (context === "register") return "registerFailed";
      return "resetEmailFailed";
  }
}
