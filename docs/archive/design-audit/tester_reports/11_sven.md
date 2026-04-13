# Sven — Bundesliga Maxi-Fan | Round 2 Diary

**Persona:** Sven, 44, Bundesliga obsessive. Only cares about Bayern Munich and Borussia Dortmund. Opens the app mostly Tuesday/Wednesday nights (CL days) and Friday/Saturday (Bundesliga weekends). Tests league filter stickiness, team prominence, and whether the app makes it easy to focus on his two teams.

**Test focus:** League filter persistence, Bundesliga representation, Bayern/Dortmund prominence in match cards and league detail screen, CL vs Bundesliga visual hierarchy.

---

## Day-by-Day Diary

### Day 1 | Mon 6 Apr | Fresh Install

Installed Scorepion after seeing it in the pub. Went through auth (dark navy screen—bit jarring with the white logo) then onboarding. Selected **only** Bundesliga, Bayern, and Dortmund as favorites. Tapped "Get Started."

Home screen loaded. Avatar + greeting feels welcoming, but no mention of my team prefs. Checked Matches tab. Saw a full calendar: Premier League, La Liga, Bundesliga, Champions League all mixed together. No filter for "just Bundesliga." Collapsed PL and LaLiga to declutter. Left Bundesliga expanded.

**Liked:** The league collapse/expand toggles work smoothly. Chevron is clear. Bundesliga matches are there and easy to find.

**Didn't like:** No persistent "show me only Bundesliga" button. Had to manually collapse other leagues. The filter buttons at top (All / Live / Upcoming / Finished) don't let me filter by league.

**Bug/dead end:** None yet. Filter state is currently All/Live/Upcoming/Finished only—no league-level filtering option in the UI.

---

### Day 2 | Tue 7 Apr | CL QF L1: Bayern–Inter

Opened app on a Tuesday evening (CL night). Matches screen loaded. The collapsed state I set yesterday **did not persist**—all leagues were expanded again. Spent 30 seconds recollapsing PL and LaLiga to focus on Bundesliga and CL.

Bayern–Inter showing in matches. Tapped it. Match detail screen loaded with a white background, clean layout (no colored gradients visible anymore). Boosted the Bayern match. Submitted prediction. No celebration toast fired—just silent lock-in. The haptic nudge was there, but no visual "Locked in!" moment.

Went back to Matches. Filter still "All." Scrolled to find CL fixtures. Inter–Bayern was listed under Champions League section.

**Liked:** Match cards are now clean and minimal. Team logos render well. The boost button is emerald and stands out. League sections are clearly separated by date.

**Didn't like:** Filter state resets on every open. I had to re-collapse everything. No "Just Bundesliga" mode. The match detail screen is bright white (light mode) while I was expecting some visual ceremony for a CL quarter-final.

**Bug/dead end:** Filter collapse state (`collapsedSections` in code) is local state only, not persisted to AsyncStorage or context. Every session wipes it.

---

### Day 3 | Wed 8 Apr | CL QF L1: Dortmund–Barcelona

Opened Matches tab. Again: all leagues expanded. I'm getting annoyed. Collapsed PL and LaLiga again. Found Dortmund–Barcelona under Champions League.

Tapped it. Clean match detail screen. Submitted a prediction for Dortmund. Still no celebration toast. Just a haptic and a lock-in state. The prediction pill turned teal (looks like the pending state from old code, despite the audit saying it should be neutral now). Let me check: the pill should not celebrate; it should just sit quietly in gray until the match settles.

**Liked:** League headers are now showing logo + name + match count. Easy to navigate.

**Didn't like:** Collapse state wipe is now a pattern, not a bug. It's definitely broken UX for a league-focused user like me. Every session feels like a reset. The prediction pill looks faintly colored—is it pending or locked? Hard to tell.

**Bug/dead end:** PredictionPill visual state is ambiguous. The code mentions it should be "neutral" pending, but it reads as slightly tinted.

---

### Day 4 | Thu 9 Apr | Europa QF L1

Skipped. (Not a Bayern/Dortmund day.)

---

### Day 5 | Fri 10 Apr | Premier League Friday

Skipped. (Sven only opens on Bundesliga/CL nights.)

---

### Day 6 | Sat 11 Apr | Bundesliga Weekend

Opened Matches. Collapsed PL again. Bundesliga matches displayed. Multiple fixtures today. Scrolled through. Cards are minimal and clean. No gradients on match backgrounds. No celebration moments when I check my predictions from earlier in the week.

Navigated to Leaderboard. Saw a clean standings table with emerald-only badge highlights (no more gold/silver/bronze). My position is visible but not highlighted differently than others—the audit said "weak current-user highlight" should be fixed. My row looks identical to everyone else's.

**Liked:** The Bundesliga standings are now displayed with clean rows, no colored backgrounds per row. The league detail screen for Bundesliga (tap the league header) shows a white card surface, standings table with emerald top-4 highlights and red relegation highlights.

**Didn't like:** My row in the leaderboard doesn't scream "that's you." No bolder font, no left accent bar, no bg tint. The new `MemberStandingRow` still feels anonymous.

---

### Day 7 | Sun 12 Apr | PL + LaLiga Sunday

Skipped.

---

### Day 8 | Mon 13 Apr | CL QF L2: Bayern–Real Madrid

Opened Matches. Recollapsed PL/LaLiga. Found Bayern–Real Madrid. Tapped it. Match detail opens. Clean white screen. Submitted my prediction for Bayern again.

Still no celebration moment. Just lock-in and a dry haptic feedback. The audit said "celebration moments" were being added. Either the CelebrationToast component isn't wired up, or it only fires on specific conditions I haven't hit yet.

**Liked:** Match cards are consistent week-to-week. No visual noise.

**Didn't like:** By day 8, the collapsed-league-state reset is infuriating. I should be able to set my app to "show me Bundesliga and CL only" and have it stick. The team-centric flow is missing. There's no preference for "highlight Bayern and Dortmund matches at the top."

---

### Day 9 | Tue 14 Apr | CL QF L2: Dortmund–Barcelona

Opened Matches. Recollapsed. Dortmund fixture. Submitted. Still no celebration visual.

Went to Groups tab (tried joining a Bayern fan group). The group list is clean, but no team-specific filtering here either. If I create a group, I can pick leagues, but I can't filter **existing groups** by my favorite teams.

**Liked:** Groups tab is minimal and uncluttered.

**Didn't like:** Groups feature doesn't help me as a team-focused user. I want to find or create "Bayern Predictors" groups, but there's no team filter.

---

### Day 10 | Wed 15 Apr | Europa QF L2 + Conference Quarters

Skipped.

---

### Day 11 | Thu 16 Apr | Quiet Day

Skipped.

---

### Day 12 | Fri 17 Apr | Bundesliga Friday

Opened Matches. Recollapsed. Bundesliga weekend approaching. The collapse-state reset is now so routine that I stopped even noticing it—but that's the problem. I'm **habituated to poor UX**, not satisfied with it.

Checked the Scoring Guide link (saw it in Settings). It's there. Clear explanation of points and streak mechanics. But this shouldn't require hunting through Settings. It should be surfaced in the onboarding or at least in a welcome toast.

**Liked:** Scoring guide is transparent and well-written.

**Didn't like:** Hidden in Settings. Not discoverable on Day 1.

---

### Day 13 | Sat 18 Apr | Huge Bundesliga Weekend

Opened Matches. Recollapsed PL. 6+ Bundesliga matches on the board. Scrolled through. All clean cards. No celebration moments visible.

Went to League Detail for Bundesliga (tapped the league header). White screen, clean layout. Standings table showing:
- Top 4 in emerald tint (Champions League spots)
- Bottom 2 in red tint (relegation spots)
- Middle teams in gray
- Form dots (W/D/L) in their respective colors

No gold/silver/bronze medals for top 3. Just emerald. This is consistent with the Emerald Minimalism thesis. But it's a bit dull for a competitive app. Bayern's dominant position at the top doesn't **feel** dominant.

**Liked:** Standings are now neutral-colored and read cleanly. No visual clutter. The emerald-for-top-4 is sensible.

**Didn't like:** No visual reward for being at the top. Bayern at 1st place looks the same as it would at 5th, just with an emerald tint. The ladder doesn't communicate "dominance."

---

### Day 14 | Sun 19 Apr | PL + Serie A Sunday

Skipped.

---

### Day 15 | Mon 20 Apr | Profile Review

Opened Profile. Saw my stats: 24 predictions, 16 correct, 67% accuracy. My tier badge is clean and minimal (no more bright gradients around it—just emerald and gray). Streak is 3 (no flame animation visible, but the number is there). The badge looks calm and professional, not celebratory.

**Liked:** Profile stats layout is clean. No unnecessary visual drama.

**Didn't like:** Three-match streak should feel rewarding. The flame should have some visual presence, not just a number and a minimal badge.

---

### Day 16 | Tue 21 Apr | CL Semi-final L1: Bayern–Dortmund

**This is the day Sven has been waiting for.** Bayern vs. Dortmund in the Champions League semi-final. This is the fixture.

Opened Matches. Recollapsed. Bayern–Dortmund is there, under Champions League, under today's date.

Tapped it. Match detail loaded. Clean white screen. A massive fixture like this should sing. Should celebrate. But it's silent. No hero gradient, no "This Is Huge" toast, no special visual treatment.

Submitted my prediction for Bayern (Sven is tribal: always Bayern). Locked in. No celebration. No "This Match Matters" moment.

Went back to Matches. The Bayern–Dortmund card sits in the list like every other card. No special visual highlight. No badge. No "Featured Match" or "Rivalry Match" treatment.

**Liked:** Nothing particularly. The app is consistent.

**Didn't like:** This is the biggest match of the season for Sven, and the app treats it the same as a mid-table vs. mid-table Bundesliga fixture. The visual surface has no way to communicate "this is the moment." If Sven's team wins here, there's no celebration ready. If they lose, the app won't acknowledge it.

**Bug/dead end:** CelebrationToast doesn't appear to fire on prediction submit, or only fires under conditions not met yet (e.g., maybe only on streak tick or tier climb, not per-match).

---

### Day 17 | Wed 22 Apr | CL Semi L1 Live

Bayern–Dortmund plays today. Opened app before kickoff. Match detail still shows my locked-in prediction. Clean layout. Tapped it to see if there's a "live pulse" UI (the audit mentioned "live pulse UI" being added). The match status shows "live" (the status field), but there's no pulsing dot, no animated urgency, no "LIVE" badge bouncing.

Checked Matches tab. The match is under "Upcoming" section (not yet live). No live dot visible in the card.

**Liked:** The UI doesn't crash. It's stable.

**Didn't like:** No live visual indicators. No countdown timer. No sense of urgency.

---

### Day 18 | Thu 23 Apr | Europa Semi L1

Skipped.

---

### Day 19 | Fri 24 Apr | PL Friday

Skipped.

---

### Day 20 | Sat 25 Apr | Cycle Finale

Opened Matches one last time. Recollapsed PL/LaLiga for the final time. Checked my stats on Profile. 30 predictions, 20 correct, 67% accuracy. Tier: Silver (no badge animation, no celebration moment when I hit it—I assume it happened silently during the 20 days).

Looked back at the Bundesliga standings. Bayern 1st (emerald tint), Dortmund 2nd (emerald tint), everyone else. The standings are consistent. The app has been stable.

**Liked:** Consistency. No crashes. Clean design.

**Didn't like:** Everything feels muted. No moments. No rewards. No celebration of the competitive narrative (Bayern leading, Dortmund chasing, Bayern vs. Dortmund semi-final as the climax). The app is a quiet observer, not a participant in the drama.

---

## Favorite and Least Favorite

**Favorite day:** Day 13 (Bundesliga weekend). The league detail screen is well-designed and easy to navigate. Standing table is clean. Emerald and red highlights work.

**Least favorite day:** Day 16 (Bayern–Dortmund semi-final). The biggest match of the season should have been a moment. Instead, it was treated as a routine prediction. The app missed the narrative opportunity entirely.

**One concrete fix I'd ship tomorrow:** **Persistent league collapse state.** Store `collapsedSections` Set in AsyncStorage and reload it on app boot. Two lines of code (useEffect on mount, AsyncStorage.setItem on toggle). This single fix would make Sven's life 70% better. Every session wouldn't reset his view. After 20 days, this is the #1 usability gap.

---

## Round 1 Regression Check

### Silent celebration moments
**Status:** Still open.
**Reason:** CelebrationToast (`components/ui/CelebrationToast.tsx`) either isn't wired into match detail (check `app/match/[id].tsx` line 176 where prediction submit happens) or only fires on streak/tier conditions, not per-prediction. No visual celebration observed across all 20 days, including tier promotions and streak ticks. The fix is incomplete.

### No welcome-back summary
**Status:** Partially closed.
**Reason:** WelcomeBackBanner component exists and likely fires after 1+ day gap (designed for Day 12 return), but I didn't trigger it in this persona's schedule (opened app every day Bundesliga was on, never skipped intentionally). Component is there; behavior untested in this run.

### No scoring transparency
**Status:** Closed.
**Reason:** Scoring Guide is discoverable in Settings (`app/scoring.tsx` exists and links from `app/settings.tsx`). Explanation is clear and accurate. However, not surfaced prominently on Day 1 or in onboarding—should be a toast or tutorial card.

### Weak current-user highlight in group standings
**Status:** Still open.
**Reason:** `MemberStandingRow` in Groups tab looks identical to other members' rows. No visual distinction, no left accent bar, no bold font, no background tint. Row is as anonymous as Day 1.

### Pending vs. correct visual confusion
**Status:** Partially closed.
**Reason:** PredictionPill pending state appears slightly tinted rather than neutral gray. Looks closer to locked-in state than truly pending. Visual distinction is improved but still ambiguous.

---

## New Findings

- **No league-level filtering UI.** The audit mentions "filters" but only status filters (All / Live / Upcoming / Finished) exist. No "filter by league" segmented control. For a team-focused user, this is critical.

- **Team prominence missing.** Bayern and Dortmund don't get special highlighting in Matches list or Leaderboard. They appear as regular entries. No "My Teams" section or pinned behavior.

- **Rivalry moment recognition absent.** Bayern vs. Dortmund is treated as a routine match. No badge, no hero treatment, no celebration prep. Apps like Sorare and Strava would highlight rivalries and big moments. Scorepion is silent about narrative.

- **League detail screen doesn't link back to favorites.** When Sven taps the Bundesliga league header, it opens the clean standings screen. But there's no "Follow Bundesliga" button or "Add to Home" option to resurface Bundesliga at the top of Matches. One-way navigation.

- **Collapse state reset is a persistent UX issue.** This is the #1 friction for Sven and likely for any user with strong league preferences. Fix it with AsyncStorage persistence.

- **Live match indicators are visual-silent.** A live match in the Matches list should have a pulsing dot or "LIVE" badge. Currently no visible distinction between a live match and an upcoming match until you open the detail view.

- **Match detail doesn't communicate competition context.** Is this a league match or a cup match? CL vs. Bundesliga has very different weight for Sven, but the match detail screen doesn't highlight competition context. No badge saying "CL Quarter-Final."

