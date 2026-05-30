# Android Phone Screenshots — Play Store

Captured 2026-05-30 from a release build (`versionName 2.0.0`) on a Pixel 3a
emulator (Android 14), running against a local instance of the **current**
backend with seeded demo data.

- **Resolution:** 1080 × 2160 (cropped to exactly 2:1 — Play's max aspect ratio;
  raw captures were 1080 × 2220, which is just over the limit).
- **Format:** 24-bit PNG.
- Play Console accepts **2–8** phone screenshots. Recommended order below; drop
  `09-sign-in` if you only want 8.

| File                           | Screen             | Why it sells                                    |
| ------------------------------ | ------------------ | ----------------------------------------------- |
| `01-predict-climb-compete.png` | Onboarding intro   | Value prop in one glance                        |
| `02-leaderboard.png`           | Leaderboard podium | Competition + social proof (**hero**)           |
| `03-make-prediction.png`       | Prediction picker  | Core mechanic, score stepper + boost (**hero**) |
| `04-live-matches.png`          | Matches list       | Real fixtures across top leagues                |
| `05-private-groups.png`        | Discover groups    | Play-with-friends angle                         |
| `06-daily-pack-streak.png`     | Today / daily pack | Habit loop, streaks                             |
| `07-profile-tiers.png`         | Profile            | Levels, XP, stats                               |
| `08-match-detail.png`          | Match detail       | Depth: H2H / lineups / stats                    |
| `09-sign-in.png`               | Sign in            | Branded entry (optional)                        |

> Demo data: leaderboard names (GoalMachine, TikiTakaTom, …) and the seeded
> fixtures are local demo content, not production data. Re-capture against
> production after the backend is redeployed (see RELEASE_STATUS.md) if you want
> real data in the store listing.
