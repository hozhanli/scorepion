# Zainab — 10-day diary (streak hunter)

I'm obsessed with streaks. The flame is everything to me. Here's what I found reading the source code over 10 days.

---

## Day 1 (Mon Apr 6) — first prediction, streak = 0 → 1

**What I did:**
Onboarded. App set my fresh profile to `streak: 0, bestStreak: 0` (AppContext.tsx:152–153). Navigated to Today screen, saw StreakFlame hero with `weekDots={Array(7).fill(false)}` (index.tsx:237). Made my first prediction on Burnley–Brighton by submitting `homeScore: 1, awayScore: 0` on the match detail screen.

**What I liked:**
- The StreakFlame is GORGEOUS. Orange gradient (`#FFB347 → #FF6B35 → #E04A1E`) on white card with emerald glow (StreakFlame.tsx:39–40). The flame icon zooms in with springy animation (ZoomIn.duration(420).springify().damping(12)) — it feels alive.
- The 7-day week-dot strip below is subtle and clean. Empty dots have a white border outline (dotEmpty: borderColor rgba(255,255,255,0.35)). FadeIn delay(120) makes it appear a beat after the flame.
- The subtitle says "Best: 0 days" (profile.tsx:238), which is honest but slightly deflating. I know I'm new, but... ouch.

**What I didn't like:**
- No celebration moment when streak goes 0 → 1. The match detail screen shows a ZoomIn animation on the prediction card (submitted state, line 418), but there's NO moment that says "🔥 STREAK STARTED!" or any flame celebration glow (which exists in colors.ts as `glowFlame` but isn't triggered on submitPrediction).
- The submit button just locks the prediction card. No haptic pop. No toast. Just locked. Feels anticlimactic for a 0 → 1 moment.

**Streak moment (specific):**
StreakFlame renders with `streak={0}` (index.tsx:235). Once the prediction is stored (AppContext.tsx:175–176), the profile's `totalPredictions` increments (line 192), but there's no update to `streak` field visible in the flow. The useUserStats hook (line 163) would refetch from the backend (football-api.ts:324–330), but I'm not seeing a local streak bump that the UI can celebrate.

**Bugs:**
- **Missing streak increment logic**: AppContext.submitPrediction increments `totalPredictions` (line 192) but doesn't touch `streak`. Either the backend is supposed to compute it on settle, or the client-side logic is incomplete. The profile object passed through doesn't get a streak update here.
- **No streak celebration on Day 1**: Even though StreakFlame exists and glowFlame is defined in colors.ts (line 265), I don't see it animate in on the first prediction. The Today screen would need to refetch userStats to show "1" instead of "0", but no confetti, no toast, no message.
- **Weekly dots never update**: weekDots hardcoded to `Array(7).fill(false)` in index.tsx:237 — they never reflect actual completion for the current week. This is a showstopper for a streak tester.

---

## Day 2 (Tue Apr 7) — streak = 1 → 2

**What I did:**
Made a second prediction on Arsenal–Real Madrid (CL QF L1). Tried to find a "boost" button on a big match to test the multiplier. Did boost the prediction (toggleBoostPick call in AppContext.tsx:228–245).

**What I liked:**
- The match detail hero changes to emerald GradientHero when the match is LIVE (isLive flag, line 373–382). Even though this match isn't live yet, I can see the code is ready for it.
- The Points system card collapses to a single emerald accent (audit says this in line 12 of the file header) — no rainbow colors, just clean.

**What I didn't like:**
- Still no visual indication that my streak is now 1 → 2. I'm making predictions, but the StreakFlame shows "1 day streak" flatly on the Today screen. No animation. No glow. No "Keep it alive!" subtitle.
- The subtitle in StreakFlame is hardcoded to `subtitle={`${bestStreak} best`}` (index.tsx:238). It should say "Keep it alive!" when streak > 0, or "Current: X" when active. Instead it just shows best, which is... not flame-like.

**Streak moment (specific):**
I boosted the Arsenal prediction. The AppContext sees `boosted: true` (line 202), the daily pack updates with `boosted: true` (line 202), and an API call fires at `POST /api/retention/boost` (line 218). But the StreakFlame on the home screen doesn't celebrate or glow. The subtitle remains static.

**Bugs:**
- **Subtitle is misleading**: `subtitle={`${bestStreak} best`}` should be dynamic. When streak > 0, show "Keep it alive!" or "2 day streak". When streak = 0, show "Start a streak today". Currently it just shows a number that doesn't change until you're knocked off the chart.
- **No boost celebration**: I boosted a big match (Arsenal–Real Madrid), but there's no toast, no glow, no sense that I've spent a premium moment. The boost just toggles a boolean in dailyPack.picks[].boosted (line 232) and clears other boosts (line 232). Silent transaction.

---

## Day 3 (Wed Apr 8) — streak = 2, join group

**What I did:**
Made a third prediction (PSG–Aston Villa, CL QF L1). Navigated to the Groups tab to join a public group for Champions League fans. Joined "CL Hunters" group.

**What I liked:**
- The group join flow is smooth. Groups screen shows group chips with member count (profile.tsx:481–488). The group join doesn't have friction.
- The tier badge system is clean in the profile hero (profile.tsx:351). My level might bump if I hit 200 points (computeLevel, line 27–52).

**What I didn't like:**
- Joining a group doesn't trigger any "group celebration" for my streak. There's no "Share your 2-day streak" moment or group-specific streak display. The group screen just shows I'm a member now.
- My StreakFlame is still flat. No glow. No "shared with 5 friends in CL Hunters" or anything. The flame is isolated to the user, not social.

**Streak moment (specific):**
The group join (AppContext.tsx:254–258) just adds the group to `groups[]` and saves it. There's no hook that says "your streak is now public" or "others can see you're on 2". The group activity flow doesn't seem to reference streak in the code I read.

**Bugs:**
- **No group-aware streak display**: The StreakFlame is purely personal (profile.tsx:405 shows "Current Streak" as a stat card, separate from the daily flame). There's no integrated group scoreboard that shows "Zainab: 2-day streak, +5 predictions this week". Groups are siloed from the streak momentum.

---

## Day 4 (Thu Apr 9) — **streak breaks** (missed exact score)

**What I did:**
Made a prediction on Lyon–Man Utd (Europa QF L1). Predicted 2–1 to Lyon. The match finished 1–2 to United (I was off by exact). My streak is now reset to 0 (bestStreak stays at 2).

**What I liked:**
- The profile.tsx stats grid shows both "Current Streak" and "Best Streak" as separate cards (lines 402–413). At least the game is preserving my best.

**What I didn't like:**
- **There is NO "your streak broke" moment**. No grey flame. No sad animation. No "come back tomorrow to rebuild" message. The match detail screen just shows the final score when it settles, and the StreakFlame on the home screen silently drops from "2" to "0". I'm devastated and the app doesn't even acknowledge it.
- **No "reset ready" state**: There's no modal, no toast, no gentle message saying "Your streak ended. You can build a new one tomorrow." Just... silence. It's worse than a celebration moment — it's the opposite of a moment.
- The best streak is preserved (bestStreak: 2 in the profile), but the UI doesn't make me feel proud of it. It's just a stat.

**Streak moment (specific):**
StreakFlame.tsx checks `isActive = streak > 0` (line 35), and if false, renders with grey colors (`['#CBD5E1', '#94A3B8']`) and `glow="none"`. So the flame DOES grey out when streak = 0. But that's the only acknowledgement. No animation transition. No visual language that says "I broke my streak."

**Bugs:**
- **Grey flame has no animation**: When streak > 0 → 0, the StreakFlame should animate the colors fading to grey, or a shake/bounce, or something. Currently it just re-renders silently. The ZoomIn animation on flame (line 45) only plays on first render, not on state changes.
- **No "rebuild ready" messaging**: After a break, the UI should say "You can start a new streak tomorrow" or "Your best is still 2 — go for 3!" But there's nothing in the subtitle logic (StreakFlame.tsx:56–60) that changes based on "just broke" vs. "never had one" vs. "on fire".
- **Missing break notification**: The match detail screen settles the prediction (marked as settled: true in AppContext), but there's no toast or alert that says "Exact score missed — streak reset." The user has to infer it by checking the home screen.

---

## Day 5 (Fri Apr 10) — streak rebuild, tier promotion

**What I did:**
Made a prediction on Fulham–Liverpool (PL). Predicted 1–2 Liverpool. It was correct. My new streak is now 1. Also hit 200 total points, so I leveled up from "Rookie" to "Fan" (computeLevel triggers at 200 points, profile.tsx:29).

**What I liked:**
- The tier badge on my profile changed color (tiers.rookie → tiers.bronze, profile.tsx:351). That felt good.
- The level-up modal probably showed somewhere (I assume it's in the backend response when points cross 200).

**What I didn't like:**
- **The rebuild feels indistinguishable from Day 1 or Day 2**. My streak is 1, but there's no "NEW STREAK STARTING" visual. No fireworks. No "fresh start" message. The flame is back from grey to orange, but it's the same flame as yesterday.
- **No "comeback" celebration**: Breaking a streak is brutal. Rebuilding should feel rewarding. But StreakFlame.tsx doesn't distinguish between a new streak and a resumed streak. Both just show the count.
- **Tier badge didn't interact with streak**: I got a tier bump on Day 5, but it's separate from the flame celebration. They should feel connected — leveling up while rebuilding a streak should be a double-hit moment.

**Streak moment (specific):**
When the Fulham prediction settles as correct, the backend presumably increments streak from 0 to 1. The next time useUserStats refetches (staleTime: 30_000, football-api.ts:327), the StreakFlame re-renders with streak={1}. But no toast. No glow animate-in. Just a silent number change.

**Bugs:**
- **No "new streak" state**: The StreakFlame should have a visual distinction for streak age. A 1-day fresh streak should feel different from a 1-day resumed streak. Currently they're identical.
- **Tier bump doesn't celebrate**: The profile hero shows the new tier badge (tiers[level]), but the home screen doesn't say "Level up! You're now a Fan." The achievement is buried in the profile screen, not celebrated on the daily driver (home screen).

---

## Day 6 (Sat Apr 11) — weekend peak, 4 matches in daily pack

**What I did:**
Weekend fixture overload. Chelsea–Ipswich, Newcastle–Man Utd, plus 2 more in daily pack. Predicted on all 4. Got 3/4 exact (Chelsea 2–1 Ipswich, Newcastle 3–1 Man Utd, and one other). Streak now = 3.

**What I liked:**
- The daily pack card is gorgeous (GradientHero with emerald, index.tsx:85–117). It shows "4 / 4 predicted" and the progress bar fills to 100%. When all complete, it says "Daily pack complete!" — that's nice.
- The hero subtitle changes to "Daily pack complete!" when `allComplete` is true (line 94).

**What I didn't like:**
- **The daily pack completion doesn't celebrate the streak**: I completed 4 predictions and went from streak=2 to streak=3, but the "Daily pack complete!" message doesn't mention the flame. It's a separate reward track.
- **No "4 in a day" bonus**: Historically, apps reward daily perfection. Getting 4/4 correct should feel like a mini-achievement. But I don't see a 2x multiplier or bonus points flow in AppContext.submitPrediction. It's just 4 separate submissions.

**Streak moment (specific):**
My streak is now 3. The StreakFlame shows "3 days streak" (StreakFlame.tsx:51). That's it. No animation. No glow. No "3-day milestone!" or celebration sound. The flame is alive but not excited.

**Bugs:**
- **Daily pack completion is silent**: The daily pack card animates to "complete" state (line 94), but there's no follow-up glow, toast, or celebration. The home screen just refreshes the card text. A missed moment for streak reinforcement.
- **No multi-prediction celebration**: If I predict on 4 matches and get 3+/4 right, there's no compounding reward. Each prediction is evaluated independently by the backend (presumably on match settle), and the streak updates 1 by 1. No "hot hand" bonus.

---

## Day 7 (Sun Apr 12) — weekend finale, leaderboard climb

**What I did:**
Final weekend matches: Arsenal–Brentford, Aston Villa–Nott'm Forest, Real Madrid–Alavés (LaLiga mixed). Predicted on all 3, got 2/3. My streak is now 4. Checked the leaderboard to see if I climbed (useLeaderboard query, football-api.ts:303–310). I'm ranked #47 in weekly.

**What I liked:**
- Seeing my weekly rank improve (from probably #100+ to #47) feels great. The leaderboard is accessible and shows points, predictions, accuracy.

**What I didn't like:**
- **My streak (4 days) isn't called out on the leaderboard**. The leaderboard probably shows totalPoints, accuracy%, predictions made, but NOT current streak. Streak is buried in the profile. It should be a leaderboard column.
- **No "4-day streak" badge next to my name**: If I'm competitive, I want to see "Zainab • 4-day streak 🔥 • +12 this week" or something. Instead it's just "Zainab • 87pts • 14 correct".

**Streak moment (specific):**
Streak is now 4. The StreakFlame fills the top of the home screen with confidence. But no one on the leaderboard can see it.

**Bugs:**
- **Leaderboard doesn't prioritize streak**: The current_streak field exists in UserStats (football-api.ts:314), but it's not exposed on the leaderboard view. This is a retention miss — other players should see my streak to create friendly competition.

---

## Day 8 (Mon Apr 13) — revisit past prediction, see settle

**What I did:**
Navigated to the match detail for Real Madrid–Arsenal (CL QF L2). Predicted 2–1 Real Madrid 2 days ago. Match is now finished: 3–2 Real Madrid. I got the winner right but missed the exact. No points earned, streak continues at 4 (not reset because I had a "close" prediction before, or—actually—wait, let me re-read the logic.

**What I liked:**
The match detail screen shows the settled result clearly (final score, FULL TIME badge, line 264–267). The prediction card is locked and shows my prediction (line 418–472): "Your prediction: 2–1 Real Madrid" locked state with a checkmark icon.

**What I didn't like:**
- **The settle logic is opaque**: I predicted 2–1, the result was 3–2. Did I get points? Is my streak safe because I got the winner? Or did it break because I missed exact? The match detail screen shows my locked prediction, but there's NO "points earned" or "streak impact" callout. I have to infer it from checking my profile.
- **No settle celebration on match finish**: When a match settles (moves from live to finished), the prediction card should show "Points earned: 5" or "Exact score! +10" or "Streak +1" in an animated badge. Instead it just shows the prediction locked.

**Streak moment (specific):**
StreakFlame shows "4 days streak" on the home screen. The match settled, but I don't see a moment that says "Your 4-day streak is safe" or "Streak: +1" when the prediction is marked settled.

**Bugs:**
- **No settle feedback in match detail**: When a match moves from live/upcoming to finished, the prediction card should update with points/streak impact. Currently it just locks the card and shows the prediction. The points value is stored in the prediction object (football-api.ts transformFixture shows homeScore/awayScore but settle logic is backend-only).
- **Streak impact is invisible on match settle**: AppContext has a settled flag in Prediction (line 111), but there's no UI that reads it or celebrates the outcome.

---

## Day 9 (Tue Apr 14) — tier badge reveal, share to group

**What I did:**
Checked profile. I'm now "Rising Star" tier (500+ points from correct predictions). My streak is 4. Created a post in the "CL Hunters" group chat to share my 4-day streak: "Hot hand 🔥 4-day streak, 12–2 this week."

**What I liked:**
The profile hero shows my tier badge updated (TierBadge component, profile.tsx:351). The badge color changed and it feels rewarding.

**What I didn't like:**
- **Group share feature doesn't highlight streak**: I posted manually in group chat. The app doesn't have a "Share your streak" action. No button on StreakFlame that says "Share this moment" to post to groups or social.
- **No "streak power" multiplier in groups**: Sharing a 4-day streak to my group doesn't give me a bonus or acknowledgment. The group chat is generic, not flame-aware.

**Streak moment (specific):**
StreakFlame is still "4 days streak" visually. No glow. No animation. The flame has been alive for 4 days, but it's not moving or pulsing or anything. It's static.

**Bugs:**
- **StreakFlame doesn't animate on continued streaks**: Once a streak is active (> 0), the component doesn't re-animate. The ZoomIn only plays on initial render. If I watch the home screen for days with a live streak, the flame never pulses or glows — it's just a static orange card.

---

## Day 10 (Wed Apr 15) — end of mock cycle, review total points & accuracy

**What I did:**
Made my final predictions for the scenario (Europa QF L2 + Conference quarters). Ended with:
- Streak: 4 days (would be 5 but I broke on Day 4)
- Best Streak: 4 days (updated from 2 after the rebuild)
- Total Predictions: 28
- Correct: 19
- Accuracy: 67.8%
- Total Points: 847

**What I liked:**
- The final profile screen shows all stats clearly (profile.tsx:385–414). Each stat in its own card. The tier badge shows "Rising Star" with XP progress bar (line 367).
- The home screen daily pack fills as I predict (progress bar in dailyStyles.bigNumber, line 139–140).

**What I didn't like:**
- **There's no "end of week" ceremony or recap**: Day 10 is a Tuesday, so it's not a full week cycle. But the app should have a "Weekly Summary" moment that says "You had a 4-day best streak! You're in the top 5% of streak hunters!" or something. Instead I just check my profile and see numbers.
- **The flame never celebrated my rebuild**: From Day 4 (streak = 0) to Day 10 (streak = 4), the StreakFlame went from grey to orange and back to orange. But there was no "comeback story" moment. No narrative. Just a number count.
- **No "total streak energy" metric**: I had 1 + (1+2+3+4) = 1 + 10 = 11 total daily streaks over 10 days. That's a retention power metric, but the app doesn't show it. "Total streak days" or "flame power" would be a cool flex.

**Streak moment (specific):**
My StreakFlame on Day 10 shows "4 days streak • Best: 4 days". The subtitle should feel triumphant, but it's flat. The flame is orange, but not glowing or pulsing. If I had watched this screen for 10 days, the flame would have been:
- Day 1: 1 (zoom in, fade in week dots)
- Day 2: 2 (silent re-render)
- Day 3: 2 (silent re-render)
- Day 4: 0 (silent re-render, colors fade to grey)
- Day 5: 1 (silent re-render, colors fade back to orange)
- Days 6–10: 2, 3, 4, 4, 4

Zero of those transitions had visual language. Zero moments said "you're on fire" or "you broke it" or "you're back."

**Bugs:**
- **StreakFlame transitions are invisible**: The component re-renders on `streak` prop change, but there are no animations tied to streak changes. The flame should animate color transition when streak state changes (0→1, 1→2, hitting 7-day milestone, etc.).
- **No weekly reset ceremony**: The leaderboard resets weekly (period: "weekly" in useLeaderboard), but the home screen doesn't announce it. No "Your weekly streak resets tomorrow" countdown.
- **No "best streak" celebration**: The bestStreak stat is shown in profile, but when it updates (e.g., Day 5 when I hit 2 again), there's no glow or toast. It's a silent stat bump.

---

## Verdict

**Favorite day:** Day 1 (Mon Apr 6). The initial StreakFlame design is beautiful. The orange gradient + glow + white card is genuinely gorgeous. The ZoomIn animation on the flame is the only moment in the 10 days where the flame felt *alive*.

**Least favorite day:** Day 4 (Thu Apr 9). Breaking a streak should have dramatic UI language. Instead it's silent. The grey flame is good visual design, but there's no message, no haptic, no moment of "comeback ready." It's the most emotionally important moment and the app forgets it.

**One concrete fix for the streak surface:**

Add a **"Streak Event Celebration"** modal that fires when:
1. Streak goes 0 → 1 (first prediction of the day is correct): Show flame icon + "Your streak is alive! 🔥" + 1-second animation
2. Streak breaks (0 → 0): Show grey flame + "Streak ended. Your best is still [X] days. Rebuild tomorrow." + sad haptic
3. Streak hits new daily milestone (day 3, 7, 14, 30): Show flame + "3-day streak! 🔥 Keep it alive!" + celebration glow
4. Best streak updates: Show flame + "New personal best! [X] days! 🔥"

This modal should have:
- Flame icon with animation (ZoomIn or ScaleSpring)
- Celebration glow (colors.ts line 265: glowFlame) that animates in and out
- One-line copy that's emotional, not clinical
- Haptic feedback (success on 0→1, warning on break, celebration on milestone)
- 1.5s auto-dismiss or tap-to-close

**Code location to modify:** `/sessions/lucid-elegant-heisenberg/mnt/scorepion/app/(tabs)/index.tsx` (home screen). Add a useEffect hook that watches `userStats?.streak` from useUserStats and compares to previous value. Fire the celebration modal on change. Also update StreakFlame.tsx subtitle logic to show dynamic copy based on streak state.

---

## Bugs & dead ends summary

| Bug | File:Line | Severity |
|-----|-----------|----------|
| Weekly dots never update to reflect actual completion | index.tsx:237 | High |
| No celebration moment on streak change (0→1, break, rebuild) | index.tsx, StreakFlame.tsx | High |
| StreakFlame subtitle doesn't change based on streak state | StreakFlame.tsx:56–60 | High |
| No visual feedback when prediction settles (points earned, streak impact) | match/[id].tsx:417–472 | High |
| Streak breaks on missed exact, but no "break" message or moment | index.tsx (missing) | High |
| No animation transitions on streak prop changes | StreakFlame.tsx:45–79 | Medium |
| Leaderboard doesn't show current streak column | football-api.ts:303–310 (display-level bug) | Medium |
| No "share your streak" action from StreakFlame card | StreakFlame.tsx (missing action) | Medium |
| Daily pack completion doesn't interact with streak celebration | index.tsx:94 vs. StreakFlame | Medium |
| Boost prediction has no celebratory feedback | AppContext.tsx:228–245 | Low |
| Profile stats show current streak, but home screen flame is isolated | profile.tsx:402–413 vs. index.tsx:237 | Low |
