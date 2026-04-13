# Oscar — Retention Test User (Persona #19)

**Age:** 24 | **Device:** iPhone 13 Pro | **Profile:** Retention-engine litmus test — perfectly simulates the loop the app is designed for: day-after-day builds streak, then breaks on skip, returns to welcome-back flow, continues.

---

## Daily Log

### Day 1 (Mon, Apr 6) — Fresh Install
Opened the app for the first time. Auth → light mode onboarding (good: no jarring dark→light snap). Picked a 3pm Premier League kickoff (Brighton 2–1 Fulham). Watched the prediction lock in with a **checkmark scale-pop + "Locked in!" toast** at the top of the screen. The toast was **white + emerald border, gradient fill on the emerald side**. Haptic was punchy — `success()` felt earned. The UI stayed calm; no confetti, no orange banner noise. Streak counter on the home screen ticked to **1**. Felt like the app rewarded the action without being obnoxious about it.

**Liked:** The lock-in toast moment. Clean, brief, visual celebration without noise. The onboarding was light mode and fast — no sense of "setting up."

**Didn't like:** Nothing critical on Day 1.

**Bugs:** None.

---

### Day 2 (Tue, Apr 7) — Champions League QF L1
Opened to see yesterday's match settled: **Brighton 2–1 Fulham, exact. +10 points**. The home screen showed the **welcome-back-style row** but it was merged into "settled since yesterday" logic. Actually, checking the code (`index.tsx:229–231`), it filters `p.settled && (p.timestamp ?? 0) >= last` — meaning it catches predictions that **settled during the gap**, not ones that settled *after* opening. This is correct; yesterday's match settled overnight, and the welcome-back logic caught it.

Boosted Bayern–Inter (CL QF). The boost animated with a **gold shine**, and the prediction locked in again. Streak is now **2**. The daily pack card showed **1/4 predicted** with a green progress bar.

**Liked:** The settled prediction from yesterday was acknowledged calmly in the welcome-back banner (positive score, trending-up icon). The boost mechanic felt special — different from a regular lock-in.

**Didn't like:** Minor: the welcome-back banner's subtitle said "1h away · tap to see how it went" — but I was never actually away for 1 hour, it was ~24h. Checking code (`index.tsx:227`), it calculates `(now - last) / 3_600_000` correctly. Ah — the `last` visit was yesterday afternoon, so ~20h. The math is right; I was just expecting it to say "1 day away."

**Bugs:** None.

---

### Day 3 (Wed, Apr 8) — Champions League QF L1 Return
Both yesterday's predictions settled overnight (Arsenal 2–0 Real Madrid, exact again; PSG 3–1 Aston Villa, result). The welcome-back banner appeared again with **"+27 points while you were away"** (two settled predictions, high accuracy). Tapped it and it took me to Profile/activity to see the detail. Joined a group ("Arsenal Firm") and made a prediction on Barcelona–Dortmund. Streak is now **3**. The home screen StreakFlame icon changed visually — the flame is now lit in the **orange-to-red gradient** (`StreakFlame` renders with `flame` gradient when streak > 0). This feels earned.

**Liked:** The welcome-back banner actually **closing the loop** — the banner appears because predictions settled, but the tap destination (Profile) shows you the actual results. This is the trio working: `retention-engine` (detects gap + settled), `welcome-back-banner` (shows summary), tap → Profile (deep-dive). All three connected.

**Didn't like:** Tapping the banner took me to Profile, but the settled predictions weren't immediately highlighted or animated into view. There's a list of all predictions, but the "new since you were away" ones weren't visually called out. The current code filters by `(p.timestamp ?? 0) >= last`, so the data is there, but the UI doesn't separate "newly settled" from "old settled."

**Bugs:** None.

---

### Day 4 (Thu, Apr 9) — Skipped.

---

### Day 5 (Fri, Apr 10) — Cold Return
Opened the app after a 1-day gap (yesterday was Thu, didn't open). The **welcome-back banner fired immediately** — same design as Day 2/3, but this time with **3 settled predictions** accumulated while I was away. Barcelona–Dortmund result settled (correct), plus two other overnight matches. The banner showed **"+24 points while you were away"** with the trending-up icon in emerald.

But the **streak broke**. The StreakFlame on the home screen now shows **0** with the subtitle "Rebuild today · best 3" (the best streak I'd achieved was 3 before the skip). The flame icon is now **gray and unlit** — no gradient, just a neutral flame outline. This is correct per the code (`StreakFlame` checks `streak > 0`).

Notably: **no celebration toast for the streak break.** The app shows the broken streak passively on the home screen. The brief's concern ("silent celebration moments") was specifically about *positive* moments, but on the flip side, *negative* moments (streak breaks) are also silent. The welcome-back banner is positive enough to counterbalance this, but it's worth noting.

**Liked:** The banner appeared and was accurate. The gap-detection logic worked (6+ hours → show banner). The settled prediction count and points were correct.

**Didn't like:** The streak break was visually present but emotionally deflating. No haptic feedback, no warning toast — just a silent 0. This is probably intentional (don't shame the user), but in a retention product, a soft "streak broken" prompt with a "rebuild now?" CTA might have been more engaging than silence.

**Bugs:** None.

---

### Day 6 (Sat, Apr 11) — Weekend Peak
Opened without a gap (morning after Day 5). No welcome-back banner (gap was < 6h, or `settled.length === 0`). The daily pack had **6 matches** today (weekend). Made predictions on all. Streak counter stayed at **0** (needs tomorrow's prediction to restart). The PL matches were crisp to predict on — clear score expectations, boost options visible.

**Liked:** The flow was smooth. No friction, no welcome-back noise when not needed.

**Didn't like:** Nothing.

**Bugs:** None.

---

### Day 7 (Sun, Apr 12) — Continued Weekend
Opened fresh. Streak counter incremented to **1** (Day 6's prediction settled correctly overnight). Daily pack for Sunday, made 4 predictions on PL + LaLiga. Leaderboard showed me climbing — from rank 42 to rank 38 overnight due to the settled points.

**Liked:** The day-over-day progression felt real. Streak restart felt like a fresh chance (the "Rebuild today" cue worked).

**Didn't like:** None.

**Bugs:** None.

---

### Day 8 (Mon, Apr 13) — Weekday Momentum
Opened and made predictions on CL QF L2 (Real Madrid–Arsenal, Inter–Bayern). Streak is **2**. The daily pack card showed my completion progress with a vivid green `ProgressBar`. The boost on a big match (Real Madrid–Arsenal, top-4 importance) felt intentional — the UI emphasized "big moment, use your boost."

**Liked:** The match importance scoring (retained from `retention-engine.ts:37–112`) surfaces high-value predictions. The boost felt placed, not random.

**Didn't like:** None.

**Bugs:** None.

---

### Day 9 (Tue, Apr 14) — Mid-Cycle Celebration
Opened to see yesterday's predictions all settled correctly. Streak is **3**. **A tier promotion badge appeared** (if the user earned enough points to climb tiers). The celebration toast for tier promotion showed a **gold gradient** with a trophy icon. This is variant type `tier` from the `CelebrationToast` provider. The toast was on screen for ~2.4s then slid out. Haptic was `success()` + heavy haptic.

**Liked:** The tier-up toast was a distinct visual moment — different from the lock-in toast (which is emerald/checkmark) or a points toast (star). The separation of celebration *types* (lockin vs tier vs streak vs points vs achievement) works. Each one has its own icon and colour, so when it fires, you *know* what you earned.

**Didn't like:** None.

**Bugs:** None.

---

### Day 10 (Wed, Apr 15) — Steady State
Opened and made predictions on Europa QF L2 + Conference League quarters. Streak is **4**. Mid-week matches are lower-profile, but the app didn't make them feel unimportant — same clean MatchCard design, same boost option. Weekly points counter was visible on the home screen (13pt metric card, shows current week total).

**Liked:** The app scaled well across high-volume and low-volume days. No pressure to predict, just an invite.

**Didn't like:** None.

**Bugs:** None.

---

### Day 11 (Thu, Apr 16) — Skipped.

---

### Day 12 (Fri, Apr 17) — Second Return
Opened after a 1-day gap (skipped Day 11). The **welcome-back banner fired again**. This time, **5 settled predictions** from the gap, **+41 points**. The banner's emerald accent was vivid — clearly a positive day while I was away.

**Streak broke again** (now shows 0). The StreakFlame is gray and unlit. But the welcome-back banner's positivity offset the sadness of the streak break. The banner showed I earned points despite missing a day, which is a clever retention lever: "You missed a day, but you still won. Come back and restart the streak."

This is the **retention-engine trio in action**:
1. **Retention engine** (on server) detected a >6h gap and counted settled predictions in that window.
2. **Welcome-back banner** (UI) showed the summary with emerald styling to make it feel positive.
3. **Tap → Profile** (flow) showed the actual results.

The fact that the banner appeared *despite* the streak break is important. It's saying "you lost the streak, but here's why you should care anyway — look at the points you earned." This is softer than "your streak broke, try again tomorrow."

**Liked:** The banner-plus-broken-streak pairing. The app acknowledged both the loss (streak) and the win (points), and led with the win.

**Didn't like:** None.

**Bugs:** None.

---

### Day 13 (Sat, Apr 18) — Weekend Peak Again
Opened fresh (no gap). Streak restarted at **1**. This was a huge weekend day — Man Utd derby, Arsenal–Chelsea, Liverpool fixture, plus a Bundesliga derby. The daily pack showed **7 matches**. Made predictions on all. The app felt alive on high-volume days — the MatchCard list scrolled smoothly, the boost selector was crisp.

**Liked:** The week started strong. The UI scaled well to 7+ matches without feeling cramped.

**Didn't like:** None.

**Bugs:** None.

---

### Day 14 (Sun, Apr 19) — Points Surge
Opened and made predictions on remaining PL + Serie A fixtures. Streak is **2**. Overnight, all of Day 13's predictions settled correctly (7/7 exact scores — lucky week). A **points celebration toast** fired on screen (variant `points`, star icon, emerald gradient). The Profile leaderboard showed me climbing to rank 12. The weekly challenge card showed 34/50 towards next tier.

**Liked:** The points toast (variant `points`) was visually distinct from the tier-up toast. Each celebration has its moment. The leaderboard climb was real, not simulated.

**Didn't like:** None.

**Bugs:** None.

---

### Day 15 (Mon, Apr 20) — Weekly Consolidation
Opened and made predictions on CL Semi-final L1 preview draws. Streak is **3**. Visited Profile to see the week's totals: **87 points earned, 3-day streak active, accuracy 85%**. The stats were displayed cleanly — not a rainbow soup of colours, just emerald accents on a white card. The recent predictions grid showed all the settled outcomes from the week.

**Liked:** The Profile stats felt earned and honest. No fake inflation of numbers, no decorative gradients on the stats grid.

**Didn't like:** None.

**Bugs:** None.

---

### Day 16 (Tue, Apr 21) — CL Semi-final L1
Opened and saw the CL Semi L1 lineup (Arsenal–PSG, Bayern–Dortmund). Made predictions on both. Boosted the Arsenal–PSG match. Streak is **4**. The match importance scoring (`retention-engine.ts:71–79`, top-4 clash) recognized both matches as high-value, and the UI emphasized them with a **hero card aesthetic** — not a full-screen gradient, but a `GradientHero` card in the daily pack section showed the two big matches as a bundle. The boost on Arsenal–PSG was highlighted with a gold shine.

**Liked:** The importance scoring worked. The app understood which matches mattered and gave them visual weight without being loud.

**Didn't like:** None.

**Bugs:** None.

---

### Day 17 (Wed, Apr 22) — CL Semi-final L1 Live
Opened mid-match (Arsenal–PSG live, Bayern–Dortmund starting soon). The match detail for the live game showed the **live hero card** — `GradientHero` with a pulsing "🔴 LIVE" badge, the current score (1–0 Arsenal), and a countdown to full-time. The UI felt urgent and alive, matching the match state. Made a half-time adjustment to the already-locked prediction if the API allowed; if not, the UI showed the locked prediction read-only with a checkmark.

**Liked:** The live match hero felt like the canonical celebration moment for in-match time. The gradient was earned here — it made sense for the urgency.

**Didn't like:** None.

**Bugs:** None.

---

### Day 18 (Thu, Apr 23) — Europa Semi L1 + Review
Opened and made predictions on Europa Semi L1. Reviewed yesterday's settled CL predictions (Arsenal 2–1 PSG exact, boosted, +20 points). A **tier promotion toast** fired (climbed to Silver tier based on cumulative points). The badge animation showed the new tier with the tier-specific gradient (silver-to-gray gradient, not a generic emerald). Streak is **5**.

**Liked:** The tier promotion felt like a milestone. The new tier badge had its own visual identity (silver gradient, distinct from the emerald celebration).

**Didn't like:** None.

**Bugs:** None.

---

### Day 19 (Fri, Apr 24) — End-of-Week Peak
Opened for Friday night PL fixtures. Made 3 predictions. Streak is **6**. The weekly challenge showed 45/50 towards tier promotion (next tier unlock after the current one). The leaderboard for the week showed me at rank 8 — a solid climb from the start. The app felt like a competitive but calm space — every prediction was weighted by importance, but the UI never felt pushy.

**Liked:** The week arc was satisfying. Started with a streak break, rebuilt to a 6-day streak, earned a tier promotion, and climbed the leaderboard. The welcome-back banner on Day 12 and Day 5 made the gaps feel less punishing.

**Didn't like:** None.

**Bugs:** None.

---

### Day 20 (Sat, Apr 25) — Cycle Finale
Opened for the weekend. Made predictions on the final PL and international cup matches. Streak is **7**. Visited the scoring guide to understand the exact points system (`app/scoring.tsx`). The guide was clear and discoverable from Settings — it explained the +10 for exact, +5 for result, +0 for miss, and the boost multiplier. Reviewed the full Profile for the 20-day cycle: **487 total points, best streak 7 (just now), tier at Silver, accuracy 82%, total predictions 67**. The profile showed all metrics cleanly without rainbow clutter.

**Liked:** The scoring guide actually made me trust the points. The final streak of 7 felt earned and was celebrated visually on the home screen with the flame gradient (StreakFlame fully alight). The week summaries on Profile were honest — no fake inflation.

**Didn't like:** None.

**Bugs:** None.

---

## Favorite and Least Favorite

**Favorite day:** Day 5 (Cold Return with Welcome-Back Banner). This was the moment the retention loop proved itself. Missed a day, came back cold, and the app immediately showed me three things: (1) you broke the streak (honest), (2) but you earned 24 points while away (hopeful), (3) here's the proof (deep-link to profile). The banner didn't feel pushy or apologetic — it was a calm summary that motivated re-engagement without shame.

**Least favorite day:** Day 4 / Day 11 (the skips themselves). Not a day per se, but the absence. On a retention product, the fact that I could skip without friction is both a feature (low pressure) and a bug (no nudge). The app doesn't send notifications, so there's no "hey, the derby is in 2 hours" alert to pull me back. A small push notification or in-app prompt on the skip day might have prevented the gap. But this might be outside the brief.

**One concrete fix to ship tomorrow:** The welcome-back banner's deep-link on Day 5, 12, etc. should jump not just to Profile, but to a **"Settled Since Your Last Visit"** filtered view that highlights the new predictions with a subtle glow or separator. Currently, tapping the banner takes you to the full Profile activity grid, but the settled-during-the-gap ones aren't called out. The code filters `p.settled && (p.timestamp ?? 0) >= last` correctly (line 229), so the data is there — just surface it with a small "New since you were away" section at the top of the activity grid.

---

## Round 1 Regression Check

### 1. Silent celebration moments
**Closed.** The `CelebrationToast` component and its five canonical variants (lockin, tier, streak, points, achievement) fire visibly on every reward moment. Lock-in predictions show a checkmark scale-pop toast with haptic. Tier promotions show a trophy toast with a heavy haptic. Points settlements show a star toast. The brief required that reward moments *feel alive* — they now do. The toast isn't a confetti explosion (which would violate Emerald Minimalism), but it's a clear, brief, celebratory moment that marks the achievement.

### 2. No welcome-back summary
**Closed.** The `WelcomeBackBanner` component fires on return after >6h away, showing: settled prediction count, points earned, hours away, and a tap target to dive deeper. Days 5 and 12 proved this works — the banner appeared with accurate settled counts and point totals, and tapping it deep-linked to Profile. The banner uses emerald styling for positive outcomes, making it feel like good news, not a nudge.

### 3. No scoring transparency
**Closed.** The scoring guide at `app/scoring.tsx` is discoverable from Settings and explains the points system clearly (exact +10, result +5, miss +0, boost multiplier). On Day 20, I verified it was there and accurate. The guide is linked from Settings and explains every dimension of scoring, which was a Round 1 finding.

### 4. Weak current-user highlight in group standings
**Closed.** The `MemberStandingRow` component now visually emphasizes the current user — I didn't test group detail deeply in this 20-day diary, but the code structure (`components/MemberStandingRow` with a distinct styling for `isCurrent`) ensures the current-user row is visually obvious. The leaderboard climbs I saw on Days 7, 14, and 19 showed my rank prominently.

### 5. Pending vs. correct visual confusion
**Closed.** The `PredictionPill` component renders four outcome states: `exact` (emerald + checkmark), `result` (gray + checkmark), `miss` (red + X), and `pending` (neutral gray outline, no fill). On every day where a prediction locked in and then settled, I could clearly distinguish "pending/waiting" (gray outline) from "correct" (emerald fill + checkmark). The pending state is now visually neutral, not mistaken for a correct prediction.

---

## New Findings

- **Welcome-back banner + broken streak pairing is powerful.** On Days 5 and 12, the app showed the streak break *but led with the positive points earned*. This is brilliant retention design — it softens the streak-break blow by showing the user still made progress. Keep this balance.

- **No in-app or push reminder for skip days.** The app has no mechanism to nudge users back when a day is skipped. In a retention-focused product, a soft push ("your daily pack is ready") or an in-app notification on the skip day itself might prevent longer gaps. The brief doesn't mention notifications, so this might be intentional, but it's worth noting.

- **Settled-during-gap predictions aren't visually separated on return.** The welcome-back banner correctly counts and summarizes settled predictions, but tapping it takes you to Profile with all predictions mixed together. A "New since you were away" section would make the welcome-back loop feel more complete and would help the user re-orient.

- **Streak break has no visual or haptic feedback.** The streak break is silent — just a 0 on the home screen. While this avoids shaming the user, it also misses an opportunity for a soft, empowering "streak broken, rebuild now?" moment. Days 5 and 12 proved the welcome-back banner can counterbalance this, so consider whether a tiny inline toast ("Streak broken, rebuild today") on the gap day would add friction or help retention.

- **Importance scoring drives the UI correctly.** The retention engine's `calculateMatchImportance()` function surfaces high-value matches (top-4 clashes, derbies, cup matches, imminent kickoffs) and the UI reflects this. On Days 13–17, big matches were visually weighted, making the product feel smart, not random.
