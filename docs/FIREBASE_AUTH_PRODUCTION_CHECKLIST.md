# Firebase Auth — Production Launch Checklist

Tracking what's left between the merged Firebase migration (PR #1, commit `b4bfd60`)
and a public Play Store rollout. Delete this file once everything is checked.

Companion docs:

- [FIREBASE_AUTH_TESTING.md](./FIREBASE_AUTH_TESTING.md) — local + QA test guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) — generic deploy runbook
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) — auth-failure runbook

---

## Already verified ✅

- [x] `google-services.json` package matches `com.coodehub.scorepion`
- [x] Service account JSON is at `~/Desktop/scorepion-7b110-firebase-adminsdk-atvkj-b86c589483.json`
- [x] `npm run typecheck` / `typecheck:server` / `lint` all clean
- [x] Firebase Email/Password provider is enabled

---

## 🔴 Critical — block production deploy until done

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

  Install on a device → register → forgot-password → reset → re-login.

- [ ] **C5. Disable unused Firebase Auth methods**
      Console → Authentication → Sign-in method. Confirm only **Email/Password**
      is enabled. Disable Anonymous, Phone, and any social providers we don't use
      to reduce attack surface.

---

## 🟠 High — do before public rollout

- [ ] **H1. Enable email-enumeration protection**
      Console → Authentication → Settings → toggle "Email enumeration protection".
      Standardizes responses so attackers can't probe for registered emails.
      (The forgot-password screen already defends client-side; this is server-side.)

- [ ] **H2. Customize the password-reset email template**
      Console → Authentication → Templates → Password reset.
  - Sender name: `Scorepion`
  - Subject: `Reset your Scorepion password`
  - Body: replace `%PROJECT_NAME%` placeholder with `Scorepion`
  - Reply-to: `support@scorepion.fans` (or whatever your support inbox is)

- [ ] **H3. Privacy Policy + TOS disclose Firebase/Google as sub-processor**
      Required by GDPR. Add one paragraph to the privacy policy:

  > "We use Google Firebase Authentication to manage user accounts. Your email,
  > authentication metadata, and IP address during sign-in are processed by
  > Google as our sub-processor under their Data Processing Agreement."
  > Translations live in [src/lib/i18n/translations.ts](../src/lib/i18n/translations.ts) — update all 5 locales.

- [ ] **H4. Update Google Play Data Safety section**
      Play Console → App content → Data safety. We now collect `email`:
  - Data type: Personal info → Email address
  - Purpose: Account management
  - Encrypted in transit: Yes
  - Can users request deletion: Yes (already wired — `/api/account` DELETE)

- [ ] **H5. Bump app version**
      `app.json` → `expo.version`: `2.0.0` → `2.1.0`. EAS auto-increments
      `versionCode`; the user-facing string is manual.

- [ ] **H6. End-to-end deliverability test on real inboxes**
      The default sender (`noreply@scorepion-7b110.firebaseapp.com`) often lands
      in spam. Test password-reset email delivery to:
  - [ ] Gmail
  - [ ] iCloud
  - [ ] Outlook / Hotmail
  - [ ] Yahoo

  Document where it lands so support can guide users ("check spam folder").
  If results are bad, escalate H6 → H7 (custom domain) before rollout.

---

## 🟡 Medium — production hygiene, soon after launch

- [ ] **M1. Custom email sender domain** (`noreply@scorepion.fans`)
      Console → Authentication → Templates → "Customize domain". Requires
      publishing DKIM/SPF/DMARC DNS records. Big spam-folder reduction.

- [ ] **M2. Surface auth-verify errors to Sentry**
      [server/middleware/auth.ts:43](../server/middleware/auth.ts#L43) currently
      has `catch {}` — verify failures are silent. Add a Sentry breadcrumb or
      `console.warn` so production issues are diagnosable.

- [ ] **M3. Firebase Console alerts**
      Console → Project Settings → Integrations / Alerts. Email or Slack alert on:
  - Sign-up rate spike (potential abuse)
  - Failed sign-in rate spike
  - Service account key approaching expiration

- [ ] **M4. Customer-support runbook entry**
      Add to [OPERATIONS.md](./OPERATIONS.md): "User can't log in" →
      Firebase Console → check user disabled? → recent failed attempts? →
      trigger password reset from console.

- [ ] **M5. Cost / quota budget alert**
      GCP Billing → Budgets & alerts → set a $5 alert on the Firebase project.
      Free tier (50k MAU) should never bill, but defensive against accidental
      enabling of paid features.

---

## 🟢 Low — nice to have, don't block

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

## Deploy-day runbook (the 30-minute window)

Once C1–C5 are checked, this is the literal sequence on deploy day:

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

# 6. Smoke test the auth surface (see FIREBASE_AUTH_TESTING.md § 2c)
#    Get an ID token via Firebase REST, then:
curl -H "Authorization: Bearer <ID_TOKEN>" https://api.scorepion.fans/api/auth/me
# Expect 404 + {"needsSync":true} for a fresh Firebase user with no profile yet
```

If step 4 fails: `git revert` is NOT a rollback — migration 012 is destructive.
Restore from the backup taken in step 1.

---

## Status

Last updated: 2026-05-05
Owner: @hozhanli
