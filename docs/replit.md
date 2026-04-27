# Scorepion - Football Score Prediction App

## Overview

Scorepion is a cross-platform mobile application built with React Native and Expo, designed for football fans to predict match scores, compete on leaderboards, and join groups. It integrates real match data, standings, and top scorers from major football leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League) via API-Football. The app features user authentication, session management, and data persistence through a MySQL backend, with a focus on daily engagement, competitive mechanics, and a youth-targeted, visually rich UI/UX.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React Native / Expo)

- **Framework**: Expo SDK 54, React Native 0.81, Expo Router for file-based navigation.
- **Language**: TypeScript with strict mode.
- **Routing**: File-based (`expo-router`) with a main tab navigation (`Fixtures`, `Leaderboard`, `Groups`, `Profile`) and dedicated screens for match details, league details, group details, and user settings.
- **State Management**: React Context (`AppContext`) for global app state, supplemented by AsyncStorage for local persistence.
- **Data Fetching**: `@tanstack/react-query` hooks fetch real football data from the Express backend, with mock data as a fallback.
- **UI Libraries**: Utilizes `expo-linear-gradient`, `react-native-reanimated` for animations, `expo-haptics` for feedback, `@expo-google-fonts/inter` for typography, and `@expo/vector-icons` (Ionicons).
- **Design System**: Dark navy-themed headers with light content areas, a palette defined in `constants/colors.ts`, and full light/dark mode support. The UI is designed for a younger audience with bold gradients, badges, and game-like prediction interfaces.

### Backend (Express + Node.js)

- **Framework**: Express 5 with TypeScript.
- **API Pattern**: RESTful API with distinct routes for authentication (`/api/auth/*`) and football data (`/api/football/*`).
- **Football API Integration**: Wraps API-Football (api-sports.io) with rate limiting and a sync service (`server/services/sync.ts`) for batch updating fixtures, standings, and top scorers across 7 leagues, including live score polling.
- **Storage Layer**: Implements an `IStorage` interface for database-backed user management.
- **CORS**: Configured to allow Replit development domains and localhost.

### Retention Engine (server/services/retention-engine.ts)

- **Daily Packs**: Backend-driven daily match packs (3-7 matches) sorted by importance, with streak tracking
- **Boost Mechanics**: 2x multiplier on one pick per day, upset detection, tracked in `boost_picks` table
- **Match Importance**: Scoring 0-100 based on derbies (15+ pairs), top-4 clashes, relegation battles, cup matches
- **Chase Mode**: Shows user rank, chase target, point gap, swing matches with potential points
- **Achievements**: 4 tiers (bronze/silver/gold/diamond) across 5 categories, automatic awarding with event logging
- **Weekly Winners**: Top 3 users from previous week, awards gold achievement to #1
- **Enhanced Group Activity**: Includes boost events, achievements earned, streak milestones, weekly winner announcements
- **Event Logging**: Tracks daily_pack_complete, boost_pick, streak_break, achievement_earned events
- **Performance Insights**: League-specific performance, best/worst leagues, recent form, overall stats
- **API Routes**: 12 endpoints under `/api/retention/*` for all retention features

### Database Schema (Drizzle + MySQL)

- **ORM**: Drizzle ORM with MySQL dialect.
- **Schema**: Defined in `shared/schema.ts`, including tables for `users`, `football_leagues`, `football_teams`, `football_fixtures`, `football_standings`, `football_top_scorers`, `sync_log`, `daily_packs`, `boost_picks`, `achievements`, `weekly_winners`, and `event_log`.
- **Validation**: Uses `drizzle-zod` for generating Zod schemas.
- **Migrations**: Managed via `drizzle-kit`.

### Key Components

- **MatchCard**: Displays match information and prediction status.
- **ScoreSelector**: UI for inputting predictions.
- **LeaderboardRow**: Represents a user's entry in leaderboards with ranking and medals.
- **StatCard**: Reusable component for displaying statistics.
- **ErrorBoundary**: For robust error handling in React.

## External Dependencies

### Required Services

- **MySQL Database**: Stores all application data, including user profiles and synced football data (fixtures, standings, top scorers).
- **API-Football**: Third-party API (api-sports.io) for real-time football match data.

### Environment Variables

- `DATABASE_URL`: MySQL connection string.
- `FOOTBALL_API_KEY`: API-Football authentication key.
- `FOOTBALL_API_BASE_URL`: Base URL for the API-Football service.
- `REPLIT_DEV_DOMAIN`: Used for local development and CORS configuration.
- `EXPO_PUBLIC_DOMAIN`: Client-side API base URL.

### Key npm Dependencies

- `expo`: Core React Native framework.
- `expo-router`: File-based routing for Expo.
- `express`: Backend web framework.
- `drizzle-orm`, `drizzle-kit`: ORM for database interaction.
- `mysql2`: MySQL client.
- `@tanstack/react-query`: Data fetching and caching.
- `@react-native-async-storage/async-storage`: Local data persistence.
- `react-native-reanimated`: Animations.
- `zod`: Schema validation.
