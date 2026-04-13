# Elif — 10-day diary (new casual fan)

## Day 1 (Mon Apr 6) — First install
**What I did:** Installed Scorepion after a friend's invite. Hit the Auth screen (light beige, emerald logo, clean form), created an account with username + password. Tapped "Create Account" → hit the Onboarding flow. Breezed through 4 steps (welcome feature list, set username with avatar preview, pick leagues, ready summary). All the onboarding surface was white + hairline borders, very calm. Final "Start Predicting" button sent me to the Home tab.

**Liked:** The onboarding is frictionless — zero confusion about what to do next. Each step felt like a natural breath, not a punishing wall of info. The progress dots were subtle but clear. The emerald logo mark and the clean typography made me feel like this was a real, professional app.

**Didn't like:** The tagline "Predict. Compete. Climb." is on the auth screen, then again on the onboarding welcome step — felt redundant. Also, the onboarding inputs don't give me a sense of what the app *actually does* — I have to piece it together from the feature list (Predict, Climb, Compete, Streak). Would've loved a short match prediction example in the welcome flow.

**Bugs or dead ends:** None I could see. The flow was solid.

---

## Day 2 (Tue Apr 7) — CL QF first leg
**What I did:** Opened the Home tab. Saw the Streak hero with a flame icon (0 streak, I'm new), three metric cards below it (Best, Week pts, Reset), then a "Your daily pack" gradient card showing 0/3 predicted. Tapped the card to go to Matches tab. Saw today's fixtures filtered by "upcoming" — Chelsea vs Ipswich, Newcastle vs Man Utd (PL), plus two CL QF L1 legs. Tapped Arsenal vs Real Madrid. Entered the Match Detail screen with a white hero card, the two team logos, a prediction stepper (Home / Draw / Away), and a big emerald "Lock In" button.

**Liked:** The Daily Pack hero uses the emerald gradient, which feels earned and celebratory. The Matches tab's collapsible date/league sections let me organize things without scrolling endlessly. The Match Detail stepper is big and easy to tap — feels like it's designed for me, not a power user.

**Didn't like:** The match detail hero is plain white + hairline, even though it's Arsenal vs Real Madrid (a *huge* match). I expected *something* — maybe a "Big Match" badge or a golden glow? Also, no obvious "most-picked score" social proof visible before I lock in. Makes me feel like I'm predicting in a vacuum.

**Bugs or dead ends:** Tried swiping left/right on the prediction stepper — didn't work. Unclear if this should be tap-only or if swipe should be supported. Also, the "Locked in" state after I predict isn't visually distinct enough — I had to re-tap to confirm I actually locked in.

---

## Day 3 (Wed Apr 8) — CL QF L1
**What I did:** Home shows my streak is now 1 (I got the Arsenal match right!). Daily pack is 1/4 predicted. Went to Matches, saw PSG vs Aston Villa and Barcelona vs Dortmund. Tapped PSG match. Made my first group-aware prediction (I see a "Compete with friends" pill now). Locked in.

**Liked:** The streak counter on Home went from 0 to 1 with a little flame emoji — it feels real now. The prediction outcome (Correct +10) on the match card uses a green checkmark pill, which is consistent.

**Didn't like:** No celebration moment when I locked in the prediction. No toast, no haptic, nothing. The outcome shows *after* the match finishes, but there's no "you got it right!" moment in real time. Also, I tried to tap a group pill and nothing happened — is the group feature fully connected?

**Bugs or dead ends:** The group pill might be a dead end on match detail — tapping it doesn't navigate anywhere. Also, the "most-picked score" section on match detail is hidden behind a FilterSegmented tab (Overview | Stats | Community) that I had to hunt for.

---

## Day 4 (Thu Apr 9) — Europa QF L1
**What I did:** Morning: checked Home, my streak is still 1 but I see "0 reset" (waiting for the next cycle). Daily pack now shows 2/5. Went to Matches, filtered by "live" and saw Lyon vs Man Utd is kicking off. Watched the match card update in real-time (LIVE badge, live minute counter, live score). Made a prediction during the match (which I realize might be too late, but the app let me). Tried to lock in but got an error or state I couldn't recover from.

**Liked:** The match card live state with the red LIVE badge + minute counter is clean and obvious. The refresh-on-pull gesture on Matches list works well.

**Didn't like:** I broke my streak (got the Europa match wrong). No explanation of *why* I broke it — just the streak counter went from 1 to 0. Also, predicting during a live match feels wrong, and the app didn't stop me (maybe it should?). The "prediction locked" state on a live match felt ambiguous — am I locked? Can I change my mind?

**Bugs or dead ends:** Hard to tell if the live-match prediction lock is intentional or a UX miss. Also, the streak reset explanation ("Reset: 0") is cryptic — I don't know what "0" means. Hours? Days? Cycle number?

---

## Day 5 (Fri Apr 10) — Premier League
**What I did:** Day 5 is tier promotion day (per the brief). Opened Home, and I see my streak is back to "0" but there's a "Tier 1" badge and a celebration card I hadn't seen before. A TierBadge component with gold accents. Went to Matches, saw Fulham vs Liverpool (big match). Made a quick prediction, locked in. Went back to Home to check my "Your Rank" section — now I'm at rank #47 globally with a small emerald hero card.

**Liked:** The tier badge uses a gold gradient, which feels special and distinct from the usual emerald. The rank hero card on Home finally has some visual weight — it's an emerald GradientHero with white text, which makes my rank feel *earned*.

**Didn't like:** The tier promotion notification didn't pop up on lock-in. I had to manually navigate back to Home to see the tier badge. No confetti, no success haptic, nothing. Also, the "Your Rank" hero card on Home only shows *my* rank (#47) and points — no breakdown of what bumped me up or how close I am to the next tier. Had to go to the Leaderboard tab to understand the tier system at all.

**Bugs or dead ends:** The tier promotion *should* have a celebration moment but doesn't appear to fire. I see the badge exists in the code (TierBadge component) but the orchestration of showing it at the right time is missing or unclear.

---

## Day 6 (Sat Apr 11) — Weekend peak
**What I did:** Saturday morning. Daily pack now shows 4 matches (Chelsea-Ipswich, Newcastle-Man Utd from the PL, plus two others). Prediction flow is now routine: Home → Daily pack card → Matches → tap a match → predict → lock in. Made 4 predictions across the day as matches kicked off. Went to Leaderboard, saw the global rankings in a FilterSegmented (Weekly | Monthly | All Time). My rank stayed around #47.

**Liked:** The four match card carousel on Home (now showing all 4 in the daily pack) is easy to scan. The match cards are consistent: league chip + team logos + kickoff time. The prediction pill (my 0–2 prediction) shows on each card, so I can see my full daily pack at a glance.

**Didn't like:** The Leaderboard screen is all white cards with green names for top 3 — but nothing about the visual hierarchy makes it *feel* like a competition. Where's the podium? Where's the gold/silver/bronze? Just numbers on white cards. Also, I have no idea what "Weekly" resets or when — the PeriodStrip card says "Ends in 3 days" but I don't know if that means Tuesday or Wednesday.

**Bugs or dead ends:** None, but UX-wise, the leaderboard doesn't *feel* competitive. It's too quiet for what's supposed to be a social product.

---

## Day 7 (Sun Apr 12) — Weekend finale
**What I did:** Sunday evening. Made my final 2 predictions (Arsenal-Brentford, Aston Villa-Nott'm Forest). Went to Leaderboard after the last match, reordered by "All Time" to see if I moved. My rank dropped to #52 (I got a couple wrong). No celebration, no demotion notice — just a number that changed.

**Liked:** The FilterSegmented on Leaderboard (Weekly | Monthly | All Time) is the right pattern — clean, emerald when active, easy to switch. The list is long-scrollable and shows each player's avatar initial + username + points + streak.

**Didn't like:** Leaderboard rows all look identical — no visual distinction for myself (I should be highlighted), no indicator of which direction I moved (up/down arrows?), no badge showing my tier on the list. The list is basically just: rank, name, points, streak, right arrow. That's it. For a social prediction product, it feels sterile.

**Bugs or dead ends:** The "Your Rank" hero card on Home should probably sync with the Leaderboard, but they feel disconnected. The hero shows me at #47 but the Leaderboard shows #52 — either they're on different data or there's a refresh lag.

---

## Day 8 (Mon Apr 13) — CL QF L2
**What I did:** Opened Home, streak is now "1" again (I got 3 correct out of 5 this weekend). Went to Matches, saw the CL QF L2 legs: Real Madrid vs Arsenal, Inter vs Bayern. Tapped Real Madrid vs Arsenal to see the Match Detail. This time I notice the hero card shows the previous match (Real Madrid beat Arsenal 3-1 in the first leg). Below it, I can scroll down to see stats, H2H history, and community picks. Made my prediction for the second leg.

**Liked:** The Match Detail hero is consistent — it's white + hairline, but now I see it includes recent head-to-head history as a scrollable list of past matches. The H2H cards are simple: date, competition, score with green tint for the winner. That's useful context without being noisy.

**Didn't like:** The previous-match hero (showing the first leg result) doesn't stand out visually from an upcoming match hero. I had to read the score to realize it was a past result, not the upcoming match. Also, the H2H section has match cards that *almost* look like the main match card, but they're slightly different in style — gray accents instead of colored. Feels inconsistent.

**Bugs or dead ends:** None, but UX-wise, past-match vs. future-match hero states could be clearer.

---

## Day 9 (Tue Apr 14) — CL QF L2 continues
**What I did:** Made predictions for Aston Villa vs PSG and Dortmund vs Barcelona. Went to the Groups tab to see if I could join a group or view my group standings. Saw an empty state: "No groups yet" with a "Create" button. My friend mentioned they have a group but I didn't see an invite flow. Tried searching for their group by name — found it, tapped "Join", got confirmation.

**Liked:** The group create/discover flow uses the standard emerald Button and a clean FilterSegmented (My | Discover). The group discovery list shows group name, member count, leagues, and a "Join" button.

**Didn't like:** Joining the group didn't immediately show me my standings in that group. I had to navigate back to the group detail to see I'm now ranked #18 out of 20. No notification, no celebration of joining. Also, the group standings screen is just a white card list (like the global leaderboard) — no sense that I'm competing with actual people I know.

**Bugs or dead ends:** The group invite flow is missing — I had to discover and manually join instead of being invited by my friend. Also, no group chat or messaging feature visible, which limits the "Compete with friends" pitch.

---

## Day 10 (Wed Apr 15) — Europa QF L2 + reflection
**What I did:** Made final predictions for Europa QF second legs (Lyon-Man Utd, Athletic-Rangers). Opened the Leaderboard one more time, my global rank is #44 (streaky movements). My group rank in my friend's squad: #16 out of 20. Overall points: 287 (not tracked on any single dashboard, had to piece it together from Leaderboard + Home metrics). Went to Profile to see my overall stats.

**Liked:** The Profile tab shows a solid summary: username, total points, all-time streak, best streak, win rate (24/55 correct). The layout is clean and uses the same white + hairline card system. TierBadge is visible in the header.

**Didn't like:** There's no unified "My Stats" view. I see some on Home (streak, week points, best streak), some on Leaderboard (global rank), some on Groups (group rank), some on Profile (points, win rate). No single "here's how you did this week" scorecard. Also, no historical view — no way to see my points over time or my accuracy trend.

**Bugs or dead ends:** The stat fragmentation means I have to visit 4+ screens to get a full picture of my performance. For a competitive/social product, a unified dashboard would close that gap.

---

## Verdict

- **Favorite day:** Day 1. The onboarding is frictionless and feels premium. Every step was clear, the emerald branding was consistent, and I didn't feel lost once. This is what "simplicity and zero friction" looks like.
- **Least favorite day:** Day 9. Joining a group should have been a celebration moment, but it was silent. No confetti, no "Welcome to your squad!" toast, no group chat integration. For a social product, that's a big miss.
- **One concrete fix I'd ship tomorrow:** Add celebration toasts/haptics for key moments: prediction lock-in (small success haptic), streak ticks (flame animation + medium haptic), tier promotions (gold gradient hero + heavy haptic), and group joins (large celebration toast + success chain). These moments currently feel silent and lost.

---

## Bugs & dead ends summary

- **auth.tsx, line 216–220:** Logo mark uses `shadowColor` + `shadowOpacity` + `shadowRadius` + `elevation`, which contradicts the Design Guide (§5, Elevation) that forbids shadows on non-celebration surfaces. The logo is fine to glow, but the style should use the `GradientHero` pattern, not raw shadow tokens.
- **onboarding.tsx, line 320–331:** `logoMark` for the welcome step also uses raw shadows instead of the glow pattern. Inconsistent with the auth logo.
- **Match Detail:** No live prediction lock-in confirmation. Predicting on a live match (after kickoff) should be blocked or clearly marked as "locked" with a visual confirmation toast.
- **Leaderboard sync issue:** Home's "Your Rank" hero and the Leaderboard screen show different rank numbers (e.g., #47 vs #52). Likely a refresh lag, but feels broken to a new user.
- **Group invite flow:** No invite-by-link or invite-by-friend-username visible. Users have to manually discover and join groups, limiting the "Compete with friends" flow promised in onboarding.
- **Stat fragmentation:** Home shows streak, Leaderboard shows rank, Groups shows group rank, Profile shows total points. No unified stats dashboard. For a competitive product, this is a UX gap.
- **Group join notification:** Joining a group produces no toast, haptic, or celebration moment. Feels silent and unrewarding.
- **Tier promotion:** TierBadge component exists and appears on Profile, but the moment of tier promotion (when a user should see a celebration modal) is missing or non-obvious.
- **Match Detail hero state:** Past-result hero (first leg) is visually identical to upcoming-match hero. Should use a secondary state (lighter, grayed out, or marked "Previous result").
- **Group messaging:** No chat or message system visible in Groups tab, which undermines the "Compete with friends" positioning.

