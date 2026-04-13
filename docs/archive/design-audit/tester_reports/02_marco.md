# Marco — 20-Day Diary
**Persona:** Power user, ex-Sorare, 34, iPhone 15 Pro. Wants speed, density, <16ms latency, minimal taps-per-action. Will probe every micro-interaction, haptic timing, transition smoothness, and queue behavior. Hyper-critical, blunt.

---

## Day 1 — Mon, Apr 6

**What I did:**
Installed fresh. Auth flow (email + password) → Onboarding (3 cards) → Home. Landed on Today screen. Noticed it defaults to light mode — good. Avatar tap → Settings → tap "How scoring works" to deep-dive the transparency layer. Back to Home. Saw StreakFlame hero (0 / best 0), Metrics row (4pt cards), Daily Pack empty state. Tapped "See all" to Matches tab. Premier League matches showing. Tapped a Brighton match to enter Match Detail: saw hero with team logos, kickoff time, H2H gauge, Predict tab. Built a 2–1 prediction in the stepper (2 taps on +, 1 on –, 1 Submit). Tapped "Lock in" button.

**What I liked:**
- Light mode entry is clean. No dark-to-light snap.
- Auth inputs are 54px tall, spaced nicely, emerald icons. No cramming.
- Onboarding carousel works (swipe-able, progress dots in emerald).
- Match Detail hero is clean: two team logos (56px), kickoff time (28px bold), one subtitle line. Emerald GradientHero on live matches is the right call.
- Prediction stepper: both ± buttons are gray, center value is emerald-bold. No confusing asymmetry.
- "Lock in" button haptic fires immediately. Felt crisp.

**What I didn't like:**
- Welcome-back banner missing on Day 1 (expected, but I want to see it work before I'm happy).
- Scoring guide link exists in Settings, but no hint in the main flow about points. Players should know what their prediction is worth before locking in.
- Hero "16:00 Starting soon" text + date + "Fri, Apr 10 · Derby" tags still feel crowded on the card. The league badge doesn't sit in the top-right corner yet — it's in the MatchCard row above, separate.
- PredictionPill shows "Locked 2–1" in neutral gray-on-gray2 (surface[2]). Looks fine, but I can't distinguish it from a "miss" at a glance when scrolling fast.

**Bugs or dead ends:**
- None. Prediction locked in, submitted, toast fired.

---

## Day 2 — Tue, Apr 7

**What I did:**
Opened app. Home → Matches. Saw Brighton (settled, 2–1 exact, +10 pts). Tapped to view. Pill now shows "Exact +10" on emerald tint. Good. Backed out to Matches. Arsenal–Real Madrid upcoming (CL QF L1). Predicted 2–2. Tapped boost toggle (the lightning bolt should 2x points). Locked in. Toast fired: "Locked in! Arsenal 2 – 2 Real Madrid" — appeared 6px below safe area inset, slid in, held 2.4s, slid out. Checked timing: roughly 320ms enter (FadeInUp), 2400ms hold, 220ms exit. Perfect. Navigated back to Matches auto-dismissed after 650ms. Tapped Leaderboard to check standing.

**What I liked:**
- CelebrationToast is *present* now. Checkmark icon, white text on emerald, subtitle shows the prediction. This is the fix they shipped.
- Toast enters with FadeInUp.duration(320).springify().damping(14) — feels snappy, not bouncy. Good damping.
- Auto-dismiss on lock-in (650ms back + 2400ms toast hold = almost no collision). Toast visible while landing on match list. That's intentional pairing. Correct.
- Boost toggle is one tap. No submenu. Locked in with boost showing a 2x indicator on the prediction row in the matches list. Visual feedback is clear.
- Leaderboard loaded fast. Rank shows as #47 / 150.

**What I didn't like:**
- Toast sits at `top: topPad + 6` (line 150 in CelebrationToast.tsx). On iPhone 15 Pro (notch ~47px), that's 53px from screen top. Perfect safe area, but the zIndex is 9999 — it *could* overlap a modal if one fired during the toast, but it won't in this app's architecture. Not a real issue.
- Boost haptic: the toggle press fires `haptic="light"` (PressableScale), but no `heavy` or `selection` on the actual lock-in. The toast's haptics.success() fires on show, not on submit. Missed one more haptic layer: submit button press could fire `haptic="medium"` as a separate signal. Sorare did this — button tap = one haptic, prediction success = another. Two signals are better than one.

**Bugs or dead ends:**
- None. Toast queue system working (CelebrationProvider tracks queue as array, shows queue[0], auto-dismisses with queue.slice(1)). No dropped toasts.

---

## Day 3 — Wed, Apr 8

**What I did:**
Home. StreakFlame now shows 2 / best 2 (streak is live). Metrics row updated: Week pts = 20. Tapped avatar top-right, landed on Profile. Saw "Your Profile" header with 36px avatar initial "M" and a settings gear. No gradient hero, no tier visible in the header yet. Scrolled down to "Your stats will appear here after your first prediction" — actually, the grid is hiding (smart Day 0 behavior as designed). Tapped groups tab. Empty, "No squads yet" empty state. Tapped "Create Group" (CTA pill, emerald). Modal popped with group name input field. Filled "Arsenal Faithfuls", tapped Create. Got invited to a 4-person group in the seed data (test group). Tapped Join. Landed on Group Detail screen.

**What I liked:**
- StreakFlame component is crisp: flame icon, big bold "2", subtitle "On fire · best 2", week dots below. No wobble or pop animation yet (waiting for the full spec), but presence is there.
- Profile header is minimal. Gear tap works, no friction.
- Avatar initial on a white circle with emerald ring is correct.
- Group Detail shows standings. Current user row ("Marco") has a full-height emerald rail on the left side. Immediately findable. Row styling: slightly tinted background (emeraldSoft = rgba(0, 166, 81, 0.10)), username bold, "YOU" pill next to name. This is the fix for weak current-user highlight.
- Rank badge shows "1", "2", "3" in a colored circle (top-3 get gold background), the rest gray. Correct.

**What I didn't like:**
- Group settings (Share / Copy Code / Leave) buried in a menu. Should be accessible from the header. Right now you swipe down and a modal appears—one more tap. In Sorare, this was instant.
- Group member avatars are colored circles with initials (correct now, was numbered before). Good.
- Weekly highlight card shows "This week's top performer" but the name/points don't match the #1 standing row above. Off by one. Might be a data freshness issue in mock data, but visually it breaks coherence. Actually, re-reading the code, it's pulling the #1 from the settled data differently than the standings list. In a real app, this should be the same person. Not a code bug, just mock data misalignment.

**Bugs or dead ends:**
- Group standings row renders correctly (fadeInUp stagger by rank - 1). No layout issues.

---

## Day 4 — Thu, Apr 9

**What I did:**
Home. Streak still 2 (predicted yesterday, today I skipped). Checked matches for Europa QF L1. Predicted on 3 matches carelessly. All three locked in with toasts firing in sequence. Watched the queue: first toast "Locked in! Sevilla 1 – 1 Atalanta" → 2400ms hold → slide out → next toast auto-fires "Locked in! Roma 0 – 2 Lazio". The queue works. No dropped toasts. Each auto-dismissed after 650ms back delay. Tapped Leaderboard. Rank still #47.

**What I liked:**
- Toast queue is reliable. Three rapid-fire celebrates → three sequential toasts, no overlap, no loss. CelebrationProvider state management is solid (queue: [ ... ]).
- Toast auto-dismiss is precise. Setting timeout inside useEffect, clears on unmount. No memory leak.

**What I didn't like:**
- Streak broke today (I didn't predict on Day 4). Tomorrow I expect to see a visual reset on StreakFlame, but I won't see a "streak broken" toast or a red flash on the leaderboard. AUDIT §3.7 promises "zero celebration moments" should be fixed, but what about *negative* moments? Miss should have feedback too. Actually, re-reading the brief, negative moments (streak break, rank drop) weren't in scope for Round 1 fixes. But they should be.
- No countdown on StreakFlame showing "1 day to maintain streak" or similar. Just the raw number. Urgency is missing.

**Bugs or dead ends:**
- None. Queue flowed cleanly.

---

## Day 5 — Fri, Apr 10

**What I did:**
Home. Streak reset to 0. No visual feedback on the StreakFlame change (no flash, no shake). Swiped refresh on Home. Data refreshed. Metrics: Week pts = 20, Best = 2, Reset = 5 days. Tapped Matches. Premier League Friday night live. Saw 3 matches, one live (green LIVE badge, 23'). Tapped the live match. Prediction stepper live, match score live (2–1 so far, updated at 23'). Locked in my prediction 2–1. Toast fired. Backed out. Checked Leaderboard. Tier promotion mentioned in AUDIT § 5.6 — not seeing it yet. Might be triggered by a specific points threshold that I haven't hit.

**What I liked:**
- Live match UI: green dot + "LIVE 23'" in top-right of MatchCard. Clear.
- Live MatchCard is still tappable, prediction locked in successfully. No race condition.
- Premier League Friday volume is density-correct: 3 matches, not cluttered, scrollable.

**What I didn't like:**
- No visible tier promotion badge. I've earned ~30 points total, should I be promoted yet? Might be a mock-data threshold. But if I *were* promoted, I should see a "Tier up!" toast with a trophy icon. AUDIT §5.6 promises this. Will check later.
- StreakFlame reset was silent. No "streak broken" toast. That's a missing celebration moment (negative, not positive).
- Leaderboard zone dividers not present yet. All ranks 1–150 flow without visual "promo zone" separation. AUDIT Track B §5 promises subtle wash + divider. Not shipping yet.

**Bugs or dead ends:**
- None. Live match prediction submission worked.

---

## Day 6 — Sat, Apr 11

**What I did:**
Home. Woke up, opened app. StreakFlame shows 1 (I predicted yesterday on Fri). Metrics row: Week pts = 25. Daily Pack shows 6 matches (PL Saturday). Tapped Daily Pack card. Navigated to Matches tab (3 taps: Daily Pack → Matches tab, vs. direct tap). Today's matches: Man Utd–Chelsea (derby), 3 others. Rapid-predicted all 6 (1 exact, 2 correct, 3 miss). Toasts fired for each lock-in. Checked Group leaderboard. I'm now tied with another player at 50 pts. Current-user row still has emerald rail and YOU pill. Visibility is correct. Avatar backgrounds are colored circles (initials deterministic by user id, cycling through palette). Good.

**What I liked:**
- Daily Pack card is a gradient hero (emerald colors, glow effect, white text). Prominent. 6 / 6 progress bar fills visually.
- Rapid predictions (6 in succession) queued cleanly. Toast sequence was ordered, no drops. Each auto-dismissed, backed to Matches, queue processed correctly.
- Group row highlights work: a tie player and I are both at rank 3 (tied), both have subtly tinted row backgrounds (rowHighlight), my row has the left rail. Distinguishable.
- StreakFlame weekDots are computed correctly. I can see a pattern of 7 dots representing Mon → Sun, with lit dots for days I predicted.

**What I didn't like:**
- Daily Pack tap delay. You tap the card, it navigates to /matches and switches the tab, but there's no visual transition. Just a hard cut to the Matches tab list. Should be a FadeInDown or a push transition. Currently it's a hard snap.
- Group Detail: I can see the members list updates live (new person joined), but there's no celebration toast for "New member joined!" or similar. That's a missed social celebration moment.

**Bugs or dead ends:**
- None. Queue held up at 6 simultaneous celebrations.

---

## Day 7 — Sun, Apr 12

**What I did:**
Home. Streak = 2 / best 2. Tapped into a match. It's already settled (finished at 11pm Sat, now Sun 10am). Result was 1–2, I predicted 2–1 = miss = 0 pts. PredictionPill shows "No points" in neutral gray. Noted: the pill logic distinguishes exact (emerald + star), result (emerald + checkmark), miss (gray + close-circle), pending (gray + lock). When I tap the settled match, can I see a breakdown of what I earned? Tapped into Match Detail. There's an "Events" tab showing match events (goals at 45', 67', 88'). Stats tab shows xG, possession, passes. But I don't see a "points breakdown" card showing me that I got +0 and why. Let me check the H2H tab... that's head-to-head history. No breakdown on this screen. Actually, looking at the code, the Points System card on `match/[id].tsx` (lines 631–654) is in the Predict tab, not a separate breakdown. So I can *see* what I could have earned before locking in, but not a summary after. That's a miss for scoring transparency (AUDIT §3.2).

**What I liked:**
- PredictionPill visual distinctions are now clear. Emerald tint on wins, gray on losses. No confusion with pending anymore.
- H2H and Stats tabs load quickly. Transition between tabs is instant (no fade, just snap). That's appropriate for dense data screens.
- Live match score updated in real-time. Match Detail refreshed correctly while I was on the screen (didn't show the live score update animation, but the number changed).

**What I didn't like:**
- No "points earned" summary on a finished match's detail screen. Sorare shows a "Card settled: +5 points" banner. Scorepion is silent. After a match finishes, a user should see *their personal result* (what they earned) as a clear, prominent summary. Not buried in the Points System card on the Predict tab.
- Leaderboard: still no visual tier zones. I'm rank #47, so I'm nowhere near top 3, but I should know what the "promo zone" is.

**Bugs or dead ends:**
- None. Prediction settled correctly.

---

## Day 8 — Mon, Apr 13

**What I did:**
Home. Streak = 3 / best 3. Tapped avatar to Profile. Expected to see tier visible in the header area (AUDIT §3.5). Still just a gear and avatar. Scrolled down past stats. Saw a badge area labeled "Tiers" but no tier revealed yet. Group standings still show my name with YOU pill. Tapped into the group to check activity feed. Saw 5 activity items (enhanced and merged from two API endpoints). Items are: "Marco locked in Napoli 1–2" timestamps + relative time format. Clear.

**What I liked:**
- Activity feed merges enhanced and basic items intelligently. Relative time ("2h ago") is readable.
- YOU pill is persistent in group standings. Good.

**What I didn't like:**
- Profile tier badge area is hidden / empty. I should be seeing a tier badge by now, but it's locked behind some threshold or game state. The code says "Tier Badge" component exists but it's not visible. Actually, looking at the Profile screen code, I don't see a GradientHero tier badge in the header like AUDIT promised. That's still on the backlog.
- No tier-up celebration toast yet. Haven't hit a promotion threshold, so I can't judge this.

**Bugs or dead ends:**
- None.

---

## Day 9 — Tue, Apr 14

**What I did:**
Home. Predicted on 4 more matches. One was a boost prediction. Tapped into Match Detail for a CL QF L2 match (Aston Villa–PSG). Saw the Predict tab with stepper, then tapped the "Boost" lightning icon. Toggled it on (should be visual feedback). Locked in prediction. Toast fired. Back to Matches. The prediction row shows a "2x" indicator next to it (small badge or text).

**What I liked:**
- Boost toggle is one tap. Visual feedback: the prediction pill or the row shows "2x" or a flame icon indicating boost is active. Good.
- CelebrationToast sub-title is correctly formatted: "Aston Villa 1 – PSG 3" (abbreviated team names work).

**What I didn't like:**
- Boost toggle feedback is minimal. On Sorare, toggling boost plays a *distinct* haptic (heavy) and the lightning icon animates (scales up). Here, it's just a PressableScale with haptic="light". Should be haptic="heavy" or at least "medium". The toggle deserves emphasis.
- Tier badge still not visible.

**Bugs or dead ends:**
- None.

---

## Day 10 — Wed, Apr 15

**What I did:**
Home. Streak = 5 / best 5. Checked Leaderboard. Rank still around #47. Scrolled through the list. Rank 1 has ~180 pts, rank 150 (bottom) has ~5 pts. No visual dividers between zones. Tapped into a group. Group leaderboard shows 20 members, ranks 1–20. I'm rank 3 in the group. Scrolled past my row. No animation or visual signal when I scrolled past "YOU". Expected: a subtle flash or a "Your rank" anchor. Not present.

**What I liked:**
- Leaderboard is sortable and responsive. Data loads fast.
- My group standing (rank 3, "YOU" pill) is visible and findable.

**What I didn't like:**
- No visual zone dividers on either leaderboard. Top 3 are different from 4–5 from 6+. No wash, no divider, no color change.
- No "rank change" celebration. If my rank improved from #50 to #47, I should see a green flash + arrow bounce on the leaderboard row (AUDIT Track E §5.4). Currently, rank changes are silent.
- No "Your rank" anchor on scroll. If I'm rank 3 in my group, there should be a sticky "You" indicator or auto-scroll to my row on first load.

**Bugs or dead ends:**
- None.

---

## Day 11 — Thu, Apr 16

**What I did:**
Skipped. (Simulating a weekday absence.)

---

## Day 12 — Fri, Apr 17

**What I did:**
Returned after 1-day absence. Opened Home. Expected: WelcomeBackBanner should fire. **It fired.** Banner text: "+20 points while you were away" (2 settled predictions from Thu, both wins = +10 each). Icon is a trending-up arrow in emerald. Banner row has a subtle emerald-tinted background (rgba(0, 166, 81, 0.05)). Subtitle: "21h away · tap to see how it went". Tappable. Has a close button (X icon, top-right of banner). Tapped the close button. Banner dismissed for the session. Good.

**What I liked:**
- WelcomeBackBanner fires correctly. 6+ hours away → settled predictions exist → banner shows.
- Banner entry animation is FadeInDown.duration(360).springify().damping(16). Feels smooth, not bouncy. Appropriate.
- Banner styling is correct: white card + hairline border on neutral, tinted border + soft background on positive outcomes. Emerald icon (trending-up) signals "good news".
- Close button is a PressableScale with hitSlop={10}. Generous hit target, haptic="selection" fires. Good UX.
- Banner's onPress navigates to Profile, which is the right destination.

**What I didn't like:**
- Banner auto-dismisses after a tap but doesn't show a "seen" state. On Sorare, you could swipe it away and it'd stay gone, but re-entering the app would re-show it if new settled predictions landed. Here, once you dismiss, it's gone for the entire session. That's defensible, but less flexible.
- The "21h away" subtitle is hardcoded calculation. Correct.

**Bugs or dead ends:**
- None. Banner wired correctly per AUDIT §3.8 and brief §11.

---

## Day 13 — Sat, Apr 18

**What I did:**
Home. Streak = 6 / best 6. Huge PL weekend: 5 matches (Man Utd derby, Arsenal–Chelsea, Liverpool, etc.). Predicted all 5 in rapid succession. Toasts fired in sequence. All queued correctly. First toast lingered while I was reviewing the other matches. By the time I predicted the 3rd match, toast 1 had already exited. Toast 2 was on-screen. Smooth.

**What I liked:**
- Toast queue is stable under high-frequency celebration firing. Five toasts enqueued, each showed for 2400ms + hold time, no collisions, no dropped events.
- Toast staggering doesn't interfere with navigation. Each lock-in → toast → auto-back is independent. No race conditions.

**What I didn't like:**
- Toast queue doesn't give visual feedback about *how many are queued*. On Sorare, if you rapidly lock in 5 predictions, you see a counter or a "3 more" indicator. Here, you just see one toast and have to trust the queue. For transparency, a queue indicator would help.

**Bugs or dead ends:**
- None.

---

## Day 14 — Sun, Apr 19

**What I did:**
Home. Streak = 7 / best 7 (I'm at the max before the weekly reset). Checked StreakFlame: "On fire · best 7" (correct). Looked for a "Tier 2" or "Tier Up!" celebration. Still no tier badge visible on Profile. So no tier-up toast fired. Points total for the week: ~85 (rough, across all 7 predictions). Expected: tier promotion might need >100 pts or it's locked behind a specific match pool. Will revisit.

**What I liked:**
- Streak count is accurate. Best streak is persistent.
- Weekly points calculation is correct. 85 pts / week is a reasonable score.

**What I didn't like:**
- No tier promotion yet. I'm waiting for the moment I hit a threshold and see the "Tier up! 🏆" toast with the pop animation (wobble spring, hold 2s, heavy haptic). Haven't been given that moment in this 20-day run.

**Bugs or dead ends:**
- None.

---

## Day 15 — Mon, Apr 20

**What I did:**
Home. Weekly reset hits Sunday UTC, so I'm starting a fresh week. Streak shows 1 (I predicted yesterday, Sun). Best streak still shows 7. Tapped into Profile to check "Your stats". Saw: All-time points = ~85, Weekly points = 0 (fresh week), Best streak = 7. Stats grid is now visible (not hidden as on Day 1). Scrolled down to Tiers. Still no tier badge revealed. Settings gear tapped → "How scoring works". Reviewed the scoring guide screen. All 6 rules explained: Exact (+10), Correct (+5), Wrong (0), Boost (×2), Streak (consecutive days), Weekly leaderboard (reset Sunday UTC). Copy is clear, no jargon. Good.

**What I liked:**
- Profile stats are now unhidden. Grid shows 4 cards: all-time pts, weekly pts, best streak, total predictions. Correct.
- Scoring guide is discoverable from Settings and the copy matches the code (exact score +10, correct result +5, etc.).
- Rules are color-coded with icons: star (exact), checkmark (correct), close-circle (wrong), flash (boost), flame (streak), trophy (weekly leaderboard). One emerald accent per rule. Clean.

**What I didn't like:**
- Tier badge still hidden. On Profile, there should be a GradientHero tier card showing "Tier 1 · Level 5" or similar. Not present.
- No link from Home to scoring guide. Users have to go Settings → "How scoring works". Should be accessible from Home or a dedicated "Learn" tab.

**Bugs or dead ends:**
- None. Scoring guide renders correctly, no broken links or missing rule definitions.

---

## Day 16 — Tue, Apr 21

**What I did:**
Home. Tapped into Matches. CL Semi-final L1 draw/preview showing: Arsenal–PSG, Bayern–Dortmund. Tapped to predict Arsenal–PSG. Boosted my prediction. Locked in. Toast fired. Backed to Matches. Predicted Bayern–Dortmund (no boost). Locked in. Second toast queued, showed correctly. Checked Leaderboard again. Rank #46 (up from #47). No visual feedback on the rank change (no green flash, no bounce, no haptic). Expected per AUDIT Track E: green row flash + arrow bounce + selection haptic. Not implemented.

**What I liked:**
- Toast queue handling is consistent across all days.
- Boost toggle works reliably.

**What I didn't like:**
- Rank climb is silent. I improved from #47 to #46 but there's no celebration. AUDIT Track E §5.4 promises "green flash + arrow bounce + selection haptic on rank climb". Not shipped.

**Bugs or dead ends:**
- None.

---

## Day 17 — Wed, Apr 22

**What I did:**
Opened app. CL Semi L1 matches settled: Arsenal–PSG (2–2), Bayern–Dortmund (0–1). Checked predictions. Arsenal: I predicted 2–2 = exact = +10. Bayern: I predicted 0–1 = exact = +10. Two settled predictions, both exact scores, both boosted = +40 total today. Tapped into my predictions to review. PredictionPills show "Exact +10" for both. No settlement-moment toast fired (like "Match settled! +10 points"). That's a missed celebration (AUDIT §3.7). Expected: when a match settles, the user should see a green +10 toast or a "Points earned" banner. Currently, only lock-in has a toast. Settlement is silent.

**What I liked:**
- Predictions settle correctly. Pill outcomes are accurate (exact / correct / miss calculated correctly per match result).
- Data consistency: if I predict 2–2 and the match finishes 2–2, the UI reflects that correctly.

**What I didn't like:**
- No settlement celebration. AUDIT §3.7 (Zero celebration moments) identifies "A finished match settled in your favour" as one of the five canonical moments. It's not wired to celebrate. That's a regression.

**Bugs or dead ends:**
- None. Settlement logic is sound.

---

## Day 18 — Thu, Apr 23

**What I did:**
Home. Europa Semi L1 played overnight. One match was settled (I predicted correctly, +5 pts). Reviewed in match detail. Checked group leaderboard again. I'm now rank 2 (up from rank 3). Again, silent rank climb. No visual feedback. Tapped into group to see activity feed. It shows "Marco locked in Roma 0–2 Atalanta" and "Marco's prediction settled: +5 points". The activity feed *logs* the settlement, but the toast wasn't there when I opened the app.

**What I liked:**
- Activity feed is logged correctly. Settlement is tracked.
- Rank 2 in group is correct (I've earned more points than the previous rank 2).

**What I didn't like:**
- Rank climbs are still silent. I expect the rank #2 row to have flashed green or bounced when I loaded the screen, but it didn't. AUDIT promises this; not delivered.
- Settlement toast is missing. Activity feed logs it, but there was no "Points earned" toast on app open (even though I was away for several hours). A welcome-back banner might have been more appropriate here, but the settlement itself should have a toast.

**Bugs or dead ends:**
- None.

---

## Day 19 — Fri, Apr 24

**What I did:**
Home. Streak = 6 (I missed predicting on one day mid-week). Predicted on 3 more PL Friday matches. Group leaderboard shows a close finish: I'm rank 2, another player is rank 3, 1pt behind. Top 3 are separated by 3–2–1 pts. Tapped Home metrics. Week pts = 45 (correct, given the 3 lock-ins + the +5 settlement). All-time pts on Profile now ~135. Tapped "See all" to Matches. Saw 6 more matches for the weekend. Rapid-predicted 4 (all locked in, all toasted correctly).

**What I liked:**
- Metrics update in real-time as predictions settle. Week pts is current.
- Group ranking is live. Players' points are updated as matches settle and predictions are scored.
- Toast queue is stable even after 20 days of heavy usage. No degradation.

**What I didn't like:**
- Still no visual "tier up" moment. I've earned 135 all-time pts, and if tier promotion is every 100pts, I should be Tier 2 by now. Not seeing it.
- Close group finish (rank 2 vs. rank 3, 1pt gap) is not celebrated. No "You're on the podium!" or "Just 1pt from the top!" toast.

**Bugs or dead ends:**
- None.

---

## Day 20 — Sat, Apr 25

**What I did:**
Home. Streak = 7 (on track). Predicted the final 5 PL Saturday matches. All locked in, toasts fired correctly. Tapped into Profile. Reviewed all-time stats: ~155 pts, 20 total predictions, best streak 7. Tapped "How scoring works" one more time to confirm scoring guide is stable. Reviewed all 6 rules. Exited. Returned to Leaderboard. Rank #45 (climbed from #46). Checked group standings one final time. I'm rank 1 in the group (surge to the top after the final settled matches). The group row highlighting is still correct: my row has the left emerald rail and YOU pill. No other member's row has the rail.

**What I liked:**
- Profile reflects the full picture: 155 all-time pts, 7 best streak, 20 predictions. Data integrity is sound.
- Scoring guide is stable across all 20 days. Copy is accurate and discoverable.
- Group standings reflect my final rank: I'm rank 1 (leader). The UI makes this obvious: MY row is highlighted with the rail, and I'm at the top of the sorted list.
- Final app behavior is consistent with Day 1. No crashes, no state corruption, no regressions.

**What I didn't like:**
- Rank climb to #45 (from #46) is silent. That's 3 separate rank climbs across the 20 days (Day 16: #47→#46, Day 18: #3→#2, Day 20: #46→#45), all silent.
- I still haven't been given a tier-up celebration (no "Tier 2!" toast, no badge pop animation). My 155 pts should have triggered one if tiers cap at 100/200/300. Either the threshold is higher or the celebration is deferred.
- Group rank climb to #1 (from #2) has no celebration either.

**Bugs or dead ends:**
- None.

---

## Favorite and Least Favorite

**Favorite day:** Day 12 (welcome-back banner fire). The banner felt like a *return to agency* — "here's what happened while you were away, good or bad." It's the first moment in 20 days where the app acknowledged that time passed and proactively surfaced context. The emerald tint on positive outcomes is the right signal. One tap to dismiss, one tap to navigate. That's the design taste I want from this app.

**Least favorite day:** Day 5 (streak reset, silent). A 3-day streak broke with no visual feedback. In a gamified app, negative moments need acknowledgment too. Either a subtle red flash on StreakFlame or a "Streak broken" toast. Sorare plays a sad horn sound. Scorepion just... nothing. The math is still correct, but the *experience* is hollow. That's a miss.

**One concrete fix to ship tomorrow:**
Implement rank-climb celebration: on any Leaderboard row where `member.rank_change > 0`, fire a 300ms green row flash (background color shift from white to rgba(0, 166, 81, 0.08)) + a subtle arrow-bounce on the rank badge (scale 1.0 → 1.15 → 1.0 via wobble spring, ~600ms) + `haptics.selection()` on the row tap. This closes the gap from AUDIT Track E §5.4. Bonus: extend to group standings. Cost: ~30 lines of code. Impact: 100% — every leaderboard scroll will feel alive.

---

## Round 1 Regression Check

1. **Silent celebration moments** — Partially closed. CelebrationToast is wired for lock-in (variant="lockin"), firing on prediction submit with haptics.success() and a 2.4s display. The toast queues correctly and dismisses. However, *settlement* celebrations (match finished, points earned) are still silent — no toast, no banner, no animation. Also, *negative* celebrations (streak broken, rank drop) have no feedback. So the lock-in moment is fixed; the other four promised moments (tier promotion, streak tick, rank climb, settlement) are either missing or incomplete. **Verdict: Partially closed.** Lock-in toast is real and works. Settlement, tier, streak tick, and rank climb are missing.

2. **No welcome-back summary** — Closed. WelcomeBackBanner fires correctly on Day 12 (6+ hours away, settled predictions exist). Entry animation is smooth (FadeInDown, 360ms spring, damping 16). UI is clean (white + hairline, emerald tint on positive outcomes, trending-up icon). Dismissible with a close button. Tappable to navigate to activity. No regressions detected. **Verdict: Closed.** WelcomeBackBanner is fully functional.

3. **No scoring transparency** — Closed. `app/scoring.tsx` is a dedicated "How scoring works" screen reachable from Settings. All 6 rules are listed (Exact +10, Correct +5, Wrong 0, Boost ×2, Streak, Weekly leaderboard) with clear descriptions, icons, and point values. Worked example at the bottom. No hidden formulas. Copy matches the server logic. **Verdict: Closed.** Scoring guide is discoverable and accurate.

4. **Weak current-user highlight in group standings** — Closed. `MemberStandingRow` renders with `isCurrentUser` check. Current user's row gets a full-height emerald rail on the left (standingStyles.youRail, width 4px, full height). Avatar gets emerald ring (avatarHighlight). Username is bold (usernameHighlight). A "YOU" pill is shown next to the username. The row is tinted (rowHighlight, emeraldSoft background). Immediately findable at a glance, even without reading the username. **Verdict: Closed.** Current user is visually distinguished in group standings.

5. **Pending vs correct visual confusion** — Closed. `PredictionPill` in MatchCard distinguishes four outcomes: exact (emerald + star icon + "Exact +10"), result (emerald + checkmark + "Correct +5"), miss (gray + close-circle + "No points"), pending (gray + lock-closed + "Locked 2–1"). Pending uses neutral gray on gray background. It's visually neutral, not confusing with exact/correct. The lock icon is clear. **Verdict: Closed.** Pending state is visually neutral and distinguishable.

---

## New Findings

- **Rank climbs are silent.** I climbed ranks three times (Day 16, 18, 20). No visual feedback. AUDIT Track E §5.4 promises "green row flash + arrow bounce + selection haptic". Not implemented. This is worth >80 pts effort to ship and would dramatically improve leaderboard engagement.

- **Settlement celebrations missing.** Match-settled moments (user earned points) have no toast, no banner, no animation. Only lock-in toasts fire. A "Match settled! +10 points" green toast would close the engagement loop.

- **Tier promotion not visible.** I have 155 all-time pts but no tier badge visible on Profile. Either the threshold is very high (>200?) or the tier celebration (AUDIT §5.6, variant="tier") is deferred. The Tier Badge component exists but isn't rendering. This might be a data layer issue, not a UI bug.

- **Negative celebration moments missing.** Streak reset (Day 4) and streak break (Day 5) were silent. No red flash, no sad toast, no haptic. These are as important as positive moments for habit-loop closure.

- **Toast queue counter absent.** If a user rapid-fires 5 predictions, they see one toast and have to trust the queue. A small "(3 more)" indicator on the toast would improve transparency.

- **Group settlement notifications missing.** Activity feed logs "Marco's prediction settled: +5 pts" but the app doesn't fire a toast on app-open welcome-back. A settlement-moment welcome-back banner (distinct from the "points earned" summary banner) would be a nice touch.

- **No FadeInDown transition on Match Detail entry.** Tapping a match card navigates to match detail with a hard cut, not a cascading animation. AUDIT Track E §5.2 promises "FadeInDown hero + 80ms staggered sections". Not implemented. This is low-effort (add `entering={entries.fadeInDown(0)}` to hero View, then stagger subsections).

- **Boost toggle haptic is light, not heavy.** Toggling boost should feel more significant (heavy or medium haptic). Currently it's light, same as a regular button.

---

## Summary

This 20-day run confirms that the CelebrationToast lock-in fix (Round 1 Finding #1) is **solid**. The queue works, haptics fire, auto-dismiss is precise, and there are no dropped celebrations. The WelcomeBackBanner (Finding #2) is also **complete** — fires correctly, dismisses correctly, navigates correctly. The scoring guide (Finding #3) is **discoverable and accurate**. The current-user row highlight (Finding #4) is **immediately visible**. The pending-state visual distinction (Finding #5) is **clear**.

But the app still lacks:
- Rank-climb celebrations (green flash, arrow bounce, haptic).
- Settlement-moment celebrations (match finished, points earned).
- Tier-promotion celebrations (badge pop, ring burst).
- Negative-moment feedback (streak reset, rank drop).
- Visual navigation transitions (match detail entry, tab switches).

If I had to ship one thing, it'd be rank-climb celebrations. That's the highest-impact, lowest-cost fix (30 lines, 80 pts effort). It would make every leaderboard scroll feel alive and give competitive players a reason to obsess over rank changes.

The app is *functionally* complete and *visually* clean. But it's still quiet where it should sing.
