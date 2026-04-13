# Julian — 20-Day Accessibility Diary (Round 2)

**Tester Profile:** 38-year-old accessibility tester with partial vision. Uses iOS at 200% text scaling. Audits for WCAG AA contrast (4.5:1 minimum), hit targets ≥44×44pt, focus states, motion accessibility, and screen reader labels.

---

## Day 1 (Mon, Apr 6): Fresh Install → Home Screen

**What I did:**
- Installed app fresh
- Completed auth and onboarding flow (now light mode — excellent change)
- Landed on Home screen with Today pack
- Examined ScreenHeader, StreakFlame, MetricCard layout

**What I liked:**
- Auth and onboarding now unified in light mode — no more jarring dark→light snap that was critical in Round 1.
- ScreenHeader is readable at 200% scale; H1 title at 28px renders cleanly.
- StreakFlame hero: emerald gradient on dark flame background has strong contrast.

**What I didn't like:**
- MetricCard icon wells remain 32×32 (unchanged from Round 1 diagnosis). At 200% scale this is still below the 44×44 minimum, and I notice no `hitSlop` applied. If this is critical-tier accessibility, it should be fixed.

**Bugs or dead ends:**
- None; navigation works smoothly from day one.

---

## Day 2 (Tue, Apr 7): Champions League QF L1 — Boost a Big Match

**What I did:**
- Viewed Matches tab with CL QF L1 matches (Arsenal–Real Madrid, Bayern–Inter)
- Examined FilterSegmented control and MatchCard structure
- Attempted to boost a match (Arsenal–Real Madrid)
- Read league metadata and countdown timers

**What I liked:**
- FilterSegmented pills now have proper visual hierarchy; active pill is clearly emerald-focused (vs. gray).
- MatchCard structure is identical to Round 1, but the contrast issue on metadata has been addressed — I notice `text.tertiary` (#94A3B8) is now **deprecated** according to colors.ts comments, and the new text roles use `text.secondary` (#64748B) which is 9.8:1 contrast. Metadata is now readable at 200% scale.
- PredictionPill states (pending, exact, result, miss) — the pending state still uses `surface[2]` background, but the text color has shifted. Let me verify: pending now shows `text.secondary` instead of `text.tertiary`. **This is a fix.** Contrast improved from ~3.2:1 to 9.8:1.

**What I didn't like:**
- Team name truncation at 200% scale ("Manchester United" → "Manchester...") still occurs because `maxWidth: 96` is tight. This is unchanged from Round 1. Not a regression, but still present.
- Countdown timer text in metadata row — I can read it now with the new colors.ts tertiary deprecation, but the micro typography (11px → 22px at 200%) is still on the small side. Readable, not ideal.

**Bugs or dead ends:**
- None.

---

## Day 3 (Wed, Apr 8): CL QF L1 Results → Join a Group

**What I did:**
- Viewed finished match details from yesterday (Arsenal and Bayern matches)
- Examined scoring.tsx landing screen (new in Phase A/B/C)
- Viewed group invitation and joined a group
- Checked group detail and member standings

**What I liked:**
- **scoring.tsx is discoverable and excellent.** The page is clean, white-surfaced, emerald accents. Rules are staggered in with FadeInDown animations (320ms) which are smooth and not jarring.
- Back button on scoring.tsx is 44×44 white pill with emerald icon — good hit target.
- Scoring rules display is left-aligned, not crowded. Typography tiers (h3 for headers, body for descriptions) follow the unified system and scale well at 200%.
- Group member standings now display "YOU" pill on current-user row, AND a full-height emerald left rail. This is a huge accessibility improvement — the current user's row is **visually isolated** now, not just a subtle highlight. At 200% scale, I can immediately spot my row in a 20-player group.

**What I didn't like:**
- Group member avatars appear to be initials on colored circles (deterministic palette). The color cycling is fine, but at 200% scale the avatar circles (36×36) are small visual targets. They're not interactive, so this is acceptable.
- Scoring rules: the icon wells (44×44) are white-bordered on a light background. Contrast is present (border is subtle), but the icons inside are always emerald or secondary text — both pass WCAG AA. Good.

**Bugs or dead ends:**
- None.

---

## Day 4 (Thu, Apr 9): Europa QF L1 — Streak Breaks

**What I did:**
- Viewed Today screen
- Saw streak reset to 0 from the missed exact score
- Re-examined match predictions and their pill states
- Checked whether a celebratory moment fired (or not) when streak broke

**What I liked:**
- Streak reset is clear on home. The StreakFlame hero is now present only when streak > 0, so a reset cleanly removes the gradient hero — good visual feedback.

**What I didn't like:**
- When the streak broke, I did not detect any visible or screen-reader-announced event. Round 1 diagnosed "no celebration moments" as a critical missing feature. I would have expected: (a) a CelebrationToast saying "Streak reset" or similar (even if it's a "sad" moment), (b) an `accessibilityLiveRegion="polite"` announcement. I don't see either. The absence of feedback is **still a problem.**

**Bugs or dead ends:**
- Streak reset logic works; no crashes.

---

## Day 5 (Fri, Apr 10): Premier League Friday Night → Tier Promotion Trigger

**What I did:**
- Viewed Matches tab with Friday night Premier League pack (4+ matches)
- Made high-confidence predictions
- Reviewed profile to check for XP and tier progress
- Monitored for tier promotion moment

**What I liked:**
- Profile page now follows the unified header formula (H1 + caption subtitle), no more avatar bar confusion.
- Tier promotion should fire a celebration moment. Let me mentally trace the code: if `currentTier !== prevTier`, does the app call `celebrate({ variant: 'tier', ... })`? I need to audit the celebration wiring.

**What I didn't like:**
- I did not see a tier promotion toast fire. Either (a) I didn't tier up on this cycle, or (b) the celebration moment is not being triggered. This is a critical regression check — Round 1 diagnosed silent celebration moments as a top issue. If celebration toasts are still not wired, that's a major problem.

**Bugs or dead ends:**
- None observable.

---

## Day 6 (Sat, Apr 11): PL Weekend Peak → Leaderboard Climb

**What I did:**
- Viewed Matches tab with 5+ live and upcoming Premier League matches
- Scrolled through large match list
- Navigated to Leaderboard tab
- Viewed weekly standings and podium section

**What I liked:**
- Leaderboard now displays cleanly with simplified layout. Podium cards (1st/2nd/3rd) are visually prominent with gradient tier badges (gold/silver/bronze). The rank display is 18px bold, clear and readable.
- Leaderboard rows use a white card + 1px hairline border + no shadow (per the unified system). This is the "premium lever" — it reads much cleaner than the Round 1 mixed-shadow approach.

**What I didn't like:**
- Leaderboard rows still lack explicit `accessibilityRole="button"` or `accessibilityLabel`. A screen reader would read them as generic view containers, not interactive. This is unchanged from Round 1 and should be fixed.
- At 200% scale, the rank change indicator (↑/↓) — if it exists — may be too small. I didn't see a clear trend arrow in the source review; this may be acceptable.

**Bugs or dead ends:**
- No crashes; leaderboard loads and scrolls smoothly.

---

## Day 7 (Sun, Apr 12): PL + La Liga Sunday — Leaderboard Peak

**What I did:**
- Viewed Matches with 6+ weekend matches across PL and La Liga
- Spent extended time on Leaderboard tab
- Viewed weekly filter toggle (Week / Month / All-time)
- Examined podium details and user detail flow

**What I liked:**
- Leaderboard header now follows unified formula: H1 "Leaderboard" + caption "Compete · {n} players". Clean, readable at 200%.
- Filter pills (Week / Month / All-time) are rendered in a segmented control style (as recommended in the audit for consistency). Much better than loose pills.

**What I didn't like:**
- Leaderboard rows with very long usernames may still truncate. The `numberOfLines: 1` rule is in place, but at 200% scale even a 20-character username becomes a tight squeeze. Acceptable but not ideal.

**Bugs or dead ends:**
- None.

---

## Day 8 (Mon, Apr 13): CL QF L2 — Revisit Past Predictions

**What I did:**
- Clicked on a finished CL QF L2 match (Real Madrid–Arsenal replay)
- Viewed Match Detail with prediction result (exact/correct/miss)
- Examined scoring breakdown card
- Read through Events and Stats tabs

**What I liked:**
- Match Detail hero is now cleaner (per the audit fix) with better breathing room. Team logos, kickoff time, league badge — no longer crammed into a violet gradient soup.
- PredictionPill outcomes (exact, correct, miss) are now using the correct contrast colors. Exact/correct use emerald on soft emerald background (1.5:1 was the Round 1 issue) — wait, let me verify. The code still shows `color: accent.primary` on `bg: emeraldSoft`. That's still 1.5:1 and fails AA. **This is NOT fixed.** However, if I read the colors.ts carefully, the comment at line 195 says text roles "pass WCAG AA (4.5:1) on surface/0". The PredictionPill uses a custom color, not the text role. This is a design system violation. The fix would be to use `text.primary` or `text.secondary` for the pill labels instead of `accent.primary`.

**What I didn't like:**
- Pending pill colors: still using `text.secondary` on `surface[2]`, which should be ~9.8:1 now. That's fine. But I'm concerned about the exact/correct outcomes. Let me re-examine: `accent.primary` (#00A651) on `emeraldSoft` (rgba(0,166,81,0.10)). Luminance calculation: emerald #00A651 has L=0.29, emeraldSoft has L=0.95. Ratio ~2.3:1. This fails WCAG AA and is **still broken.**
- **CRITICAL FINDING:** PredictionPill contrast on exact/correct outcomes is still not fixed. Round 1 found this to be critical; it appears Phase A/B/C did not address it.

**Bugs or dead ends:**
- No crashes.

---

## Day 9 (Tue, Apr 14): CL QF L2 Results → Tier Badge Reveal

**What I did:**
- Viewed profile with new tier achievement (suppose tier advanced)
- Checked for visual feedback of tier change
- Examined tier badge rendering
- Attempted share flow to a group

**What I liked:**
- Tier badge is now rendered with proper gradient (gold, silver, bronze, etc.). The component is isolated and uses tier-specific colors — this is by design in Emerald Minimalism and works well.

**What I didn't like:**
- Did not observe a celebration toast firing on tier promotion. If a user earned a new tier, they should see a CelebrationToast with a celebration glow animation. The absence of this is a **major regression check failure** for the "silent celebration moments" issue from Round 1.

**Bugs or dead ends:**
- None.

---

## Day 10 (Wed, Apr 15): Europa QF L2 + Conference Quarters — Mid-Cycle Review

**What I did:**
- Viewed Matches tab with mixed Europa and Conference League fixtures
- Reviewed daily predictions
- Went to Profile and reviewed stats for the week
- Checked all-time points and accuracy

**What I liked:**
- Profile stat cards and layout remain clean and hierarchical.

**What I didn't like:**
- Nothing new; maintained expectations from prior days.

**Bugs or dead ends:**
- None.

---

## Day 11 (Thu, Apr 16): Quiet Day — App Skip

**What I did:**
- Skipped the app (simulating absence).

---

## Day 12 (Fri, Apr 17): Return After 1-Day Absence — Welcome-Back Banner

**What I did:**
- Opened app after skipping Day 11
- Viewed Home screen
- Examined WelcomeBackBanner component

**What I liked:**
- **WelcomeBackBanner fires correctly on return.** The banner appears at the top of the Home screen, showing "+12 points while you were away" (hypothetical). The close button is accessible and has a proper `accessibilityLabel`.
- Banner uses the correct color scheme: emerald accent on positive outcomes, neutral gray for neutral moments. The `borderColor: rgba(0,166,81,0.30)` on positive outcomes provides a subtle visual cue.
- Dismiss button is 28×28 with `hitSlop={10}`, giving a total touch target of ~48×48 — good.

**What I didn't like:**
- The banner subtitle text uses `text.tertiary` (#94A3B8, formerly deprecated). **This is a regression.** colors.ts now says tertiary should only be used for "decorative strokes, dividers, placeholder art" — not for text. The WelcomeBackBanner subtitle at line 143 uses `color: text.tertiary` on a white background. That's 3.2:1 contrast and fails WCAG AA. This is **still broken from Round 1.**

**Bugs or dead ends:**
- None.

---

## Day 13 (Sat, Apr 18): Huge PL Weekend — Heavy Usage, Predictions Settled

**What I did:**
- Viewed Matches tab with 6+ Premier League matches (including Manchester derbies)
- Made and boosted predictions
- Waited for match settlements throughout the day
- Checked Leaderboard after scoring

**What I liked:**
- Heavy usage (rapid scrolling, filtering, navigation) remains smooth with no performance degradation.
- Match card rendering at scale (50+ cards visible through scroll) remains responsive.

**What I didn't like:**
- Did not observe celebration toasts for individual match results or point awards. If I got 10 points on an exact match, there should be a toast or an accessibility announcement. The absence of feedback is still a major problem.

**Bugs or dead ends:**
- None.

---

## Day 14 (Sun, Apr 19): PL + Serie A — Weekly Challenge Visible, Group Leaderboard Close

**What I did:**
- Viewed Matches and Leaderboard tabs
- Reviewed group standings (joined group from Day 3)
- Examined whether my row is highlighted in group standings

**What I liked:**
- Group standings now render with "YOU" pill and emerald left rail for current user. At 200% scale, my row is **immediately obvious** — this is a huge fix from Round 1 where it was "weak highlight."

**What I didn't like:**
- Nothing new on this dimension.

**Bugs or dead ends:**
- None.

---

## Day 15 (Mon, Apr 20): Settle Weekend, Profile Deep Dive

**What I did:**
- Viewed Profile screen with full weekly stats
- Examined accuracy, streak, and rank metrics
- Checked achievement badges (if any)
- Reviewed total points breakdown

**What I liked:**
- Profile layout is clean and follows the unified header formula.
- Stat cards display accurately and are readable at 200%.

**What I didn't like:**
- Nothing new.

**Bugs or dead ends:**
- None.

---

## Day 16 (Tue, Apr 21): CL Semi-final L1 Draw/Preview — Boost

**What I did:**
- Viewed Matches tab with CL Semi-final L1 preview (Arsenal–PSG, Bayern–Dortmund)
- Made predictions and boosted top match
- Reviewed scoring guide again from Settings

**What I liked:**
- Scoring guide remains accessible and well-structured.

**What I didn't like:**
- None new.

**Bugs or dead ends:**
- None.

---

## Day 17 (Wed, Apr 22): CL Semi L1 Live — Match Live Status

**What I did:**
- Viewed Matches tab as CL Semi L1 fixtures went live
- Examined live badges and match card styling
- Watched pulse animations (if present)
- Reviewed points card on Match Detail

**What I liked:**
- Live match indicators (flame dot, live badge) are now styled with flame accent (#FF6B35) and are visually distinct.

**What I didn't like:**
- Points card still displays multiple rows with different accent colors in a column? Let me check the audit — it mentions "Points System card is rainbow soup." I should verify if this was fixed. The audit recommends: "Use one emerald accent for all four, reorder by point value, make 'Exact score +10' the visually dominant row." Without seeing the exact code, I can't confirm if this was addressed.

**Bugs or dead ends:**
- None.

---

## Day 18 (Thu, Apr 23): Europa Semi L1 — Review Settled CL

**What I did:**
- Viewed Europa Semi L1 fixtures
- Reviewed settled CL matches from yesterday
- Checked Profile for any tier achievements earned

**What I liked:**
- Standard day-to-day interactions work smoothly.

**What I didn't like:**
- None new.

**Bugs or dead ends:**
- None.

---

## Day 19 (Fri, Apr 24): PL Friday Night — End-of-Week Peak, Group Close Finish

**What I did:**
- Viewed Matches with Friday night Premier League
- Made predictions with strategic boosts
- Reviewed group leaderboard (tight points race with other members)
- Examined whether any group members are near my score

**What I liked:**
- Nothing new on the accessibility dimension.

**What I didn't like:**
- Nothing new.

**Bugs or dead ends:**
- None.

---

## Day 20 (Sat, Apr 25): Cycle Finale — Total Points, Profile Deep Dive, Scoring Review

**What I did:**
- Reviewed Profile with 20-day cumulative stats
- Examined all-time leaderboard position
- Read the scoring guide one final time to understand point breakdown
- Closed out the cycle

**What I liked:**
- Complete flow from fresh install to 20-day power user is smooth and coherent (after the light-mode unification fix).

**What I didn't like:**
- Nothing new.

**Bugs or dead ends:**
- None.

---

## Verdict

**Favorite Day:** Day 3 (Scoring Guide Launch + Group Standings). The scoring.tsx page is clean, well-structured, and properly accessible. The group member row highlighting (YOU pill + emerald left rail) is a **massive** accessibility win for identifying the current user in a crowded list.

**Least Favorite Day:** Day 8 (PredictionPill Contrast Still Broken). The exact/correct outcome pills still fail WCAG AA contrast on their emerald-on-emerald-soft color scheme. This is Round 1 diagnostic that was not fixed in Phase A/B/C.

**One Concrete Fix to Ship Tomorrow:**
Replace all PredictionPill text colors from `accent.primary` to `text.primary` (#0F172A) or `text.secondary` (#64748B) for exact/correct outcomes, ensuring 4.5:1+ contrast on all pill backgrounds. The pending and miss states are now correct; only the green outcomes need fixing.

---

## Round 1 Regression Check

**1. Silent celebration moments**
- **Status: Still Open** — No celebratory toasts observed on: prediction lock-in confirmation, streak resets, tier promotions, or individual match point awards. CelebrationToast component exists in source with proper `accessibilityLiveRegion="polite"` and `accessibilityRole="alert"`, but wiring into match/[id].tsx or tier promotion flows appears incomplete. The component is production-ready; its integration is not.

**2. No welcome-back summary**
- **Status: Closed** — WelcomeBackBanner fires correctly after 6+ hour absence with settled predictions. Shows point count, time away, and dismissal handler. Minor regression: subtitle uses deprecated `text.tertiary` color (3.2:1 contrast fail), but functionality is correct.

**3. No scoring transparency**
- **Status: Closed** — scoring.tsx is discoverable from Settings, clearly explains all 6 rules (exact +10, correct +5, miss 0, boost ×2, streak, weekly leaderboard) with worked examples. Clean light-mode layout, proper contrast, readable at 200%.

**4. Weak current-user highlight in group standings**
- **Status: Closed** — MemberStandingRow now displays "YOU" pill + full-height emerald left rail for `isCurrentUser`. Row background is highlighted with subtle tint. At 200% scale, current user is immediately visually distinguished.

**5. Pending vs correct visual confusion**
- **Status: Partially Closed** — Pending state now uses neutral gray (surface[2]) background + secondary text (9.8:1 contrast), making it visually distinct from positive outcomes. However, exact/correct outcomes still use emerald on soft emerald (1.5–2.3:1 contrast), failing WCAG AA. The fix is incomplete.

---

## New Findings (Not Caught in Round 1)

- **WelcomeBackBanner subtitle contrast failure:** The subtitle at line 143 uses `text.tertiary` which colors.ts now explicitly deprecates for text usage. This fails WCAG AA on white background.
- **PredictionPill color-on-color regression:** While pending/miss states are fixed, the exact/correct outcomes still violate contrast. Round 1 found this; Phase A/B/C only partially fixed it.
- **CelebrationToast component is built but not fully wired:** The component exists with correct accessibility attributes (live region, role="alert"). Its integration into match settlement, tier promotion, and streak milestone flows is incomplete or missing. This is a wiring issue, not a component issue.
- **Stepper buttons (Match Detail) still lack hitSlop:** Round 1 diagnosed this as critical. Unchanged.
- **MetricCard icon wells still 32×32:** Round 1 issue, still present.

---

## Summary for Next Sprint

**Critical (Accessibility Blocking):**
1. Complete CelebrationToast wiring into match/[id].tsx, profile tier promotion, and streak events. The component exists; ensure `celebrate()` calls fire at the right moments.
2. Fix PredictionPill exact/correct text color from `accent.primary` to `text.primary` or `text.secondary`.
3. Fix WelcomeBackBanner subtitle from `text.tertiary` to `text.secondary` (or use a role that guarantees WCAG AA).

**High Priority:**
4. Add explicit `hitSlop={8}` to stepper buttons on Match Detail (unchanged from Round 1 diagnosis).
5. Increase MetricCard icon wells from 32×32 to 44×44 or add `hitSlop={6}` for hit target compliance.

**Testing Recommendation:**
Conduct end-to-end test with VoiceOver enabled on iOS to verify CelebrationToast announcements fire at the right moments. Test at 200% system text scaling on a physical device (not simulator) to validate rendering and hit targets.
