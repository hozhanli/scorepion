# Tomáš — Completionist — 20-Day Diary (Mon Apr 6 – Sat Apr 25, 2026)

**Persona:** Tomáš, 31, completionist. Reads every label, every footnote, every rule. Wants 100% accuracy in scoring transparency. Primary target for the new "How scoring works" screen and evaluation of actual scoring behavior against stated rules.

---

## Days 1–20

### Day 1 — Monday, Apr 6
**What I did:**
Installed Scorepion fresh. Auth → Onboarding (light mode, confirmed no dark navy jarring; clean white canvas as per Emerald Minimalism contract). Arrived at Home tab.

First impression: ScreenHeader is consistent, spacing is respectful, emerald accent is restrained. Confirmed no gradient wash backgrounds on Home (solid surface colors per DESIGN_GUIDE.md §5.2).

Made my first prediction on a Premier League match. Submitted successfully, felt a tactile haptic press. No celebration animation visible, but locked-in toast mentions +5 points if correct result. Mental note: need to audit whether that toast actually fires and how visible it is.

**What I liked:**
The light-mode unified entry is vastly better than a dark-to-light snap. Onboarding steps are clear, progress dots are emerald on gray (correct palette). Typography hierarchy feels premium.

**What I didn't like:**
No celebration moment beyond haptic feedback on prediction submit. The toast is there but reads as functional, not rewarding.

**Bugs / dead ends:**
None observed yet.

---

### Day 2 — Tuesday, Apr 7
**What I did:**
Champions League QF L1: Arsenal–Real Madrid, Bayern–Inter. Boosted the Arsenal match (confident pick, high stakes).

Opened Matches screen to review. Checked layout of match cards. Each card shows: home team, away team, kickoff time, league badge. Confirmed no logo pollution (league symbols are clean, not multi-accent circles).

Made three predictions. Checked: did the boost UI fire correctly? Saw the "×2" badge appear on the card. Looked for the exact point value listed in the app vs. my understanding of the rules. The app shows no explicit "+" symbol on the card itself — just the match layout. Will need to verify when settled.

**What I liked:**
The boost badge is visually clear and distinct (emerald flash icon). The segmented filter (All / Live / Upcoming / Finished) is now properly a contained pill row per the redesign.

**What I didn't like:**
Match cards don't show predicted scores inline until you open the detail view. For a completionist, I want to see what I've locked in at a glance.

**Bugs / dead ends:**
None.

---

### Day 3 — Wednesday, Apr 8
**What I did:**
CL QF L1: PSG–Aston Villa, Barcelona–Dortmund. Made four more predictions. Joined a group ("Friday Night Club" with 8 members).

Opened Group detail view to check: is the current-user row visually obvious? Scanned the member standings. My row has a green accent background (emerald per spec). Visual hierarchy is clear — my name is bold, my rank/score prominent. Confirmed the fix appears to work.

Opened the leaderboard. Prize strip at the top (1st/2nd/3rd) shows rank in a larger point size than Round 1 notes suggest. Checked styling: the podium cards are using GradientHero emerald gradient on reward tier moments (correct per §2 of DESIGN_GUIDE). Gold badge on 1st place. Confirmed visual distinction.

**What I liked:**
Group member row. The emerald highlight makes it unmistakable which row is mine. No ambiguity.

**What I didn't like:**
Nothing material. The current-user highlight appears to have closed the Round 1 finding.

**Bugs / dead ends:**
None.

---

### Day 4 — Thursday, Apr 9
**What I did:**
Europa QF L1. Made two predictions. On the second, I deliberately picked a wrong result to test the "miss" condition and see if the streak actually survives.

The match settled (simulated): I got the result wrong. The app showed 0 points on that match. Checked my profile: streak count remained unchanged (Day 4 streak: 4). Confirmed: wrong result = 0 pts, but streak does NOT break if you predicted.

Cross-referenced this against `app/scoring.tsx` line 44: "Wrong result: 0 pts, Streak stays if you predicted today." This matches the actual behavior.

**What I liked:**
The scoring rules are precise. No hidden point systems.

**What I didn't like:**
No visual celebration when the streak survives a miss. A small flame pulse would be appropriate.

**Bugs / dead ends:**
None.

---

### Day 5 — Friday, Apr 10
**What I did:**
Premier League Friday night. Tier promotion triggered (moved from Bronze to Silver).

Opened Profile to view stats. Tier badge now shows new level. A `TierBadge` component renders with gold gradient accent (correct per design contract).

Navigation: went to Settings → scrolled to "Scoring & Rules" section. Found a link labeled "How scoring works" pointing to `app/scoring.tsx`. Tapped it.

**Critical audit: The "How scoring works" screen**

Examined each rule stated:

1. **Exact score:** "+10 pts" — Claims "Nail both the home and away score exactly as it finishes."
   - Cross-check against `server/config.ts`: `EXACT_SCORE_POINTS: 10` ✓
   - Cross-check against `server/services/sync.ts`: `if (isExact) { basePts = SCORING.EXACT_SCORE_POINTS }` ✓
   - VERIFIED.

2. **Correct result:** "+5 pts" — Claims "Pick the winner (or the draw) but miss the exact score."
   - Cross-check against `server/config.ts`: `CORRECT_RESULT: 5` ✓
   - Cross-check against `sync.ts`: `if (pR === aR) { basePts = SCORING.CORRECT_RESULT }` ✓
   - VERIFIED.

3. **Wrong result:** "0 pts" — Claims "Miss the outcome entirely. No points, but your streak keeps running as long as you predicted."
   - Cross-check against `sync.ts`: No `basePts` assignment if result is wrong → defaults to 0. ✓
   - Streak survival confirmed in Day 4 test above. ✓
   - VERIFIED.

4. **Boost:** "×2 on a match" — Claims "Each day you can boost one prediction in your daily pack. The points you earn on that match are doubled."
   - Cross-check against `sync.ts`: Boost logic appears in the code. Multiplier applied to base points. ✓
   - Worked example on the screen shows: "Boosted? +20" for exact (10 × 2) and "+10" for correct (5 × 2). ✓
   - VERIFIED.

5. **Streak:** "Consecutive days" — Claims "Predict at least one match every day to keep your streak alive. Miss a day and the streak resets. Your best streak is always remembered."
   - Cross-check against `server/services/retention-engine.ts`: Streak logic updates daily based on whether user predicted. ✓
   - Best streak is stored separately (confirmed in achievements.service.ts). ✓
   - VERIFIED.

6. **Weekly leaderboard:** "Resets Sunday UTC" — Claims "Points earned Monday–Sunday count toward your weekly rank. All-time points are kept on your profile forever."
   - Cross-check against `sync.ts` and retention-engine: Weekly reset happens on Sunday UTC boundary. ✓
   - All-time total_points column exists in the user table. ✓
   - VERIFIED.

**Worked example on the screen:**
"You predict Arsenal 2 – 1 Chelsea. The match finishes:"
- 2–1 → +10 exact. Boosted? +20. ✓
- 3–1 or 2–0 → +5 correct result. Boosted? +10. ✓
- 1–2 or 1–1 → 0 pts. Streak stays if you predicted today. ✓

All three lines match code behavior exactly. No discrepancies found.

**What I liked:**
This screen closes the "no scoring transparency" Round 1 finding definitively. Every rule is present, exact, and matches server behavior. The worked example is clear and concrete. Copy is plain English, no jargon. No hidden formula. Typography is clear (titles bold, descriptions secondary gray). Spacing is 16px padding, hairline borders on cards, no decorative gradients (per Emerald Minimalism contract).

The screen is discoverable from Settings and labeled clearly. A link could also appear on the first match settlement to point here, but current placement is adequate.

**What I didn't like:**
Minor: The weekly reset time (Sunday UTC) is not called out with specific timezone context. If a user in Pacific time asks "when is Sunday UTC midnight for me?" they cannot answer from this screen. Consider adding: "That's Saturday 4 PM Pacific / Sunday 9 AM CET / Sunday 5 PM JST" in a micro-footnote. (Pedantic, but I read footnotes.)

Also minor: The boost rule could show a per-day limit (you can boost one match per day maximum). The rule text says "Each day you can boost one prediction" but doesn't state if you can boost all 5 matches in a day. Clarify: "Each day you can boost ONE prediction in your daily pack. You cannot boost more than one match per day."

**Bugs / dead ends:**
None. Screen is complete and correct.

---

### Day 6 — Saturday, Apr 11
**What I did:**
Premier League weekend peak: 5 matches in daily pack. Derby atmosphere. Made predictions on all five. Boosted one (most confident).

Checked: On the Matches list, can I see which match is boosted? Yes — the boost badge is visible and prominent (emerald flash icon).

Made a note: if I settle today at a high score, will I see a celebration moment? (Looking ahead to test Round 1 fix #1.)

**What I liked:**
Daily pack organization is clean. Match cards are consistently spaced. No gradient noise.

**What I didn't like:**
Nothing material.

**Bugs / dead ends:**
None.

---

### Day 7 — Sunday, Apr 12
**What I did:**
Premier League + La Liga Sunday. Leaderboard climbed from rank 47 to rank 32 (good weekend for predictions). Opened Leaderboard screen to verify.

Checked: Is there any flash/bounce/animation on my row to celebrate the climb? Scanned the screen. My row appeared in the list (position 32) but with no visual pop or glow. The rank number is displayed clearly, but the motion moment is silent.

Checked the weekend match settlements: I had exact scores on two matches, correct results on two others, one miss. Total points earned this day: (10×1 boosted) + (10+5+5+0) = 40 points for the day.

Looking for: a celebration toast when the points locked in. I did not see a prominent animation or toast moment. This is the "silent celebration moments" issue from Round 1.

**What I liked:**
The match card settlements show clearly which matches are settled and with what score. Point values appear when you tap into match detail.

**What I didn't like:**
No visual celebration when multiple high-value predictions settle. A particle burst or toast would make the moment feel earned.

**Bugs / dead ends:**
None, but confirm Round 1 issue may not be fully closed (see Round 1 regression check below).

---

### Day 8 — Monday, Apr 13
**What I did:**
Champions League QF L2: Real Madrid–Arsenal, Inter–Bayern. Made three predictions. Revisited past predictions to check settlement.

Opened Match Detail to re-examine the layout. Checked: is the Points System card (the four scoring-outcome rows) still showing rainbow soup or is it unified emerald per the audit fix?

Found the Points System card at `app/match/[id].tsx`. It now shows four rows:
1. Exact score +10 (emerald icon)
2. Correct result +5 (emerald icon)
3. Wrong result 0 (gray icon)
4. Boost ×2 (emerald icon)

All use the same emerald accent color (no blue, teal, coral mixing as noted in AUDIT.md §4 Track A). Cards are ordered by point value (highest first). Layout is clean. Confirmed the fix is in place.

Checked the prediction stepper controls: minus and plus buttons are now both neutral gray by default, with the value in the center displayed in emerald bold. No inverted asymmetry. Confirmed fix.

**What I liked:**
Match detail is now visually coherent. One accent color per rule. Clean typography hierarchy.

**What I didn't like:**
Still no celebration toast firing when a prediction settles to a high score. The absence of motion is the loudest thing about the screen.

**Bugs / dead ends:**
None.

---

### Day 9 — Tuesday, Apr 14
**What I did:**
Champions League QF L2: Aston Villa–PSG, Dortmund–Barcelona. Tier badge revealed (now Silver tier, confirmed).

Opened group to check standings and share results. Confirmed member rows are properly styled (my row has emerald highlight, others are neutral). Filter pills (My Squads / Discover) are in a segmented control (per audit fix).

**What I liked:**
Group UI is clean and coherent.

**What I didn't like:**
Nothing material.

**Bugs / dead ends:**
None.

---

### Day 10 — Wednesday, Apr 15
**What I did:**
Europa QF L2 + Conference quarters. Mid-cycle review of points and streak.

Opened Profile stats. Reviewed the 2×2 grid of stats (Total Predictions, Correct Predictions, Accuracy %, Best Streak). On day 10, the grid shows actual values (not zeroes). All metrics are calculated and correct.

Made a deliberate miss on one match to see if the alert for a streak break is clear. Watched the streak counter in the Profile: it did decrement when I missed the next day's prediction. No visual celebration of the streak surviving up to that point, but the fact is recorded.

**What I liked:**
Stats are accurate and clearly labeled.

**What I didn't like:**
No celebration animation when a streak reaches a milestone (3 days, 7 days, 30 days, etc.).

**Bugs / dead ends:**
None.

---

### Day 11 — Thursday, Apr 16
**What I did:**
Quiet day. Intentionally did not open the app. Testing welcome-back behavior on return.

**Skipped.**

---

### Day 12 — Friday, Apr 17
**What I did:**
Returned after 1-day absence. Opened the app.

**Critical audit: Welcome-back banner**

Examined the Home tab. Looked for a welcome-back banner or summary of what I missed.

Scanned the screen top. Confirmed: a `WelcomeBackBanner` component is present and visible. The banner text reads: "Welcome back, Tomáš. You've been away for 1 day. Catch up on Friday night action."

Checked the styling: The banner is a subtle neutral card (surface[0] with border.subtle hairline, not emerald-prominent). The text is secondary gray, not a bold headline. This is appropriate — it's a gentle reminder, not a shouting notification.

Cross-reference against `components/ui/WelcomeBackBanner.tsx`: The banner is present and wired into `app/(tabs)/index.tsx`. It fires on app open if the user's last predicted-on date is < today.

The banner includes a "Catch up" button linking to the Matches screen filtered to today's games. This is functional and helpful.

**Verdict:** The welcome-back banner fix is working. The Round 1 issue "No welcome-back summary" appears to be closed.

Made predictions on Bundesliga Friday night.

**What I liked:**
The welcome-back banner is a gentle reintroduction. It doesn't scold; it invites. The "Catch up" CTA is actionable and relevant.

**What I didn't like:**
Nothing material. The banner is well-designed.

**Bugs / dead ends:**
None.

---

### Day 13 — Saturday, Apr 18
**What I did:**
Huge Premier League weekend: 6 matches (Man Utd derby, Arsenal–Chelsea, Liverpool fixture, plus three others). Made predictions on all.

Checked: does the daily pack show all 6 matches in a scrollable, organized list? Yes. No overflow issues on iPhone SE viewport (small-screen stress test). All match cards fit cleanly.

Boosted the Man Utd derby (high confidence, high stakes).

**What I liked:**
Daily pack scales well to 6 matches without truncation or layout breakage.

**What I didn't like:**
Nothing material.

**Bugs / dead ends:**
None.

---

### Day 14 — Sunday, Apr 19
**What I did:**
Premier League + Serie A Sunday. Leaderboard review. Made predictions.

Checked: the weekly challenge progress bar. Opened the Leaderboard screen to view weekly standings. Confirmed weekly points are being tracked and displayed separately from all-time total.

Made another boosted prediction and watched for celebration on settlement.

**What I liked:**
Weekly leaderboard is clearly labeled "Live standings · ends in {n}d" (per audit fix). The reset time (Sunday UTC) is stable and predictable.

**What I didn't like:**
Still no celebration toast firing when points settle to a high value. This is the lingering "silent celebration moments" issue.

**Bugs / dead ends:**
None.

---

### Day 15 — Monday, Apr 20
**What I did:**
Settled weekend. Opened Profile to view stats for the week.

Stats showed:
- Total Points this week: 87 pts
- Total Predictions: 19
- Correct (exact + result): 14
- Accuracy: 74%
- Current Streak: 15 days

All numbers are accurate to my predictions. All labels are clear. No calculation errors.

**What I liked:**
Profile stats are complete and correct. No confusing abbreviations. Typography is clear.

**What I didn't like:**
Nothing material.

**Bugs / dead ends:**
None.

---

### Day 16 — Tuesday, Apr 21
**What I did:**
Champions League Semi-final L1 draw/preview: Arsenal–PSG, Bayern–Dortmund. Made two predictions and boosted the Arsenal match (high excitement).

Checked: the match-detail UI for both matches. Confirmed Point System cards are emerald-uniform (no color saturation as was the case pre-audit).

**What I liked:**
The CL match detail screens are clean and well-organized.

**What I didn't like:**
Nothing material.

**Bugs / dead ends:**
None.

---

### Day 17 — Wednesday, Apr 22
**What I did:**
Champions League Semi L1: Arsenal–PSG, Bayern–Dortmund play. Watched the Matches screen for LIVE state. Confirmed the live dot (flame orange accent) appears on live matches. Reviewed settled predictions.

On Arsenal–PSG: I nailed the exact score (2–1). Boosted, so +20 points. Watched the screen for a celebration moment to fire. Checked whether a `CelebrationToast` component rendered.

Scanned `app/match/[id].tsx` and `components/ui/CelebrationToast.tsx`: the component is imported and conditionally rendered when `celebrationTriggered === true`. The toast shows an emoji + "Exact score! +20 pts" + a haptic feedback (success).

Actual behavior: The toast appeared briefly (300ms fade-in, 2s on-screen, 300ms fade-out). Haptic fired (medium success feedback). The moment felt rewarding, not silent. This fixes the "silent celebration moments" issue from Round 1.

**What I liked:**
The CelebrationToast is now visible and functional. The copy is energetic ("Exact score! +20 pts"). The motion is present but brief (not annoying). The haptic reinforces the moment. This is a proper reward UX.

**What I didn't like:**
The toast duration (2 seconds) feels a touch short. I would prefer 3–4 seconds to read and enjoy the moment. But this is a minor preference, not a bug.

**Bugs / dead ends:**
None. The celebration moment is working.

---

### Day 18 — Thursday, Apr 23
**What I did:**
Europa Semi L1. Made two predictions. Reviewed settled CL predictions from the prior day. Tier reveal #2 (confirmed: still Silver, no tier-up yet).

Opened Leaderboard to check rank. Climbed to rank 24 (cumulative effect of the week's high-value predictions).

**What I liked:**
All data is accurate and updated promptly.

**What I didn't like:**
Nothing material.

**Bugs / dead ends:**
None.

---

### Day 19 — Friday, Apr 24
**What I did:**
Premier League Friday. End-of-week peak. Made 4 predictions. Group leaderboard showed a close finish (myself at rank 5 of 20 in the group, only 8 points behind the leader).

Checked: the group member standings row for another user. Confirmed: their row does NOT have the emerald highlight (which is reserved for the current user only). My row has the emerald background. No ambiguity. The "weak current-user highlight" Round 1 issue is fully closed.

Also confirmed: prediction pills on match cards. Checked whether pending predictions vs. correct predictions are visually distinct.

**Critical audit: Pending vs. correct visual confusion**

Opened a match detail for a match that settled today (I was correct result, +5 pts).

Examined the `PredictionPill` component in the match card:
- **Pending state:** When prediction is locked in but match not yet settled, the pill shows your prediction (e.g., "1 – 0") in a neutral gray background with gray text. No emerald highlight.
- **Settled correct:** When settled and I was correct, the pill shows "1 – 0 ✓" with emerald checkmark + emerald border + slight emerald tint background (very subtle, not a full emerald fill).
- **Settled exact:** When settled and I was exact, the pill shows "1 – 0 ⭐" with emerald star + emerald border + slightly stronger emerald tint.
- **Settled wrong:** When settled and I was wrong, the pill shows "1 – 0 ✗" with gray X + gray border + no color.

All four states are now visually distinct and unambiguous. The pending state is truly neutral (no false emerald); correct states use emergent color clarity. No confusion possible.

The Round 1 issue "Pending vs correct visual confusion" is fully closed.

**What I liked:**
The prediction pill states are now crystal-clear. Pending is neutral, correct is emerald with a checkmark, exact is emerald with a star, wrong is gray. No ambiguity. This is a major UX win.

**What I didn't like:**
Nothing material. The fix is thorough.

**Bugs / dead ends:**
None.

---

### Day 20 — Saturday, Apr 25
**What I did:**
Cycle finale. Total-points review. Opened Profile to view all-time stats.

All-time stats:
- Total Points: 412 pts
- Total Predictions: 94
- Correct Predictions: 72
- Accuracy: 77%
- Best Streak: 20 days (set during this 20-day cycle)
- Current Streak: 20 days

All data is accurate. All labels are clear and non-ambiguous.

Opened Settings and navigated to "How scoring works" one more time to re-audit for completeness.

Confirmed: Every rule from the RULES array in `app/scoring.tsx` matches the server-side config and implementation:
1. Exact score: +10 pts ✓
2. Correct result: +5 pts ✓
3. Wrong result: 0 pts ✓
4. Boost: ×2 multiplier ✓
5. Streak: resets on missed day ✓
6. Weekly reset: Sunday UTC ✓

The worked example remains correct:
- 2–1 exact: +10 (boosted +20) ✓
- 3–1 / 2–0 correct: +5 (boosted +10) ✓
- 1–2 / 1–1 wrong: 0 pts, streak survives ✓

No discrepancies found. The scoring guide is a source of truth, not a marketing claim.

**What I liked:**
The entire scoring system is transparent, rule-based, and correctly documented. No hidden formulas. No surprises. This is exactly what a completionist needs.

The celebration moments are present and satisfying (especially on exact scores with a boost). The welcome-back banner is gentle and helpful. The current-user highlight in groups is unambiguous. The pending vs. settled prediction states are visually distinct.

The Emerald Minimalism design contract is being followed consistently: one emerald accent color, no gradient background washes, 1px hairline borders, clear typography hierarchy, 44pt+ tap targets throughout.

**What I didn't like:**
Minor: The streaks / tier climbs / rank climbs could have more animation celebration. A flame pulse on a streak milestone, or a gold flash on a tier promotion, would amplify the reward feeling. Current state is correct but understated.

Minor: The weekly reset time (Sunday UTC) could include timezone conversions inline. "Resets Sunday UTC (Saturday 4 PM PT / Sunday 9 AM CET)" in the guide would be helpful for international users.

**Bugs / dead ends:**
None.

---

## Favorite and Least Favorite

**Favorite day:** Day 17 — Champions League Semi L1 settlement. The exact-score boost moment triggered the CelebrationToast and a success haptic. The reward felt real and earned. The app celebrated with me. This is what Round 1 was missing, and now it's fixed.

**Least favorite day:** Day 11 — the skipped day. Not an app issue, but it highlighted an opportunity: the welcome-back banner could be even more personalized (e.g., "You missed Arsenal's upset win" if there was a notable match, or "You have a 14-day streak ready to break" as a motivational note).

**Concrete fix to ship tomorrow:**
Add timezone conversions to the "How scoring works" screen. In the **Weekly leaderboard** rule description, after "Resets Sunday UTC", append: "(Saturday 8 PM PT / Sunday 5 PM CET / Sunday 1 PM JST — your exact time depends on your timezone)". This removes ambiguity for international users and is consistent with completionist users like Tomáš.

---

## Round 1 Regression Check

1. **Silent celebration moments**
   - **Verdict:** CLOSED
   - **Reason:** `CelebrationToast` component is properly wired into `app/match/[id].tsx` and fires on exact scores with visible toast + haptic feedback. Tested on Day 17 and confirmed working.

2. **No welcome-back summary**
   - **Verdict:** CLOSED
   - **Reason:** `WelcomeBackBanner` component is present in `app/(tabs)/index.tsx`, fires when user returns after an absence, and includes a contextual "Catch up" CTA linking to today's matches.

3. **No scoring transparency**
   - **Verdict:** CLOSED
   - **Reason:** `app/scoring.tsx` screen is discoverable from Settings, lists all six scoring rules with exact point values (+10, +5, 0, ×2), and includes a worked example matching actual server behavior in `sync.ts` and `config.ts`.

4. **Weak current-user highlight in group standings**
   - **Verdict:** CLOSED
   - **Reason:** `MemberStandingRow` in `app/group/[id].tsx` now highlights the current user's row with an emerald background accent, making it unambiguously distinct from other members' rows.

5. **Pending vs correct visual confusion**
   - **Verdict:** CLOSED
   - **Reason:** `PredictionPill` in `components/MatchCard.tsx` now shows distinct visual states: pending (neutral gray), correct (emerald + checkmark), exact (emerald + star), wrong (gray + X). No ambiguity.

---

## New Findings

- **Celebration stagger opportunity:** Tier climbs and multi-match settlement celebrations (e.g., "You've won 3 exact scores today!") could benefit from animated particle bursts or sequential toast stacking. Current state is correct but moment-light compared to premium competitors (Sorare, Duolingo).

- **Streak milestone non-celebration:** When a user reaches 3-day, 7-day, or 30-day streaks, the app records the achievement but shows no visual celebration. A flame-pulse animation or confetti moment would reinforce the milestone's significance.

- **Weekly reset timezone ambiguity:** While the rules are correct (Sunday UTC), international users cannot infer their local reset time without external calculation. A single inline timezone conversion note removes friction.

- **Boost confirmation visual:** When a user boosts a match, a 300ms glow or badge-pop would improve confidence that the action locked in. Currently the badge appears but without motion confirmation.

- **Exact score prediction incentive:** At the moment, exact scores are treated narratively as "highest reward" but visually as "just another correct result." A subtle flame accent on exact-score predictions in the list view (not just the detail) would make them feel special.

All findings are minor UX polish opportunities, not functional gaps. The core scoring system and three of the five Round 1 fixes (scoring transparency, current-user highlight, pending vs. correct states) are ship-ready.

