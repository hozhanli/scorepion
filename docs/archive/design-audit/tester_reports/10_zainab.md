# Zainab — Streak Hunter | Round 2 Diary
**Persona 10 | 20-day simulation (Mon Apr 6 – Sat Apr 25, 2026)**

---

## Overview
Zainab is 22, obsessed with the streak flame. In Round 1, she praised the StreakFlame hero for being "genuinely gorgeous in its resting state" but condemned the lack of visual feedback when streaks break, tick, or reach milestones. She said: "breaking a streak should have dramatic UI language. Instead it's silent." Round 2 is her regression test: has the new CelebrationToast 'streak' variant (and its wiring) actually closed this gap, or is the flame still a beautiful but emotionally mute component?

---

## 20-Day Diary

### Day 1 — Mon, Apr 6
**Activity:** Fresh install. Auth → Onboarding (selects Premier League + Champions League). Home screen.

**What I did:** Signed up as "zainab_flame", selected fave leagues, landed on Home. The **StreakFlame hero is instantly gorgeous** — the flame gradient (#FFB347 → #FF6B35 → #E04A1E) pops against the white background, the glow is restrained and elegant, the week-dots are a nice touch. The subtitle "Lock in to start your streak" is aspirational, not scolding.

**What I liked:** The StreakFlame design itself is perfect. No notes. The gradient looks premium, the flame icon has weight, the kerning on "0 days streak" is tight. This is the visual payoff I wanted.

**What I didn't like:** Nothing visual. But I'm already thinking: when I predict and my streak goes 0 → 1, what happens? Will the card animate? Will a toast fire? Or will I just see the number tick up silently like last round?

**Bugs:** None.

---

### Day 2 — Tue, Apr 7
**Activity:** CL QF L1 matches live (Arsenal–Real Madrid). Make first prediction (1-1 draw). Boost the Arsenal match.

**What I did:** Tapped into Arsenal–Real Madrid, predicted 1–1, hit submit. **The lock-in toast fires with a satisfying pop** — "Locked in!" with the checkmark icon, white text on emerald bg. Haptic thumped. Lovely. Prediction count updated. Back to home.

**What I liked:** The lock-in toast is exactly the celebration moment the brief promised. Quick, visual, haptic. This is how rewards *should* feel.

**What I didn't like:** Streak still showing 0. No toast for a streak tick. I locked in my first prediction and the streak is still dead. I get it — maybe day 1 doesn't count. But where's the feedback when day 1 → day 2? Will there even be one?

**Bugs:** None observed.

---

### Day 3 — Wed, Apr 8
**Activity:** CL QF L1 (PSG–Aston Villa). Second prediction locked in. Join a group called "Flame Runners."

**What I did:** Predicted PSG 2–1 Aston Villa. Another lock-in toast fires. Joined a group. Expected the streak to tick to 1 (two consecutive days of predictions). But the StreakFlame still shows 0.

**What I liked:** The lock-in toast is consistent. The group invite flow is clean.

**What I didn't like:** **This is the regression test failing.** The StreakFlame component is wired to accept a `streak` prop, it renders beautifully when streak > 0 (flame gradient + glow), but there is **zero celebration** when the streak actually ticks. The UI is gorgeous in resting state but emotionally silent in the moment it should scream "YOU'RE ON FIRE." I can see in the mock data that profile.streak should update, but the app gives me no visual or haptic reward for achieving it. The lock-in toast fires (lockin variant), but there is no correspond `celebrate({ variant: 'streak' })` call anywhere in the codebase when the streak increments. **This is Round 1 finding #6 still open.**

**Bugs:** None. The logic just isn't wired.

---

### Day 4 — Thu, Apr 9
**Activity:** Europa QF L1. Miss a prediction (exact score required). Streak breaks.

**What I did:** Didn't predict on a Europa match. Expected the streak to reset from whatever it should be to 0.

**What I didn't like:** **No visual feedback for the break either.** I understand from the audit that "streak break" should be one of the five canonical celebration moments — the opposite of a positive moment, but still a *moment*. Something that marks the threshold. Instead, the StreakFlame silently turns gray. The gradient transitions from flame to neutral (#CBD5E1 → #94A3B8) with no animation, no color-pop, no toast, no haptic punch. It's the most emotionally important moment in a streak product and it's handled like a silent state update. **The flame is beautiful whether it's burning or cold, but breaking the streak should *feel* like breaking something.**

**Bugs:** None. The behavior is correct; the celebration is missing.

---

### Day 5 — Fri, Apr 10
**Activity:** PL Friday night (Tier promotion trigger). Predictions continue.

**What I did:** Locked in two more predictions. Expected a tier promotion toast (the brief promised a 'tier' variant celebration).

**What I liked:** The Daily Pack card with emerald gradient is lovely. No noise.

**What I didn't like:** No tier toast. No streak tick toast. The app is a beautiful, silent machine. Every prediction lock-in is rewarded with the emerald toast (lockin variant works perfectly), but the *meta-rewards* (streak, tier, points-milestone) are completely invisible. **The product has built a celebration primitive that can fire five different celebration types, but only one of them is actually wired up.**

**Bugs:** None.

---

### Day 6 — Sat, Apr 11
**Activity:** PL weekend peak (4+ matches). Derby atmosphere. Leaderboard check.

**What I did:** Locked in predictions on Manchester derby and others. Checked leaderboard. Metrics row shows correct data (weekly points, etc.).

**What I liked:** The leaderboard is clean. The prize strip (1st/2nd/3rd) uses solid backgrounds, no confusing gradients.

**What I didn't like:** Still no streak celebration. I'm now at day 5 or 6 of correct predictions (if the logic is silently accumulating), and the flame should be roaring. But I have no idea if my streak is actually ticking because there's zero visual feedback. The StreakFlame hero is a *display* component, not a *reward* component. In Duolingo, when you break your streak, the screen shakes and there's an urgency animation. When you rebuild it, confetti. Zainab's Round 1 feedback was "breaking a streak should have dramatic UI language." That's still the case. The StreakFlame looks premium, but the *moment* is absent.

**Bugs:** None.

---

### Day 7 — Sun, Apr 12
**Activity:** PL + LaLiga Sunday. Leaderboard climb.

**What I did:** Predictions locked in. Leaderboard rank improved.

**What I didn't like:** No celebration for leaderboard climb. The 'points' and 'tier' variants in CelebrationToast exist in code but are orphaned — no call sites.

---

### Days 8–10
**Activity:** CL QF L2 matches, revisit predictions, mid-cycle review.

**What I did:** Continued predictions. Checked past predictions in Match Detail. Examined settled matches.

**What I liked:** The Match Detail screen is information-dense but well-organized. H2H gauge is clear.

**What I didn't like:** Still no streak celebration. By now, if the app were properly wired, I should have seen a 'streak' toast fire at least once when I hit a milestone. The fact that I haven't is damning. **CelebrationToast.tsx is architecturally sound — it queues celebrations, picks the right icon (flame for 'streak'), fires haptics, auto-dismisses. But there is zero call to `celebrate({ variant: 'streak', ... })` in any user-facing flow.**

---

### Day 11 — Thu, Apr 16
**Activity:** Quiet day. Skip the app.

**What I did:** Skipped.

---

### Day 12 — Fri, Apr 17
**Activity:** Return after 1-day absence. See welcome-back banner. Bundesliga Friday.

**What I did:** Opened the app. A WelcomeBackBanner fires with settled prediction count and points earned. Clean, elegant, responsive to a 1-day gap. Made new predictions.

**What I liked:** The welcome-back banner closes finding #2 from Round 1. It works.

**What I didn't like:** Still no streak celebration.

---

### Days 13–20
**Activity:** CL Semi-finals, large PL weekends, profile review, scoring guide check.

**What I did:** Continued prediction cycle. Checked Profile page (stats are correct). Found the Scoring Guide link in Settings and read it (finding #3 is closed). Viewed the MemberStandingRow in a group — my row has a subtle highlight, so finding #4 is partially closed (it's visible but not *obvious*).

**What I liked:**
- The Scoring Guide is discoverable and correct (Round 1 finding #3: closed).
- The WelcomeBackBanner works flawlessly (Round 1 finding #2: closed).
- Lock-in toasts are beautiful and consistent (Round 1 finding #1: partially closed — one type fires, but not all five).

**What I didn't like:**
- **Streak is still completely silent.** Over 20 days of regular predictions, I should have seen a 'streak' toast fire. I haven't. The StreakFlame component displays the streak count beautifully, but when the streak *changes* — ticks up, breaks, hits a milestone — there is zero celebration. This is the defining failure of Round 2 for a "streak hunter" persona.
- The pending-pill confusion (finding #5): I checked Match Detail. Pending predictions still show as gray pills without a visual difference from incorrect predictions. This is still open.

---

## Favorite and Least Favorite

**Favorite day:** Day 5. The lock-in toast was perfect, the Daily Pack hero was elegant, and the overall surface felt polished. For that one moment, the app felt like a real product.

**Least favorite day:** Day 3–4 (the streak break). The StreakFlame transition from flame to gray is silent. There's no animation, no toast, no haptic. Just a color change. For a product obsessed with streaks, this is the most emotionally dead moment in the entire app.

**One concrete fix to ship tomorrow:**
Wire up the `celebrate({ variant: 'streak', ... })` call in `AppContext.tsx` or a derived hook. When `profile.streak` changes from 0 to 1, fire a 'streak' toast with the flame icon and "🔥 Streak started!" When it ticks (day 1 → day 2, etc.), fire "On fire! +1 day" or similar. When it breaks (streak > 0 → streak = 0), fire a somber 'streak' toast with "Streak ended" and flame icon. The primitive exists. It just needs wiring.

---

## Round 1 Regression Check

### 1. **Silent celebration moments**
**Verdict: PARTIALLY CLOSED**

The lock-in toast (variant: 'lockin') works perfectly and fires with haptics + animation. But the other four canonical celebrations are missing:
- `tier` — no call site found.
- `streak` — no call site found.
- `points` — no call site found.
- `achievement` — no call site found.

The CelebrationToast primitive is 20% wired. Unacceptable for a Round 2 fix.

### 2. **No welcome-back summary**
**Verdict: CLOSED**

The WelcomeBackBanner in `app/(tabs)/index.tsx:240–258` fires correctly when the user returns after >6 hours away. It shows settled prediction count and points earned. Works as intended.

### 3. **No scoring transparency**
**Verdict: CLOSED**

The Scoring Guide screen (`app/scoring.tsx`) exists and is linked in Settings. It clearly explains the points system. Discoverability is good.

### 4. **Weak current-user highlight in group standings**
**Verdict: PARTIALLY CLOSED**

The MemberStandingRow in group detail has a subtle background tint on the current user's row, but it's not "obviously you." The highlight is present but passive. A stronger visual marker (like a border, a chevron, or a badge) would make it obvious at a glance.

### 5. **Pending vs correct visual confusion**
**Verdict: STILL OPEN**

In Match Detail, pending predictions still render as gray neutral pills without a clear visual distinction from incorrect (locked-in but wrong) predictions. The pending state should be visually distinct from settled states. This creates confusion about which predictions are still open and which have settled.

---

## New Findings

- **CelebrationToast's 'streak' variant is architecturally sound but orphaned from the user-facing app.** The primitive was created (lines 50–55 define the type, lines 76–82 define the icon map), but there is no single call to `celebrate({ variant: 'streak', ... })` in any user-facing flow. This is architectural debt: the infrastructure exists, the plumbing is installed, but the light switch is not connected.

- **Streak break should fire a distinct variant or at least a visual/haptic event.** Right now, the StreakFlame transitions from flame gradient to gray with zero fanfare. In a streak product, breaking the streak is a *moment* — possibly the most emotionally salient moment after achieving the first day. The app should acknowledge it, not pretend it didn't happen.

- **The lock-in toast works so well that the silence on meta-rewards (streak, tier, points) is even more jarring.** One celebration is wired. Four are not. This inconsistency erodes trust in the product.

- **Profile.streak updates are likely happening server-side (in retention-engine.ts:779), but the client has no wiring to detect and celebrate those updates.** The socket/API layer is in place (queryClient invalidations fire), but the celebration logic never fires in response.

---

## Closing Note

The StreakFlame is genuinely one of the prettiest components in the app. It earns the flame gradient through good design. But design without ceremony is a missed opportunity. Zainab came to Round 2 asking: "Will breaking a streak finally feel dramatic?" The answer is: no, it's still silent. The app built a celebration primitive to fix this, but only wired it halfway. **The fix is 10 minutes of implementation work; the cost of not doing it is the entire emotional payload of a streak product.**
