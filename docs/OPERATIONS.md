# Scorepion Operations Runbook

A guide to running and maintaining the Scorepion football prediction app in production.

---

## Environment Setup

### Production Secrets

Configure these in your `.env` file or via your platform's secrets management (Fly.io, Heroku, AWS Systems Manager, etc.):

| Variable                                                              | Required | Notes                                                                                                                                        |
| --------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                        | Yes      | MySQL 8.0+ connection string; managed MySQL (PlanetScale, AWS RDS, DigitalOcean) recommended. 2GB RAM minimum for 10k MAU.                   |
| `FOOTBALL_API_KEY`                                                    | Yes      | RapidAPI API-Football key (Pro plan recommended for live polling; free tier is batch-only).                                                  |
| `FIREBASE_PROJECT_ID`                                                 | Yes      | Firebase project ID (e.g. `scorepion-7b110`). Authentication is handled by Firebase.                                                         |
| `GOOGLE_APPLICATION_CREDENTIALS` _or_ `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes      | Admin SDK credentials. Path to a service account JSON file, OR the JSON inlined as a single env var. The latter is preferred for containers. |
| `ADMIN_SECRET`                                                        | Yes      | Secret for admin-only endpoints (e.g., `/api/football/sync/full`). Rotate quarterly.                                                         |
| `SENTRY_DSN`                                                          | Yes      | Error tracking DSN from [sentry.io](https://sentry.io). Create two projects: `scorepion-server`, `scorepion-client`.                         |
| `STRIPE_SECRET_KEY`                                                   | No       | Production Stripe secret key (if using premium features).                                                                                    |
| `STRIPE_WEBHOOK_SECRET`                                               | No       | Stripe webhook signing key.                                                                                                                  |
| `ALLOWED_ORIGINS`                                                     | No       | Comma-separated CORS origins (e.g., `https://scorepion.fans,https://www.scorepion.fans`). Localhost always allowed in dev.                   |
| `NODE_ENV`                                                            | Yes      | Set to `production` in prod.                                                                                                                 |
| `APP_URL`                                                             | Yes      | Public-facing server URL for Stripe/Expo redirects (e.g., `https://api.scorepion.fans`).                                                     |
| `EXPO_PUBLIC_SENTRY_DSN`                                              | Yes      | Client-side Sentry DSN (React Native). Different from server DSN.                                                                            |

### Recommended Infrastructure

- **MySQL**: PlanetScale, AWS RDS, DigitalOcean managed, or Fly.io (not containerized in prod)
  - Min 2GB RAM for 10k MAU; 8GB for 100k MAU
  - Daily automated backups via managed provider
  - Single region acceptable up to 100k MAU
- **Node Server**: Single box (1-2GB RAM) for <100k MAU, load-balanced for larger
  - Stateless (auth via Firebase ID tokens — verified offline against cached public keys)
  - Runs health checks at `/api/health`, `/api/health/live`, `/api/health/ready`
- **Client**: Expo EAS (managed build + OTA)
- **Monitoring**: Sentry for errors + perf; DataDog, CloudWatch, or Papertrail for logs
- **Cache**: Redis optional (only needed at >50k MAU for rate limiting shared state)

---

## Environment Configuration

This section explains how environment variables flow through the system. For the
full list of production secrets and their descriptions, see the
[Production Secrets](#production-secrets) table above.

### Two env universes

There are **two independent env universes** in this repo:

- **Server env** — read by the Express backend via `process.env`. Sourced from
  `.env` locally, or from the hosting platform's secret store in production
  (Fly.io secrets, Railway variables, etc.).
- **Client env** — read by the React Native app. Only variables prefixed with
  `EXPO_PUBLIC_*` are exposed to the bundle, and they are **inlined at build
  time**, not read at runtime. You cannot change `EXPO_PUBLIC_*` values after
  the AAB is installed on a user's phone.

The client env in practice has two variables: `EXPO_PUBLIC_DOMAIN` (required) and
`EXPO_PUBLIC_SENTRY_DSN` (optional). Everything else lives on the server.

### Where values come from

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

### Build profiles (`eas.json`)

| Profile       | Distribution | `EXPO_PUBLIC_DOMAIN`          | When to use                                    |
| ------------- | ------------ | ----------------------------- | ---------------------------------------------- |
| `development` | internal APK | `localhost:13291` (tunnelled) | Local dev on a real device with `--dev-client` |
| `preview`     | internal APK | `staging-api.scorepion.fans`  | Internal beta testing against staging          |
| `production`  | store AAB    | `api.scorepion.fans`          | Play Store releases                            |

The URL is a **bare host** (no `https://` prefix). The client's `getApiUrl()`
infers the scheme: `http://` for localhost/IP addresses, `https://` for
everything else.

### Validation at startup (server)

`server/env.ts` runs before Express binds the port. In production it refuses to
boot if any of these are missing:

- `DATABASE_URL`
- `ADMIN_SECRET`
- `APP_URL`
- `FOOTBALL_API_KEY`
- `FIREBASE_PROJECT_ID`
- One of: `GOOGLE_APPLICATION_CREDENTIALS` (path) or `FIREBASE_SERVICE_ACCOUNT_JSON` (inline)

And conditionally (if `ENABLE_BILLING=true`):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_PREMIUM_YEARLY`

Missing vars in dev print a warning but don't block boot, so local developers
can run without Stripe keys. To add a new required var, edit `REQUIRED_IN_PROD`
in `server/env.ts`.

### Changing the API URL for a release

**Before the build** -- update `eas.json`:

```json
// eas.json
"production": {
  "env": {
    "EXPO_PUBLIC_DOMAIN": "api.your-new-domain.com"
  }
}
```

Then run `eas build --platform android --profile production`. The URL is baked
into the AAB.

**After installation:** not possible without shipping a new JS bundle
(`eas update --channel production`) or a new binary.

### Secrets hygiene

- Every `.env*` file is git-ignored.
- `credentials/` is git-ignored (keystore + service account JSONs).
- Never paste secret values into commit messages, PR descriptions, or chat.
- If `ADMIN_SECRET` leaks: rotate immediately (see [Secrets Rotation](#secrets-rotation) below).
- If the Firebase service account JSON leaks: revoke the key in Firebase
  Console and generate a new one. Existing user sessions are unaffected.

### Relationship to `credentials/`

`credentials/` holds artifacts (upload keystore, Firebase service account, Play
Developer API service account) that are referenced by path, not by env var. They
are packaged/uploaded by `eas credentials` or `eas submit` -- not read by the
running server or app. See `credentials/README.md` for details.

---

## Daily Operations

### Backup Schedule

**Automated**: Cron job scheduled to run `scripts/backup-db.sh` at **03:00 UTC daily**

```bash
# Example crontab entry (on server or CI/CD)
0 3 * * * cd /path/to/scorepion && bash scripts/backup-db.sh >> /var/log/scorepion-backup.log 2>&1
```

**Manual backup**: `bash scripts/backup-db.sh`

Backups are written to `./backups/` with auto-rotation (keeps 7 days).

**Verify latest backup**: `bash scripts/verify-backup.sh` (requires Docker)

### Log Aggregation

Scorepion logs via **pino** in JSON format to stdout. Aggregate using your log service:

- **Datadog**: Ship via agent
- **CloudWatch**: Set up CloudWatch Logs agent
- **Papertrail**: Forward to UDP endpoint
- **Local**: `pm2 logs scorepion` (dev only)

### Health Checks

Wire these into your uptime monitor (Uptime.com, Pingdom, New Relic, etc.):

- `GET /api/health` — comprehensive health (DB, external APIs)
- `GET /api/health/live` — liveness (server is running)
- `GET /api/health/ready` — readiness (DB + migrations applied)

Expected response: `{ "status": "ok" }`

**Alert** on 503 or timeout.

### Daily Checklist

- [ ] Check Sentry dashboard for new error groups
- [ ] Monitor health endpoint for 503 responses
- [ ] Verify backup rotation (≥7 files in `./backups/`)
- [ ] Spot-check logs for unusual activity

---

## Common Tasks

### Rerun Stuck Football API Sync

If the scheduled sync is stuck or behind:

```bash
curl -X POST http://localhost:5000/api/sync/full \
  -H "x-admin-secret: $ADMIN_SECRET"
```

Expected response: `{ "message": "Sync started" }`

Logs will show progress.

### Check API-Football Quota

```bash
curl http://localhost:5000/api/sync/quota \
  -H "x-admin-secret: $ADMIN_SECRET"
```

Response:

```json
{
  "used": 2840,
  "remaining": 4660,
  "limit": 7500
}
```

If `remaining` is 0, quota is exhausted. Wait until midnight UTC or upgrade plan.

### Add a New Language

1. Create translations in `shared/translations.ts` (all 5 languages + English keys)
2. Add to `SUPPORTED_LANGUAGES` enum
3. Ensure diacritics are correct: `npm run i18n:check`
4. Restart server and rebuild client

### Add a New League

1. Edit `server/services/football-api.ts`, update `LEAGUE_MAP`
2. Restart server
3. Sync via `/api/football/sync/full` to populate fixtures
4. Client picks up leagues from `/api/football/leagues` automatically

### Force-revoke a single user's session

If a user reports a compromised account:

1. Firebase Console → Authentication → find the user → "Reset password" _or_
   click "..." → "Revoke refresh tokens".
2. The user's existing ID tokens stay valid until they expire (max 1 hour);
   after that they'll be forced to re-authenticate.

For immediate revocation that ignores the 1-hour ID-token TTL, change
`requireAuth` to call `verifyIdToken(token, true)` — but expect added Firebase
RPC latency on every authenticated request.

### Force-logout all users

If the Firebase service account is compromised:

1. Firebase Console → Project Settings → Service accounts → revoke the leaked key.
2. Generate a new key, update `GOOGLE_APPLICATION_CREDENTIALS` /
   `FIREBASE_SERVICE_ACCOUNT_JSON` on the server, restart.
3. To force every user to re-auth (rather than wait for token expiry):
   Firebase Console → Authentication → bulk-revoke refresh tokens via the
   Admin SDK or the gcloud CLI.

### Check Database Size

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "
  SELECT
    table_schema,
    ROUND(SUM(data_length + index_length) / 1024 / 1024) AS size_mb
  FROM information_schema.tables
  GROUP BY table_schema
  ORDER BY size_mb DESC;
"
```

### Roll Back Migration

If a migration breaks prod:

1. Manually revert schema via `mysql` (consult migration file)
2. Delete the migration from `_migrations` table: `DELETE FROM _migrations WHERE name = '006_*.sql';`
3. Redeploy server (will re-apply migrations on startup)

---

## Scaling Notes

### 10k MAU

- Single MySQL (2GB RAM, automated backups, ~daily growth)
- Single Node box (1GB RAM, stateless)
- API-Football free or pro (batch-only acceptable)
- No caching needed

### 100k MAU

- MySQL 8GB RAM with read replica (for reporting queries)
- 2–3 Node boxes behind load balancer
- Redis for rate limiting (shared state across LB)
- API-Football Pro (7,500 req/day, grows with users but caching mitigates linear scaling)

### 1M+ MAU

- MySQL cluster (primary + hot standby) in same region
- 5+ stateless Node boxes (horizontal scaling)
- Redis cluster for sessions + rate limiting
- Consider read replicas in other regions for latency
- Shard predictions table if approaching >500M rows
- API-Football may need custom integration (direct API or higher tier)

---

## Incident Response

See [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) for playbooks covering:

1. Server down (health check 503)
2. API-Football quota exhausted
3. Database full / slow queries
4. Payment/auth failure

---

## Secrets Rotation

**Quarterly rotation recommended**:

- `ADMIN_SECRET` — regenerate and update production config
- Firebase service account — generate a new key and revoke the old one in
  Firebase Console → Project Settings → Service accounts. Existing user
  sessions are unaffected (the key signs nothing user-facing).
- `STRIPE_SECRET_KEY` — rotate via Stripe dashboard
- Database password — managed by cloud provider (no action needed)

After rotation, restart server to apply.

---

## Monitoring & Alerts

### Key Metrics

- **Server uptime**: `/api/health` should return 200 every minute
- **Database latency**: Query p95 latency <200ms (check MySQL logs)
- **API-Football sync lag**: Latest fixture sync should be <1 hour old
- **Error rate**: Sentry error groups should trend toward zero
- **Disk usage**: Database size should grow <10% monthly

### Alert Thresholds

- Health endpoint returns 503: **Critical** — page on-call
- Backup missing for >24h: **High** — check cron job
- API-Football quota >80% used: **Medium** — plan upgrade
- Error rate >5%: **High** — investigate in Sentry

---

## Support & Debugging

- **Logs**: `pm2 logs` or log aggregation service (see above)
- **Errors**: Check Sentry dashboard for full stack traces + context
- **Database queries**: Use `EXPLAIN ANALYZE` to debug slow queries
- **API tests**: Import `api/tests/*.http` files into Postman or VS Code REST Client

For production incidents, consult [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md).
