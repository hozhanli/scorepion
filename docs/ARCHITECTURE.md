# Scorepion Architecture

## Repo layout

```
scorepion/
├── app/                    # Expo Router — every file here is a route. Mobile entry.
├── src/                    # Mobile internals (non-route code)
│   ├── components/         # Reusable RN components (incl. src/components/ui primitives)
│   ├── contexts/           # React contexts (Auth, Theme, Language, App)
│   ├── lib/                # Mobile utilities: storage, i18n, motion, datetime, api client
│   ├── constants/          # Design tokens (colors, radii)
│   └── types/              # Mobile-only type declarations
├── server/                 # Node/Express backend (feature-based)
│   ├── index.ts            # Express bootstrap: security, CORS, rate-limit, /health, routes
│   ├── routes/             # One router file per domain
│   ├── services/           # Business logic (sync, football-api, …)
│   ├── repositories/       # DB access layer
│   ├── middleware/         # Auth, admin, rate-limit
│   ├── migrations/         # SQL migrations + runner
│   ├── templates/          # HTML templates (landing page)
│   ├── utils/              # Server-only helpers
│   ├── __tests__/          # Vitest server tests
│   └── tsconfig.json       # Server-only typecheck config
├── shared/                 # Code used by BOTH mobile and server
│   └── schema.ts           # Drizzle tables + Zod schemas (single source of truth)
├── scripts/                # Dev/ops scripts (db start, seed, build)
├── assets/                 # App icons, fonts, static images
├── patches/                # patch-package overrides
├── figma-plugin/           # Standalone Figma plugin (unrelated to app bundle)
├── docs/                   # This folder — all project docs
│   ├── README.md           # Doc index
│   ├── ARCHITECTURE.md     # You are here
│   ├── DESIGN_GUIDE.md
│   ├── PERSONA_ROLLUP.md
│   ├── TIMEZONE_AUDIT.md
│   ├── replit.md
│   └── archive/            # Historical audits and briefs (read-only)
├── .github/workflows/      # CI: backend.yml, mobile.yml
├── app.json                # Expo config (slug, bundle IDs, plugins)
├── eas.json                # EAS Build profiles (dev/preview/production)
├── Dockerfile              # Backend container (multi-stage, non-root)
├── tsconfig.json           # Mobile typecheck config (includes app/ + src/)
├── tsconfig.base.json      # Shared compiler options + path aliases
└── vitest.config.ts        # Test runner config
```

## Path aliases

| Alias        | Resolves to   | Used by           |
|--------------|---------------|-------------------|
| `@/*`        | `./src/*`     | Mobile (app + src)|
| `@shared/*`  | `./shared/*`  | Both              |
| `@server/*`  | `./server/*`  | Server only       |

## Boundary rules

- `app/` imports from `@/*` and `@shared/*` only — never from `server/`.
- `src/` imports from `@/*` and `@shared/*` only — never from `server/`.
- `server/` imports from `@shared/*` only — never from `app/` or `src/`.
- `shared/` imports nothing from `app/`, `src/`, or `server/` — keep it pure.

Tsconfigs enforce this: `tsconfig.json` (mobile) excludes `server/**`, and `server/tsconfig.json` excludes `../app/**` and `../src/**`.

## CI pipelines

- **`backend.yml`** — runs on `server/**`, `shared/**` changes. Lint → typecheck → vitest (Postgres 16 service) → build → Docker image → GHCR push.
- **`mobile.yml`** — runs on `app/**`, `src/**`, `shared/**`, `assets/**`, `app.json`, `eas.json`. Lint + typecheck on all branches; EAS build (preview on PRs, production on `main`).

## Why this structure (short version)

- **`src/` consolidates mobile internals** so the root only holds entry points and config. Expo Router requires `app/` at the root, but everything else is now behind one clear boundary.
- **Server is feature-based** (routes + services + repositories per domain) — matches the 2025 Node+Express consensus and keeps each domain self-contained.
- **`shared/` is the only bridge** between tiers. Drizzle schema + Zod validation live there so both server and client agree on the shape of the data.
- Not a pnpm monorepo yet — only worthwhile when a second app (web, admin) appears. Current layout upgrades cleanly to `apps/mobile` + `apps/backend` + `packages/shared` when that day comes.
