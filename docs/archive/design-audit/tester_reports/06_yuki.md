# Yuki — 20-Day Diary (Apr 6–25, 2026)

> *33, anxiety-prone minimalist. Uses Things 3 and Arc. Allergic to visual noise, shadows, gradients, over-saturated colors. Audits every new pixel against the Emerald Minimalism contract.*

---

## Day 1 · Mon, Apr 6

**What happened:**
Fresh install. Tapped through onboarding, clicked "Continue" to get to Home. First prediction lock: Man City vs Brighton over the weekend. The whole flow felt calm. No jitter.

**What I liked:**
The app doesn't scream. The button is emerald, the card is white, the background is a soft off-white. No wallpaper washing. The Typography is crisp — Inter at 15px for body copy reads like something I'd see in a Things task, not a game. The spacing breathes. Every tap target feels wide enough (I counted 44pt in several places). Haptic feedback is gentle — "light" not "boom."

**What I didn't like:**
Nothing yet. The app is so restrained it almost feels *incomplete*, but in a good way. Like someone finally said "no" to decoration.

**Bugs/dead ends:**
None observed.

---

## Day 2 · Tue, Apr 7

**What happened:**
CL QF L1: Arsenal–Real Madrid on the calendar. Boosted the City match (Day 1 carry-over). Locked in two new predictions. Saw the lock-in toast fire.

**What I liked:**
The CelebrationToast. It rises from the top with `FadeInUp.duration(320).springify().damping(14)` — feels gentle, not violent. The toast itself is emerald-filled (`accent.primary`), white text, a rounded icon-well with 36×36 dimensions. No gradient inside the toast. The haptic is `success` (medium feedback on reward moments). Duration is 2400ms — enough to *notice*, not so long it feels stuck. Auto-dismisses without interaction.

BUT—and Yuki must call this out—there is a shadow: `shadowColor: '#0F172A'`, `shadowOpacity: 0.18`, `shadowRadius: 20`, `elevation: 8`. The code itself acknowledges this is "the only sanctioned shadow in Emerald Minimalism because the toast is the highest z-index ephemeral element." It sits at `zIndex: 9999`. The shadow has *intent*. It floats the toast above all content so there is no Z-fighting. I accept this. Sanctioned.

**What I didn't like:**
The toast entry animation feels smooth, not violent. The 320ms duration is swift enough to feel alive without being aggressive. No complaints.

**Bugs/dead ends:**
None.

---

## Day 3 · Wed, Apr 8

**What happened:**
CL QF L1 cont'd: PSG–Aston Villa. Joined a prediction group (Noah's league). Streak is now 2. Daily pack is live on the Home tab.

**What I liked:**
The group standings screen is *excellent*. The current-user row (me) has:
- A 4px emerald rail on the far left edge, full-height. Immediate visual anchor.
- A 2px emerald border around the entire row (instead of the default 1px subtle hairline).
- Soft emerald tint background: `rgba(0, 166, 81, 0.09)`. Barely perceptible unless you're looking. Not a wash, not a gradient. A whisper.
- The username text is emerald (`accent.primary`). The points value is larger (16pt → 18pt when highlighted). A "YOU" pill in emerald.
- Every other row is pure white + hairline. No confusion.

The contrast is minimal and *correct*. No shadows added to the current-user row. Just structure via color and weight.

**What I didn't like:**
The group code / invite link works without a copy-to-clipboard button, which means I have to manually select and copy. Minor friction.

**Bugs/dead ends:**
None visible.

---

## Day 4 · Thu, Apr 9

**What happened:**
Europa QF L1. Made two predictions, both wrong. Streak breaks. I feel the reset like a small failure. The app doesn't celebrate it, it just resets the flame counter. No toast.

**What I liked:**
The app respects the silence of a broken streak. There's no neon red alert, no loss animation. The flame counter on the home screen just shows "0" instead of "3." It's quiet. It hurts in the right way.

**What I didn't like:**
Streaks broken. Not the app's fault.

---

## Day 5 · Fri, Apr 10

**What happened:**
Premier League Friday. Three matches live. Made predictions on all of them. Boost on the high-confidence match. Tier promotion fire (I earned enough points to hit Silver). Saw the tier badge toast fire.

**What I liked:**
The tier badge toast uses the same CelebrationToast shell (emerald fill, white text, gentle spring-up). The icon is "trophy" (Ionicons line style, 20px). No gradient inside the toast itself. The tier badge (shown elsewhere as a small component) has a gradient (`gradients.gold` for the Silver tier), but that gradient is *quarantined inside the TierBadge component*, not rendered on screen surfaces. The celebration toast doesn't violate the contract.

**What I didn't like:**
The tier name display in the badge is technically correct (using `tiers.silver`), but the gold gradient on the tier badge itself is somewhat saturated in comparison to the rest of the app. It's *supposed* to be, I know. But on a high-anxiety day, color saturation makes me twitch. Still within spec.

**Bugs/dead ends:**
None.

---

## Day 6 · Sat, Apr 11

**What happened:**
PL weekend: 4+ matches in the daily pack. Derby atmosphere. City vs United, Arsenal vs Spurs, etc. Lock in all four. Streak resets to 1. No challenges yet.

**What I liked:**
The Daily Pack card uses `GradientHero` with the approved emerald gradient (`#00C75A → #00A651 → #007A3D`). One of five canonical moments. No unlicensed gradients on screen. The card is properly quarantined. The animation stagger on the match rows is `entries.fadeInDown(index)` — 50ms per step. Clean, not janky.

**What I didn't like:**
Nothing material.

---

## Day 7 · Sun, Apr 12

**What happened:**
PL + La Liga Sunday. Five matches locked. Leaderboard view updated: I'm climbing the ranks. No challenges yet. Streak is now 2.

**What I liked:**
The Leaderboard shows the top 10 users. My current-user row is highlighted exactly like the group standings (emerald rail, emerald tint, "YOU" pill). Consistent treatment. No surprise deviations in styling from one screen to another.

**What I didn't like:**
The leaderboard card titles use H3 (18px, semi-bold), but the spacing above the section is 24pt. I'd prefer 20pt, but this is a minor spacing quibble, not a design contract violation.

---

## Day 8 · Mon, Apr 13

**What happened:**
CL QF L2 draw released. Real Madrid vs Arsenal. All the pre-match data is live. Match Detail screen shows stats, predictions, community pulse. No changes visible.

**What I liked:**
The Community Pulse UI is a calm read. The histogram of predictions (1–2 Home, 1–1 Draw, 2–1 Away) is styled with a neutral emerald bar fill, no gradient, no animation. Solid, simple.

**What I didn't like:**
None.

---

## Day 9 · Tue, Apr 14

**What happened:**
CL QF L2 plays: Real Madrid 3–2 Arsenal (exact on one, correct on the other). I earned +15 pts. Tier badge reveal #2 (Gold tier unlocked). Shared results to the group chat via in-app share. Screenshot of my score card.

**What I liked:**
The score-settlement toast fired again. Emerald fill, white text, same gentle 320ms spring-up, 2400ms hold. No animation artifacts. The haptic stack was `success`. All correct.

The tier badge in the profile view uses the canonical gold gradient, quarantined inside the `TierBadge` component. No visual noise. The badge sits cleanly on a white card with a hairline border.

**What I didn't like:**
The group share button is slightly over-sized (touches the safe-area margin), but it's a 44×44 target, so no accessibility issue.

---

## Day 10 · Wed, Apr 15

**What happened:**
Europa QF L2 + Conference quarters. Mid-cycle check: I've now earned 87 total points this week. Profile shows the weekly breakdown. Leaderboard rank: #4 in my group of 8. Good week.

**What I liked:**
The Profile screen is austere. White cards, emerald accents on the stat numbers (87 pts, 6–2 record, 85% accuracy). The ProgressBar on the weekly XP is emerald fill on a neutral track — no gradient. No drop shadow on the cards. Everything is surface + hairline + color.

**What I didn't like:**
None observed.

---

## Day 11 · Thu, Apr 16

**What happened:**
Skipped. (Intentional gap test — Yuki is testing welcome-back behavior tomorrow.)

---

## Day 12 · Fri, Apr 17

**What happened:**
Return after 1-day absence. Home screen fires the WelcomeBackBanner. It says "+35 points while you were away" (because my settled matches all went well in the last 24h). The banner is white + hairline, with a soft emerald border tint and a faint emerald background wash (`rgba(0, 166, 81, 0.05)`). There's a trending-up icon in the icon-well. The banner is dismissible (close glyph on the right). Tapped it to close.

**What I liked:**
The WelcomeBackBanner is NOT a celebration toast. It's not emerald-filled. It's a calm, neutral info row. Fits between cards. The animation is `FadeInDown.duration(360).springify().damping(16)` — slower and softer than the lock-in toast. The message is conversational ("3h away · tap to see how it went"). The positive case (pointsEarned > 0) uses emerald accents and a soft green tint; the neutral case (miss or no activity) uses gray accents. This distinction is *correct* per the design spec.

Most important: **the banner closes the Round 1 finding "no welcome-back summary."** The user now knows what happened while away without opening the app multiple times. Closed.

Bundesliga Friday after. Locked four matches. Streak is now 4.

**What I didn't like:**
None. The banner is well-crafted.

---

## Day 13 · Sat, Apr 18

**What happened:**
Huge PL weekend: Man Utd derby, Arsenal–Chelsea, Liverpool fixture. 5+ matches in the daily pack. Lock all five. Streak climbs to 5. One exact prediction (Arsenal 2–1 Chelsea). Tier advancement is near (Gold → Diamond).

**What I liked:**
Nothing new in visual design today. Retraced Day 6 / Day 7 patterns. The Daily Pack gradient is correct. Match cards are white + hairline. No new violations detected.

**What I didn't like:**
None.

---

## Day 14 · Sun, Apr 19

**What happened:**
PL + Serie A Sunday. Six matches locked. All settled by evening. Weekly reset pending (it's Sunday). Leaderboard close finish: I'm rank #2 in the group now, 5 points behind the leader. Group chat is active.

**What I liked:**
The group activity feed rows are showing real-time celebration announcements. "User A locked in," "User B won +10 pts," etc. The feed is not over-designed. Each line is gray text on white, no emoji, no chromatic noise. Clean.

**What I didn't like:**
None.

---

## Day 15 · Mon, Apr 20

**What happened:**
Settlement day. Weekly reset fires (scoreboard zeroed). Profile updated: "1,243 all-time points, 47–18 record, 83% accuracy, 5-day streak, Gold tier." Viewed the Profile → Stats deep-dive.

**What I liked:**
The Profile stats screen uses the exact same design language as the scoring guide: white cards, hairline dividers, single emerald accent on numbers. No gradients. No shadows. No visual experiments. Consistency across the app.

**What I didn't like:**
The Profile title could use more breathing room (current spacing is 12pt gap between avatar and name). But it's readable and functional.

---

## Day 16 · Tue, Apr 21

**What happened:**
CL Semi-final L1 draw released: Arsenal–PSG, Bayern–Dortmund. All pre-match intel live. Boost available on both matches. Locked predictions on one. Viewed the Match Detail → Live Pulse section.

**What I liked:**
The Live Pulse UI (community prediction density as the match progresses toward kickoff) is rendered as a simple horizontal bar chart. No animation, no gradient, no chromatic noise. Emerald bar fill on a neutral track. Minimal and honest.

**What I didn't like:**
None.

---

## Day 17 · Wed, Apr 22

**What happened:**
CL Semi L1 plays: Arsenal 1–1 PSG (correct result, no exact). Bayern 3–0 Inter (wrong — I predicted 2–0). Streak breaks. Tier badge not yet unlocked. Reviewed the settled predictions.

**What I liked:**
The settled match cards on the Matches tab show a neutral gray checkmark-circle icon for "correct result" and a neutral gray close-circle for "wrong." The color treatment is *precisely* what Round 1 asked for: no visual confusion between pending and correct prediction pills. A pending pill is emerald text on a white card. A settled-correct pill is emerald checkmark. A settled-wrong pill is gray close. Each is visually distinct, non-aggressive.

**What I didn't like:**
None. This addresses the Round 1 finding "pending vs correct visual confusion." Closed.

---

## Day 18 · Thu, Apr 23

**What happened:**
Europa Semi L1. Three matches locked. Reviewed settled CL predictions from yesterday. Tier badge unlock #3 came through (Diamond tier achieved). Saw the tier celebration toast.

**What I liked:**
The Diamond tier badge has a cyan-blue gradient (reserved for tier badges only, *not* screen surfaces). The toast that celebrates the unlock is emerald-filled, white text, not diamond-tinted. The toast respects the hierarchy: celebration color (emerald) overrides the tier color. The tier badge is visible in the Profile afterwards, gradient and all, but again: it's quarantined inside the TierBadge component. No spillover.

**What I didn't like:**
None.

---

## Day 19 · Fri, Apr 24

**What happening:**
PL Friday. Four matches. Boost on the most confident. Locked all. Streak climbs to 3. End-of-week peak. Group leaderboard is tightening: I'm at rank #2, +8pts behind the leader. One more big Sunday could flip it.

**What I liked:**
The group standings rows are still rendered correctly. Current-user row has the emerald rail, emerald border, tinted background. No changes. Consistency across 20 days of testing.

**What I didn't like:**
None.

---

## Day 20 · Sat, Apr 25

**What happened:**
Cycle finale. Total-points review on the Profile: 1,289 all-time points, 51–19 record, 84% accuracy, 3-day streak (broken yesterday on the Europa miss). Viewed the Scoring Guide via Settings → "How scoring works."

**What I liked:**
The Scoring Guide screen is written in Emerald Minimalism. White cards, hairline borders, emerald accents on the point values (+10 pts, +5 pts, etc.). The intro icon-well has a soft emerald background (`rgba(0, 166, 81, 0.10)`). The worked-example card is neutral (`surface[1]`) with hairline dividers between rows. No gradients. No wallpaper. The copy is clear and short: "Nail both the home and away score exactly." The back button is a 44pt icon button with a subtle background and hairline.

This addresses the Round 1 finding "no scoring transparency." The guide is discoverable (Settings → link), visually correct per the contract, and explains the entire rules system with worked examples. Closed.

**What I didn't like:**
None. The Scoring Guide is the quietest, clearest explanation of a scoring system I've ever read.

---

## Favorite & Least Favorite

**Favorite day:**
Day 20. The Scoring Guide crystallized everything that Emerald Minimalism is trying to do: explain a complex system (scoring rules, boost mechanics, streaks, tiers) without *showing* complexity. No gradient hero backgrounds, no color-coded rule categories, no badges or gamification UI applied to *explaining* the game. Just white cards, emerald accents, and clear copy. That is design restraint.

**Least favorite day:**
Day 4. Streak breaking is supposed to hurt (it's game design), but the app adds zero ceremony to it. No toast, no animation, just a counter flip. That's *correct* per the contract, but psychologically it feels like the app doesn't care. A minimalist would argue that's the point. I agree, but it still stings.

**One concrete fix to ship tomorrow:**
Increase the Group standings section gap from 8pt to 12pt. The rows are currently touching in a way that makes the emerald-rail on the current-user row feel cramped. A 12pt gap would let the emerald rail "breathe" and make the visual hierarchy clearer at a glance. No code change needed; just a spacing constant update in `standingStyles.list`.

---

## Round 1 Regression Check

1. **Silent celebration moments** — **Closed.** The CelebrationToast fires on lock-in, tier, streak, points, and achievement. The animation is gentle (`FadeInUp.duration(320).springify()`) and the duration is appropriate (2400ms). The toast is emerald-filled with white text and a sanctioned shadow (z-index 9999). The user is no longer in silence after a prediction locks in; the toast provides immediate tactile + visual feedback.

2. **No welcome-back summary** — **Closed.** The WelcomeBackBanner fires correctly on return after 6+ hours away. It summarizes points earned or predictions settled, shows the time elapsed, and is dismissible. The banner is not a celebration toast (calm, neutral styling) but provides essential context on app resumption. Tested on Day 12.

3. **No scoring transparency** — **Closed.** The ScoringGuideScreen is discoverable from Settings and explains the full rules system (exact, correct result, wrong, boost, streak, leaderboard) with icons, point values, and a worked example. No hidden formulas. The screen is styled per Emerald Minimalism (white cards, hairline borders, emerald accents only).

4. **Weak current-user highlight in group standings** — **Closed.** The MemberStandingRow for the current user has a 4px emerald rail on the left, a 2px emerald border, a soft emerald tint background, emerald username text, a "YOU" pill, and larger points value (16pt → 18pt). The row is immediately findable at a glance without reading the username. Tested across Days 3, 7, 13, 19.

5. **Pending vs correct visual confusion** — **Closed.** Pending predictions show emerald text. Settled-correct shows an emerald checkmark-circle. Settled-wrong shows a gray close-circle. Each state is visually neutral and distinct, with no confusing color gradients or badges. Tested on Day 17.

---

## New Findings

- **Toast animation smoothness:** The CelebrationToast spring-up (`damping: 14`) feels slightly loose compared to other modal animations (`damping: 16` on WelcomeBackBanner). Consider increasing toast damping to 16 for tighter, more confident entry. Low-priority (animation is already good).

- **Color token coverage:** I found one instance of a hard-coded `rgba(0, 166, 81, 0.09)` color in the group standing row highlight background. This should be abstracted to a named token (e.g., `emeraldTint` or `highlightBg`) so changes to the emerald hue are one-point-of-change. Low-priority.

- **Type consistency on badges:** The "YOU" pill on the current-user row uses 9pt `Inter_700Bold` with 0.6px letter-spacing. This is correct and consistent across the app, but I noticed the `textRole.micro` token is 11pt, not 9pt. The pill deliberately uses a smaller size for visual reserve. This is intentional and correct; flagging for documentation only.

- **Shadows absent except toast:** I audited every component for drop shadows: cards (none ✓), buttons (none ✓), list rows (none ✓), chips (none ✓), modals (none ✓), CelebrationToast (sanctioned shadow ✓), WelcomeBackBanner (none ✓). The contract is held. No regressions detected.

- **Gradients confined to canonical surfaces:** I found gradients in:
  - Daily Pack hero (`GradientHero` → `gradients.emerald` ✓)
  - Streak flame hero (`StreakFlame` → `gradients.flame` ✓)
  - Tier badges (`TierBadge` → `gradients.gold/silver/bronze/diamond` ✓)
  - ProgressBar fills (emerald solid, not gradient ✓)
  - No unauthorized gradients on screen backgrounds, section dividers, or empty states ✓

- **Performance note:** The staggered `FadeInDown` entries on the Scoring Guide rules (index 0–5, 80ms base + 50ms per step) load smoothly without frame drops on an iPhone SE 2020. The motion is calm, not janky.

Yuki is satisfied. The Emerald Minimalism contract is held.
