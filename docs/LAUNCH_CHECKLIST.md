# Scorepion — Launch Checklist

Final pre-launch verification before App Store and Play Store submission.

---

## Pre-Launch Infrastructure (Critical)

- [ ] All migrations applied in production DB (`runMigrations()` completes without errors)
- [ ] Database backup strategy in place and tested (`scripts/verify-backup.sh` passes)
- [ ] SENTRY_DSN configured for both client and server (error tracking active)
- [ ] FOOTBALL_API_PLAN=pro in production env (live match data active)
- [ ] FOOTBALL_API_KEY rotated from development value
- [ ] JWT_SECRET is production value (not default/development)
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
- [ ] Cookie/tracking disclosure documented (or confirmed no tracking in v1.0)
- [ ] Accessibility (WCAG 2.1 AA) baseline tested (button text readable, color contrast OK)

---

## Security & API Keys

- [ ] No API keys, secrets, or credentials in version control (checked .env.example)
- [ ] Rate limiting active on authentication endpoints (prevent brute force)
- [ ] CORS headers correct (allow only web domain if applicable)
- [ ] CSRF protection enabled on state-changing endpoints
- [ ] SQL injection protection verified (using parameterized queries)
- [ ] XSS protection verified (React escapes by default; confirm no dangerouslySetInnerHTML)
- [ ] Password hashing confirmed (bcrypt or similar, not plaintext)
- [ ] Session/token expiry enforced (JWT expiration, refresh token rotation)
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
- [ ] Data privacy section filled (confirm no data collection in v1.0)
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
- [ ] Dark mode works across all screens (no unreadable text, proper contrast)
- [ ] Internationalization verified (5 languages, proper diacritics, no broken text)
- [ ] Offline mode graceful (read-only UI, data syncs on reconnect)
- [ ] Memory usage under 150 MB (check Instruments on iOS, Android Studio on Android)
- [ ] Battery impact minimal (check battery usage over 1-hour session)

---

## Final Pre-Submission Steps

1. [ ] Run full TypeScript typecheck: `cd server && npx tsc -p tsconfig.json --noEmit`
2. [ ] Run i18n diacritic check: `node scripts/check-diacritics.mjs`
3. [ ] Run unit tests: `npm test` (all passing)
4. [ ] Run E2E tests on staging: `npm run test:e2e`
5. [ ] Generate changelog for v1.0
6. [ ] Create git tag: `git tag v1.0.0`
7. [ ] Create release branch from main: `git checkout -b release/v1.0`
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

## Notes

- **Dates:** This checklist should be completed 1 week before target launch date
- **Sign-offs:** Each section requires owner approval (see CODEOWNERS)
- **Blockers:** Any item marked unchecked = potential launch blocker (discuss with lead)
- **Updates:** This checklist is a living document; update as new requirements emerge
