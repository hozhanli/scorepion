# Scorepion — 10-Day End-User Simulation Brief

This brief defines the 10-day mock scenario used to stress-test the Emerald Minimalism refresh from an end-user perspective.

## Setup

- Repo root: `/sessions/lucid-elegant-heisenberg/mnt/scorepion`
- Design audit (source of truth): `_design_audit/AUDIT.md`
- Design guide: `DESIGN_GUIDE.md`
- Start date: **Mon, Apr 6, 2026**
- End date: **Wed, Apr 15, 2026** (10 days)
- League in focus: **Champions League Quarter-finals → Semi-finals** + mixed Premier League / La Liga / Bundesliga weekend
- App base state: fresh install; onboarding required on Day 1 for most testers

## The 10 mock days

| Day | Date | Key fixtures | State changes to simulate |
|---|---|---|---|
| 1 | Mon 6 Apr | Burnley–Brighton, Monaco–Lille | First install. Onboarding, first prediction. |
| 2 | Tue 7 Apr | CL QF L1: Arsenal–Real Madrid, Bayern–Inter | Streak = 1. Boost a big match. |
| 3 | Wed 8 Apr | CL QF L1: PSG–Aston Villa, Barcelona–Dortmund | Streak = 2. Join a group. |
| 4 | Thu 9 Apr | Europa QF L1: Lyon–Man Utd, Athletic–Rangers | Streak breaks to 0 (missed exact). Feels the reset. |
| 5 | Fri 10 Apr | Premier League: Fulham–Liverpool | Tier promotion trigger (level-up). |
| 6 | Sat 11 Apr | PL derby: Chelsea–Ipswich, Newcastle–Man Utd | Weekend peak. 4 matches in daily pack. |
| 7 | Sun 12 Apr | PL: Arsenal–Brentford, Aston Villa–Nott'm Forest; LaLiga: Real Madrid–Alavés | Weekend finale. Leaderboard climb. |
| 8 | Mon 13 Apr | CL QF L2: Real Madrid–Arsenal, Inter–Bayern | Revisit past prediction, see settle. |
| 9 | Tue 14 Apr | CL QF L2: Aston Villa–PSG, Dortmund–Barcelona | Tier badge reveal. Share to group. |
| 10 | Wed 15 Apr | Europa QF L2 + Conference quarters | End of mock cycle. Review total points & accuracy. |

## The 10 personas

Each agent plays exactly one persona and walks through all 10 days from that persona's lens.

1. **"Elif" — new casual fan**, 26, android, opens the app on Day 1 after a friend invite. Cares about simplicity and onboarding friction.
2. **"Marco" — power user, ex-Sorare**, 34, iPhone 15 Pro, wants speed, keyboard shortcuts, density. Hyper-critical of taps-per-action.
3. **"Aisha" — weekend-only fan**, 29, iPhone 12, opens only on weekends (Days 6–7). Expects zero ramp-up after gaps.
4. **"Tomáš" — completionist**, 31, wants 100% accuracy, will read every pts-system label. Values transparency.
5. **"Noah" — group social organizer**, 27, runs a 20-member predict group. Cares about group hero, invite flow, standings readability.
6. **"Yuki" — anxiety-prone minimalist**, 33, uses Things 3 and Arc. Reacts to any visual noise, shadow, or gradient wallpaper.
7. **"Carlos" — stats nerd**, 40, loves xG, stands, form guides. Lives in Match Detail and Leaderboard.
8. **"Priya" — lapsed user**, 25, installed 6 months ago, reinstalls on Day 5. Cares about what's new and not feeling lost.
9. **"Julian" — accessibility tester**, 38, partial vision, 200% text. Cares about hit targets, contrast, focus states.
10. **"Zainab" — streak hunter**, 22, obsessed with the flame. Wants the streak surface to feel worth playing for.

## What each persona must evaluate

For each of the 10 days, the persona must trace through the relevant screens for that day's activity and write a short entry covering:

1. **What they did** on that day (concrete screen-by-screen sequence)
2. **What they liked** — specific design moments that felt right
3. **What they didn't like** — friction, confusion, ugliness, inconsistency
4. **Any bugs or dead ends** — broken flows, missing states, unreachable branches (identified by reading the source)

At the end, the persona picks:
- **Favorite day** and why
- **Least favorite day** and why
- One **concrete fix** they would ship tomorrow

## How agents should work

- Read `_design_audit/AUDIT.md` sections §6.1–§6.11 to understand what each screen *should* look like
- Read the actual screen source files under `app/` to see what it *does* look like
- Read `DESIGN_GUIDE.md` to understand the design contract
- Read `constants/colors.ts`, `components/ui/*`, `lib/motion.ts` as needed for primitive behavior
- Read `lib/mock-data.ts` to understand what matches the user would see
- Read `contexts/AppContext.tsx` to understand state flow
- Trace the user's path mentally — do NOT run the app
- Report findings as structured markdown matching the sections above
