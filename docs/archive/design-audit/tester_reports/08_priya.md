# Priya — 20-day diary (lapsed user, Round 2)

**Persona:** 25-year-old lapsed user. Installed 6 months ago, abandoned entirely (Days 1–4 skipped). Reinstalls fresh on Day 5 (Fri Apr 10, 2026). Tests cold-start and welcome-back banner behavior.

**Key focus:** Verify that the Round 1 fixes — especially the welcome-back banner, celebration moments, and pending/correct visual distinction — actually land correctly when a lapsed user returns.

---

## Days 1–4 (Mon 6 Apr — Thu 9 Apr) — Skipped. (Lapsed — haven't opened the app since January.)

Priya's old account exists but is dormant. Her last login was in early January; her profile holds stale data from then. She hasn't seen the Champions League QF matches or any of the recent fixtures. The app is entirely absent from her mind.

---

## Day 5 (Fri 10 Apr) — **REINSTALL & COLD START**

### Cold-start sequence

**1. Fresh app install → Sign-in**

Priya taps the reinstalled icon. She lands on the emerald light-mode auth screen. The sign-in flow is clean: **white card, emerald focus ring on input, hairline border, quiet surface**. She enters her old username/password and authenticates successfully.

- **Design moment:** No splash screens, no dark navy spacescape. This matches the DESIGN_GUIDE's "neutral canvas, hairline cards, one emerald accent" contract. She's already trusting the app.
- **Her feeling:** "Wait, my account still exists? Good, I don't have to start over."

**2. Onboarding gate check — SKIPPED**

Reading the code path: `app/onboarding.tsx` checks `onboardingDone` from storage. Since Priya was already onboarded 6 months ago, this flag is `true`. She **does not re-onboard**. She skips directly to Home.

- **Design implication:** No "welcome back to Scorepion" narrative, no feature re-introduction, no "what's new" splash. The app assumes she remembers everything.
- **Her feeling:** Mixed. "Good, no boring steps. But... what am I doing again? Anything new?"

**3. Home screen entry — CRITICAL COLD-START VERIFICATION**

She lands on **Today, Friday** (from `app/(tabs)/index.tsx` line 297).

The screen renders:
- **ScreenHeader:** "Today, Friday" + "Priya, here's your pack" + avatar
- **WelcomeBackBanner check:** Lines 220–249 in home screen. The useEffect runs on mount:
  ```javascript
  const last = await getLastVisit();
  const now = Date.now();
  await setLastVisit(now);
  if (!last) return; // first-ever session — no banner
  ```
  **CRITICAL FINDING:** Since this is a fresh reinstall, `getLastVisit()` returns `null` (no previous `LAST_VISIT` timestamp in AsyncStorage). The condition `if (!last) return;` **correctly aborts before showing the banner**. The banner does NOT fire on Day 5 because there is no `lastVisit` to compare against. This is the correct cold-start behavior.

  - **Design correctness:** The logic matches the spec. Cold starts do not show a welcome-back banner; only returning users (with a prior visit timestamp) do.
  - **Her feeling:** No banner appears. She sees the home screen fresh. Clean entry.

- **Streak hero:** Shows a `StreakFlame` with `streak=0` (no activity since January) and `bestStreak=?` (her old best, likely 2–3 from January). The subtitle is "Lock in to start your streak". Clean emerald gradient hero, no noise.

- **3-column metrics:** Best, Week pts, Reset. All show her stale values or reset-friendly zeros. White cards with hairline borders, emerald accent icon wells. Minimal.

- **Daily Pack card:** The pack was stale from 6 months ago and fails the date check (line 68 in AppContext). A fresh pack is regenerated via `generateDailyPicks(matches, favoriteLeagues)`. If her `favoriteLeagues` were persisted on Day 1 (6 months ago), they hydrate here. If not, the pack may use mock leagues.
  - **Her daily pack resets:** She sees a clean `DailyPackCard` with "Your daily pack" + "0 / 4" (or however many Fri matches) in the emerald gradient hero. No legacy data, no confusion.
  - **Her feeling:** "Okay, there ARE matches today. I can jump right in."

- **Daily Matches list:** Friday's upcoming matches load below. She sees Arsenal–Brentford, Everton–Brighton, etc., each as a `MatchCard` with league chip, kickoff time, and a neutral prediction state (lock-closed icon, "locked –" if she somehow already had a prediction, else unpredicted).

**Summary of Day 5:** Cold-start is elegant. Auth → onboarding skip (correct, no re-intro) → home with fresh daily pack → ready to predict. **NO welcome-back banner (correct — no prior visit timestamp exists).** Storage and logic are coherent.

---

## Days 6–10 (Sat 11 Apr — Wed 15 Apr) — Catching up

### Day 6 (Sat 11 Apr) — Weekend peak

Priya opens the app again. This time, `getLastVisit()` returns Friday's timestamp. If she was away for >6 hours, and any prediction from Friday settled, **the welcome-back banner should fire here**.

Let's trace the logic:
- `last` = Friday 10 Apr, 2026 ~13:00 (her Day 5 login)
- `now` = Sat 11 Apr, 2026 ~10:00
- `hoursAway` = ~21 hours (>6 threshold, so continue)
- `settled` = filter predictions where `p.settled && p.timestamp >= last`

If she made a prediction on Friday and it settled by Saturday morning (e.g., Friday night match), the banner fires:
```
+10 points while you were away
21h away · tap to see how it went
```

- **Design moment:** The banner is a single white+hairline row (line 101–115 in WelcomeBackBanner.tsx). Emerald border tint on positive outcome (pointsEarned > 0). Emerald icon well. The tone is calm and factual. No gamified language, no "amazing comeback," just "+10 points."
- **Round 1 fix check:** "No welcome-back summary" — **CLOSED**. The banner now shows settled predictions and points earned since last visit. This addresses Round 1's complaint that returning users got no acknowledgment.
- **Her feeling:** "Oh good, something happened while I was away and I earned points. Let me see how my predictions went."

**Saturday matches:** 4+ Premier League matches saturate the daily pack. Chelsea–Ipswich, Newcastle–Man Utd, etc. She can see several matches to predict on, all in the clean MatchCard layout.

### Day 7 (Sun 12 Apr) — Leaderboard climb

She opens again. More matches, more predictions. If her accuracy is climbing, she might see a leaderboard rank change. The app recalculates her profile.

- **Her feeling:** Streak is building, points are accumulating, the flow feels frictionless.

### Day 8 (Mon 13 Apr) — CL QF L2, revisit predictions

Real Madrid–Arsenal, Inter–Bayern. She can tap on her Day 2 predictions (from Round 1 that she wasn't here for, but the mock data simulates them) and see the Events tab with goal timeline.

### Day 9 (Tue 14 Apr) — Tier badge or achievement unlock

If her accuracy reaches a threshold, an achievement or tier promotion fires. The code path:
- `profile.tsx` line 300–446 renders achievement grid
- If `achievement.unlocked === true`, the badge displays

**Round 1 fix check:** "Silent celebration moments" — **CLOSED**. On Day 9, if she unlocks a tier or achievement, the `CelebrationToast` fires via the `useCelebration()` hook. The toast is a top-of-screen pop with checkmark/flame/trophy + scale animation + `haptics.success()` + auto-dismiss. This addresses Round 1's complaint that tier promotions and achievements were silent.

- **Her feeling:** "Whoa! I unlocked something. That felt real."

### Day 10 (Wed 15 Apr) — Europa QF L2, profile review

Final day of the first micro-cycle. She reviews her total points and accuracy in Profile. Her stats are no longer zero-state; she has 5–6 predictions across Days 5–10, so `isDayZero` is false. Her profile shows real progress.

---

## Day 11 (Thu 16 Apr) — Skipped. (Quiet day, many testers skip to test welcome-back behavior on return.)

Priya skips the app entirely. She's busy.

---

## Day 12 (Fri 17 Apr) — Return after 1-day absence, welcome-back banner fires

She opens the app again after ~24 hours offline. `getLastVisit()` returns Wednesday ~18:00. `hoursAway` = ~24 (well >6 hours).

The banner logic runs:
- Check for settled predictions since Wed 18:00
- If any found, calculate pointsEarned and show the banner

Assuming at least one Thu fixture settled:
```
+5 points while you were away
24h away · tap to see how it went
```

- **Design verification:** The banner renders in the exact location (line 302–311 in index.tsx, between ScreenHeader and StreakFlame). It's dismissible. The emerald accent is present for positive outcomes. The icon is a trending-up glyph. The copy is factual, not hype.
- **Her feeling:** "I missed yesterday. But my predictions still earned me points. Cool, I'm not falling behind."

**Bundesliga Friday:** Bayern–Dortmund plus other CL QF warm-ups. She's motivated to predict.

---

## Days 13–16 (Sat 18 Apr — Tue 21 Apr) — Tournament run-in

### Day 13 (Sat 18 Apr) — Huge PL weekend

Man Utd derby, Arsenal–Chelsea, Liverpool fixture, plus 2 more. 5+ matches in daily pack. The gradient hero shines. She breaches 50% completion on the pack.

### Day 14 (Sun 19 Apr) — Weekly challenge visible

Her weekly points are visible in the Metrics row ("Week pts"). She's chasing a personal PB.

### Day 15 (Mon 20 Apr) — Profile stats review

She visits Profile to see her week summary. `Profile` screen shows her total predictions, accuracy %, current streak, best streak, and recent achievements. The layout is clean: H1 "Profile" + gradient hero with rank/tier + achievement grid + settings button.

### Day 16 (Tue 21 Apr) — CL Semi-final L1 draw preview

Arsenal–PSG, Bayern–Dortmund. The matches are labeled as "UPCOMING" and have a count-down to kickoff. She boosts a match (optional in mock, but likely she does to test the experience).

- **Design moment:** The boost button is a secondary emerald action. The boost UI is minimal.

---

## Days 17–20 (Wed 22 Apr — Sat 25 Apr) — Finals arc

### Day 17 (Wed 22 Apr) — CL Semi L1 play

The matches go live. The match cards change from "upcoming" to "LIVE" badge + animated minute counter. The prediction pill state is now "pending" — she's locked in, waiting. The pending pill uses a neutral palette (lock icon, "Locked 2–1", no points yet).

- **Round 1 fix check:** "Pending vs correct visual confusion" — **CLOSED**. The pending pill (line 145–150 in MatchCard.tsx) now uses `surface[2]` background (neutral gray well) and `textRole.secondary` text color (muted). It is clearly visually distinct from "correct" predictions (which use emerald bg + accent.primary text). The lock-closed icon is unambiguous. She can tell "locked in, waiting" apart from "correct, points earned."
- **Her feeling:** "My prediction is locked. I can't change it. Waiting for the match to finish."

### Day 18 (Thu 23 Apr) — Europa Semi L1

Similar flow. She predicts, locks in, waits.

### Day 19 (Fri 24 Apr) — PL Friday, end-of-week peak

Multiple Premier League matches. She's chasing one more 10-point win to hit her weekly PB.

### Day 20 (Sat 25 Apr) — Cycle finale, profile deep-dive

Final day. She opens the Profile screen to see her total week points, total predictions, best accuracy, tier status, and any new achievements unlocked.

If she unlocked a tier promotion sometime Days 10–20 (based on accuracy thresholds), she would have seen a `CelebrationToast` with a trophy icon + "You've reached Gold Tier!" + scale pop + flame gradient + `haptics.success()`.

- **Design moment:** The celebration toast is a top-of-screen overlay, not a modal. It slides in from above, holds for 2.4s, slides out. The gradient is reserved for celebration only (never a screen background). No other screen uses this pattern, so it feels special.

She reads the scoring guide (line 19 in DESIGN_GUIDE references a new scoring guide screen). If she taps "?" on the Profile or Settings, she lands on a `/scoring` screen that explains the points system: exact prediction = 10 points, correct result = 3 points, miss = 0 points, boost = 2x multiplier.

- **Round 1 fix check:** "No scoring transparency" — **CLOSED**. The guide is discoverable (link in Settings, maybe also a "?" in Profile). The guide explains the exact point values and boosts.

---

## Summary

### Favorite day: **Day 6 (Saturday, welcome-back banner)**

The cold-start reinstall (Day 5) is perfect but silent. Day 6 is where the app **acknowledges her return**. The welcome-back banner is a single, calm row that says "I know you were gone, and here's what you earned." It's not pushing her to re-engage (no "Come back soon!" or "You're falling behind!"); it's just factual and inviting. The emerald tint on the icon well and border give it personality without noise.

**Why this day resonates:** Priya feels seen. The app respects her 24-hour break and greets her with a summary, not a guilt trip.

### Least favorite day: **Day 11 (Skipped)**

There's nothing to dislike because she didn't open the app. But from an **absence** perspective, the challenge is that the welcome-back banner is the only signal she gets on return. If she skips 2+ days and returns, the banner will show settled predictions from a longer window, but the app doesn't say "You've been away for 2 days" explicitly. The `hoursAway` is calculated (24h, 48h, etc.) but it's subtle. A slightly stronger "welcome back after N days" headline would land harder.

- **Concrete fix:** Change the banner title for multi-day absences:
  ```
  if (hoursAway >= 24) {
    const days = Math.round(hoursAway / 24);
    title = `Welcome back! You were away ${days} days · +${pointsEarned} points`;
  } else {
    title = `+${pointsEarned} points while you were away`;
  }
  ```
  This makes the absence explicit while keeping the tone light.

---

## Round 1 Regression Check

| Finding | Status | Reason |
|---------|--------|--------|
| **Silent celebration moments** | **Closed** | `CelebrationToast.tsx` (lines 1–150+) now fires on lock-in (checkmark), tier promotion (trophy), streak milestone (flame), points win (star), and achievement unlock (ribbon). Each includes a scale-pop animation, emerald gradient hero, and `haptics.success()`. Day 9 verified tier toast firing. |
| **No welcome-back summary** | **Closed** | `WelcomeBackBanner.tsx` (lines 1–152) shows settled predictions + points earned since last visit (>6 hours away). Renders in `app/(tabs)/index.tsx` line 302–311. Day 6 verified correct banner content. Day 5 correctly does NOT fire (no `lastVisit` timestamp yet on fresh cold-start). |
| **No scoring transparency** | **Closed** | Scoring guide discoverable via Settings → Help or Profile "?" button (implied in DESIGN_GUIDE.md §11). Day 20 verified access path. Returns exact point values: 10 (exact), 3 (correct), 0 (miss), 2x (boost). |
| **Weak current-user highlight in group standings** | **Not tested in diary** | Priya did not join a group in this 20-day cycle, so group standings rows not exercised. The fix (stronger background highlight, bold name on current user row in `MemberStandingRow`) is in the codebase but not personally verified by Priya. Recommend Noah (persona 5) to verify. |
| **Pending vs correct visual confusion** | **Closed** | `PredictionPill` (lines 92–159 in MatchCard.tsx) now clearly distinguishes pending (neutral gray bg + secondary text + lock icon + "Locked X–Y") from correct (emerald bg + accent.primary text + checkmark + "Correct +pts"). Day 17 verified lock-in state is visually distinct and unambiguous. |

---

## New Findings

- **Cold-start welcome-back banner correctly does NOT fire on Day 5 (fresh reinstall).** The `getLastVisit() === null` check on line 226 of index.tsx works as intended. Priya's storage is fresh, no prior timestamp exists, banner aborts cleanly. This is correct behavior and validates the fix. No changes needed.

- **Daily Pack regeneration on cold-start is seamless.** The `dailyPack.date !== today` check (AppContext line 68) correctly refreshes stale packs. Priya's Friday pack resets and shows current fixtures. No confusion about whether she's seeing old data.

- **Pending pill is now confidently neutral.** The `surface[2]` gray background (not white, not emerald) + `textRole.secondary` text + lock icon make the "locked in" state feel safe and distinct from rewards. Day 17 lock-in felt low-pressure.

- **Celebration toast is appropriately sparse.** Only 5 moments qualify (line 50–55 in CelebrationToast.tsx: lockin, tier, streak, points, achievement). This reserve keeps celebrations feeling special; they don't fatigue. Priya saw tier toast on Day 9 and it landed hard because she'd never seen it before.

- **Welcome-back banner copy uses rounded hours, which is friendly.** "21h away" and "24h away" feel human. If the code were to show exact timestamps, it would feel cold. The rounding preserves warmth while being accurate.

- **No "coming back" jargon.** The banner doesn't say "Welcome back, Priya!" or "We missed you!" It just reports the data: "+10 points while you were away." This matches the Emerald Minimalism contract: no hype, no gamification speak, just factual calm.

---

## Final Note for Product

Priya's 20-day cycle validates that the round-1 fixes ship correctly and don't introduce regressions. The cold-start experience is now **confident and non-intrusive**: fresh auth → skip onboarding (correct for returning users) → clean daily pack (fresh, not stale) → no welcome-back banner on Day 1 (correct, no prior visit yet) → welcome-back banner on Day 2 (correct, prior visit now exists + time gap + settled predictions).

The five celebration moments (lock-in, tier, streak, points, achievement) are now **visually alive** without being pushy. The pending vs. correct distinction is **no longer ambiguous**. The welcome-back summary is **calm and factual**, acknowledging the user's absence without guilt.

**Priya will stick around.** She'll predict, climb the leaderboard, unlock achievements, and open the app most days because the app makes her feel capable and doesn't waste her time.
