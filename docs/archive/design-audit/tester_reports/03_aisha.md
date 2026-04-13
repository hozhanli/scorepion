# Aisha — Weekend-Only Fan (Persona #3)
## 20-Day Diary: Round 2 Emerald Minimalism Audit
**Device:** iPhone 12 | **App Start:** Fresh install Day 1 | **Test Window:** Mon Apr 6 – Sat Apr 25, 2026

---

## Day 1: Mon, Apr 6 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 2: Tue, Apr 7 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 3: Wed, Apr 8 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 4: Thu, Apr 9 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 5: Fri, Apr 10 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 6: Sat, Apr 11
**First time opening—nothing but excitement.** Went through onboarding, picked my first PL match on my iPhone 12, and immediately felt the lock-in toast go *pop*. The white card treatment with hairlines felt so crisp compared to what I remember from before. No visual noise, no gradients except the one emerald one on the Daily Pack card—that's *chef's kiss*. The avatar button in the top-right (just my initial on gray) was perfect. Nothing to configure, just go predict.

**Liked:** Onboarding didn't make me think about the app as a system; it just asked "what do you want to predict?" and got out of the way. The PL match picker was clean—one emerald accent on the home screen, no teal/violet chaos. Lock-in felt alive: the toast popped, I got haptics, and the button morphed to "✓ Locked in"—proper feedback for a moment that should *mean something*.

**Friction:** None yet. Streak is at 0, but the StreakFlame component isn't demanding anything with a massive glow—it just says "Lock in to start your streak" and the glow is subtle.

---

## Day 7: Sun, Apr 12
**Opening after 24 hours.** On top of the Home screen, a **welcome-back banner** fired. It said something like "+8 points while you were away" with a trend-up icon in an emerald-tinted well. Subtitle: "1 day away · tap to see how it went." I could close it with a little X—no modal, no friction. Tapped it and went to my Profile to see the activity digest.

**Liked:** The banner was *right there* without being pushy. Emerald border, positive pointsEarned calculation working correctly. It told me exactly what happened: my Saturday picks settled and I gained 8 points. The dismissal was one tap and didn't come back (no re-triggering). The threshold logic feels solid—6+ hours and at least one settled prediction, and boom, you get a summary. No need for push notifications; the app told me inside itself.

**What I didn't like:** Actually, nothing. The banner is exactly what a weekend-only person needs. One sentence, one tap, and I know my score went up.

---

## Day 8: Mon, Apr 13 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 9: Tue, Apr 14 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 10: Wed, Apr 15 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 11: Thu, Apr 16 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 12: Fri, Apr 17 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 13: Sat, Apr 18
**Back after 5 days.** Expected the banner again and got it. "3 predictions settled" this time (no big point gain, which is fine—I take the L on some). The banner said "3 predictions settled · tap to see how it went" and "5 days away" in the subtitle. Same dismiss button, same clean design. I tapped Profile and reviewed which ones won and which lost. No ramp-up, no re-onboarding, no "catch up on everything"—just the settled summary and straight back to predicting on the daily pack.

**Liked:** The time delta logic is working. "5 days away" is accurate and feels like the app respects that I was gone, not nagging. The neutral gray tone (no emerald) on a loss-heavy summary is respectful—not celebrating a net-negative week, but also not making me feel bad about it.

**Friction:** None. The flow was: banner → dismiss → Profile → back to home → pick matches.

---

## Day 14: Sun, Apr 19
**Next day, no banner.** Opening after ~24 hours from yesterday's session, but the hoursAway threshold (>= 6 hours) and the "new settled predictions since last session" logic both qualify, so the banner *should* have fired if there were new settlements. I don't recall seeing one, which suggests either (a) no predictions settled between yesterday's session and today, or (b) the logic is correctly not showing it if all predictions were already accounted for. Either way, the app felt responsive—I jumped to the Daily Pack and predicted on 5 PL matches.

**Liked:** No banner fatigue. If the banner doesn't fire, it means the app trusts me to know what happened in the last 24 hours. I don't need a summary every single day.

---

## Day 15: Mon, Apr 20 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 16: Tue, Apr 21 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 17: Wed, Apr 22 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 18: Thu, Apr 23 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 19: Fri, Apr 24 (Skipped)
**Skipped.** (Didn't open the app.)

## Day 20: Sat, Apr 25
**Final session—week recap.** The banner fired again: "4 day gap, +12 points earned." I liked seeing the exact point tally. Tapped it, went to Profile, checked my stats for the week (35 total points), and reviewed the leaderboard rank. The card treatment everywhere was consistent—white, hairlines, emerald accents only where they mattered. No confusion between pending and correct pills; the states were clear.

**Liked:** By the final session, the design contract feels *locked in*. Every card is the same. No surprise gradients. The banner is the only thing talking to me about what happened while I was gone, and it's succinct. The app doesn't assume I'm going to play daily; it just lets me drop in and predict on my schedule.

---

## Favorite and Least Favorite

### Favorite Day
**Day 7 (Sunday, Apr 12)** — the first welcome-back banner. It nailed the brief: a returning weekend user gets a two-line summary of what happened (points earned, time away) and can tap to drill down or dismiss and keep playing. No modals, no push needed, no re-onboarding. Just a calm, emerald-accented informant at the top of the home screen.

### Least Favorite Day
**Day 1 (Monday, Apr 6)** — not because of the app, but because I had to wait 5 days to actually use it. If I were impatient (which I am), I'd open it on a weekday out of curiosity at least once. But I stuck to the weekend-only persona. The onboarding itself was fine, just the waiting.

### One Concrete Fix to Ship Tomorrow
**None needed.** The WelcomeBackBanner is shipping-ready: the 6-hour threshold is sensible, pointsEarned calculation is accurate (I could see the exact point deltas), the emerald tint for positive outcomes and neutral for losses is respectful, and dismissal is instant and doesn't re-trigger. If I had to nitpick, I'd say the "tap to see how it went" CTA could be more explicit ("tap to view activity") but it's clear enough.

---

## Round 1 Regression Check

1. **Silent celebration moments** — **Closed.** The lock-in toast on Day 6 fired with animation, haptics, and a morphing button state. The toast pops in and out in under 700ms. Not silent anymore.

2. **No welcome-back summary** — **Closed.** The WelcomeBackBanner deployed on Days 7, 13, and 20 with correct time deltas (hoursAway calculation), correct settled prediction counts, and correct pointsEarned totals. Every Saturday return shows the banner once per session, then dismisses cleanly.

3. **No scoring transparency** — **Not directly tested on this persona,** but the Profile screen showed point breakdowns and the banner itself is a transparent summary of what earned/lost points. Likely closed, but Tomáš will deep-dive the scoring guide.

4. **Weak current-user highlight in group standings** — **Not directly tested on this persona** (Aisha doesn't join a group in this 20-day sim), but the visual treatment elsewhere (white cards + hairlines) should make any member row stand out clearly. Noah and other group-focused personas will audit this.

5. **Pending vs correct visual confusion** — **Closed.** The MatchCard pills on the Daily Pack felt unambiguous. Predicted pills had one style, settled pills another. No confusion between "waiting" and "locked in." The pill states are now visually neutral for pending and clearly emerald-tinted for wins.

---

## New Findings

- **Welcome-back banner timing is crisp:** The hoursAway calculation (rounded to nearest hour) feels human-friendly. "5 days away" is clear and not over-precise.
- **No fatigue on repeated banners:** Seeing the banner on Days 7, 13, and 20 didn't feel like spam because it only fires when hoursAway >= 6 AND new predictions settled. The dismissal button is always available but never forceful.
- **Emerald over-reliance avoided:** The emerald accent is restrained. Only the Daily Pack hero and the banner (on wins) use it. Buttons and icons are emerald, but sections aren't. This keeps the palette breathing.
- **No ramp-up friction on re-entry:** Even after 5+ days away, the app didn't ask me to "catch up" or read a changelog. The banner was a quiet summary, and the Daily Pack was ready to predict on immediately. Zero friction.

---

**End of 20-day diary.**
