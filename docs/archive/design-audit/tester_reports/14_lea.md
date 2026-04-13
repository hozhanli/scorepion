# Léa — notification-averse, 20-day simulation
**Persona #14 (Round 2)** | Ages 31 | No push enabled | Runs April 6–25, 2026

---

## Day 1: Monday, April 6 — Fresh install & first prediction

Fresh install. Auth, onboarding, username set to "Léa". Immediately disabled push notifications in phone Settings before even opening the app again — notifications make me anxious. Opened the app to the Home screen. No notifications means I rely entirely on in-app signals. Saw the "Today, Monday" header, StreakFlame at 0, Streak label says "Lock in to start your streak". Tapped into a Premier League Friday fixture (not actually Friday, mock data), chose 2–1, submitted. No celebration. I waited. Nothing. Just closed back to the home screen. The prediction appeared in the list as locked, that's the only feedback I got. Disappointing for what's supposed to be a moment.

**Liked:** Clean onboarding flow, no ceremony, no friction.

**Didn't like:** Lock-in moment felt hollow — prediction submitted and I'm back in the list with zero pomp. I half-expected a toast or a little flourish. Is there meant to be one?

**Bugs:** None detected.

---

## Day 2: Tuesday, April 7 — CL QF L1, boost a match

Two Champions League Quarter-final first-leg matches (Arsenal–Real Madrid, Bayern–Inter). Submitted predictions on both, then boosted the Arsenal match because it felt significant. One boost token used. Still no celebration toast on the boost itself. Each prediction locked and disappeared into the list silently. Tapped on Arsenal's row to see the match detail — shows my prediction, status says "locked", no visual distinction for the boosted state yet.

**Liked:** Match detail screen layout is clean, prediction display clear.

**Didn't like:** The boost action feels weightless. I committed a premium resource and there's no acknowledgement. Also, no celebration on lock-in is getting frustrating.

**Bugs:** None.

---

## Day 3: Wednesday, April 8 — CL QF L1 continued, join a group

Two more CL fixtures (PSG–Aston Villa, Barcelona–Dortmund). Predicted on both. Then tapped into the Groups tab and joined a public group called "CL Maximalists". Group screen shows the leaderboard. I'm in there somewhere. Predictions settling (match results coming in).

**Liked:** Group join flow is straightforward. Leaderboard is visible but I'm not yet comparing myself closely.

**Didn't like:** Still no celebration on lock-in. Starting to wonder if they're broken or intentionally stripped.

**Bugs:** None.

---

## Day 4: Thursday, April 9 — Europa QF L1, streak breaks

Europa League Quarter-final first leg. Submitted a prediction but guessed the exact score wrong. The app doesn't flag it as a "miss" or "loss" right away — just shows "locked" status. I know it's wrong because the match result is in and it doesn't match. No streak to break (streak is 0), but the narrative is that this is where a new player would have failed a milestone. The app is silent about it.

**Liked:** The miss isn't rubbed in; no sarcastic messaging.

**Didn't like:** No confirmation that I *did* mess up. I have to infer it from the mismatch of my prediction vs. the result. Feels like there's a feedback gap.

**Bugs:** None.

---

## Day 5: Friday, April 10 — Premier League Friday night, tier trigger

Premier League Friday night fixture. Submitted a prediction. Still no lock-in toast. I've been locking predictions for five days with zero celebration.

Also, the mock data is seeded so that I should be accumulating points. My profile shows totalPoints incrementing. If there's a tier promotion, it should fire today, but I haven't seen any toast. No achievement unlock either. The app is *silent* on these moments.

**Liked:** The Daily Pack card is a nice visual anchor for the day's work.

**Didn't like:** Complete absence of celebration on lock-in, tier promotion, or achievement moments. I feel like I'm playing in a vacuum.

**Bugs:** None visible, but possibly missing reward event handlers.

---

## Day 6: Saturday, April 11 — PL weekend peak

Large Saturday slate. 4+ matches in the daily pack. Submitted predictions on all four. Still no celebration on any lock-in. The app feels inert.

**Liked:** The Daily Pack progress bar fills up visually — that's a small sense of progress.

**Didn't like:** Lock-in celebration is definitely broken or not wired. Five days in, I've locked six predictions and gotten no toast, no animation, nothing.

**Bugs:** None detected, but the celebration system appears to be non-functional (at least for lock-in, and possibly for all five canonical moments).

---

## Day 7: Sunday, April 12 — PL + LaLiga Sunday, leaderboard

Large Sunday. Predicted on PL and LaLiga fixtures. Tapped into the Groups tab and looked at the leaderboard again. I can see my row, but it doesn't stand out as "me" — I'm just another entry. No special highlight, no current-user marker, no visual distinction like a background tint or an avatar indicator. Also looked at my Profile. No celebration badges, no tier display, no achievement unlock message.

**Liked:** Leaderboard is readable. The tabular layout is clear.

**Didn't like:** I can't immediately tell which row is me. It's supposed to be easier to find yourself on a leaderboard. Also, profile doesn't show any tier or level badge yet.

**Bugs:** None.

---

## Day 8: Monday, April 13 — CL QF L2, revisit predictions

CL QF second leg kicks off today (Real Madrid–Arsenal, Inter–Bayern). Submitted new predictions on both. Tapped into the match detail for Arsenal to see my prediction from Day 2 settle. It shows locked status, result matches (hypothetically), and it's marked settled. Still no celebration toast for the settled match result. Also no toast when I locked today's new predictions.

**Liked:** Match detail screen clearly shows settled status.

**Didn't like:** Settlement feedback is purely informational. No celebration on the moment a prediction is confirmed correct.

**Bugs:** None.

---

## Day 9: Tuesday, April 14 — CL QF L2 continued, tier badge reveal

CL QF L2 continues. Submitted final predictions. The mock data is set up so a tier promotion should have occurred by now, but I haven't seen a banner or toast. Opened my Profile to check. No tier badge visible in the header or anywhere. I'm looking at my stats: totalPoints (accumulated), correctPredictions, totalPredictions, streak. But no tier/level/badge display. Shared my prediction to the group (button on match detail), which sent it to the group chat. That's a nice touch, but still no celebration.

**Liked:** The share-to-group flow is seamless.

**Didn't like:** No tier badge visible anywhere on the profile. If I've earned a tier promotion, where is it? The Profile should lead with a tier badge according to the design spec.

**Bugs:** Tier badge not visible on Profile screen, even though it should have been promoted by now.

---

## Day 10: Wednesday, April 15 — Europa QF L2 + Conference quarters

Quiet in terms of new activity. Europa QF L2 and Conference League quarters play today. Submitted predictions on a few. No celebrations, no toasts.

**Liked:** The app stays out of the way.

**Didn't like:** Still zero celebration feedback on any lock-in, no tier badge, no achievement badges visible.

**Bugs:** Same as before.

---

## Day 11: Thursday, April 16 — Quiet day (intentional skip)

Skipped.

---

## Day 12: Friday, April 17 — Return after 1-day absence, welcome-back banner

Returned to the app after one day away (Thursday was skipped). The last visit was Wednesday evening (Day 10). More than 6 hours have passed. Expected to see the WelcomeBackBanner fire on the Home screen. And it did! The banner appears at the top, saying "4 predictions settled · tap to see how it went" with a subtle time label "1d away". The close glyph is present. I can dismiss it. Tapped the banner and it navigated to Profile. Good.

**Liked:** The WelcomeBackBanner is *exactly* what I needed as a notification-averse user. It's the only place I learn what happened while I was away. Copy is informative, concise, and doesn't assume I saw push. It's calm and focused. The banner correctly counts settled predictions and informs me of the time away.

**Didn't like:** The banner doesn't say whether the settled predictions were correct or incorrect. It shows count but not outcome summary. I had to navigate to Profile to see the actual point changes.

**Bugs:** None. The banner is working as designed.

---

## Day 13: Saturday, April 18 — Huge PL weekend

Huge PL slate (Man Utd derby, Arsenal–Chelsea, Liverpool fixture, 5+ matches). Submitted predictions on all five. Still no lock-in toast on any of them. If the celebration system *were* wired, I'd expect five lock-in toasts this weekend, but I got zero. The app feels incomplete.

**Liked:** The Daily Pack fills up nicely on a big day. Visual progress is clear.

**Didn't like:** No celebration on lock-in. The silence is deafening.

**Bugs:** Celebration system appears non-functional.

---

## Day 14: Sunday, April 19 — PL + Serie A Sunday, weekly challenge

Large Sunday slate. Submitted predictions. The app mentioned "weekly challenge progress" somewhere (I think in a card I didn't fully read), but no achievement badge unlocked, no celebration on progress toward challenge.

**Liked:** The layout is consistent.

**Didn't like:** No achievement feedback, no celebration on challenge milestone.

**Bugs:** None detected.

---

## Day 15: Monday, April 20 — Settle weekend, profile review

Reviewed my Profile stats for the week. Saw totalPoints, correctPredictions, totalPredictions, streak, bestStreak. No tier badge. No achievement badges visible anywhere. The Profile header doesn't show a TierBadge or GradientHero as the spec suggests it should. I'm curious why.

**Liked:** Stats are available and readable.

**Didn't like:** Profile feels minimal to the point of being incomplete. No tier display, no achievements, no level/rank badge.

**Bugs:** Tier badge missing from Profile header.

---

## Day 16: Tuesday, April 21 — CL Semi-final L1 draw, boost

CL Semi-final first leg preview and predictions (Arsenal–PSG, Bayern–Dortmund). Submitted on both, boosted Arsenal–PSG because it felt like the marquee match. Still no celebration toast on boost. No toast on lock-in.

**Liked:** Boost mechanic is still clear and usable.

**Didn't like:** Celebration system is broken. I've now locked 20+ predictions without seeing a single toast.

**Bugs:** Celebration system non-functional.

---

## Day 17: Wednesday, April 22 — CL Semi L1 plays

CL Semi-final fixtures play. Submitted live predictions (match-detail flow). Watched the Live Pulse UI (the match status updates in real time). No celebration on lock-in, no celebration on settled result.

**Liked:** The Live Pulse UI is responsive and shows the match state evolving.

**Didn't like:** Still no celebration.

**Bugs:** None.

---

## Day 18: Thursday, April 23 — Europa Semi L1

Europa Semi-final first leg. Submitted predictions. Reviewed settled CL predictions from Day 17. The spec says there should be tier reveal #2 for some testers today, but I'm not seeing a tier badge or promotion toast.

**Liked:** Settled predictions are easy to find.

**Didn't like:** No tier badge, no celebration.

**Bugs:** Tier promotion not visible.

---

## Day 19: Friday, April 24 — PL Friday, group leaderboard

Large Friday PL slate. Submitted predictions. Checked the group leaderboard — still can't easily identify which row is me. I'm looking for a current-user highlight (a background tint, an avatar badge, a "you" label) but I don't see it.

**Liked:** The group leaderboard is readable.

**Didn't like:** Current-user row is not visually distinguished.

**Bugs:** None.

---

## Day 20: Saturday, April 25 — Cycle finale, profile deep-dive

Final day. Reviewed Profile stats one more time. Checked if there was any celebration or achievement badge. Nothing. No tier badge, no achievement badges, no celebration on all the milestones I should have hit.

Looked for the Scoring Guide. Found a link in Settings. Opened it. The guide is concise and explains the points system clearly. But I should have discovered it earlier, ideally from a tip in the Profile when I was confused about where my points came from.

**Liked:** Scoring Guide exists and is clear.

**Didn't like:** No path to the guide from the Profile or Home. No celebration toasts for any of the five canonical moments (lock-in, tier, streak, points, achievement).

**Bugs:** Celebration system appears broken (see regression section below).

---

## Favorite and least favorite

**Favorite day:** Day 12 (Friday, April 17) — WelcomeBackBanner fired correctly. It's the only thing in the app designed for notification-averse users. The copy is perfect: "4 predictions settled · tap to see how it went" and the time context "1d away" is helpful. It's calm, informative, and doesn't assume push was working.

**Least favorite day:** Day 13 (Saturday, April 18) — Huge PL slate, locked five predictions, got zero celebration feedback. It felt like playing in a vacuum. The celebration system is the heartbeat of a gamified app, and it's missing.

**One concrete fix to ship tomorrow:** Wire up the lock-in celebrate() call so that every prediction submission triggers a CelebrationToast with the `lockin` variant. Right now, there's only one celebrate() call in the codebase (`app/match/[id].tsx`), and it fires, but the toast may not be visible due to a provider mount issue or variant mismatch. I'd audit the app root to ensure CelebrationProvider is mounted, then run a fresh install and submit a prediction to verify the toast appears.

---

## Round 1 regression check

### Silent celebration moments
**Status: Still open (critical).**
The CelebrationToast component exists and is well-built (`components/ui/CelebrationToast.tsx`). It has five variants (lockin, tier, streak, points, achievement). But only the `lockin` variant is *wired* to an actual event source. I found only one `celebrate()` call in the entire codebase, in `app/match/[id].tsx`, and it only fires on prediction submit. There are no `celebrate()` calls for tier promotions, streak increments, points earned, or achievements unlocked. The other four variants are orphaned enum values. Lock-in toast *may* be working (I didn't see it despite 20+ predictions, so possibly still broken), but tier, streak, points, and achievement are completely silent.

### No welcome-back summary
**Status: Closed.**
The WelcomeBackBanner exists, is wired correctly in `app/(tabs)/index.tsx`, and fired on Day 12 as expected after a 1+ day absence. The 6-hour threshold works. The copy correctly summarizes settled predictions and points earned. It's dismissible. This is the only surface in the app that works for notification-averse users, and it works perfectly.

### No scoring transparency
**Status: Partially closed.**
The Scoring Guide exists and is readable, but it's buried in Settings. There's no link or prompt from the Home or Profile to guide a new user to it. I discovered it only on Day 20 by exhaustive search. A new player wouldn't know to look there when confused about points.

### Weak current-user highlight in group standings
**Status: Still open.**
The group leaderboard (`app/group/[id].tsx` or similar) displays a table of members and their scores, but the current user's row is not visually distinguished. No background tint, no avatar badge, no "You" label. On a 20-member group, I can't tell at a glance which row is me.

### Pending vs correct visual confusion
**Status: Unknown (not fully tested).**
The PredictionPill component shows a locked/settled prediction, but I didn't thoroughly explore the visual distinction between pending, locked, and settled states across different match statuses. The app's mock data doesn't have enough match-state variety to test this fully. From what I saw, locked predictions appear as a simple text entry with no icon or badge to distinguish them from pending or settled. This might be acceptable, but I'd need more match states to be sure.

---

## New findings (not in Round 1)

- **Celebration system is critically incomplete:** Of the five canonical celebration moments defined in `CelebrationToast.tsx`, only `lockin` has a call site. Tier, streak, points, and achievement are dead code paths. This is a massive gap. Either the celebrate() calls were never wired, or they're in a different branch of code I didn't find.

- **Lock-in toast itself may be broken:** I submitted 20+ predictions and never saw a lock-in toast, despite the code path existing in `app/match/[id].tsx`. This suggests either the CelebrationProvider is not mounted at the app root, or the toast is dismissed so quickly it's imperceptible, or there's a conditional that's preventing it from firing.

- **Profile lacks tier badge in header:** Per the AUDIT spec (§6.8, line 628), the Profile header should have "avatar 56px + username h1 + TierBadge + XP progress + member-since caption". The TierBadge is missing. If I've earned a tier promotion, there's no visual or textual confirmation anywhere.

- **Achievement badges not visible:** The AUDIT spec describes an Achievements section with locked badges (silhouette + gray border) and unlocked badges (emerald glow). I didn't see any achievements in my Profile, either locked or unlocked, despite 20 days of play.

- **Current-user leaderboard row needs a visual marker:** I'd suggest a subtle left border in emerald, or a faint background, or an avatar thumbnail in the row itself to make "me" immediately identifiable.

- **Scoring Guide is undiscovered:** No in-app prompt leads to it. A tooltip on the Profile stats card, or a link in the Home metrics row, would help new players.

