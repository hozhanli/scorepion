# Firebase Auth

Migration 012 replaced the in-house JWT auth with Firebase Authentication
(email/password). This document covers local/QA testing, production readiness,
and the deploy-day runbook.

> **iOS is intentionally out of scope** for this round. The native iOS
> module is not configured and `app.json` does not register
> `GoogleService-Info.plist`. Reintroducing iOS only requires adding the
> plist + bundle id back to Firebase and `app.json` -- no schema/server
> changes are needed (see L2 in the Production Checklist below).

Companion docs:

- [DEPLOYMENT.md](./DEPLOYMENT.md) -- generic deploy runbook
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) -- auth-failure runbook

---

## 1. Prerequisites

### Firebase project

| Item            | Value                            |
| --------------- | -------------------------------- |
| Project ID      | `scorepion-7b110`                |
| Android package | `com.coodehub.scorepion`         |
| Auth provider   | Email/Password (already enabled) |
| Email templates | Default                          |

### Files in your environment (NOT committed)

| File                                                                | Purpose                                    |
| ------------------------------------------------------------------- | ------------------------------------------ |
| `./google-services.json`                                            | Android client config (already gitignored) |
| `~/Desktop/scorepion-7b110-firebase-adminsdk-atvkj-b86c589483.json` | Server Admin SDK credentials               |

---

## 2. Server Setup

### 2a. Environment variables (`.env`)

Add the following to your local `.env`:

```bash
# Firebase
FIREBASE_PROJECT_ID=scorepion-7b110
GOOGLE_APPLICATION_CREDENTIALS=/Users/halilibrahimozhanli/Desktop/scorepion-7b110-firebase-adminsdk-atvkj-b86c589483.json

# Remove (no longer required)
# JWT_SECRET=...
```

**Alternative for production / containers:** instead of a file path, paste
the JSON inline as `FIREBASE_SERVICE_ACCOUNT_JSON='{...}'`. The server
prefers `FIREBASE_SERVICE_ACCOUNT_JSON` when both are set.

### 2b. Run the server

```bash
npm run dev:server   # or whatever script starts the Express server
```

You should see:

```
[env] validated (development mode)
[Migration] Applying 012_firebase_auth.sql...
[Migration] Done: 012_firebase_auth.sql
```

> **Migration 012 truncates all user-related tables** (`users`,
> `predictions`, `groups`, etc.). Only run it on a database with no
> production data.

### 2c. Quick server-side smoke test (no app needed)

1. In Firebase Console -> Authentication, manually create a test user
   (e.g. `qa@scorepion.fans` / `Password123!`).
2. Get an ID token by calling Firebase REST:
   ```bash
   curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<WEB_API_KEY>" \
     -H 'Content-Type: application/json' \
     -d '{"email":"qa@scorepion.fans","password":"Password123!","returnSecureToken":true}'
   ```
   Copy the `idToken` from the response.
   _(Web API Key lives in Firebase Console -> Project Settings -> General -> Web API Key.)_
3. Hit the server with it:

   ```bash
   curl -H "Authorization: Bearer <ID_TOKEN>" http://localhost:5000/api/auth/me
   ```

   - **404 + `{"needsSync":true}`** -> token verified, no profile yet (expected for a brand-new user).
   - **401** -> Admin SDK init or token verification failed; check
     `GOOGLE_APPLICATION_CREDENTIALS` and `FIREBASE_PROJECT_ID`.

4. Create the profile:

   ```bash
   curl -X POST -H "Authorization: Bearer <ID_TOKEN>" \
        -H "Content-Type: application/json" \
        -d '{"username":"qauser"}' \
        http://localhost:5000/api/auth/sync
   ```

   - **201** -> profile created.
   - **409** -> username already taken.

5. Confirm in MySQL:
   ```sql
   SELECT id, username, email FROM users;
   ```
   `id` should be the Firebase UID, not a UUID.

---

## 3. Client Setup (Android)

`@react-native-firebase` uses native modules, so **Expo Go will not work**
-- you need an EAS dev build.

### 3a. Build the dev client (one-time)

```bash
eas build --profile development --platform android
```

Wait for the build to finish (~15 min), then download and install the
`.apk` on your physical device or Android emulator.

You only rebuild the dev client when native dependencies change. Day-to-day
JS/TSX changes are hot-reloaded as normal.

### 3b. Reachable API

Your device needs to reach the local Express server. Pick one:

| Setup            | `EXPO_PUBLIC_DOMAIN` value         |
| ---------------- | ---------------------------------- |
| Same Wi-Fi (LAN) | `192.168.x.x:5000` _(your LAN IP)_ |
| Android emulator | `10.0.2.2:5000`                    |
| Tunnel           | `https://yourtunnel.ngrok.io`      |

Set in `.env` (or shell) and start Metro:

```bash
EXPO_PUBLIC_DOMAIN=192.168.1.20:5000 npm start
```

### 3c. Open the dev client -> connect to Metro

If the app crashes on launch with a "Default FirebaseApp is not initialized"
error: confirm `google-services.json` is at the project root and that
`app.json -> expo.android.googleServicesFile` points to it.

---

## 4. Manual Test Scenarios

### Happy path -- register -> sign in -> reset -> re-sign-in

1. **Register**
   - Open app -> tap "Create Account" tab.
   - Enter: email (real inbox), username, password (8+ chars w/ letter & number).
   - Submit -> routes to `/onboarding`.
   - Verify in Firebase Console -> Authentication: new user with that email.
   - Verify in MySQL `users` table: row with Firebase UID + email + username.

2. **Sign out**
   - From settings or wherever logout is triggered -> returns to `/auth`.

3. **Forgot password**
   - On login screen, tap "Forgot password?" -> routes to `/forgot-password`.
   - Enter the email used at signup -> tap "Send reset link".
   - Confirmation screen appears.
   - Check inbox (may land in **Spam** for default `noreply@scorepion-7b110.firebaseapp.com` sender).
   - Click link -> Firebase-hosted reset page -> set new password.
   - Return to app -> tap "Back to sign in".

4. **Sign in with new password**
   - Email + new password -> lands on `(tabs)`.
   - Old password no longer works (sanity-check this).

### Error paths

| Scenario                             | Expected UI                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Wrong password                       | "Email or password incorrect."                                                                                               |
| Unregistered email                   | "No account found with that email."                                                                                          |
| Invalid email format                 | Inline "Please enter a valid email."                                                                                         |
| Weak password (<6 chars)             | "Password is too weak." (Firebase rejection)                                                                                 |
| Email already in use during register | "This email is already in use. Sign in instead?"                                                                             |
| Username taken during register       | "This username is taken. Try another." (and the orphan Firebase user is deleted automatically -- verify in Firebase Console) |
| 5+ failed logins in a row            | "Too many attempts. Try again in a minute."                                                                                  |
| Airplane mode                        | "No internet connection. Check your network and try again."                                                                  |

### Token refresh (silent)

1. Sign in.
2. Leave app idle for 60+ minutes.
3. Pull-to-refresh leaderboards -> request succeeds with auto-refreshed ID token.
4. In Firebase Console -> Authentication -> "..." -> Revoke refresh tokens for the user.
5. Next API call -> 401 -> app logs you out automatically (the auth-expiry callback signs out client-side).

### Account deletion

1. Settings -> Delete Account -> confirm.
2. Firebase Console: user is gone.
3. MySQL: `users` row gone, all related rows cascade-deleted.
4. App returns to `/auth` screen.

---

## 5. Files of Interest

Where to look when something breaks:

| Concern                                          | File                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Server: ID-token verification                    | [server/middleware/auth.ts](../server/middleware/auth.ts)                             |
| Server: Admin SDK init / credentials             | [server/lib/firebase.ts](../server/lib/firebase.ts)                                   |
| Server: profile sync route                       | [server/routes/auth.routes.ts](../server/routes/auth.routes.ts)                       |
| Server: account deletion (revokes Firebase user) | [server/routes/account.routes.ts](../server/routes/account.routes.ts)                 |
| Server: env validation                           | [server/env.ts](../server/env.ts)                                                     |
| Schema migration                                 | [server/migrations/012_firebase_auth.sql](../server/migrations/012_firebase_auth.sql) |
| Client: Firebase init + error mapping            | [src/lib/firebase.ts](../src/lib/firebase.ts)                                         |
| Client: Auth state + login/register/reset        | [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)                       |
| Client: API client (ID token attach)             | [src/lib/query-client.ts](../src/lib/query-client.ts)                                 |
| Client: Auth screen UI                           | [app/auth.tsx](../app/auth.tsx)                                                       |
| Client: Forgot password screen                   | [app/forgot-password.tsx](../app/forgot-password.tsx)                                 |
| Client: Stack registration                       | [app/\_layout.tsx](../app/_layout.tsx)                                                |
| Client: i18n strings                             | [src/lib/i18n/translations.ts](../src/lib/i18n/translations.ts)                       |

---

## 6. Production Checklist

Tracking what's left between the merged Firebase migration (PR #1, commit `b4bfd60`)
and a public Play Store rollout.

### Already verified

- [x] `google-services.json` package matches `com.coodehub.scorepion`
- [x] Service account JSON is at `~/Desktop/scorepion-7b110-firebase-adminsdk-atvkj-b86c589483.json`
- [x] `npm run typecheck` / `typecheck:server` / `lint` all clean
- [x] Firebase Email/Password provider is enabled

### Critical -- block production deploy until done

- [ ] **C1. Upload service account JSON to the eduqube VPS**

  ```bash
  scp ~/Desktop/scorepion-7b110-firebase-adminsdk-atvkj-b86c589483.json \
      eduqube:/etc/scorepion/firebase-admin.json
  ssh eduqube 'chown scorepion:scorepion /etc/scorepion/firebase-admin.json \
              && chmod 600 /etc/scorepion/firebase-admin.json'
  ```

- [ ] **C2. Update production `.env` on the VPS**
  - Add: `FIREBASE_PROJECT_ID=scorepion-7b110`
  - Add: `GOOGLE_APPLICATION_CREDENTIALS=/etc/scorepion/firebase-admin.json`
  - Remove: `JWT_SECRET=...`

- [ ] **C3. Take a DB backup before the first deploy**
      Migration 012 is destructive. Run `bash scripts/backup-db.sh` on the VPS
      and confirm a fresh dump in `./backups/` before restarting the server.

- [ ] **C4. Test the EAS production build end-to-end**
      Native Firebase modules behave differently in release builds (R8/Hermes/ProGuard).
      Dev-client testing is necessary but not sufficient.

  ```bash
  eas build --profile production --platform android
  ```

  Install on a device -> register -> forgot-password -> reset -> re-login.

- [ ] **C5. Disable unused Firebase Auth methods**
      Console -> Authentication -> Sign-in method. Confirm only **Email/Password**
      is enabled. Disable Anonymous, Phone, and any social providers we don't use
      to reduce attack surface.

### High -- do before public rollout

- [ ] **H1. Enable email-enumeration protection**
      Console -> Authentication -> Settings -> toggle "Email enumeration protection".
      Standardizes responses so attackers can't probe for registered emails.
      (The forgot-password screen already defends client-side; this is server-side.)

- [ ] **H2. Customize the password-reset email template**
      Console -> Authentication -> Templates -> Password reset.
  - Sender name: `Scorepion`
  - Subject: `Reset your Scorepion password`
  - Body: replace `%PROJECT_NAME%` placeholder with `Scorepion`
  - Reply-to: `support@scorepion.fans` (or whatever your support inbox is)

- [ ] **H3. Privacy Policy + TOS disclose Firebase/Google as sub-processor**
      Required by GDPR. Add one paragraph to the privacy policy:

  > "We use Google Firebase Authentication to manage user accounts. Your email,
  > authentication metadata, and IP address during sign-in are processed by
  > Google as our sub-processor under their Data Processing Agreement."
  > Translations live in [src/lib/i18n/translations.ts](../src/lib/i18n/translations.ts) -- update all 5 locales.

- [ ] **H4. Update Google Play Data Safety section**
      Play Console -> App content -> Data safety. We now collect `email`:
  - Data type: Personal info -> Email address
  - Purpose: Account management
  - Encrypted in transit: Yes
  - Can users request deletion: Yes (already wired -- `/api/account` DELETE)

- [ ] **H5. Bump app version**
      `app.json` -> `expo.version`: `2.0.0` -> `2.1.0`. EAS auto-increments
      `versionCode`; the user-facing string is manual.

- [ ] **H6. End-to-end deliverability test on real inboxes**
      The default sender (`noreply@scorepion-7b110.firebaseapp.com`) often lands
      in spam. Test password-reset email delivery to:
  - [ ] Gmail
  - [ ] iCloud
  - [ ] Outlook / Hotmail
  - [ ] Yahoo

  Document where it lands so support can guide users ("check spam folder").
  If results are bad, escalate H6 -> M1 (custom domain) before rollout.

### Medium -- production hygiene, soon after launch

- [ ] **M1. Custom email sender domain** (`noreply@scorepion.fans`)
      Console -> Authentication -> Templates -> "Customize domain". Requires
      publishing DKIM/SPF/DMARC DNS records. Big spam-folder reduction.

- [ ] **M2. Surface auth-verify errors to Sentry**
      [server/middleware/auth.ts:43](../server/middleware/auth.ts#L43) currently
      has `catch {}` -- verify failures are silent. Add a Sentry breadcrumb or
      `console.warn` so production issues are diagnosable.

- [ ] **M3. Firebase Console alerts**
      Console -> Project Settings -> Integrations / Alerts. Email or Slack alert on:
  - Sign-up rate spike (potential abuse)
  - Failed sign-in rate spike
  - Service account key approaching expiration

- [ ] **M4. Customer-support runbook entry**
      Add to [OPERATIONS.md](./OPERATIONS.md): "User can't log in" ->
      Firebase Console -> check user disabled? -> recent failed attempts? ->
      trigger password reset from console.

- [ ] **M5. Cost / quota budget alert**
      GCP Billing -> Budgets & alerts -> set a $5 alert on the Firebase project.
      Free tier (50k MAU) should never bill, but defensive against accidental
      enabling of paid features.

### Low -- nice to have, don't block

- [ ] **L1. Separate dev / prod Firebase projects**
      Currently `scorepion-7b110` serves both. Mixing dev test users with real
      users is messy long-term. Defer until you have real users to protect, then:
      create `scorepion-prod`, generate new credentials, switch the production
      EAS build profile to a different `google-services.json`.

- [ ] **L2. Reintroduce iOS**
      Add iOS app in Firebase, drop `GoogleService-Info.plist` at repo root,
      add `expo.ios.googleServicesFile` to `app.json`. No schema or server changes.

- [ ] **L3. "Sign out from all devices" in Settings**
      The Admin SDK's `revokeRefreshTokens(uid)` is available but unexposed.
      Add a Settings button that calls a new `POST /api/auth/revoke` route.

---

## 7. Deploy-Day Runbook

Once C1--C5 in the Production Checklist are checked, this is the literal
sequence on deploy day:

```bash
# 1. Backup
ssh eduqube 'cd /var/www/scorepion && bash scripts/backup-db.sh'

# 2. Confirm dump exists
ssh eduqube 'ls -lh /var/www/scorepion/backups/ | tail -3'

# 3. Deploy
ssh eduqube 'cd /var/www/scorepion && git pull && npm ci && npm run build'

# 4. Restart, watch the migration land
ssh eduqube 'pm2 restart scorepion --update-env && pm2 logs scorepion --lines 50'
# Look for: "[Migration] Done: 012_firebase_auth.sql"

# 5. Health check
curl -fsS https://api.scorepion.fans/api/health

# 6. Smoke test the auth surface (see section 2c above)
#    Get an ID token via Firebase REST, then:
curl -H "Authorization: Bearer <ID_TOKEN>" https://api.scorepion.fans/api/auth/me
# Expect 404 + {"needsSync":true} for a fresh Firebase user with no profile yet
```

If step 4 fails: `git revert` is NOT a rollback -- migration 012 is destructive.
Restore from the backup taken in step 1.

---

## 8. Rollback Plan

If something is wrong post-deploy:

- The migration is **destructive**, so rolling back the server alone leaves
  the DB in the new shape (no `password` column, no `refresh_tokens` table).
  A rollback would need a 013 reverse migration plus restoring the deleted
  `auth.service.ts` / `token.service.ts` / `bcrypt` / `jose` deps from git.
- Practical advice: don't roll back. If Firebase auth has a problem,
  fix forward -- the schema is well-isolated and the server endpoints
  involved are minimal.
- If Firebase is unavailable (rare), the server will reject all
  authenticated requests with 401. Public endpoints (`/api/health`,
  fixture queries used by the football data layer) remain accessible.

---

## Production Deployment Notes

When you deploy to your VPS (eduqube):

1. **Service account file** -- copy the JSON to a path on the server (e.g.
   `/etc/scorepion/firebase-admin.json`), `chmod 600`, and set
   `GOOGLE_APPLICATION_CREDENTIALS` to that path. Or paste the JSON content
   into `FIREBASE_SERVICE_ACCOUNT_JSON` and avoid the file altogether.

2. **EAS production build** -- the same `google-services.json` is bundled
   automatically because of `app.json -> android.googleServicesFile`. No
   special EAS secret is needed for it (the file contains identifiers,
   not secrets -- Firebase access is gated by the package signature).

3. **Custom email sender domain (optional, deferred)** -- the default
   `noreply@scorepion-7b110.firebaseapp.com` works but lands in spam more
   often. To switch, add a verified domain in Firebase Console ->
   Authentication -> Templates -> "from" sender. Requires DNS records.

4. **Email enumeration protection** -- consider enabling Firebase's
   "Email enumeration protection" (Authentication -> Settings) once you
   have real users. It standardizes responses so attackers can't probe
   which emails are registered. The forgot-password screen already
   defends against this client-side, but the toggle is belt-and-suspenders.

---

## Status

Last updated: 2026-05-07
Owner: @hozhanli
