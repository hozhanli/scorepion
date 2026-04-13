# Ingrid — Accessibility Tester #2 (Motor) — 20-Day Diary

**Profile:** 47, iOS Switch Control, limited fine motor control. Auditing hit targets (≥44x44pt), gesture-only interactions (swipes, long-press without tap alternatives), celebration dismissal mechanics, CelebrationToast display duration, and Switch Control focus across UI components.

---

## Day 1 – Mon, Apr 6 | Fresh install, onboarding

Navigated the auth → onboarding flow. Observations:

- **What I did:** Tapped through auth screen (large CTA hits easily), completed onboarding narrative screens (all tappable, no gesture-only alternatives). Landed on Home and made first prediction on a Premier League match.
- **What I liked:** Button text on onboarding is large and clearly labelled. Prediction CTA on MatchCard ("Predict" pill) is a comfortable tap target.
- **What I didn't like:** Onboarding carousel uses swipe-to-advance as the primary mechanic. I had to switch to manual next-button tap, which exists (good fallback), but the auto-suggestion favors swiping.
- **Bugs/dead ends:** None critical on Day 1. Switch Control can focus and activate the prediction pill without friction.

---

## Day 2 – Tue, Apr 7 | CL QF L1: Arsenal–Real Madrid, Bayern–Inter. Boost match. Streak = 1.

Opened to Home, saw my fresh prediction from Day 1 had settled (I was correct). CelebrationToast fired.

- **What I did:** Locked in predictions on Arsenal–RM and Bayern–Inter. Used the "Boost" feature (if present) on Arsenal match.
- **What I liked:** When my Day 1 prediction settled as "Correct +10", the CelebrationToast appeared at the top and auto-dismissed after ~2.4s with a soft fade. Haptic pulse was clear.
- **What I didn't like:** **The CelebrationToast duration feels tight with Switch Control.** I had to navigate away from the match card list to acknowledge the toast, but by the time I refocused on it, it was auto-dismissing. I didn't need to manually dismiss it, but the 2400ms window didn't give me time to *read* the full message aloud via VoiceOver before it vanished. This is borderline.
- **Bugs/dead ends:** Toast has `pointerEvents="none"`, which is correct — it doesn't block interaction. No trap.

---

## Day 3 – Wed, Apr 8 | CL QF L1: PSG–Aston Villa, Barcelona–Dortmund. Join a group. Streak = 2.

Joined a public group. Went to `/group/[id]` to see standings for the first time.

- **What I did:** Predicted on PSG–Villa and Barca–Dortmund. Tapped "Join group" from a group discovery card. Landed on group standings.
- **What I liked:** The group standings rows (MemberStandingRow component) each render a full tappable row with rank, avatar, username, and points. The "YOU" pill is a small visual indicator but is *not* itself a tappable element — it's just a marker inside the row. Switch Control can focus and navigate the entire row.
- **What I didn't like:** The "YOU" pill is non-interactive. If a user wants to know whether they're looking at their own row, they have to rely on the row highlight (emerald border and rail) and the visual "YOU" badge. For Switch Control users with low vision, the small emerald rail on the left might not be accessible enough. The pill is only 6x9px padding around "YOU" text — this is well below 44pt.
- **Bugs/dead ends:** None. The row itself is tappable and focusable; the "YOU" pill doesn't break that. But the pill is *never* interactive, which is fine — it's a label.

---

## Day 4 – Thu, Apr 9 | Europa QF L1. Streak breaks (missed exact).

Made a prediction on an Europa match and missed the exact score (marked as "Correct" instead).

- **What I did:** Predicted on Europa QF fixture. Waited for it to settle (showed "Correct +6" outcome).
- **What I liked:** PredictionPill shows outcome state clearly: "Correct" with emerald tint for wins, "No points" with neutral tint for misses. Locked predictions show a lock icon and neutral tint so users know "this is waiting, not scored yet."
- **What I didn't like:** Streak reset. Not a UI problem, but emotionally jarring as a player. The UI itself handled it fine.
- **Bugs/dead ends:** None.

---

## Day 5 – Fri, Apr 10 | Premier League Friday night. Tier promotion trigger.

Made multiple predictions. One earned me a Tier badge promotion (e.g., Tier 2 → Tier 3).

- **What I did:** Predicted on PL Friday night fixtures. Earned tier upgrade.
- **What I liked:** When the tier promotion fired, a CelebrationToast appeared with "Tier 3 reached!" (or similar) and a trophy icon. Same 2400ms auto-dismiss window. The toast was polite and not intrusive.
- **What I didn't like:** I'm still concerned about the 2400ms duration. For Switch Control users, 2.4 seconds is very tight if I need to pause, refocus, and read the message. I couldn't manually dismiss the toast (no close button on the toast itself), so I had to wait for the auto-dismiss. If a celebration lands while I'm navigating, I might miss it entirely because I can't tap to re-trigger it.
- **Bugs/dead ends:** None, but the lack of a manual dismiss button on CelebrationToast means users with motor control issues can't recover if they look away.

---

## Day 6 – Sat, Apr 11 | PL weekend peak: 4+ matches in daily pack. Derby atmosphere.

Heavy day of matches. Predicted on 5 matches, all PL.

- **What I did:** Locked in predictions on multiple PL derbies and high-stakes fixtures.
- **What I liked:** MatchCard layout is clean and scannable. The prediction pill (pending state) shows "Locked 1–1" with a lock icon, making it clear the choice is committed but awaiting match result.
- **What I didn't like:** The MatchCard itself is tappable, but the individual elements inside (team names, score area) are not separately focusable. This is fine for gesture-based users, but Switch Control users who want to jump directly to one team name can't — they have to focus the whole card and tap it. Not a blocker, but a granularity loss.
- **Bugs/dead ends:** None.

---

## Day 7 – Sun, Apr 12 | PL + LaLiga Sunday. Leaderboard climb.

Multiple predictions settled. Climbed in group leaderboard (still second place, behind one user).

- **What I did:** Reviewed settled predictions from the day. Checked group leaderboard again.
- **What I liked:** The MemberStandingRow highlighting is solid. My row now shows a 2pt margin behind the leader. I can see the gap text and the progress bar, both accessible.
- **What I didn't like:** No change in accessibility stance, but I notice the leaderboard does not have a dedicated "current user" jump button (e.g., a button to scroll to my row). On a large leaderboard (10+ members), I'd have to scroll and hunt for my row. Feasible but slow.
- **Bugs/dead ends:** None.

---

## Day 8 – Mon, Apr 13 | CL QF L2: Real Madrid–Arsenal, Inter–Bayern. Revisit past predictions.

Replayed the CL QF legs. Went to Profile to see my prediction history.

- **What I did:** Tapped on Profile tab. Reviewed past CL QF predictions from Day 2 to see settlement.
- **What I liked:** Profile screen lists all predictions with settlement status clearly labelled. Each row is a tappable link to the match detail.
- **What I didn't like:** The Profile screen is long; scrolling to find a specific match requires hunting. No search or filter on this screen (expected for Emerald Minimalism, but a motor accessibility gap).
- **Bugs/dead ends:** None.

---

## Day 9 – Tue, Apr 14 | CL QF L2: Aston Villa–PSG, Dortmund–Barcelona. Tier badge reveal. Share to group.

Second CL QF leg settled. I earned a new tier badge during this day's predictions.

- **What I did:** Made CL predictions. Saw another CelebrationToast for tier progression. Shared my leaderboard standing with my group.
- **What I liked:** The tier icon and badge are rendered clearly on the tier card. Share button (group menu → Share) launches native share sheet, which is accessible.
- **What I didn't like:** The share action requires entering the group menu (a three-dot button) and selecting "Share." For someone with limited fine motor control, this multi-step flow is slower than a dedicated share CTA. Not broken, but suboptimal.
- **Bugs/dead ends:** None.

---

## Day 10 – Wed, Apr 15 | Europa QF L2 + Conference quarters. Mid-cycle review.

Made predictions on secondary European competitions. Reviewed week-to-date stats.

- **What I did:** Predicted on Europa and Conference QF legs. Checked "Week pts" metric card on Home.
- **What I liked:** Metric cards (Best, Week pts, Reset) are large 44x44pt+ tap targets displayed in a 3-column grid with clear labels.
- **What I didn't like:** None specific to this day.
- **Bugs/dead ends:** None.

---

## Day 11 – Thu, Apr 16 | Quiet day. Skip the app.

Intentionally did not open the app to test welcome-back behavior.

- **What I did:** Skipped.

---

## Day 12 – Fri, Apr 17 | Return after 1-day absence. Welcome-back banner. Bundesliga Friday.

Opened the app after a 24-hour gap (from Day 11). Expected to see the WelcomeBackBanner.

- **What I did:** Opened app to Home. Scrolled to top.
- **What I liked:** The WelcomeBackBanner appeared at the top of Home, showing "+X points while you were away" (or a settled prediction count). The banner is a tappable row with a clear dismiss button (X icon) on the right. The close button is **28x28pt**, which is below the 44pt WCAG AAA minimum but still easily tappable with Switch Control.
- **What I didn't like:** The close button (close glyph) is 28x28pt with a 10px hitSlop, bringing the effective target to ~48x48pt. This is *just* adequate, but the actual rendered button is smaller than recommended. For someone with tremor or limited accuracy, the 28pt visual target is tight.
- **Bugs/dead ends:** None. The banner is dismissible and doesn't block navigation.

---

## Day 13 – Sat, Apr 18 | Huge PL weekend: Man Utd derby, Arsenal–Chelsea, Liverpool fixture. 5+ matches.

Heavy match day. Multiple predictions locked in and settled quickly (live matches).

- **What I did:** Predicted on 5+ PL fixtures including derbies. Some settled within hours, firing CelebrationToasts.
- **What I liked:** CelebrationToasts are properly sequenced — if two settle within 2.4s, they queue and show one at a time. The provider queues correctly.
- **What I didn't like:** Rapid-fire celebrations (e.g., two matches settling in quick succession on a live-watch session) means the toasts appear and dismiss quickly. By the time I navigate and re-focus, the second toast is already gone. **This is a real issue for Switch Control users.** If I'm in a match detail screen watching live updates and two predictions settle seconds apart, I can't read both toasts in sequence without manual control to pause the auto-dismiss.
- **Bugs/dead ends:** None, but the fixed 2400ms duration is problematic for real-time scenarios.

---

## Day 14 – Sun, Apr 19 | PL + Serie A Sunday. Weekly challenge progress visible.

Predictions on both PL and Serie A. Saw weekly challenge progress (group challenges).

- **What I did:** Predicted on PL + Serie A fixtures. Checked group challenges card (shows progress toward "Beat the leader" and "7-day streak" challenges).
- **What I liked:** Challenge cards have a title and a progress bar. The xp badge ("+100 xp") is small but not interactive, so it doesn't need a large hit target.
- **What I didn't like:** None specific.
- **Bugs/dead ends:** None.

---

## Day 15 – Mon, Apr 20 | Settle weekend. View Profile stats.

Weekend matches settled. Reviewed weekly performance on Profile.

- **What I did:** Navigated to Profile tab. Reviewed week-to-date points, accuracy %, best streak, and recent prediction outcomes.
- **What I liked:** Profile layout is clear. Stat rows are tappable (navigate to detail) and large enough. The weekly stats card is prominent.
- **What I didn't like:** None.
- **Bugs/dead ends:** None.

---

## Day 16 – Tue, Apr 21 | CL Semi-final L1 draw/preview: Arsenal–PSG, Bayern–Dortmund. Boost.

CL Semi-finals kick off. Made predictions and boosted one match.

- **What I did:** Predicted on both CF semi-final legs. Used boost feature (if accessible).
- **What I liked:** The boost CTA (if it's a button on the match detail) is tappable and not gesture-only.
- **What I didn't like:** If boost requires a swipe or long-press gesture without a tap alternative, that would be a barrier. (From code audit: I don't see a gesture-only boost, so this is safe.)
- **Bugs/dead ends:** None.

---

## Day 17 – Wed, Apr 22 | CL Semi L1: same fixtures play. Live pulse UI.

CL Semi L1 matches played live. Real-time score updates and live badges visible.

- **What I did:** Opened Home and Matches tabs during live matches. Watched score updates in real-time.
- **What I liked:** LIVE badges on MatchCard show a red dot + "LIVE 45'" indicating minute. These are not tappable, just informational. Good.
- **What I didn't like:** The minute number updates every 1–2 minutes. On a Switch Control interface, this means the card layout shifts slightly, which could cause focus to drift. Not a blocker, but jarring.
- **Bugs/dead ends:** None.

---

## Day 18 – Thu, Apr 23 | Europa Semi L1. Review settled CL predictions. Tier reveal #2.

CL Semi L1 settled. Another tier promotion notification (via CelebrationToast).

- **What I did:** Reviewed settled CL semi predictions (all were exact or correct). Made Europa semi predictions. Saw tier toast.
- **What I liked:** Tier badge progression is visually clear.
- **What I didn't like:** The 2400ms toast window is still the pain point. I can't manually dismiss it, and if I'm scrolling through settled predictions while the toast appears, I miss it.
- **Bugs/dead ends:** None.

---

## Day 19 – Fri, Apr 24 | PL Friday. End-of-week peak. Group leaderboard close finish.

Group leaderboard is tight (2–3 pts between top members). Made final PL Friday predictions.

- **What I did:** Predicted on PL Friday fixtures. Checked group standings to see current rank.
- **What I liked:** Group standings update in real-time (mocked). I can scroll and find my row easily enough.
- **What I didn't like:** Still no jump-to-self button. For a large leaderboard, this is an accessibility gap.
- **Bugs/dead ends:** None.

---

## Day 20 – Sat, Apr 25 | Cycle finale. Total-points review. Profile deep-dive. Read scoring guide.

Final day of the mock scenario. Reviewed complete profile and read the scoring guide.

- **What I did:** Opened Profile tab and reviewed full weekly/monthly stats. Navigated to Settings and opened "Scoring Guide" (from the brief: checks whether guide is discoverable and correct).
- **What I liked:** Scoring Guide is a separate screen `/scoring`. It lists all scoring rules (exact, result, miss, boost, tier, streak, etc.) in clear readable text. The guide is tappable links to detail sections.
- **What I didn't like:** The back button on the scoring guide screen is labeled (e.g., "< Back") but is a small touch target (~40x40pt estimated from the code). For someone with tremor, a 44pt minimum would be safer.
- **Bugs/dead ends:** None. The guide is discoverable and readable.

---

## Favorite and Least Favorite

**Favorite Day:** Day 12 (return with welcome-back banner). The banner was a thoughtful moment — it acknowledged my absence and summarized what I missed without being pushy. The dismiss button was accessible (close X) and the banner didn't block content.

**Least Favorite Day:** Day 13 (heavy PL weekend with rapid-fire celebrations). The rapid succession of CelebrationToasts exposed a real limitation: the 2400ms fixed duration is too short for Switch Control users to read, navigate, and acknowledge multiple alerts in quick succession. I felt rushed and unable to fully engage with each celebration.

**One Concrete Fix to Ship:** **Make CelebrationToast dismissible by tapping it, or add a manual dismiss button (X glyph) in the top-right corner of the toast.** Alternatively, extend the default `durationMs` to 3500ms for users with accessibility needs. Current code passes `durationMs` as an optional prop — expose this in the celebration call so high-engagement moments (like tier promotions) can be longer-lived.

---

## Round 1 Regression Check

**1. Silent celebration moments** — **Partially closed.** CelebrationToast is now visible with haptic feedback, so celebrations are no longer silent. However, the fixed 2400ms auto-dismiss means users with motor control needs can't always *engage* with the celebration (no manual dismiss option). The audio/visual feedback exists, but the interaction model is still rigid.

**2. No welcome-back summary** — **Closed.** WelcomeBackBanner correctly fires after >6 hours away, shows settled count + points earned, and is dismissible. Tested on Day 12; works as spec.

**3. No scoring transparency** — **Closed.** Scoring Guide screen is discoverable via Settings and clearly lists all point systems. Tested on Day 20; content is accurate and accessible.

**4. Weak current-user highlight in group standings** — **Partially closed.** MemberStandingRow now renders an emerald left rail + border highlight + "YOU" badge + username color change for the current user. The highlight is *visually* present, but for Switch Control users, the small emerald rail (4px wide, ~50px tall) may not be obvious enough. The "YOU" pill is more helpful as a text label, but it's only ~20x15px and not interactive.

**5. Pending vs correct visual confusion** — **Closed.** PredictionPill now clearly distinguishes: pending shows lock icon + neutral surface + "Locked X–Y" label. Correct shows checkmark + emerald tint + points label. Tested across Days 2–20; the visual distinction is clear and consistent.

---

## New Findings

- **CelebrationToast auto-dismiss is too aggressive for real-time scenarios.** In high-engagement sessions (live matches, rapid prediction settlements), users with motor control limitations cannot pause or manually dismiss the toast. The queue works correctly, but the 2400ms window is inflexible. Recommend either (a) add a close button to the toast itself, (b) extend duration to 3.5–4s, or (c) allow users to disable auto-dismiss in accessibility settings.

- **Close button on WelcomeBackBanner is 28x28pt.** While the 10px hitSlop brings it to ~48pt effective, the visual target is below WCAG AAA (44pt). Recommend sizing the button to 44x44pt or increasing padding around the glyph.

- **No visual or structural way to jump-to-self on large leaderboards.** For Group Standings with 10+ members, a Switch Control user must scroll the full list to find their row. A "Jump to me" button or a visual scroll position indicator would help. Not critical, but an efficiency gap.

- **Onboarding carousel defaults to swipe-to-advance.** While a next-button tap alternative exists, the UX nudges users toward swiping. For motor accessibility, lead with the tap button or provide clear labelling that tapping is an option.

- **PredictionPill and other inline elements in MatchCard are not separately focusable.** The card is a single tappable unit. For users who want granular navigation (e.g., focus just the team name), this is a loss. Not a blocker, but a semantic granularity miss.

- **Rapid-fire settlements during live-watch sessions create a stressful toast experience.** If two matches settle within 2 seconds, both toasts will flash quickly in succession. By the time a Switch Control user refocuses, the second toast is gone. The queue works, but the compounded auto-dismiss timing makes it feel chaotic. Recommend a slower dismiss cadence or manual control.
