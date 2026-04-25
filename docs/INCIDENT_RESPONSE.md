# Scorepion Incident Response Playbook

Quick response procedures for the four most likely production incidents.

---

## 1. Server Down (Health Check 503)

**Symptom**: `/api/health` returns 503 or times out. App cannot sync or predict.

**Severity**: Critical. Users affected immediately.

### Diagnosis (2 min)

```bash
# Check if server process is running
pm2 list
# or
fly status

# Check recent logs (last 50 lines)
pm2 logs scorepion | tail -50
# or
fly logs -n 50

# Test database connectivity
psql $DATABASE_URL -c "SELECT 1"
# Expected: 1 (zero latency ~1ms)

# Check Sentry dashboard
# → Look for new error groups in the last 10 minutes
```

### Common Causes & Fixes

#### Out of Memory (OOM)

**Signs in logs**: `FATAL`, `out of memory`, or process just stops.

**Fix**:

```bash
# Restart process
pm2 restart scorepion
# or redeploy
fly deploy
```

#### Postgres Connection Failed

**Signs in logs**: `ECONNREFUSED`, `could not translate host name`, or `password authentication failed`.

**Fix**:

```bash
# 1. Verify DATABASE_URL is set and correct
echo $DATABASE_URL

# 2. Test connection directly
psql $DATABASE_URL -c "SELECT 1"

# 3. If connection fails:
#    - Check Postgres is running (cloud provider dashboard)
#    - Verify security group / firewall allows your IP
#    - Rotate DATABASE_URL if password was exposed

# 4. Restart server after fixing
pm2 restart scorepion
```

#### Migration Error on Startup

**Signs in logs**: `[Migration] Error`, `CREATE TABLE` fails, or syntax error.

**Fix**:

```bash
# 1. Check which migration failed
psql $DATABASE_URL -c "SELECT * FROM _migrations ORDER BY applied_at DESC LIMIT 1"

# 2. Inspect the SQL file
cat server/migrations/006_*.sql

# 3. If SQL is wrong:
#    - Roll back commit (git revert)
#    - Fix the migration file
#    - Re-deploy

# 4. If SQL is correct but DB already partially applied:
#    - Delete the failed migration from _migrations
psql $DATABASE_URL -c "DELETE FROM _migrations WHERE name = '006_h2h_league_and_venue.sql'"
#    - Manually fix the schema via psql
#    - Restart server (will re-apply migrations)
```

#### Node Process Crashed

**Signs**: Process exited with non-zero code, no logs.

**Fix**:

```bash
# Check exit code
pm2 show scorepion | grep "exit code"

# Common exit codes:
# 1   = unhandled exception
# 143 = killed by SIGTERM (timeout)

# Restart and tail logs
pm2 restart scorepion
pm2 logs scorepion

# If crash repeats, redeploy previous version
git revert HEAD
npm run server:build
fly deploy
```

### If diagnosis doesn't find the issue:

```bash
# Last resort: redeploy previous commit
git log --oneline | head -5
git checkout abc123  # last known good commit
npm run server:build
fly deploy

# Meanwhile, check Sentry for context
# → Full stack trace, breadcrumbs, user info
```

---

## 2. API-Football Quota Exhausted

**Symptom**: `/api/football/sync/full` fails with quota error. Fixture data is stale.

**Severity**: High. Users see outdated match data, predictions may be locked.

### Diagnosis (1 min)

```bash
# Check quota
curl -X GET http://server:5847/api/football/sync/quota \
  -H "x-admin-secret: $ADMIN_SECRET"

# Response shows:
# { "used": 7450, "limit": 7500, "resetAt": "2026-04-22T00:00:00Z" }
```

### Causes & Fixes

#### Free Plan: Daily Limit Reached

**Normal at scale**. Free tier is 100 req/day; hits limit quickly.

**Fix**:

- Upgrade to Pro plan immediately (~$30–50/month)
- Update `FOOTBALL_API_KEY` in production
- Restart server
- Rerun sync: `curl -X POST http://server:5847/api/football/sync/full ...`

#### Caching Not Working

**Symptom**: Quota used before end of day despite caching.

**Check logs**:

```bash
grep "API-Football" logs/* | tail -20
# Should see ~2,800–3,000 requests per day
# If seeing >5,000, caching is broken
```

**Fix**:

- Verify caching logic in `server/services/football-api.ts`
- Check Redis is running (if using Redis cache)
- Verify fixture cache TTL is set (should be 1 hour or more)

#### Pro Plan Still Hits Limit

**Symptom**: Used 7500 before reset, but on Pro plan.

**Possible causes**:

- Multiple servers hitting the same API (re-seeding, parallel syncs)
- Custom integration fetching uncached data
- Sync running too frequently

**Fix**:

1. Disable custom integrations or batch them
2. Ensure only one sync instance is running (check for duplicate cron jobs)
3. Increase sync interval (currently every 10 min during live matches)

### Temporary Workaround

If quota exhausted and can't upgrade immediately:

```bash
# Pause sync to preserve quota for critical times
# Edit server config or use admin endpoint
# (Manual: update server code to skip sync until reset)

# Users will see stale data but predictions are still accepted
# Re-enable sync after reset at 00:00 UTC next day
```

---

## 3. Database Full / Slow Queries

**Symptom**: `/api/health` slow (>1 sec), or writes start failing. Server logs show queries taking >5 seconds.

**Severity**: High. User experience degrades, then breaks.

### Diagnosis (3 min)

```bash
# Check database size
psql $DATABASE_URL -c "
  SELECT
    schemaname,
    ROUND(SUM(pg_total_relation_size(tablename)) / 1024 / 1024 / 1024, 2) AS size_gb
  FROM pg_tables
  GROUP BY schemaname
  ORDER BY size_gb DESC;
"

# Check for long-running queries
psql $DATABASE_URL -c "
  SELECT pid, usename, state, query, (NOW() - query_start) AS duration
  FROM pg_stat_activity
  WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%'
  ORDER BY duration DESC
  LIMIT 10;
"

# Check table sizes (predictions table often largest)
psql $DATABASE_URL -c "
  SELECT tablename, ROUND(pg_total_relation_size(tablename) / 1024 / 1024) AS size_mb
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY size_mb DESC
  LIMIT 10;
"
```

### Common Causes & Fixes

#### Missing Indexes

**Signs**: Sequential scans on large tables in EXPLAIN output.

**Diagnosis**:

```bash
# Identify slow query
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT ..."

# Look for "Seq Scan" on large tables — indicates missing index
```

**Fix**:

```bash
# Add index for common query filters
psql $DATABASE_URL -c "CREATE INDEX idx_predictions_user_league ON predictions(user_id, league_id)"

# Restart server (queries will use new index)
```

#### Predictions Table Bloat

**Signs**: `predictions` table >50MB, performance degrading over weeks.

**Diagnosis**:

```bash
# Count predictions
psql $DATABASE_URL -c "SELECT count(*) FROM predictions"

# Check table size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_total_relation_size('predictions'))"
```

**Fix (short-term)**:

```bash
# Vacuum and reindex (non-blocking)
psql $DATABASE_URL -c "VACUUM ANALYZE predictions"
psql $DATABASE_URL -c "REINDEX TABLE CONCURRENTLY predictions"
```

**Fix (long-term)**:

- Archive old predictions (>6 months) to separate table
- Partition table by league_id or created_at
- Add retention policy (delete predictions >1 year old)

#### Disk Full

**Symptom**: `Disk full` error in Postgres logs.

**Fix**:

1. Check managed database provider (Fly, Supabase, RDS)
2. Upgrade disk size (takes 10–30 min downtime usually)
3. Meanwhile, identify bloat:
   ```bash
   psql $DATABASE_URL -c "VACUUM FULL"  # ~10 min, blocks reads
   ```

---

## 4. Payment / Auth Failure

**Symptom**: Users report "invalid token" or "auth failed" errors despite correct credentials. Or Stripe webhook failures.

**Severity**: High. Users locked out; revenue impact if payment failures.

### Diagnosis (2 min)

```bash
# Check JWT_SECRET hasn't changed
echo "Current JWT_SECRET: $(echo $JWT_SECRET | cut -c1-8)..."

# Check refresh_tokens table size (shouldn't grow unboundedly)
psql $DATABASE_URL -c "
  SELECT count(*) AS token_count,
         COUNT(DISTINCT user_id) AS unique_users,
         ROUND(pg_total_relation_size('refresh_tokens') / 1024 / 1024, 2) AS size_mb
  FROM refresh_tokens;
"

# Check Sentry for JWT/Stripe errors
# → Look for patterns: all users or specific user IDs?
```

### Common Causes & Fixes

#### JWT_SECRET Rotated or Compromised

**Symptom**: All users suddenly get `invalid token`.

**Fix**:

1. **If rotated accidentally**: revert to old secret

   ```bash
   # In production config, restore previous JWT_SECRET
   export JWT_SECRET="old_value"
   pm2 restart scorepion
   ```

2. **If compromised**: invalidate all tokens immediately
   ```bash
   psql $DATABASE_URL -c "TRUNCATE TABLE refresh_tokens"
   # Users will be logged out; warn them to re-authenticate
   ```
   Then rotate JWT_SECRET:
   ```bash
   export JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
   pm2 restart scorepion
   ```

#### Refresh Token Table Bloat

**Symptom**: `refresh_tokens` >100MB, queries slow.

**Cause**: Old tokens not being deleted (normal, but can accumulate).

**Fix**:

```bash
# Delete expired refresh tokens (safe)
psql $DATABASE_URL -c "
  DELETE FROM refresh_tokens
  WHERE created_at < NOW() - INTERVAL '30 days'
"

# Vacuum to reclaim space
psql $DATABASE_URL -c "VACUUM ANALYZE refresh_tokens"
```

#### Stripe Webhook Not Signing Correctly

**Symptom**: Webhook signature validation fails, Stripe events not processed.

**Check**:

```bash
# Verify STRIPE_WEBHOOK_SECRET is set
echo $STRIPE_WEBHOOK_SECRET

# Check logs for signature errors
grep "Stripe" logs/* | grep -i "signature\|invalid"
```

**Fix**:

1. Retrieve correct webhook secret from Stripe dashboard → Webhooks
2. Update `STRIPE_WEBHOOK_SECRET` in production config
3. Restart server
4. Test: trigger a payment and check logs for successful webhook

### If users are locked out:

```bash
# Immediate mitigation: clear all sessions (WARN USERS)
psql $DATABASE_URL -c "TRUNCATE TABLE refresh_tokens"
# → Users will be forced to re-auth on next app open

# Then investigate root cause in Sentry / logs
```

---

## Escalation & Communication

### Page On-Call

Page on-call immediately if:

- Health check has been 503 for >5 minutes
- > 10% of users report auth failures
- Database becomes unreachable
- Disk space exhausted

### Customer Communication (15 min)

Post status update:

- Twitter / status page
- In-app notification (if applicable)
- Slack / Discord community

**Example**: "We're investigating a database connectivity issue. User sync is degraded. ETA: 30 minutes."

### Post-Incident

After incident is resolved:

1. Document root cause in a ticket
2. Assign prevention task (e.g., "add disk usage alert")
3. Update this playbook if new pattern emerges

---

## Prevention

- **Health checks**: Monitor every minute (Uptime.com, Pingdom)
- **Sentry alerts**: Get paged on spike in error rate
- **Database alerts**: Monitor disk space, slow queries, connections
- **Backup validation**: Run `scripts/verify-backup.sh` daily (ensures restore works)
- **Load testing**: Run monthly synthetic load test (10% of peak users)

See [`OPERATIONS.md`](./OPERATIONS.md) for monitoring setup.
