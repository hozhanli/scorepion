# Marco — 10-day diary (power user, ex-Sorare)

> 34-year-old ex-Sorare player. iPhone 15 Pro. Demands speed, density, lowest taps-per-action. Hyper-critical of friction.

---

## Day 1 (Mon Apr 6) — First install — onboarding + first prediction

**What I did:**
- Launch app → onboarding flow (username entry → league selection)
- Skip detailed walkthrough, tap *Complete Onboarding*
- Land on Home screen (Today tab)
- Tap Daily Pack card → navigate to Matches tab
- Search for upcoming match (Burnley–Brighton)
- Tap match card → Match Detail screen
- Set prediction: Home 2, Away 1 via stepper taps
- Review outcome ("Brighton win")
- Tap *Lock In* button
- Back to Matches tab

**Taps to complete first prediction:**
1. Home tab loaded (already there)
2. Daily Pack card → Matches tab (1 tap)
3. Match card (Burnley–Brighton) (1 tap)
4. Home team stepper + (2 taps to reach 2)
5. Away team stepper + (1 tap to reach 1)
6. Lock In button (1 tap)
7. Back to Matches (1 auto-pop on iOS)

**Total: 7 taps** (or 6 if back is auto)

**Liked:**
- ScreenHeader is consistent and clean—no redundant back buttons wasting space (app/(tabs)/_layout.tsx shows unified Liquid Glass tabs)
- MatchCard design is dense: league chip, team logos, score, time, prediction pill all in one compact row (MatchCard.tsx:296–471)
- Stepper buttons have good 44pt hit targets with `hitSlop={6}` (app/match/[id].tsx:496–520), haptic feedback on each tap is satisfying
- Outcome chip shows result prediction inline, no extra modal (app/match/[id].tsx:561–577)
- No confirmation dialogs = speed

**Didn't like:**
- Onboarding requires username entry before I can play. Would prefer skip-to-demo (Elif's first test friction point, but I get it)
- Daily Pack card on Home only shows matches if dailyPack exists—initially empty on Day 1 (Home index.tsx:251–261). Should show a "Check back" card or link to build first pack immediately
- Match Detail hero is white + hairline for upcoming—fine, but feels a bit anticlimactic compared to Sorare's match cards. Emerald GradientHero is only for LIVE (§6.10 of audit). Understand the minimalism, but hero should *feel* clickable with stronger visual weight

**Bugs:**
- None critical; app initializes cleanly from cold install

---

## Day 2 (Tue Apr 7) — Streak = 1 — boost a big match

**What I did:**
- Home tab → already see streak (1) in StreakFlame hero (Home index.tsx:233–240)
- Tap "Your daily pack" card → jumps to Matches tab, filter = "all"
- Spot Arsenal–Real Madrid (CL QF L1, big match)
- Tap match card → Match Detail
- See it's a Daily Pick (isDailyPick = true, shows "Daily pick" badge in hero meta, app/match/[id].tsx:309–316)
- Scroll down to boost toggle (boostToggle visible, isBoosted = false, app/match/[id].tsx:580–599)
- Tap boost toggle to activate (2× points)
- Set prediction 2–1 (Home)
- Tap Lock In
- Back to list

**Taps to activate boost + predict:**
1. Tap Daily Pack card → Matches (1 tap)
2. Tap Arsenal–Real Madrid card (1 tap)
3. Boost toggle (1 tap)
4. Home stepper + twice (2 taps)
5. Away stepper + once (1 tap)
6. Lock In (1 tap)
7. Back (1 auto-pop)

**Total: 7 taps** (including boost)

**Liked:**
- Boost toggle is a full card (not a chip), so 44pt hit target guaranteed
- "Boost active (2× points)" text is immediately clear
- Boost appears only when isDailyPick && boostAvailable, so no clutter on non-daily matches (app/match/[id].tsx:580)
- Returning to Matches auto-shows updated prediction pill on that card (no re-tap needed)

**Didn't like:**
- Boost is its own swipeable card below the prediction section. On a iPhone 15, I need to scroll to see it. For a power user who wants one-tap-in, one-tap-out, this is a 2–3 extra scrolls on Day 2 (Context: Sorare showed boosts inline in match cards)
- No keyboard shortcut to increment stepper (e.g., arrow keys or swipe). Only touch taps. Speed loss for someone used to Sorare's quicker input

**Bugs:**
- None

---

## Day 3 (Wed Apr 8) — Streak = 2 — join a group

**What I did:**
- Home tab
- Tap avatar (right slot, app/index.tsx:204–213) → Profile tab
- Profile shows groups section (not shown fully, but Groups tab visible in tab bar, app/(tabs)/_layout.tsx:35–37)
- Tap Groups tab (app/(tabs)/groups, not provided but referenced)
- Browse public groups
- Tap "Join group" on "Champions League Watchers"
- Confirmation or inline join (speed depends on flow)
- Back to Today
- Tap Matches
- Spot PSG–Aston Villa (in same group now)
- Predict 1–0 (Home)

**Taps for group join + match:**
1. Avatar button → Profile (1 tap)
2. Groups tab (1 tap via tab bar)
3. Join group (1 tap)
4. Confirmation (1 tap, if required)
5. Back to Home (1 auto-pop)
6. Matches tab (1 tap)
7. PSG–Aston Villa card (1 tap)
8. Home stepper + (1 tap)
9. Lock In (1 tap)

**Total: 9 taps**

**Liked:**
- Groups tab is first-class in tab bar (Tab bar has 5 tabs: Today, Matches, Standings, Groups, Profile, app/(tabs)/_layout.tsx:23–43)
- Consistency: all screens use ScreenHeader, all cards use MatchCard

**Didn't like:**
- No Groups source provided; can't audit UI. Assume standard join flow, but if it requires 2 taps (choose group + confirm), that's death by a thousand cuts for a power user
- Prediction count is now buried in leaderboard; Home screen doesn't show "You have X pending predictions" summary. Should mirror Daily Pack card into a persistent metric

**Bugs:**
- Groups tab not in provided files; can't verify for dead ends

---

## Day 4 (Thu Apr 9) — Streak breaks (missed exact) — feel the reset

**What I did:**
- Wake, open app
- Home screen: Streak = 0 (reset from yesterday's missed exact prediction)
- StreakFlame now shows 0, best = 2 (app/index.tsx:175–176, uses userStats?.streak)
- Daily Pack shows 2/4 completed (matched to yesterday's unsettled predictions)
- Tap Matches tab
- Filter = "finished" to see yesterday's results
- Europa QF L1: Lyon–Man Utd, I had predicted 2–1 (Home), but scored 1–1
- Tap card → Match Detail shows my prediction pill as "No points" (grey, miss outcome)
- Scroll down, see settled = true, no edit option (handleEdit blocked by matchStarted, app/match/[id].tsx:208–212)
- Back
- Tap today's matches
- Filter = "upcoming"
- Set predictions for today's 3 remaining daily picks

**Taps for reviewing past result + setting new predictions:**
1. Matches tab (1 tap)
2. Filter "finished" (1 tap on FilterSegmented, app/matches.tsx:261–270)
3. Lyon–Man Utd card (1 tap)
4. Back (1 auto)
5. Filter "upcoming" (1 tap)
6. Athletic–Rangers card (1 tap)
7. Home +1, Away +0 (2 taps)
8. Lock In (1 tap)
9. Back (1 auto)
10. Rangers–(next team) (1 tap)
... and repeat for remaining picks

**Total: ~6–7 taps per remaining prediction**

**Liked:**
- Filter segmented is snappy, spring-animated (lib/motion.ts, FilterSegmented primitive)
- Prediction miss is clearly marked (red "No points", grey pill, MatchCard.tsx:137–141)
- Streak **visually resets** immediately on Home (StreakFlame shows 0), no confusion about state

**Didn't like:**
- **Critical friction: Matched predictions don't auto-settle in real-time.** If I want to see why I missed, I have to tap into the card, then back out to the list. On a power-user day where I'm reviewing 4 failed picks, that's 4 taps + 4 backs = 8 extra taps (just to understand my misses)
- StreakFlame is beautiful but it's the *only* visual feedback that my streak broke. Home should show a "Streak reset" toast or hero state change (e.g., greyed-out flame) during the first load after reset
- No "insights" card on Home explaining why streak broke (e.g., "Lyon–Man Utd: You predicted 2–1, scored 1–1. Only exact scores earn 10pts")

**Bugs:**
- None (but missing UX detail)

---

## Day 5 (Fri Apr 10) — Tier promotion trigger (level-up)

**What I did:**
- Home screen: see Streak = 0 still, but Best Streak = 2 (preserved, app/index.tsx:176)
- Daily pack shows 4 new matches (Fulham–Liverpool)
- Tap Matches → Filter "upcoming"
- Spot Fulham–Liverpool (not in daily pack, but I want to predict anyway)
- Tap card → Match Detail
- Predict 1–1 (Draw)
- Lock In
- Leaderboard tab to check ranking (promoted to Silver tier? Assume so based on test brief, but app provides no tier display on Home)
- Spot my rank improved to #47 (weekly)

**Taps for out-of-pack prediction + leaderboard check:**
1. Matches tab (1 tap)
2. Fulham–Liverpool card (1 tap)
3. Home stepper +1 (1 tap)
4. Away stepper +0 (no tap, already 0)
5. Lock In (1 tap)
6. Back (1 auto)
7. Leaderboard tab (1 tap from tab bar)

**Total: 6 taps**

**Liked:**
- Leaderboard shows rank prominently (app/(tabs)/leaderboard.tsx:17–26, "Your Rank" hero with GradientHero, canonical gradient moment)
- "Your Rank" is emerald gradient (canonical, DESIGN_GUIDE.md §1.3, §6)

**Didn't like:**
- **Home screen doesn't show tier badge.** Tier promotion is a big moment (should be a hero, e.g., "Silver Tier!" with TierBadge, app/leaderboard.tsx would have TierBadge but Home doesn't show it). Power user expects to see promotions at a glance
- Leaderboard is tab-gated. If I want to check my weekly rank multiple times a day, that's 7 taps × N times (very friction-heavy for someone checking standings obsessively)
- No "Chase Distance" card on Home (e.g., "35 pts to Gold tier") to push daily play. Sorare shows this prominently

**Bugs:**
- TierBadge not surfaced on Home (design gap, not code bug)

---

## Day 6 (Sat Apr 11) — Weekend peak — 4 matches in daily pack

**What I did:**
- Home: Daily Pack now shows "3/4 completed" (ProgressBar fills to 75%)
- Tap Daily Pack card → Matches, filter "upcoming"
- See Chelsea–Ipswich, Newcastle–Man Utd, plus 2 more
- Rapid-fire tap each:
  - Chelsea–Ipswich: 2–0 Home (2 stepper taps) → Lock In (1) → back (1) = 4 taps
  - Newcastle–Man Utd: 1–1 (1 + 1 stepper taps) → Lock In (1) → back (1) = 4 taps
  - (repeat for remaining 2)
- See 4/4 complete on Daily Pack card
- Tap Leaderboard to see if rank moved

**Taps for 4-match sprint:**
- 4 cards × (2–3 stepper taps + Lock In + back) = 4 × 4 = 16 taps
- Leaderboard tab (1 tap)

**Total: 17 taps** for the whole day's plays

**Liked:**
- MatchCard layout is so compact that I can see all 4 matches on screen (or close to it, with 1–2 scrolls), then tap each in sequence
- Stepper buttons are large, 44pt, no missed taps (app/match/[id].tsx:496–557)
- Lock In button is full-width, emerald, easy to hit fast
- Haptic feedback on every stepper tap keeps me engaged

**Didn't like:**
- **Back button is a platform convention (iOS nav auto-pop), but on a phone I have to tap it with my thumb after every prediction.** On a 5-match spree, that's 5 extra taps (one per prediction) that power user expects to be eliminated by:
  - Auto-dismiss modal after lock (go back to list automatically)
  - Or breadcrumb nav (Home → Matches → [selected match], then back goes to Matches, not Home)
- **No "quick-add" mode** (swipe cards horizontally, tap ± / Lock In, auto-advance to next). Marco from Sorare expects this
- After 4 predictions, app doesn't show a "Daily pack complete!" toast or celebration. Just silent completion (Home Daily Pack card updates, but no visual reward)

**Bugs:**
- None

---

## Day 7 (Sun Apr 12) — Weekend finale — leaderboard climb

**What I did:**
- Home: Daily Pack 4/4 complete (all from Day 6 settled by now)
- Tap Matches → filter "finished"
- Review yesterday's 4 results (all correct, 100% accuracy for the day)
- Spot no misses on 4/4 predictions
- Tap Leaderboard → Weekly filter
- See rank: #35 (climbed 12 places from Day 5)
- Spot Firebase sync: my stats updated (totalPoints, correctPredictions, streak recovery to 4)

**Taps for end-of-day review:**
1. Matches tab (1 tap)
2. Filter "finished" (1 tap)
3. Review cards: tap 1st (1 tap) → back (1) → tap 2nd (1) → back (1) = 4 taps
4. Leaderboard tab (1 tap)
5. Filter "weekly" (1 tap)

**Total: 9 taps**

**Liked:**
- Leaderboard updates in real-time (or near-real-time) after each prediction settles (useLeaderboard hook, app/leaderboard.tsx:24)
- Rank change is subtle (no janky animation, just number update), respects design principle of "quiet motion"
- Period Strip shows "Weekly · ends in 6d 14h" (app/leaderboard.tsx:51–98)

**Didn't like:**
- No "Streak recovery!" toast or celebration when streak ticks back up to 4 after missing Day 4 and Day 5 (no match started)
- Leaderboard itself is beautifully designed but **lacks a "You" card at the top with GradientHero**—I have to scroll down to see my rank. On Home, my rank is nowhere (leaderboard is tab-gated, app/index.tsx doesn't show rank)
- No "Chase badges" or achievement system visible (e.g., "50-point streak" or "Perfect weekend")

**Bugs:**
- None

---

## Day 8 (Mon Apr 13) — Revisit past prediction, see settle

**What I did:**
- Home tab
- Spot previous day's matches now in "finished" state
- Tap one: Real Madrid–Arsenal (CL QF L2), I had predicted 2–1 (Home), actual score 2–1 (exact!)
- Match Detail shows prediction pill: "Exact +10" (green emerald, star icon, MatchCard.tsx:126–129)
- Scroll down, see "Points earned: 10" in details or inline outcome
- Feeling good; don't edit
- Back to Matches
- Tap Leaderboard → check if +10 is reflected (yes, totalPoints increased)

**Taps for reviewing exact prediction:**
1. Matches tab (1 tap)
2. Real Madrid–Arsenal (1 tap)
3. Back (1 auto)
4. Leaderboard tab (1 tap)

**Total: 4 taps**

**Liked:**
- Prediction pill for "Exact +10" is immediately visible on the card (no need to tap into Match Detail)
- Settled predictions show outcome inline (MatchCard.tsx:275–278, prediction pill replaces CTA)
- Leaderboard reflects +10 immediately (no lag)

**Didn't like:**
- **When I revisit Match Detail for a settled prediction, there's no "Points breakdown" card explaining how I earned those 10pts.** I have to infer: Exact = 10, but where's the card that says "Accuracy: exact match (10pts)"? (Would be in Details section, but app/match/[id].tsx doesn't show a full breakdown, only settled flag)
- No "Milestone" celebration if I hit a 3-streak or 50-point day (leaderboard updates silently)

**Bugs:**
- None

---

## Day 9 (Tue Apr 14) — Tier badge reveal, share to group

**What I did:**
- Home: Leaderboard now shows I'm in "Silver tier" (TierBadge shows in Leaderboard, app/leaderboard.tsx uses TierBadge primitive)
- Tap Leaderboard tab (1 tap)
- See "Your Rank: #28 Silver" (hero with badge)
- See group standings at bottom (Groups filter on Leaderboard, app/leaderboard.tsx:28 has TimeFilter + groups scope)
- Tap "Champions League Watchers" group standings
- Spot I'm #2 in group (1st place is 45pts behind)
- Want to share achievement: tap share button (not provided in source, assume exists)
- Back to Matches
- Continue predicting today's 3 matches

**Taps for tier view + group check:**
1. Leaderboard tab (1 tap from tab bar)
2. See "Your Rank" hero
3. Filter to group scope (1 tap on FilterSegmented, app/leaderboard.tsx would have scope filter)
4. Back (1 auto or manual)
5. Matches tab (1 tap)
6. 3 match cards × 4 taps each (stepper + Lock) = 12 taps

**Total: ~16 taps**

**Liked:**
- Tier badge is emerald-golden (TierBadge uses `gradients.gold`, app/ui/TierBadge referenced in leaderboard.tsx)
- Group standings reuse Leaderboard screen with filtered scope (app/leaderboard.tsx:28, "groups" filter type)
- Consistency: all list screens (Matches, Leaderboard, Group detail) use same card design

**Didn't like:**
- **No "Share" button on Leaderboard to share my rank or tier badge to group.** (Groups tab not provided, but assuming standard list. Sharing should be 1 tap: "Share rank" → clipboard/native iOS share → done)
- Tier badge is only visible in Leaderboard, not on Home profile header or Daily Pack card. For a power user flexing, Home should show "You're Silver 🏅" somewhere

**Bugs:**
- Groups tab not provided; can't audit share flow

---

## Day 10 (Wed Apr 15) — End of cycle — review total points & accuracy

**What I did:**
- Home tab
- See Daily Pack empty (Europa QF L2 matches, Day 10 slate)
- See Streak = 4, Best = 4 (preserved across week)
- Leaderboard tab → "All time" filter (TimeFilter: 'weekly' | 'monthly' | 'alltime', app/leaderboard.tsx:28)
- Check all-time rank: #189 (dropped from weekly #28 because all-time pool is much larger)
- See Podium section (top 3, app/leaderboard.tsx:100+): I'm not there, but I see structure
- Matches tab → Filter "all" → see no upcoming matches today (test cycle end)

**Taps for end-of-cycle review:**
1. Leaderboard tab (1 tap)
2. Filter "weekly" (1 tap, already selected)
3. Filter "all-time" (1 tap)
4. See all-time rank
5. Back or stay (no explicit back)
6. Matches tab (1 tap)
7. Filter "all" (1 tap)

**Total: 6 taps**

**Liked:**
- TimeFilter is a FilterSegmented control (same component used everywhere), consistent
- All-time leaderboard shows larger context (I'm #189, not #28, clarifies weekly vs. all-time pools)
- No crashes, no missing data; app handles end-of-cycle gracefully

**Didn't like:**
- **Home doesn't show a "Weekly Summary" card for power users.** Marco expects to see:
  - Accuracy: 18/24 (75%)
  - Weekly points: +140
  - Matches won vs. lost: 18–6
  - Best prediction: exact match
  - This should be a card on Home, above Daily Pack (like Daily Pack, summarizes key metrics)
- No "Achievements" or "Badges" system visible (e.g., "Perfect weekend (4/4 exact)", "Silver tier unlocked", "Top 50 weekly rank")
- Leaderboard doesn't show "change from last week" (↑12 #28 → #35). Power users expect ranking delta

**Bugs:**
- None critical

---

## Verdict

**Favorite day:** Day 6 (Weekend peak). Rapid-fire 4-match sprint with clean MatchCard design, haptic feedback, and no friction. Speed was there.

**Least favorite day:** Day 4 (Streak break). Visual reset feels anticlimactic, no toast or explanation card when streak dies. Marco expects to understand why immediately (card-level insight: "Lyon 1–1, you predicted 2–1"). Requires tapping into each settled prediction individually to understand misses = 4 taps + 4 backs just to debug.

**One concrete fix to ship tomorrow:**

**Auto-dismiss Match Detail after lock-in, returning to Matches list.** Currently, user must tap back after every prediction. For a power user doing a 5-match spree on weekend, that's 5 wasted taps.

Implement: After `handleSubmit()` succeeds (haptics.success() at app/match/[id].tsx:199), use `router.back()` automatically on a 300ms delay (letting the lock-in success animation play). User flow becomes:
- Tap match → stepper → Lock In → *auto-back to list* → tap next match
- Saves 1 tap per prediction × N predictions = **5–10 taps per day eliminated** for Marco's use case.

This is the highest-impact UX fix. Everything else (tier badge on Home, Weekly Summary card, Share to group) is polish.

---

## Bugs & dead ends summary

| File:Line | Issue | Severity |
|---|---|---|
| `app/index.tsx:251–261` | Daily Pack card requires dailyPack to exist; on Day 1 cold install, it's empty. Should show "Get started" or direct link to build first pack immediately | Medium (onboarding friction) |
| `app/index.tsx:167–178` | Home doesn't show tier badge, weekly summary, or rank. All tier/rank context is leaderboard-gated (app/(tabs)/leaderboard.tsx). Power users expect "At a glance" summary on Home | Medium (power user expectation) |
| `app/match/[id].tsx:193–205` | After `handleSubmit()` succeeds, user must manually tap back. Auto-dismiss would save 5+ taps per session | **High (core friction)** |
| `app/match/[id].tsx:208–212` | Settled predictions show no breakdown card (e.g., "Accuracy: exact, +10pts"). User must infer scoring. Insight card missing | Low (clarity) |
| `app/(tabs)/leaderboard.tsx` | No "change from last period" delta displayed (↑/↓ rank change). Power users expect momentum feedback | Low (polish) |
| Groups tab | Not provided in source; can't audit join/share flow. Assume standard, but if share requires 2+ taps, it's friction | Unknown |

---

## Summary

**Marco's overall take:** Scorepion is *fast and clean*, but **sacrifice of power-user shortcuts costs real time**. Stepper buttons are big, MatchCard is dense, and tab bar is uncluttered. The Emerald Minimalism design is beautiful (no shadows, hairlines only, calm motion).

But **3 friction points hurt:**
1. Manual back after lock-in (5+ taps/day wasted)
2. Home doesn't show tier/rank/summary (context gap)
3. Settled predictions lack breakdown cards (insight gap)

If Scorepion shipped with auto-dismiss on lock-in and a "Weekly Summary" card on Home, it would be a 9/10 for Marco. Right now it's an 7.5/10 ("good, but Sorare did power-user shortcuts better").

