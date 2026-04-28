# Scorepion v2.0 — Production Release Status

Living snapshot of what's done and what's left to get the rewritten app live
on the Play Store. Update as you go; delete completed items or move them to
the "History" section at the bottom.

**Last updated:** 2026-04-21

---

## TL;DR

The codebase and signing/push infrastructure are production-ready. The three
things standing between you and a live v2.0 on Play Store are:

1. **Deploy the backend** (you're handling)
2. **Refresh the Play Store listing** (screenshots, release notes, data safety form)
3. **Publish Privacy Policy + Terms at public URLs**

Everything else is either optional for v1 or already done.

---

## ✅ Done

### Infrastructure & signing

- [x] Android package name set to `com.coodehub.scorepion` (matches existing Play Store app)
- [x] Upload keystore stored in `credentials/upload-key.jks` + git-ignored
- [x] Keystore verified: SHA-1 `70:1F:7F:FD:57:C5:08:72:F3:61:A6:4A:31:D9:D2:FD:BF:E6:21:8E` matches `google-services.json` cert #1
- [x] Keystore uploaded to EAS via `eas credentials` (Build Credentials ID `g86yLJFx_j`)
- [x] Keystore passwords + alias documented in `credentials/UPLOAD_KEY.md`

### Firebase + push notifications

- [x] `google-services.json` in repo root (project `scorepion-7b110`)
- [x] `android.googleServicesFile` wired in `app.json`
- [x] Firebase Admin SDK JSON in `credentials/firebase-adminsdk.json`
- [x] FCM V1 service account uploaded to EAS (Android push delivery path is live)
- [x] `notification-icon.png` generated from adaptive monochrome (white-on-transparent, auto-tinted emerald green)
- [x] Android notification channels wired in `src/lib/notifications.ts`

### Codebase hardening

- [x] Version bumped: `app.json` v1.0.0 → v2.0.0
- [x] `versionCode` managed by EAS (remote auto-increment)
- [x] Dependency alignment: 17/17 expo-doctor checks passing
- [x] `@sentry/react-native` aligned to SDK 54 (7.x)
- [x] `expo-notifications` upgraded to 0.32.x (new `NotificationBehavior` shape handled)
- [x] `expo-device` + `react-native-keyboard-controller` aligned
- [x] Duplicate `expo-constants` deduplicated

### Bug fixes

- [x] `src/lib/notifications.ts`: was using wrong env var + no JWT auth → refactored to use `apiRequest` helper
- [x] `src/lib/query-client.ts::getApiUrl()`: crashed when `EXPO_PUBLIC_DOMAIN` contained `https://` prefix → now accepts bare host or full URL
- [x] `setNotificationHandler` updated for expo-notifications v0.29+ API (`shouldShowBanner`/`shouldShowList`)

### Env & config management

- [x] `server/env.ts` — boot-time env validation, refuses to start in production with missing critical vars
- [x] `.env.example` — comprehensive rewrite, every var documented with required/optional flags
- [x] `eas.json` — cleaned, consistent bare-host URLs across dev/preview/production
- [x] `docs/ENVIRONMENTS.md` — single-page reference for how env config works across client/server

### Documentation

- [x] `credentials/README.md` + `credentials/UPLOAD_KEY.md`
- [x] `docs/ROADMAP/` — v1.1 / v1.2 / v2.0 / backlog files + TEMPLATE + README
- [x] `docs/ENVIRONMENTS.md`
- [x] `docs/LAUNCH_CHECKLIST.md` (package name references updated)
- [x] `docs/OPERATIONS.md`, `docs/DEPLOYMENT.md`, `docs/INCIDENT_RESPONSE.md`

---

## ⏳ Blockers — must be done before public release

### 1. Backend deployment

**Status:** with you.

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

**Status:** text probably already exists somewhere; publication is missing.

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

Not code work — you do this in the Play Console admin UI.

| Item                        | Where                               | Notes                                                                   |
| --------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| Release notes × 5 languages | Production → Create release         | EN/ES/FR/TR/PT. Can draft in chat if you want help.                     |
| Phone screenshots           | Store presence → Main store listing | Min 2, ideally 4–8. Current UI (not old app). 1080×1920 or 1080×2400.   |
| Feature graphic             | Store presence → Main store listing | 1024×500. Reuse old one if brand unchanged.                             |
| Short description           | Main store listing                  | 80 chars                                                                |
| Full description            | Main store listing                  | 4000 chars. Mention push, 5 languages, new UI.                          |
| Data safety form            | App content → Data safety           | **Must re-review** — we added push tokens, birth year, Sentry telemetry |
| Content rating              | App content → Content rating        | Verify 13+                                                              |
| Target audience             | App content → Target audience       | 13+                                                                     |
| Privacy policy URL          | App content → Privacy policy        | From blocker #2                                                         |
| Support email               | Store presence → Main store listing | Verify it's monitored                                                   |

---

## 🟡 Recommended, not strictly required for v1

### 4. Google Play Developer API service account

**Why:** lets `eas submit --platform android` upload AABs automatically. Without it, you drag the AAB into Play Console by hand each release.

**How:**

1. Play Console → Setup → API access → Create service account (opens Google Cloud)
2. On GCP: create service account, download JSON key
3. Back in Play Console: grant "Release manager" or "Admin (all apps)"
4. Save JSON as `credentials/google-play-service-account.json`
5. `eas credentials` → Android → production → Google Service Account → Play Store Submissions → upload

Can defer to v1.1. First release is fine via manual upload.

### 5. Sentry / GlitchTip DSN

**Why:** no crash reporting in prod until this is set. Not a blocker — the server code handles a missing DSN gracefully.

**How:**

- Free option: sign up for [GlitchTip](https://glitchtip.com) (Sentry-API-compatible) free tier
- Or: self-host GlitchTip on a $5 VPS
- Create two projects: `scorepion-server` + `scorepion-client`
- Set `SENTRY_DSN` (server) and `EXPO_PUBLIC_SENTRY_DSN` (client) on host/eas.json respectively

### 6. Automated backups

**Status:** scripts exist in `scripts/backup-db.sh`, `scripts/verify-backup.sh`, `scripts/restore-db.sh`. Not yet automated.

**Minimum viable setup:**

- Cron on the backend host: nightly `./scripts/backup-db.sh` + weekly `./scripts/verify-backup.sh`
- Pipe each dump to off-site storage (S3 / R2 / B2 — R2 is free egress, cheapest)
- Healthchecks.io ping on success so you notice if cron dies

Can also defer to v1.1 if the managed MySQL host (PlanetScale/RDS) provides point-in-time recovery.

### 7. 50-user beta run

**Why:** catch real-device issues before mass rollout.

**How:**

- Play Console → Testing → Internal testing → add email list
- Run for 7 days minimum
- Monitor crash-free-sessions %, Sentry/GlitchTip, user feedback channel

---

## 🔵 Optional — can ship without

- [ ] Legal review of Terms by outside counsel (see ROADMAP/v1.2 GAP-0010 if deferring)
- [ ] Accessibility audit with TalkBack (ROADMAP/v1.2 GAP-0013)
- [ ] Dark mode (ROADMAP/v1.1 GAP-0001)
- [ ] Offline mode for predictions (ROADMAP/v1.1 GAP-0002)
- [ ] xG data on match detail (ROADMAP/v1.1 GAP-0003)
- [ ] GDPR data export (ROADMAP/v1.2 GAP-0010)
- [ ] COPPA parental consent flow (ROADMAP/v1.2 GAP-0011)
- [ ] Stripe activation (ROADMAP/v1.2 GAP-0012)

---

## ▶ When you pick this back up

**If the backend is live:**

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

Build takes ~15–25 minutes on EAS. Outputs a signed AAB. Download it and upload
to Play Console → Internal testing → Create new release → drop the AAB → fill
release notes → start rollout to testers.

**If the backend is not live yet:**
Don't build production. Use `preview` profile pointing at your staging URL, or
a tunnel (`ngrok http 13291`) for local-device testing with `eas build --profile development`.

---

## History (completed milestones)

- **2026-04-21 session** — End-to-end production wiring: package name migration, Firebase push, keystore setup, env validation, dep alignment, all documented.
- **2026-04-20 session** — Production-readiness foundations (Wave 1 + Wave 2): observability, tests, push, backup scripts, compliance, Stripe scaffolding, legal docs, i18n diacritic audit.
- **2026-04-19 session** — UX council synthesis + top-10 UX improvements, community picks histogram, smart polling.

---

## Appendix A — What is an AAB?

### Short version

An **AAB (Android App Bundle)** is a packaging format Google requires for new
apps on the Play Store. It's `app.aab` instead of the older `app.apk`. You
upload one AAB, and Google's servers automatically generate optimised APKs for
each device that downloads it.

### Why Google switched from APK to AAB

A traditional APK is a zip containing code + assets for every device:

- Every screen density (mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi)
- Every CPU architecture (armeabi-v7a / arm64-v8a / x86_64)
- Every language's string resources
- Every code path, regardless of whether a given user's device can use it

For a user with an arm64 phone in Turkey running xxxhdpi, 70% of the APK is
payload they'll never use — extra megabytes to download and extra storage wasted.

An **AAB contains all of that** (same as an APK), but Google's Play Delivery
system splits it per-device at download time. That arm64 xxxhdpi Turkish user
only gets arm64, xxxhdpi, Turkish strings, and the Java/Kotlin code they need.
Typical download size savings: 30–50%.

### Format + structure

An AAB is a zip with:

- `base/` — the core module (code + resources that every install needs)
- `feature/` — optional dynamic feature modules (we don't use these)
- `BundleConfig.pb` — build-time configuration
- A signed proof-of-integrity block (same signing mechanism as APKs)

You can't install an AAB directly on a phone — only Play Store, Google Play
Console's internal testing distribution, or the [`bundletool`][bundletool] CLI
can unpack one into per-device APKs.

[bundletool]: https://developer.android.com/tools/bundletool

### AAB vs APK in practice

|                                       | APK                                       | AAB                                         |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| Format                                | Zip with classes.dex, resources, manifest | Zip with module-split structure             |
| Who generates final per-device bundle | You                                       | Google Play (from your AAB)                 |
| Install method                        | Direct install + Play Store               | Play Store (and App Bundle testers)         |
| Required by Play Store                | No (legacy)                               | **Yes, since Aug 2021 for new apps**        |
| Signed by                             | You                                       | You (upload key) + Google (app-signing key) |
| Developer downloads it                | Optional                                  | From EAS artifacts after build              |

### Scorepion's flow

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  Your source  │  →    │   EAS Build   │  →    │    app.aab    │
│  (this repo)  │       │  (on their    │       │  (signed with │
│               │       │   Linux VM)   │       │  upload-key)  │
└───────────────┘       └───────────────┘       └───────┬───────┘
                                                         │
                                                         │  you upload
                                                         ▼
                                                ┌─────────────────┐
                                                │  Play Console   │
                                                │  → re-signs with│
                                                │  app-signing key│
                                                └────────┬────────┘
                                                         │
                                                         │  per-device
                                                         ▼
                                                ┌─────────────────┐
                                                │ Individual APKs │
                                                │ downloaded by   │
                                                │ user phones     │
                                                └─────────────────┘
```

Our `eas.json` production profile has `"buildType"` unset, which means EAS
defaults to AAB output. The `preview` profile explicitly sets
`"android": { "buildType": "apk" }` because internal testers sideload APKs
directly — those don't go through Play Delivery, so we need a single
installable file, not an AAB.

### Relevant commands

```bash
# Build an AAB for Play Store submission
eas build --platform android --profile production

# Build an APK for internal sideload testing
eas build --platform android --profile preview

# If you have an AAB and want to install it locally (requires bundletool):
bundletool build-apks --bundle=app.aab --output=app.apks \
  --ks=credentials/upload-key.jks --ks-key-alias=key
bundletool install-apks --apks=app.apks
```

### Size impact for Scorepion

Our APK is approximately 45 MB today. After Play's AAB splitting, users
typically download around 22–28 MB — the exact number depends on their
language + architecture + density combination.
