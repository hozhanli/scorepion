# Scorepion Operations Runbook

A guide to running and maintaining the Scorepion football prediction app in production.

---

## Environment Setup

### Production Secrets

Configure these in your `.env` file or via your platform's secrets management (Fly.io, Heroku, AWS Systems Manager, etc.):

| Variable                 | Required | Notes                                                                                                                      |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Yes      | MySQL 8.0+ connection string; managed MySQL (PlanetScale, AWS RDS, DigitalOcean) recommended. 2GB RAM minimum for 10k MAU. |
| `FOOTBALL_API_KEY`       | Yes      | RapidAPI API-Football key (Pro plan recommended for live polling; free tier is batch-only).                                |
| `JWT_SECRET`             | Yes      | 64+ random hex chars. Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`                 |
| `ADMIN_SECRET`           | Yes      | Secret for admin-only endpoints (e.g., `/api/football/sync/full`). Rotate quarterly.                                       |
| `SENTRY_DSN`             | Yes      | Error tracking DSN from [sentry.io](https://sentry.io). Create two projects: `scorepion-server`, `scorepion-client`.       |
| `STRIPE_SECRET_KEY`      | No       | Production Stripe secret key (if using premium features).                                                                  |
| `STRIPE_WEBHOOK_SECRET`  | No       | Stripe webhook signing key.                                                                                                |
| `ALLOWED_ORIGINS`        | No       | Comma-separated CORS origins (e.g., `https://scorepion.com,https://www.scorepion.com`). Localhost always allowed in dev.   |
| `NODE_ENV`               | Yes      | Set to `production` in prod.                                                                                               |
| `APP_URL`                | Yes      | Public-facing server URL for Stripe/Expo redirects (e.g., `https://api.scorepion.com`).                                    |
| `EXPO_PUBLIC_SENTRY_DSN` | Yes      | Client-side Sentry DSN (React Native). Different from server DSN.                                                          |

### Recommended Infrastructure

- **MySQL**: PlanetScale, AWS RDS, DigitalOcean managed, or Fly.io (not containerized in prod)
  - Min 2GB RAM for 10k MAU; 8GB for 100k MAU
  - Daily automated backups via managed provider
  - Single region acceptable up to 100k MAU
- **Node Server**: Single box (1-2GB RAM) for <100k MAU, load-balanced for larger
  - Stateless (sessions via JWT + refresh tokens)
  - Runs health checks at `/api/health`, `/api/health/live`, `/api/health/ready`
- **Client**: Expo EAS (managed build + OTA)
- **Monitoring**: Sentry for errors + perf; DataDog, CloudWatch, or Papertrail for logs
- **Cache**: Redis optional (only needed at >50k MAU for rate limiting shared state)

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
curl -X POST http://server:5847/api/football/sync/full \
  -H "x-admin-secret: $ADMIN_SECRET"
```

Expected response: `{ "message": "Sync started" }`

Logs will show progress.

### Check API-Football Quota

```bash
curl http://server:5847/api/football/sync/quota \
  -H "x-admin-secret: $ADMIN_SECRET"
```

Response:

```json
{
  "used": 2840,
  "limit": 7500,
  "resetAt": "2026-04-22T00:00:00Z"
}
```

If `used >= limit`, quota is exhausted. Wait until `resetAt` or upgrade plan.

### Add a New Language

1. Create translations in `shared/translations.ts` (all 6 languages + English keys)
2. Add to `SUPPORTED_LANGUAGES` enum
3. Ensure diacritics are correct: `npm run i18n:check`
4. Restart server and rebuild client

### Add a New League

1. Edit `server/services/football-api.ts`, update `LEAGUE_MAP`
2. Restart server
3. Sync via `/api/football/sync/full` to populate fixtures
4. Client picks up leagues from `/api/football/leagues` automatically

### Refresh User Token (Admin)

If a user reports locked-out auth:

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "
  DELETE FROM refresh_tokens WHERE user_id = 'user_id_here';
  SELECT 'Token invalidated. User will re-auth on next app open.';
"
```

### Force Logout All Users

If JWT_SECRET is suspected compromised:

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "
  TRUNCATE TABLE refresh_tokens;
  SELECT 'All refresh tokens invalidated.';
"
```

Then rotate `JWT_SECRET` in production and restart.

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
- `JWT_SECRET` — rotate carefully (invalidates all active tokens; warn users)
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
