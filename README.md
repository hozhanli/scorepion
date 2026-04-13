# Scorepion

A football prediction app built with Expo (React Native) + Express + PostgreSQL.

## Prerequisites

- **Node.js** v20+
- **npm**
- **Docker** (for the PostgreSQL database)

## Quick Start (from scratch)

```bash
# 1. Install dependencies
npm install

# 2. Start database, push schema, and seed dev data — all in one command
npm run db:setup

# 3. Start the backend server (in one terminal)
npm run server:dev

# 4. Start the Expo app (in another terminal)
npm start
```

That's it. The app should now be running:

| Service          | URL                          |
|------------------|------------------------------|
| Express API      | http://localhost:5847        |
| Expo Metro       | http://localhost:8087        |
| PostgreSQL       | localhost:8990               |

## Environment Variables

All config lives in `.env` at the project root. Create it from scratch or copy the example below:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:8990/scorepion
FOOTBALL_API_KEY=your_api_key_here
FOOTBALL_API_PLAN=free
FOOTBALL_API_DAILY_LIMIT=100
PORT=5847
EXPO_PUBLIC_DOMAIN=localhost:5847
EXPO_METRO_PORT=8087
SESSION_SECRET=change-me-in-production
ADMIN_SECRET=change-me-in-production
```

**Notes:**
- `EXPO_PUBLIC_DOMAIN` must match the Express server host and port so the mobile app can reach the API.
- `FOOTBALL_API_PLAN` can be `free` or `pro`. The free plan uses ~15-25 API calls/day and syncs only Premier League, La Liga, and Serie A.

## Available Scripts

### Database

| Command            | What it does                                               |
|--------------------|------------------------------------------------------------|
| `npm run db:start` | Start the PostgreSQL Docker container                      |
| `npm run db:stop`  | Stop the container                                         |
| `npm run db:reset` | Stop, remove the container and volume, then start fresh    |
| `npm run db:push`  | Push the Drizzle schema to the database                    |
| `npm run db:seed`  | Populate the database with realistic dev data (no API calls) |
| `npm run db:setup` | All-in-one: start DB + push schema + seed data             |

### App

| Command               | What it does                                      |
|-----------------------|---------------------------------------------------|
| `npm run server:dev`  | Start the Express API server (development mode)   |
| `npm start`           | Start the Expo Metro bundler                      |

### Other

| Command             | What it does                      |
|---------------------|-----------------------------------|
| `npm run lint`      | Run the linter                    |
| `npm run lint:fix`  | Run the linter and auto-fix       |

## Starting Everything

Open **three terminal tabs**:

```bash
# Terminal 1 — Database (if not already running)
npm run db:start

# Terminal 2 — Backend
npm run server:dev

# Terminal 3 — Frontend
npm start
```

## Stopping Everything

```bash
# Stop the Express server
# → Ctrl+C in the terminal running server:dev

# Stop Expo
# → Ctrl+C in the terminal running npm start

# Stop the database
npm run db:stop
```

## Verifying It Works

**Backend:** Open http://localhost:5847/api/health in a browser. You should get a JSON response with the DB status, API plan, and uptime.

**Frontend:** The Expo CLI will print a QR code. Scan it with your phone (Expo Go) or press `i` for iOS simulator / `a` for Android emulator.

## Troubleshooting

### Port 5000 in use on macOS
macOS uses port 5000 for AirPlay Receiver. This project already avoids it by defaulting to port 5847. If you still hit a conflict, either change `PORT` in `.env` or disable AirPlay Receiver in *System Settings > General > AirPlay & Handoff*.

### `DATABASE_URL must be set` error
Make sure your `.env` file exists at the project root and contains the `DATABASE_URL` line. The server loads it automatically via `dotenv`.

### `ECONNREFUSED` on port 5432
This means the database URL isn't being picked up (PostgreSQL defaults to 5432). Verify `.env` has `DATABASE_URL=postgresql://postgres:postgres@localhost:8990/scorepion`.

### Docker not running
`npm run db:start` will tell you if Docker isn't installed or the daemon isn't running. Start Docker Desktop first, then retry.

## Project Structure

```
├── app/                  # Expo app (file-based routing via expo-router)
│   ├── (tabs)/           # Tab screens (matches, leaderboard, groups, etc.)
│   ├── match/[id].tsx    # Match detail / prediction screen
│   └── ...
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # Route registration
│   ├── db.ts             # Database connection (Drizzle + pg)
│   ├── config.ts         # Scoring constants, intervals
│   ├── services/
│   │   ├── football-api.ts   # API-Football client (plan-aware)
│   │   └── sync.ts           # Data sync engine (plan-aware scheduling)
│   └── migrations/       # SQL migrations
├── shared/               # Shared types and schema (Drizzle)
├── scripts/
│   ├── start-db.sh       # Docker PostgreSQL management
│   └── seed-dev-data.ts  # Dev data seeder
└── .env                  # Environment config (not committed)
```

## API Plan Details

The app supports both **free** and **pro** API-Football plans:

| Feature              | Free Plan          | Pro Plan            |
|----------------------|--------------------|---------------------|
| Leagues synced       | 3 (PL, La Liga, Serie A) | All 15        |
| Fixtures sync        | Every 12 hours     | Every 6 hours       |
| Standings sync       | Every 12 hours     | Every 6 hours       |
| Top scorers sync     | Every 24 hours     | Every 12 hours      |
| Live match polling   | Disabled           | Every 2 minutes     |
| Daily API calls      | ~15-25             | ~275-545            |
