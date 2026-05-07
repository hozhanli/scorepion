# Scorepion — Launch Checklist

Final pre-launch verification before App Store and Play Store submission.

> **Auth-specific items live in [FIREBASE_AUTH.md](./FIREBASE_AUTH.md)** —
> service-account upload, email template, Play Data Safety, deliverability tests, etc.

---

## Critical Blockers — Must Complete Before Release

These three items are the only things standing between the codebase and a live v2.0 on Play Store.

### 1. Backend deployment

**What's needed:**

- Pick a host (Fly.io / Railway / Render / VPS)
- Provision production MySQL (PlanetScale / RDS / DigitalOcean recommended over self-host)
- Deploy the Express server
- Point the chosen domain at it, provision TLS
- Set every `[R]` variable from `.env.example` via the host's secret manager
- Run migrations: `npm run db:push` (drizzle-kit) or equivalent
- Smoke test: `curl https://YOUR-DOMAIN/api/health` → should return a JSON health body

**After it's live:**

- Update `eas.json` → `build.production.env.EXPO_PUBLIC_DOMAIN` to your bare host (e.g. `api.scorepion.fans`)
- Update `eas.json` → `build.preview.env.EXPO_PUBLIC_DOMAIN` too if you're running a staging environment
- Commit `eas.json`

### 2. Privacy Policy + Terms at public URLs

**What's needed:**

- Host both as plain HTML or markdown on a public URL (GitHub Pages, Vercel, docs.scorepion.fans, etc.)
- URLs must be reachable without login
- Cite them in:
  - Play Console → App content → Privacy policy
  - In-app Settings screen (may already be wired; verify)
  - Data safety form

**Content must cover:**

- Data collected (profile, birth year, predictions, group membership, push tokens)
- Third-party processors (API-Football, Sentry/GlitchTip, Expo Push)
- Data retention (account deletion flow at `/api/account DELETE`)
- GDPR / CCPA rights
- Under-13 policy (currently: blocked via age gate)
- Contact email

### 3. Play Console listing refresh

Not code work — done in the Play Console admin UI.

| Item                        | Where                               | Notes                                                                   |
| --------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| Release notes x 5 languages | Production → Create release         | EN/ES/FR/TR/PT. Can draft in chat if you want help.                     |
| Phone screenshots           | Store presence → Main store listing | Min 2, ideally 4-8. Current UI (not old app). 1080x1920 or 1080x2400.   |
| Feature graphic             | Store presence → Main store listing | 1024x500. Reuse old one if brand unchanged.                             |
| Short description           | Main store listing                  | 80 chars                                                                |
| Full description            | Main store listing                  | 4000 chars. Mention push, 5 languages, new UI.                          |
| Data safety form            | App content → Data safety           | **Must re-review** — we added push tokens, birth year, Sentry telemetry |
| Content rating              | App content → Content rating        | Verify 13+                                                              |
| Target audience             | App content → Target audience       | 13+                                                                     |
| Privacy policy URL          | App content → Privacy policy        | From blocker #2                                                         |
| Support email               | Store presence → Main store listing | Verify it's monitored                                                   |

---

## Pre-Launch Infrastructure (Critical)

- [ ] All migrations applied in production DB (`runMigrations()` completes without errors)
- [ ] Database backup strategy in place and tested (`scripts/verify-backup.sh` passes)
- [ ] SENTRY_DSN configured for both client and server (error tracking active)
- [ ] FOOTBALL_API_PLAN=pro in production env (live match data active)
- [ ] FOOTBALL_API_KEY rotated from development value
- [ ] FIREBASE_PROJECT_ID set to the production Firebase project
- [ ] Firebase Admin credentials provided (`GOOGLE_APPLICATION_CREDENTIALS` path or `FIREBASE_SERVICE_ACCOUNT_JSON` inline) — NOT the dev service account
- [ ] ADMIN_SECRET is production value (not default/development)
- [ ] NODE_ENV=production enforced in production (rate limiting active)
- [ ] Health check endpoints responding (`GET /api/health` returns 200)
- [ ] Push notification certificates provisioned (APNs for iOS, FCM for Android)
- [ ] SSL certificates valid and not expiring within 30 days

---

## Compliance & Legal

- [ ] Privacy policy published at public HTTPS URL
- [ ] Terms of Service published at public HTTPS URL
- [ ] GDPR compliance verified for EU users (data retention, deletion)
- [ ] CCPA compliance verified for California users (data rights)
- [ ] Age gate tested: users under 13 are blocked (no exception pathway)
- [ ] Age gate tested: users 13–17 see age-appropriate wording
- [ ] Age gate tested: users 18+ see full feature set
- [ ] Delete account flow tested end-to-end (data fully purged)
- [ ] Data retention policy documented and enforced
- [ ] Cookie/tracking disclosure documented (or confirmed no tracking in v2.0)
- [ ] Accessibility (WCAG 2.1 AA) baseline tested (button text readable, color contrast OK)

---

## Security & API Keys

- [ ] No API keys, secrets, or credentials in version control (checked .env.example)
- [ ] Rate limiting active on authentication endpoints (prevent brute force)
- [ ] CORS headers correct (allow only web domain if applicable)
- [ ] CSRF protection enabled on state-changing endpoints
- [ ] SQL injection protection verified (using parameterized queries)
- [ ] XSS protection verified (React escapes by default; confirm no dangerouslySetInnerHTML)
- [ ] Authentication delegated to Firebase (no plaintext password handling on this server)
- [ ] Firebase Email/Password provider enabled; password reset email template reviewed
- [ ] Webhook signature verification in place (Stripe webhook, if enabled)

---

## Database & Data

- [ ] Production database backed up (automated daily backup confirmed)
- [ ] Database user account has least-privilege permissions (not root)
- [ ] Indexes created on frequently-queried columns (confirmed in schema)
- [ ] Connection pooling configured (avoid connection exhaustion)
- [ ] Database size projected for 1 year of user growth
- [ ] Partition or archival strategy for audit logs (if applicable)

---

## App Store Submission (iOS)

- [ ] App Store Connect app created
- [ ] Bundle identifier correct: com.coodehub.scorepion
- [ ] App icon provided (1024x1024 PNG)
- [ ] Splash screen branded and final
- [ ] Screenshots captured for all required device sizes:
  - [ ] 6.7" (iPhone 14 Pro Max)
  - [ ] 6.5" (iPhone 12/13)
  - [ ] 5.5" (iPhone 8)
  - [ ] 12.9" iPad (landscape)
- [ ] App preview video provided (optional but recommended)
- [ ] Demo account seeded and working (username: reviewer, password: ReviewMe2026)
- [ ] TestFlight internal testing completed (0 crashes in baseline session)
- [ ] TestFlight external testing completed (≥ 10 external testers, 7 days)
- [ ] Build 1.0 uploaded and ready for submission
- [ ] Privacy policy URL set in App Store Connect
- [ ] Support URL set in App Store Connect
- [ ] Age rating (12+) selected
- [ ] Category (Sports/Entertainment) set
- [ ] Encryption compliance form reviewed (confirm no export-controlled crypto)
- [ ] Review notes uploaded (use APP_REVIEW_NOTES.md)

---

## Play Store Submission (Android)

- [ ] Google Play Console app created
- [ ] Package name correct: com.coodehub.scorepion
- [ ] App icon provided (512x512 PNG)
- [ ] Adaptive icon foreground/background/monochrome assets provided
- [ ] Screenshots captured:
  - [ ] Phone (at least 2 per language)
  - [ ] Tablet (at least 2 per language)
- [ ] Feature graphic (1024x500 PNG) provided
- [ ] Closed testing track configured
- [ ] ≥ 10 internal testers added to closed testing
- [ ] Closed testing run for ≥ 14 days (no crashes, ratings > 4.0 if applicable)
- [ ] Production release prepared (ready to rollout after approval)
- [ ] Demo account seeded and working
- [ ] Privacy policy URL set in Play Store
- [ ] Support email set in Play Store
- [ ] Content rating questionnaire completed
- [ ] Target audience (age range) set
- [ ] Data privacy section filled (confirm no data collection in v2.0)
- [ ] Permissions rationale documented (internet, location optional)

---

## Analytics & Monitoring

- [ ] Sentry alert rules configured (new-issue notifications to Slack)
- [ ] Sentry performance monitoring baseline established (transaction duration, error rate)
- [ ] Status page set up (Better Uptime, Statuspage, or internal dashboard)
- [ ] Health check monitoring in place (PagerDuty or equivalent)
- [ ] Uptime SLA defined (e.g., 99.5%) and communicated to users
- [ ] Error rate baseline established (< 0.1% 5xx errors)
- [ ] API response time baseline established (p95 < 500ms)

---

## Operations & Support

- [ ] Support email active and monitored (support@scorepion.example.com)
- [ ] Support response SLA defined (e.g., 24-hour first response)
- [ ] Runbook for common issues documented (login failures, crash causes, etc.)
- [ ] On-call rotation established (who handles production issues 24/7)
- [ ] Escalation path documented (support → engineering → management)
- [ ] Communication plan for outages prepared (public status page, Slack notification)
- [ ] Rollback procedure tested (can revert a bad deployment in < 10 minutes)

---

## Product & Feature Verification

- [ ] Onboarding flow tested (login → age verification → league select → first prediction)
- [ ] Prediction locking works (cannot predict after match kickoff)
- [ ] Live score updates work (visible within 10 seconds of API data)
- [ ] Leaderboard calculates correctly (streak, total points, ranking)
- [ ] Private group creation works (users can create, invite, see group leaderboard)
- [ ] Push notifications functional (if enabled: goals, match start, leaderboard rank change)
- [ ] ~~Dark mode~~ Light mode only in v1 (dark mode deferred to v1.1 — see ROADMAP)
- [ ] Internationalization verified (5 languages, proper diacritics, no broken text)
- [ ] Offline mode graceful (read-only UI, data syncs on reconnect)
- [ ] Memory usage under 150 MB (check Instruments on iOS, Android Studio on Android)
- [ ] Battery impact minimal (check battery usage over 1-hour session)

---

## Final Pre-Submission Steps

1. [ ] Run full TypeScript typecheck: `cd server && npx tsc -p tsconfig.json --noEmit`
2. [ ] Run i18n diacritic check: `node scripts/check-diacritics.mjs`
3. [ ] Run unit tests: `npm test` (all passing)
4. [ ] Run E2E tests on staging (script not yet created — add to `package.json` when E2E framework is chosen)
5. [ ] Generate changelog for v2.0
6. [ ] Create git tag: `git tag v2.0.0`
7. [ ] Create release branch from main: `git checkout -b release/v2.0`
8. [ ] Final code review pass (lead engineer sign-off)
9. [ ] Product sign-off (confirm feature set matches spec)
10. [ ] Legal sign-off (privacy policy, terms, compliance docs)

---

## Post-Launch (First Week)

- [ ] Monitor Sentry for new errors and crashes
- [ ] Monitor API error rate and latency (dashboard)
- [ ] Respond to first user feedback and bug reports within SLA
- [ ] Verify push notifications are delivering (check APNs/FCM delivery rates)
- [ ] Check leaderboard calculations in production (spot-check accuracy)
- [ ] Verify live score sync is working (compare app to official source)
- [ ] Confirm no unexpected resource usage spikes (CPU, memory, disk)
- [ ] Review first 48 hours of analytics (DAU, retention, crash rate)
- [ ] Hold post-launch retrospective (what went well, what to improve)

---

## Recommended Before Public Rollout

Not strictly required for v1, but strongly recommended before wide release.

### 50-user beta run

Catch real-device issues before mass rollout.

- Play Console → Testing → Internal testing → add email list
- Run for 7 days minimum
- Monitor crash-free-sessions %, Sentry/GlitchTip, user feedback channel

### Google Play Developer API service account

Lets `eas submit --platform android` upload AABs automatically. Without it, you drag the AAB into Play Console by hand each release.

1. Play Console → Setup → API access → Create service account (opens Google Cloud)
2. On GCP: create service account, download JSON key
3. Back in Play Console: grant "Release manager" or "Admin (all apps)"
4. Save JSON as `credentials/google-play-service-account.json`
5. `eas credentials` → Android → production → Google Service Account → Play Store Submissions → upload

Can defer to v1.1. First release is fine via manual upload.

### Sentry / GlitchTip DSN

No crash reporting in prod until this is set. Not a blocker — the server code handles a missing DSN gracefully.

- Free option: sign up for [GlitchTip](https://glitchtip.com) (Sentry-API-compatible) free tier
- Or: self-host GlitchTip on a $5 VPS
- Create two projects: `scorepion-server` + `scorepion-client`
- Set `SENTRY_DSN` (server) and `EXPO_PUBLIC_SENTRY_DSN` (client) on host/eas.json respectively

### Automated backups

Scripts exist in `scripts/backup-db.sh`, `scripts/verify-backup.sh`, `scripts/restore-db.sh`. Not yet automated.

**Minimum viable setup:**

- Cron on the backend host: nightly `./scripts/backup-db.sh` + weekly `./scripts/verify-backup.sh`
- Pipe each dump to off-site storage (S3 / R2 / B2 — R2 is free egress, cheapest)
- Healthchecks.io ping on success so you notice if cron dies

Can also defer to v1.1 if the managed MySQL host (PlanetScale/RDS) provides point-in-time recovery.

---

## When You Pick This Back Up

### If the backend is live

```bash
cd ~/Desktop/scorepion

# 1. Update eas.json with the real production URL, commit
# "EXPO_PUBLIC_DOMAIN": "api.your-real-domain.com"

# 2. Verify everything still passes
npm run typecheck
npx expo-doctor

# 3. First production build
eas build --platform android --profile production
```

Build takes ~15-25 minutes on EAS. Outputs a signed AAB. Download it and upload
to Play Console → Internal testing → Create new release → drop the AAB → fill
release notes → start rollout to testers.

### If the backend is not live yet

Don't build production. Use `preview` profile pointing at your staging URL, or
a tunnel (`ngrok http 5000`) for local-device testing with `eas build --profile development`.

---

## Notes

- **Dates:** This checklist should be completed 1 week before target launch date
- **Sign-offs:** Each section requires owner approval (see CODEOWNERS)
- **Blockers:** Any item marked unchecked = potential launch blocker (discuss with lead)
- **Updates:** This checklist is a living document; update as new requirements emerge
