/**
 * Scorepion — Environment validation
 *
 * Loaded once at server startup (imported from `server/index.ts`). Its job is
 * to fail fast with a helpful message if a production deployment is missing
 * a variable it needs — instead of crashing later on the first request.
 *
 * Existing server modules can keep reading `process.env.FOO` directly; this
 * file is purely a boot-time gate.
 *
 * Add new required vars to the `REQUIRED_IN_PROD` list below.
 */

const isProd = process.env.NODE_ENV === "production";

// ─────────────────────────────────────────────────────────────────────────────
// Required — server refuses to boot in production without these.
// Each entry is [varName, brief human-readable purpose].
// ─────────────────────────────────────────────────────────────────────────────
const REQUIRED_IN_PROD: [string, string][] = [
  ["DATABASE_URL", "MySQL connection string"],
  [
    "JWT_SECRET",
    "JWT signing key (generate with node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")",
  ],
  ["ADMIN_SECRET", "admin endpoint token"],
  ["APP_URL", "public-facing server URL, e.g. https://api.yourdomain.com"],
  ["FOOTBALL_API_KEY", "API-Football key from api-sports.io"],
];

// ─────────────────────────────────────────────────────────────────────────────
// Conditionally required — needed when a feature flag is on.
// ─────────────────────────────────────────────────────────────────────────────
const CONDITIONAL: { when: () => boolean; vars: [string, string][]; label: string }[] = [
  {
    when: () => process.env.ENABLE_BILLING === "true",
    label: "ENABLE_BILLING=true",
    vars: [
      ["STRIPE_SECRET_KEY", "Stripe secret key"],
      ["STRIPE_PUBLISHABLE_KEY", "Stripe publishable key"],
      ["STRIPE_WEBHOOK_SECRET", "Stripe webhook signing secret"],
      ["STRIPE_PRICE_PREMIUM_MONTHLY", "Stripe price ID for monthly tier"],
      ["STRIPE_PRICE_PREMIUM_YEARLY", "Stripe price ID for yearly tier"],
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Numeric sanity: make sure anything we parseInt() is valid up front.
// ─────────────────────────────────────────────────────────────────────────────
const NUMERIC: [string, number | null][] = [
  ["PORT", 5847],
  ["FOOTBALL_API_DAILY_LIMIT", null],
  ["EXPO_METRO_PORT", null],
];

function validate(): { missing: string[]; invalid: string[] } {
  const missing: string[] = [];
  const invalid: string[] = [];

  if (isProd) {
    for (const [name, purpose] of REQUIRED_IN_PROD) {
      if (!process.env[name]) missing.push(`${name}  (${purpose})`);
    }
    for (const cond of CONDITIONAL) {
      if (!cond.when()) continue;
      for (const [name, purpose] of cond.vars) {
        if (!process.env[name])
          missing.push(`${name}  (${purpose}) — required because ${cond.label}`);
      }
    }
  }

  for (const [name] of NUMERIC) {
    // eslint-disable-next-line expo/no-dynamic-env-var
    const v = process.env[name];
    if (v === undefined) continue;
    if (!/^\d+$/.test(v)) invalid.push(`${name}=${v}  (must be a positive integer)`);
  }

  return { missing, invalid };
}

export function checkEnv(): void {
  const { missing, invalid } = validate();

  if (missing.length === 0 && invalid.length === 0) {
    console.log(
      `[env] validated (${isProd ? "production" : (process.env.NODE_ENV ?? "development")} mode)`,
    );
    return;
  }

  const lines: string[] = ["", "━━━ Environment misconfigured ━━━"];
  if (missing.length > 0) {
    lines.push("", "Missing required variables:");
    missing.forEach((m) => lines.push(`  • ${m}`));
  }
  if (invalid.length > 0) {
    lines.push("", "Invalid values:");
    invalid.forEach((m) => lines.push(`  • ${m}`));
  }
  lines.push("", "See .env.example for the full list and docs/ENVIRONMENTS.md for guidance.", "");

  const message = lines.join("\n");

  if (isProd) {
    // Crash loudly in prod — don't let the server come up in a bad state.
    console.error(message);
    process.exit(1);
  } else {
    // In dev, warn but keep going so devs aren't blocked by missing Stripe keys etc.
    console.warn(message);
  }
}
