# Environments & secrets

One-page reference for how Scorepion handles env-specific configuration across
the mobile app (Expo) and the Express server.

## Mental model

There are **two independent env universes** in this repo:

- **Server env** — read by the Express backend. Normal Node `process.env`.
  Sourced from `.env` locally, or from the hosting platform's secret store in
  production (Fly.io secrets, Railway variables, etc.).
- **Client env** — read by the React Native app. Only variables prefixed with
  `EXPO_PUBLIC_*` are exposed to the bundle, and they're **inlined at build
  time**, not read at runtime. You cannot change `EXPO_PUBLIC_*` values after
  the AAB is installed on a user's phone.

The server env has many variables. The client env in practice has two:
`EXPO_PUBLIC_DOMAIN` (required) and `EXPO_PUBLIC_SENTRY_DSN` (optional).

## Where values come from

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      SERVER                                                │
├────────────────────────────────────────────────────────────────────────────┤
│ Local dev       │  .env                                                    │
│ Production      │  hosting platform secrets (Fly.io / Railway / systemd)   │
│ CI              │  GitHub Actions secrets                                  │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT (Expo)                                         │
├────────────────────────────────────────────────────────────────────────────┤
│ Local dev       │  .env (only EXPO_PUBLIC_* vars)                          │
│ EAS builds      │  eas.json → build.<profile>.env                          │
│ OTA update      │  same as the build that emitted the JS bundle            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Build profiles (`eas.json`)

| Profile       | Distribution | `EXPO_PUBLIC_DOMAIN`          | When to use                                    |
| ------------- | ------------ | ----------------------------- | ---------------------------------------------- |
| `development` | internal APK | `localhost:13291` (tunnelled) | Local dev on a real device with `--dev-client` |
| `preview`     | internal APK | `staging-api.scorepion.fans`  | Internal beta testing against staging          |
| `production`  | store AAB    | `api.scorepion.fans`          | Play Store releases                            |

The URL is intentionally a **bare host** (no `https://` prefix). The client's
`getApiUrl()` infers the scheme: `http://` for localhost/IP addresses, `https://`
for everything else.

## Validation at startup (server)

`server/env.ts` runs before Express binds the port. In production it refuses
to boot if any of these are missing:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_SECRET`
- `APP_URL`
- `FOOTBALL_API_KEY`
- `EXPO_ACCESS_TOKEN`

And conditionally (if `ENABLE_BILLING=true`):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_PREMIUM_YEARLY`

Missing vars in dev print a warning but don't block boot — so local developers
can still run without Stripe keys.

To add a new required var: edit `REQUIRED_IN_PROD` in `server/env.ts`.

## Changing the API URL for a release

**Before the build:**

```json
// eas.json
"production": {
  "env": {
    "EXPO_PUBLIC_DOMAIN": "api.your-new-domain.com"
  }
}
```

Then `eas build --platform android --profile production`. The URL is baked
into the AAB.

**After installation:** not possible without shipping a new JS bundle
(`eas update --channel production`) or a new binary.

## Local dev quickstart

```bash
cp .env.example .env
# edit .env with real values (DATABASE_URL, FOOTBALL_API_KEY, JWT_SECRET…)
npm run db:start     # local MySQL
npm run server:dev   # Express
npm start            # Metro + Expo client
```

## Production checklist (server)

Before starting the server in production mode, have these set on the host:

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` with `?sslmode=require`
- [ ] `JWT_SECRET` (64-byte hex)
- [ ] `ADMIN_SECRET` (32-byte hex)
- [ ] `APP_URL` = public URL of the server
- [ ] `FOOTBALL_API_KEY`
- [ ] `EXPO_ACCESS_TOKEN`
- [ ] `ALLOWED_ORIGINS` if your web frontend lives on another domain
- [ ] `SENTRY_DSN` (optional but recommended)
- [ ] `LOG_LEVEL=info`

## Secrets hygiene

- Every `.env*` file is git-ignored.
- `credentials/` is git-ignored (keystore + service account JSONs).
- Never paste secret values into commit messages, PR descriptions, or chat.
- Rotate `JWT_SECRET` only when you can tolerate logging everyone out — all
  outstanding tokens become invalid.
- If `ADMIN_SECRET` leaks: rotate immediately. If `JWT_SECRET` leaks: rotate,
  and users re-login.

## Relationship to `credentials/`

`credentials/` holds artifacts (upload keystore, Firebase service account,
Play Developer API service account) that are referenced by path, not by env
var. They are packaged/uploaded by `eas credentials` or `eas submit` — not
read by the running server or app.

See `credentials/README.md` for that side of the story.
