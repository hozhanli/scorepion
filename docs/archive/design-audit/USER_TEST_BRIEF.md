# Scorepion — 20-Tester / 20-Day End-User Simulation Brief (Round 2)

This is the second round of user simulation, run **after** the Phase A/B/C "address all findings wisely" pass closed the 17 items from Round 1. Round 2 doubles both axes: 20 personas, each walking through a 20-day mock scenario against the **current** state of the codebase.

Round 1 artifacts are archived at `_design_audit/archive/round1_10x10/` for reference.

## Setup

- Repo root: `/sessions/lucid-elegant-heisenberg/mnt/scorepion`
- Design audit (source of truth): `_design_audit/AUDIT.md`
- Design guide: `DESIGN_GUIDE.md`
- Start date: **Mon, Apr 6, 2026**
- End date: **Sat, Apr 25, 2026** (20 days)
- Competition focus: **Champions League Quarter-finals → Semi-finals → first Final preview**, plus Premier League run-in, La Liga, Bundesliga, Serie A, Europa, Conference League
- App base state: fresh install on Day 1 unless persona explicitly reinstalls later

## What's different from Round 1

Round 1 surfaced five themes: silent celebration moments, no welcome-back summary, no scoring transparency, weak current-user highlight in group standings, and visual confusion between pending and correct prediction pills. All five were addressed in Phase A/B/C. Round 2 testers must explicitly evaluate whether the fixes **actually** close those findings, not just report on the resting state. Each tester must include a **"Round 1 regression check"** section at the end of their diary.

## The 20 mock days

| Day | Date | Day of week | Key activity to simulate |
|---|---|---|---|
| 1 | 6 Apr | Mon | Fresh install. Auth → Onboarding → Home. First prediction on a PL match. |
| 2 | 7 Apr | Tue | CL QF L1: Arsenal–Real Madrid, Bayern–Inter. Boost a big match. Streak = 1. |
| 3 | 8 Apr | Wed | CL QF L1: PSG–Aston Villa, Barcelona–Dortmund. Join a group. Streak = 2. |
| 4 | 9 Apr | Thu | Europa QF L1. Streak breaks (missed exact). Feel the reset. |
| 5 | 10 Apr | Fri | Premier League Friday night. Tier promotion trigger. |
| 6 | 11 Apr | Sat | PL weekend peak: 4+ matches in daily pack. Derby atmosphere. |
| 7 | 12 Apr | Sun | PL + LaLiga Sunday. Leaderboard climb. |
| 8 | 13 Apr | Mon | CL QF L2: Real Madrid–Arsenal, Inter–Bayern. Revisit past predictions. |
| 9 | 14 Apr | Tue | CL QF L2: Aston Villa–PSG, Dortmund–Barcelona. Tier badge reveal. Share to group. |
| 10 | 15 Apr | Wed | Europa QF L2 + Conference quarters. Mid-cycle review. |
| 11 | 16 Apr | Thu | Quiet day. Skip the app for most testers (tests welcome-back behavior). |
| 12 | 17 Apr | Fri | Return after 1-day absence. See welcome-back banner. Bundesliga Friday. |
| 13 | 18 Apr | Sat | Huge PL weekend: Man Utd derby, Arsenal–Chelsea, Liverpool fixture. 5+ matches. |
| 14 | 19 Apr | Sun | PL + Serie A Sunday. Weekly challenge progress visible. |
| 15 | 20 Apr | Mon | Settle weekend, view Profile stats for the week. |
| 16 | 21 Apr | Tue | CL Semi-final L1 draw/preview: Arsenal–PSG, Bayern–Dortmund. Boost. |
| 17 | 22 Apr | Wed | CL Semi L1: same fixtures play. Live pulse UI. |
| 18 | 23 Apr | Thu | Europa Semi L1. Review settled CL predictions. Tier reveal #2 for some. |
| 19 | 24 Apr | Fri | PL Friday. End-of-week peak. Group leaderboard close finish. |
| 20 | 25 Apr | Sat | Cycle finale. Total-points review. Profile deep-dive. Read scoring guide. |

For any day where a persona does NOT open the app (e.g. weekday-only fan skipping weekends, weekend-only fan skipping weekdays, lapsed user before reinstall), write a single-line "Skipped." entry — this is intentional and tests gap-handling in the UI.

## The 20 personas

Personas 1–10 are the same cast from Round 1, now returning with fresh install and 20 days. Personas 11–20 are new and chosen to stress the surfaces that Round 1 did not cover deeply.

### Returning cast (from Round 1)

1. **"Elif" — new casual fan**, 26, android, opens the app on Day 1 after a friend invite. Cares about simplicity and onboarding friction. Now also checks whether the lock-in toast makes her first prediction feel alive.
2. **"Marco" — power user, ex-Sorare**, 34, iPhone 15 Pro, wants speed, keyboard shortcuts, density. Hyper-critical of taps-per-action. Will probe every new micro-interaction for latency and correctness.
3. **"Aisha" — weekend-only fan**, 29, iPhone 12, opens only on weekends (Days 6, 7, 13, 14, 19, 20). Expects zero ramp-up after gaps. Primary target for welcome-back banner.
4. **"Tomáš" — completionist**, 31, wants 100% accuracy, will read every pts-system label. Values transparency. Primary target for new scoring guide screen.
5. **"Noah" — group social organizer**, 27, runs a 20-member predict group. Cares about group hero, invite flow, standings readability. Primary target for strengthened current-user row.
6. **"Yuki" — anxiety-prone minimalist**, 33, uses Things 3 and Arc. Reacts to any visual noise, shadow, or gradient wallpaper. Will audit every new pixel against the Emerald Minimalism contract.
7. **"Carlos" — stats nerd**, 40, loves xG, stands, form guides. Lives in Match Detail and Leaderboard. Primary target for H2H gauge fix and league screen refresh.
8. **"Priya" — lapsed user**, 25, installed 6 months ago, reinstalls on Day 5. Cares about what's new and not feeling lost. Will stress-test cold-start welcome behavior.
9. **"Julian" — accessibility tester**, 38, partial vision, 200% text. Cares about hit targets, contrast, focus states. Will audit the new CelebrationToast for contrast and motion accessibility.
10. **"Zainab" — streak hunter**, 22, obsessed with the flame. Wants the streak surface to feel worth playing for. Will judge whether streak feedback is still silent.

### New cast (Round 2 additions)

11. **"Sven" — Bundesliga maxi-fan**, 44, only cares about Bayern and Dortmund. Opens the app mostly on CL and Bundesliga nights. Tests league filter stickiness and team-centric flows.
12. **"Amara" — design-system reviewer**, 36, principal designer at a fintech. Will audit surface/border/radius/type tokens, consistency of hairlines, and the five canonical celebration surfaces. Functional as a second-pass design auditor.
13. **"Kenji" — dark-mode sceptic**, 29, runs phone in always-light mode, expects the light palette to be honest about contrast ratios. Will check WCAG AA compliance on every new surface introduced by Phase A/B/C.
14. **"Léa" — notification-averse**, 31, disabled all push, relies on in-app signals only. Primary target for welcome-back banner and toast behavior (must work without notifications).
15. **"Ravi" — small-screen user**, 28, iPhone SE 2020 (4.7"), tests every screen for truncation, overflow, and safe-area handling on a tight viewport.
16. **"Bea" — ultra-casual**, 52, mostly opens the app to check scores, rarely predicts. Wants the app to feel low-pressure. Tests whether the new celebration moments feel proportional and not pushy.
17. **"Takoda" — competitor**, 30, plays rival prediction apps (Sorare, Superbru, Predictor). Has reference points. Will compare Scorepion's lock-in, streak, and group flows against competitors.
18. **"Ingrid" — accessibility tester #2 (motor)**, 47, uses Switch Control and has limited fine motor control. Will probe hit targets ≥ 44pt, gesture requirements, and whether any celebration dismissal requires a timed tap.
19. **"Oscar" — retention test user**, 24, simulates the exact retention loop the retention-engine is built for: perfect on Days 1–3, misses Day 4, returns Day 5 cold, resumes. Primary target for welcome-back + celebration pairing.
20. **"Mei" — internationalization tester**, 33, runs the app in Turkish locale (tr-TR), longest strings in the i18n catalog. Will audit every new string for translation keys and layout robustness under long-string conditions.

## What each persona must evaluate

For each of the 20 days, the persona must trace through the relevant screens for that day's activity and write a short entry covering:

1. **What they did** on that day (concrete screen-by-screen sequence, or "Skipped.")
2. **What they liked** — specific design moments that felt right
3. **What they didn't like** — friction, confusion, ugliness, inconsistency
4. **Any bugs or dead ends** — broken flows, missing states, unreachable branches (identified by reading the source)

At the end, the persona writes three sections:

### Favorite and least favorite
- **Favorite day** and why
- **Least favorite day** and why
- One **concrete fix** they would ship tomorrow

### Round 1 regression check
For each of the five Round 1 themes, a one-line verdict:
- **Silent celebration moments** — does CelebrationToast actually close this? (Examine `components/ui/CelebrationToast.tsx` and its wire-up in `app/match/[id].tsx`.)
- **No welcome-back summary** — does the banner fire correctly? (Examine `components/ui/WelcomeBackBanner.tsx` and its wire-up in `app/(tabs)/index.tsx`.)
- **No scoring transparency** — is the guide discoverable and correct? (Examine `app/scoring.tsx` and its link in `app/settings.tsx`.)
- **Weak current-user highlight in group standings** — is the row now obviously you? (Examine `MemberStandingRow` in `app/group/[id].tsx`.)
- **Pending vs correct visual confusion** — is the pending state now visually neutral? (Examine `PredictionPill` in `components/MatchCard.tsx`.)

Answer each with **Closed**, **Partially closed**, or **Still open**, plus a one-sentence reason.

### New findings
A bullet list of anything the tester found this round that Round 1 did not catch.

## How agents should work

- Read `_design_audit/AUDIT.md` sections §6.1–§6.11 to understand what each screen *should* look like
- Read the actual screen source files under `app/` to see what it *does* look like — **make sure to read the post-Phase-A/B/C versions**, not archived ones
- Read `DESIGN_GUIDE.md` to understand the design contract
- Read `constants/colors.ts`, `components/ui/*`, `lib/motion.ts` as needed for primitive behavior
- Read `lib/mock-data.ts` to understand what matches the user would see
- Read `contexts/AppContext.tsx` to understand state flow
- Trace the user's path mentally — do NOT run the app
- Report findings as structured markdown matching the sections above
- Write the diary to `_design_audit/tester_reports/NN_name.md` where NN is two-digit persona number
