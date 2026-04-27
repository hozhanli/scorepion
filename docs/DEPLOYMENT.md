# Scorepion Production Deployment Guide

Step-by-step instructions for first-time and ongoing production deployments.

---

## Pre-Deployment Checklist

Before deploying to production for the first time, verify all items:

### Secrets & Configuration

- [ ] `.env` populated with all required variables (see [`OPERATIONS.md`](./OPERATIONS.md) for full list)
- [ ] `DATABASE_URL` points to a production-grade MySQL (managed service, not local container)
- [ ] `FOOTBALL_API_KEY` set with Pro plan for live polling (or free for batch-only)
- [ ] `JWT_SECRET` generated securely (64+ random hex chars)
- [ ] `ADMIN_SECRET` generated securely (different from JWT_SECRET)
- [ ] `SENTRY_DSN` set and account verified (two projects: `scorepion-server`, `scorepion-client`)
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` set (if using premium features)

### Infrastructure

- [ ] MySQL database created and accessible via `DATABASE_URL`
- [ ] Migrations will run automatically on server startup (no manual step needed)
- [ ] Server instance ready (1–2GB RAM minimum for <100k MAU)
- [ ] Node.js 18+ installed and npm/pnpm available

### Monitoring & Logging

- [ ] Sentry projects created and DSNs verified
  - Test by triggering a dummy error: `curl -X GET http://localhost:5847/api/health` (before deploy)
- [ ] Log aggregation configured (DataDog, CloudWatch, Papertrail, etc.)
- [ ] Health check endpoint monitored (Uptime.com, Pingdom, New Relic, etc.)

### Build & Deployment

- [ ] Git repo is clean (no uncommitted changes): `git status`
- [ ] All tests passing: `npm test`
- [ ] All type checks passing: `npm run typecheck && npm run typecheck:server`
- [ ] Linter checks passing: `npm run lint`

### Client (Mobile App)

- [ ] Apple Developer account with Team ID registered
- [ ] iOS push certificate (APNs) provisioned and installed in Expo
- [ ] Android FCM key configured in Firebase Console
- [ ] App Store listing submitted and approved (or ready for review)
- [ ] Google Play listing ready (can be submitted after first server deploy)
- [ ] Build credentials secured in Expo (managed via `eas build`)

### Backup Strategy

- [ ] Daily automated backup cron job scheduled: `0 3 * * * bash scripts/backup-db.sh`
- [ ] Backup rotation verified (script keeps 7 days)
- [ ] Restore test completed: `bash scripts/verify-backup.sh` (requires Docker)

---

## Deployment Steps

### 1. Build Server

```bash
npm run server:build
```

This creates `server_dist/index.js` (ESM bundle, optimized for Node).

### 2. Deploy Server

Choose your platform (examples below):

#### Fly.io

```bash
# Ensure fly.toml exists and is configured
fly deploy
```

Fly will:

- Build the Docker image
- Push to registry
- Deploy to your configured region
- Run health checks automatically

#### Heroku

```bash
git push heroku main
```

Heroku will:

- Detect Node.js buildpack
- Run `npm run server:build`
- Set `NODE_ENV=production` automatically
- Start the app

#### Traditional VPS (EC2, DigitalOcean, Linode, etc.)

```bash
# On the server:
cd /opt/scorepion
git pull origin main
npm ci --omit=dev
npm run server:build
pm2 restart scorepion  # or equivalent process manager
```

### 3. Verify Server Deployment

After deploy completes, check health:

```bash
curl https://api.scorepion.com/api/health
# Expected: { "status": "ok" }
```

If health check fails:

1. Check logs: `fly logs` or `pm2 logs`
2. Verify MySQL connectivity: `mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT 1"`
3. Check for migration errors in startup logs
4. See [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) for troubleshooting

### 4. Build & Deploy Client (Mobile)

Once server is confirmed working:

```bash
# Build for iOS and Android
eas build --profile production --platform all

# Wait for builds to complete (~15 min each)
# Then submit to app stores
eas submit --platform all
```

**First-time iOS**: Builds must be approved by Apple (1–3 days). Android is instant.

**OTA Updates** (after first app store release):

```bash
# For bug fixes / non-native-code changes:
eas update --branch production
```

Clients fetch new code automatically within 2–4 hours.

---

## Rollback

If a critical issue is discovered in production:

### Server Rollback

**Fastest option** (redeploy previous commit):

```bash
git log --oneline | head -5
# Find the last good commit, e.g., abc123
git checkout abc123
npm run server:build

# Re-deploy using your platform's tooling:
# fly deploy
# git push heroku main
# pm2 restart scorepion
```

**Downtime**: ~2–5 minutes depending on platform.

### Database Rollback

If a migration corrupted data:

```bash
bash scripts/restore-db.sh backups/scorepion_2026-04-21_000000.dump
```

Confirm with typing `restore` at the prompt.

**Downtime**: ~5–15 minutes depending on dump size.

### Client Rollback

**Native code changes** (iOS/Android):

- Users must update via App Store / Play Store (no instant rollback)
- Submit a hotfix build ASAP to unblock users
- Estimated time: 30 min (Android), 1–3 days (iOS review)

**JavaScript / business logic changes**:

- Use OTA rollback via Expo:
  ```bash
  eas rollback --branch production
  ```
- Clients fetch within 2–4 hours
- No app store resubmission needed

---

## Post-Deployment Verification

### 1. Smoke Tests (10 min)

- [ ] Server health check returns 200: `curl https://api.scorepion.com/api/health`
- [ ] Database is accessible: `mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT count(*) FROM users"`
- [ ] Migrations applied: `mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT * FROM _migrations"`
- [ ] Latest fixture sync is recent (within 1 hour): check logs or admin endpoint

### 2. Manual Testing (15 min)

- [ ] Sign up a new test user on iOS / Android
- [ ] View leagues and fixtures (should be populated)
- [ ] Create a prediction
- [ ] Trigger a payment flow (if applicable)

### 3. Monitoring (24 hours)

- [ ] Health check continues to pass every minute
- [ ] Error rate in Sentry is stable (no new error groups)
- [ ] Database latency is <200ms (check slow query logs)
- [ ] Backup ran successfully at 03:00 UTC (check cron output)

---

## Gradual Rollout (Recommended for Large Audiences)

If you have >10k users, consider a phased rollout:

### Server: Canary Deploy

Most platforms support canary (traffic split):

**Fly.io**:

```bash
fly deploy --strategy=canary
```

Routes 5% of traffic to new version; monitor errors for 5 minutes.

**Manual load balancer**: Deploy to a canary instance, route 5% of traffic, monitor for errors, then promote to 100%.

### Client: Staged Rollout

EAS and app stores support phased rollouts:

```bash
# Submit at 5% staged rollout
eas submit --platform ios --rate 0.05
```

Increase percentage every 6 hours if no crash reports.

---

## Common Issues

### Migrations Fail on Startup

**Symptom**: Health check returns 503, logs show `[Migration] Error`

**Fix**:

1. Check migration SQL syntax: review latest `.sql` file in `server/migrations/`
2. Test locally: `mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < server/migrations/006_*.sql`
3. If broken, roll back to previous commit and re-deploy

### MySQL Connection Timeout

**Symptom**: `mysql: error: could not translate host name`

**Fix**:

1. Verify `DATABASE_URL` format: `mysql://user:pass@host:3306/db`
2. Check MySQL is running and accessible (security groups, firewall)
3. Verify credentials are correct

### Secrets Not Loaded

**Symptom**: Server starts but `FOOTBALL_API_KEY` is undefined

**Fix**:

1. Confirm `.env` file exists in production (not in `.gitignore`)
2. Or use platform's secrets manager (Fly secrets, Heroku config vars)
3. Restart server after adding secrets

---

## CI/CD Integration (Optional)

For automated deployments on git push:

### GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run typecheck
      - run: npm run server:build
      - run: fly deploy
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## Support

- **Deployment issues**: Check logs and [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md)
- **Database questions**: See [`OPERATIONS.md`](./OPERATIONS.md)
- **Troubleshooting**: Check Sentry, server logs, and MySQL connectivity
