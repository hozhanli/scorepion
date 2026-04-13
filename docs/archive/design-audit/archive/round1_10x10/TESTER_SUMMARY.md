# Scorepion — 10-tester / 10-day playtest summary

Aggregate of the 10 persona reports produced by parallel tester agents walking through the Emerald Minimalism refresh from Mon Apr 6 → Wed Apr 15, 2026.

Individual diaries live in `tester_reports/01_elif.md` through `tester_reports/10_zainab.md`.

## Overall reaction

The Emerald Minimalism visual system ships: hairline cards, calm motion, quarantined gradients, unified headers, and consistent primitives across Home, Matches, Leaderboard, Groups, Profile, Match detail, and Group detail. Every tester — even the strictest (Yuki, Julian) — agreed the *resting state* of the refreshed screens looks right.

The unanimous complaint is not about visuals. It is about **missing feedback loops**: the app is now beautiful and silent when it needs to be beautiful and celebratory. Eight of ten testers independently flagged a variant of "nothing happens when the thing I care about happens." That is the single biggest finding.

## What every tester liked

The cross-report consensus on design wins:

- Unified `ScreenHeader` on every tab. No more per-screen top-bar drift. (Elif, Marco, Noah, Aisha)
- Hairline + white card treatment. Yuki called it "finally calm"; Marco called it "dense without being noisy."
- Emerald Minimalism palette. Testers consistently liked that emerald is the single action colour and that flame/gold/red feel earned. (Yuki, Zainab)
- `PressableScale` press feel and haptics wherever they exist. (Marco, Julian)
- `FilterSegmented` pill slide. (Carlos, Noah)
- Day-zero invite banner in Group Detail. (Noah)
- Match Detail hero + prediction stepper layout. (Elif, Marco, Julian praised the 44pt stepper)
- Streak hero visual language. Zainab: "genuinely gorgeous in its resting state." (Zainab, Elif)
- Daily Pack emerald hero as the one canonical celebration card on Home. (Aisha, Elif)

## What every tester disliked — the five themes

Aggregated across all 10 reports, the issues cluster into five themes. Count = how many testers independently raised it.

### 1. Silent celebration moments (8/10)
Every reward moment the audit called out — prediction lock-in, streak tick, tier promotion, rank climb, group join, challenge complete — currently ships as silent state change. No toast, no glow flash, no haptic chain, no modal.

Raised by: Elif, Marco, Tomáš, Noah, Carlos, Priya, Zainab, Julian.

Concrete examples from the reports:

- Zainab: "Breaking a streak should have dramatic UI language. Instead it's silent."
- Elif: "Joining a group should have been a celebration moment, but it was silent."
- Tomáš: "Tier promotion has zero celebration or notification."
- Marco: "No auto-dismiss or confirmation card after Lock In."

### 2. Transparency gaps in scoring & streak rules (5/10)
Tomáš, Carlos, Aisha, Priya, and Julian all wanted to know *exactly* what a prediction is worth, *exactly* when a streak resets, *exactly* what "Weekly pts" means, and *exactly* how the daily pack is selected. None of this is documented in-app.

- Tomáš listed 7 transparency gaps with file:line citations.
- Aisha flagged the cryptic "Reset: –" metric on Home as the #1 fix she'd ship.
- Carlos called out that "Accuracy" is undefined (exact-only? exact+result?).

### 3. LinearGradient / shadow / hex leakage in secondary screens (2/10, high severity)
Yuki's minimalist audit found ~35 violations of the design contract, concentrated in `app/league/[id].tsx`, `app/premium.tsx`, and some primitives (`Button.tsx`, `FilterSegmented.tsx`, `EmptyState.tsx`) that still add `shadowOffset` / `elevation`.

`league/[id].tsx`: 5 direct `LinearGradient` imports + 6 stray hex codes. It is the single most non-compliant file in the refresh.

`premium.tsx`: similar — direct `LinearGradient` usage at the screen layer.

These screens were not in the §6 scope (the audit explicitly covered §6.1–§6.11 and marked league/premium as secondary) but Yuki is right that they break the contract from a pure-vision QA perspective and should be cleaned up next.

### 4. Missing empty & zero states (4/10)
- Priya (reinstall): no "welcome back" banner, no recovery narrative, no distinction between fresh-install and returning-user zero states.
- Aisha: same issue after a 5-day gap.
- Noah: standings list doesn't indicate if activity is quiet because nobody predicted or because of a server hiccup.
- Carlos: H2H gauge uses a 0.1 flex fallback for "no wins" that visually misrepresents 0-0-5 scenarios.

### 5. Accessibility — tertiary text contrast & focus states (Julian)
Julian's single-persona audit produced 18 violations:

- `text.tertiary` (#94A3B8) on `surface[0]` fails WCAG AA at 3.2:1 vs. required 4.5:1. This is systemic — it affects metadata, captions, inactive tab labels, and score captions on MatchCard.
- PredictionPill pending/miss states also fail contrast.
- Several icon-only buttons lack `accessibilityLabel`.
- Stepper buttons are 44×44 but have no `hitSlop` expansion for 200% text magnification.

## Favorite / least-favorite day by tester

| Tester | Persona | Favorite | Least favorite |
|---|---|---|---|
| Elif | New casual fan | Day 1 — frictionless onboarding | Day 9 — silent group join |
| Marco | Power user (ex-Sorare) | Day 6 — weekend sprint density | Day 4 — silent streak break |
| Aisha | Weekend-only | Day 6 — no guilt trip on return | Days 8–10 — radio silence |
| Tomáš | Completionist | Day 1 — clean rules at first glance | Day 2 — boost mystery |
| Noah | Group organizer | Day 6 — 20-member list held up | Day 3 — lonely create flow |
| Yuki | Minimalist auditor | Day 1 — auth is nearly clean | Day 6 — league/[id] violation parade |
| Carlos | Stats nerd | Day 7 — H2H gauge worked on a derby | Day 10 — no xG anywhere |
| Priya | Lapsed reinstall | Day 5 — elegant cold start | Days 6–7 — silent about her return |
| Julian | Accessibility | Day 1 — auth has decent contrast | Day 8 — score captions unreadable at 200% |
| Zainab | Streak hunter | Day 1 — flame looks beautiful at rest | Day 4 — streak dies silently |

## The concrete fixes testers would ship tomorrow (verbatim, deduped)

Listed in order of how many testers independently asked for them.

1. **Celebration toast system.** A single `CelebrationToast` primitive that fires on: prediction lock-in (success haptic + emerald flash), streak tick (flame wobble + counter bump + success haptic), streak break ("Best is still X. Rebuild tomorrow."), tier promotion (badge pop + ring burst), group join (confetti toast), rank climb (row flash). Requested by Elif, Zainab, Tomáš, Noah, Priya, Marco (as auto-dismiss), Carlos.
2. **Auto-dismiss Match Detail after Lock In** with 300ms delay, returning to Matches list. Saves 5–10 taps per weekend session. Requested by Marco, Carlos.
3. **"How scoring works" transparency screen** in Settings, covering: the 4-tier point system, boost multiplier, streak reset rules, weekly reset timing, and daily pack algorithm. Requested by Tomáš, Carlos, Aisha, Priya.
4. **Darken `text.tertiary`** from #94A3B8 to at least #64748B to hit WCAG AA on white. Requested by Julian. Single-line token change; fixes a systemic contrast failure.
5. **Clean up `app/league/[id].tsx` and `app/premium.tsx`** to remove the stray `LinearGradient`/shadow/hex leakage. Requested by Yuki (high severity).
6. **Welcome-back banner** for returning users with a 2+ day absence. Dismissible, shown once. Requested by Priya, Aisha.
7. **Fix weekly dots** on Home — currently hardcoded `Array(7).fill(false)` at `app/(tabs)/index.tsx:237`. Requested by Zainab.
8. **Stronger current-user highlight** on group standings at 20-member scale. Noah: 4px emerald left border + 15% tint. Requested by Noah.
9. **Add "Form (Last 5)" row** to Match Detail stats tab. Requested by Carlos.
10. **Leave-group confirm dialog** is currently inconsistent ("Are you sure?" vs. "Are you sure you want to leave?") and the menu handler at `group/[id].tsx:293` does not actually call leave. Requested by Noah (also a bug).

## Bugs and dead ends found across the 10 reports

Real code issues flagged with file:line references across all reports. Classified by severity.

### High severity
- `app/(tabs)/index.tsx:237` — `weekDots={Array(7).fill(false)}` is hardcoded; streak days never light up. (Zainab)
- `app/group/[id].tsx:293` — menu "Leave group" handler does not call the leave mutation. (Noah)
- `contexts/AppContext.tsx:243` — boost API call fails silently with no error handling or toast. (Tomáš)
- `app/league/[id].tsx` — 5 direct `LinearGradient` imports + 6 stray hex codes violate the design contract. (Yuki)
- `app/premium.tsx` — same class of violations. (Yuki)
- `constants/colors.ts` — `text.tertiary` at #94A3B8 fails WCAG AA contrast on surface[0]. Systemic. (Julian)

### Medium severity
- `PredictionPill` pending state uses emerald-on-emerald tint that fails WCAG AA (~1.5:1). (Julian)
- H2H gauge uses `0.1` flex fallback for 0-0-5 scenarios, visually misrepresents the ratio. (Carlos)
- `app/match/[id].tsx` — no auto-dismiss, no "you predicted X, result was Y" recap after settlement. (Marco)
- `components/ui/Button.tsx` adds `shadowOffset`/`elevation` to primary & danger — cascades to every button in the app. (Yuki)
- `components/ui/FilterSegmented.tsx` active pill has a drop shadow. (Yuki)
- `components/ui/EmptyState.tsx` container has a drop shadow. (Yuki)
- Boost messaging contradicts behavior ("1 per day" vs. "only 1 active"). (Tomáš)
- Tier badge colours don't align with tier names (Fan is bronze instead of silver). (Tomáš)
- `userRank` race condition if `chaseData` loads before `leaderboard` on leaderboard screen. (Carlos)
- `bestStreak` falsy fallback trap on profile screen. (Carlos)

### Low severity
- Activity feed caps at 5 items with no pagination. (Noah)
- Leaderboard doesn't expose a "current streak" column. (Zainab)
- Standings row in Group Detail is read-only; no tap-through to a member's picks. (Noah)
- No "Jump to me" affordance on 20-member group standings. (Noah)
- No `lastLoginAt` field to detect reinstall gap. (Priya)
- Cryptic "Reset: –" metric label on Home when stats are unavailable. (Aisha)

## Recommended priority order for the next iteration

Based on the aggregate vote count and the severity matrix:

1. Ship the `CelebrationToast` primitive and wire it to the eight reward moments (prediction lock-in, streak tick, streak break, tier promotion, rank climb, group join, challenge complete, daily pack complete). **(8-tester consensus)**
2. Fix the hardcoded `weekDots` on Home and the `group/[id].tsx:293` leave-handler bug. **(real bugs)**
3. Darken `text.tertiary` to a WCAG-AA-passing value (#64748B or similar). **(systemic a11y fix, one-line change)**
4. Clean up `app/league/[id].tsx`, `app/premium.tsx`, and the three primitives (`Button`, `FilterSegmented`, `EmptyState`) that still add drop shadows. **(contract compliance)**
5. Add a "How scoring works" docs screen in Settings with the 4-tier points, boost, streak, and weekly-reset rules. **(transparency)**
6. Welcome-back banner for returning users (single banner component, driven by a `lastLoginAt` ≥ 2-day gap). **(reinstall + weekend fans)**
7. Auto-dismiss Match Detail after lock-in. **(tap-count savings)**
8. Stronger current-user row on group standings. **(group social)**

With the above eight items the refresh would cross the finish line on the testers' aggregate scorecard.

## Appendix — file locations

Individual reports:

- `_design_audit/tester_reports/01_elif.md`
- `_design_audit/tester_reports/02_marco.md`
- `_design_audit/tester_reports/03_aisha.md`
- `_design_audit/tester_reports/04_tomas.md`
- `_design_audit/tester_reports/05_noah.md`
- `_design_audit/tester_reports/06_yuki.md`
- `_design_audit/tester_reports/07_carlos.md`
- `_design_audit/tester_reports/08_priya.md`
- `_design_audit/tester_reports/09_julian.md`
- `_design_audit/tester_reports/10_zainab.md`

Source documents:

- `_design_audit/AUDIT.md` — the original Emerald Minimalism audit (§6.1–§6.11)
- `_design_audit/USER_TEST_BRIEF.md` — the 10-day / 10-persona test brief
- `DESIGN_GUIDE.md` — the refreshed design contract
