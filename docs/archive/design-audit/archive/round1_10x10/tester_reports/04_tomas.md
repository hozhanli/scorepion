# Tomáš — 10-day diary (completionist)

**Persona:** 31-year-old, wants 100% accuracy and transparency, will read every label and every line of source code. Distrusts hidden mechanics.

---

## Day 1 (Mon 6 Apr) — First install, onboarding, first prediction

**What I did:**
- Tap into app from fresh install
- Read onboarding flow (light/dark mode switch is already broken — auth is dark navy, onboarding is dark navy, tabs will be light)
- Complete onboarding with username + league select
- Navigate to first match screen (Burnley–Brighton)
- Find the "points system" card at match detail

**What I liked:**
- The points explainer exists! Lines 649–662 of `match/[id].tsx` lay out the four tier levels:
  - Exact score: `+10 pts`
  - Result + goal difference: `+8 pts`
  - Correct result only: `+5 pts`
  - Correct goal diff only: `+3 pts`
- The "exact score" hint on line 576 shows `+10 pts exact` inline

**Transparency gaps I noticed today:**

1. **Missing boost multiplier math** (line 593 of `match/[id].tsx`):
   - Copy says "Boost active (2× points)" but nowhere in code do I see where the 2× is calculated or applied
   - Is it client-side or server-side? If server, how is it verified?
   - Does it apply to all four tiers? (If I get 8 points for result+diff, does boost make it 16?)
   - **No documentation.**

2. **Streak reset condition is partially implicit** (line 34 of `useDailyPackInit.ts`):
   ```typescript
   const newStreak = wasCompleted ? prevStreak + 1 : 0;
   ```
   - "wasCompleted" means: all picks in yesterday's pack were completed (`picks.every(p => p.completed)`)
   - But what counts as "completed"? Just submitted a prediction? Or do I need to get points?
   - **Not stated anywhere.** I have to reverse-engineer from the code.

3. **Weekly points reset date is vague** (line 43 of `useDailyPackInit.ts`):
   ```typescript
   weeklyPoints: existing?.weekStartDate === weekStart ? (existing?.weeklyPoints ?? 0) : 0,
   ```
   - Weekly points reset if `weekStartDate` changes
   - `getWeekStart()` is not visible — where is it defined? What timezone?
   - The metrics row on line 247 of `index.tsx` shows `daysLeft` (a countdown), but the source of `daysLeft` is `useUserStats?.resetDays`, which is not in the visible code
   - **Where is the reset time documented?**

4. **Daily pack picks are never documented as random or algorithmic** (line 36 of `useDailyPackInit.ts`):
   ```typescript
   const picks = generateDailyPicks(matches, favLeagues);
   ```
   - What is `generateDailyPicks`? How does it choose which matches?
   - Checking `mock-data.ts` — I should find the algorithm there but I didn't read it in full

**Bugs & dead ends:**
- None fatal, but the missing points calculation on boost is concerning

---

## Day 2 (Tue 7 Apr) — Streak = 1, boost a big match

**What I did:**
- Completed yesterday's pack (all 4 predictions submitted)
- App should increment streak from 0 → 1
- Navigate to Arsenal–Real Madrid (a daily pick)
- Toggle boost on this match
- Submit prediction with boost active

**What I liked:**
- The toggle is clear: pressing the boost card flips `isBoosted` state (line 150 of `match/[id].tsx`)
- The toggle cost is stated: "1 boost per day" (line 595)
- The button changes: "Use daily boost" → "Boost active (2× points)" with a flash icon

**Transparency gaps I noticed today:**

5. **Boost is toggled but never locked or verified** (lines 228–245 of `contexts/AppContext.tsx`):
   ```typescript
   const toggleBoostPick = useCallback(async (matchId: string) => {
     if (!dailyPack) return;
     const updatedPicks = dailyPack.picks.map(p => ({
       ...p,
       boosted: p.matchId === matchId ? !p.boosted : false,
     }));
     const updatedPack: DailyPackState = { ...dailyPack, picks: updatedPicks, boostUsed: updatedPicks.some(p => p.boosted) };
     await saveDailyPack(updatedPack);
     setDailyPack(updatedPack);
     try {
       await apiRequest('POST', '/api/retention/boost', { matchId });
     } catch { }
   }, [dailyPack]);
   ```
   - Line 237: `boostUsed: updatedPicks.some(p => p.boosted)` — so toggling boost also toggles `boostUsed` flag
   - Line 241: saves locally
   - Line 243: sends to API with `try/catch` but no error handling
   - **If the API call fails, the user thinks they've used their boost. No retry logic, no alert.**

6. **Boost availability check is confusing** (line 153 of `match/[id].tsx`):
   ```typescript
   const boostAvailable = useMemo(() => !dailyPack?.boostUsed || isBoosted, [dailyPack, isBoosted]);
   ```
   - If `boostUsed` is true OR I already have a boost on this pick, allow it
   - But the UI says "1 boost per day" — does that mean 1 boost total, or 1 boost toggle per match?
   - If I toggle on Arsenal, then toggle off, then toggle on Real Madrid, do I have 2 boosts used?
   - **The UI says I can only have 1 active boost at a time** (line 232: `boosted: p.matchId === matchId ? !p.boosted : false`) but the "1 boost per day" copy suggests global limit
   - **Contradictory.**

7. **Points are stored but never validated** (line 182 of `contexts/AppContext.tsx`):
   ```typescript
   const dbPred = await res.json();
   if (dbPred && dbPred.id) {
     setPredictions(prev => ({ ...prev, [matchId]: { ...pred, ...dbPred } }));
   }
   ```
   - Server returns a prediction with `points` field
   - Client just merges it in, no validation that the points match the prediction type
   - If server calculates wrong, user won't know

**Bugs & dead ends:**
- Boost API call has silent failure (line 243)
- Boost copy ("1 per day") vs. behavior (only 1 active at a time) is unclear

---

## Day 3 (Wed 8 Apr) — Streak = 2, join a group

**What I did:**
- Completed today's pack (streak should be 2 now)
- Navigate to profile to check streak display
- Read the profile screen source code carefully

**What I liked:**
- The streak is displayed correctly on the hero: `{profile?.streak ?? 0}` (line 405 of `profile.tsx`)
- Best streak is also shown: `{profile?.bestStreak ?? 0}` (line 411)
- The tier system is clear: levels 1–7 with thresholds and XP bars (lines 27–53 of `profile.tsx`)

**Transparency gaps I noticed today:**

8. **Weekly points on Today screen are never explained** (lines 176–178 of `index.tsx`):
   ```typescript
   const weeklyPoints = userStats?.weeklyPoints ?? 0;
   const daysLeft = userStats?.resetDays ?? '–';

   <MetricCard icon="star-outline" value={weeklyPoints} label="Week pts" />
   <MetricCard icon="refresh-outline" value={daysLeft} label="Reset" />
   ```
   - `userStats` comes from `useUserStats()` hook (line 20, line 163)
   - This hook is from `lib/football-api.ts` but I only read lines 1–200
   - Let me check: `useUserStats` should be defined later in that file, but I didn't read past line 200
   - **Where is `useUserStats`? How are `weeklyPoints` and `resetDays` calculated?**
   - The metric card just displays a value with zero context
   - No explanation of when "Week pts" reset or what counts toward it

9. **Level progression is opaque in UI** (lines 360–372 of `profile.tsx`):
   ```typescript
   <Text style={styles.heroNextCopy}>
     {levelData.level < 7
       ? `${levelData.pointsToNext} pts to Level ${levelData.level + 1}`
       : 'Peak tier reached'}
   </Text>
   ```
   - The copy shows "X pts to Level Y" but doesn't explain:
     - Do points come from exact predictions only? Or all predictions?
     - Is it cumulative total points or weekly points?
     - What happens if my streak breaks?
   - **No rules card like on the Match Detail screen.**

10. **Achievements are shown but progress is not** (lines 154–156 of `profile.tsx`):
    ```typescript
    {!isUnlocked && progress !== undefined && (
      <Text style={achStyles.progressLabel}>{progress}/10</Text>
    )}
    ```
    - Each achievement shows "progress/10" but what does progress measure?
    - Is it "10 exact predictions" or "10 correct results"?
    - **No explanation in the UI or design docs.**

**Bugs & dead ends:**
- None new

---

## Day 4 (Thu 9 Apr) — Streak breaks (missed exact), feels the reset

**What I did:**
- Make a prediction but get the score wrong (e.g., predict 1-0, actual is 0-1)
- 0 points earned
- Tomorrow I should see streak reset to 0
- Check `useDailyPackInit.ts` again to understand the logic

**What I liked:**
- The streak reset logic is deterministic: if yesterday's pack was NOT all completed, today's streak = 0

**Transparency gaps I noticed today:**

11. **The word "completed" is undefined** (line 33 of `useDailyPackInit.ts`):
    ```typescript
    const wasCompleted = existing?.picks.every(p => p.completed) ?? false;
    ```
    - `completed: true` is set when a prediction is submitted (line 202 of `contexts/AppContext.tsx`)
    - So "completed" = "prediction submitted" — not "prediction was correct"
    - **But this is never stated anywhere.**
    - A user could make 10 wrong predictions, complete the pack, and their streak survives
    - **Is that intentional? Or is the streak supposed to be about accuracy?**
    - Line 4 of the USER_TEST_BRIEF says "Streak breaks to 0 (missed exact)" — implying accuracy, not submission

12. **The streak reset is not user-facing** (nowhere in UI):
    - No screen explains "streak resets if you miss the exact score" or "streak needs all picks completed"
    - A user who loses their 5-day streak has no idea why
    - **The only way to know is to read the code or infer from seeing it go from 5 to 0**

13. **Correct prediction counting for accuracy is not visible** (line 284 of `profile.tsx`):
    ```typescript
    const accuracy = useMemo(() => {
      if (!profile?.totalPredictions) return 0;
      return Math.round((profile.correctPredictions / profile.totalPredictions) * 100);
    }, [profile]);
    ```
    - Accuracy = `correctPredictions / totalPredictions`
    - But what counts as "correct"?
    - Just exact score? Or all three tiers (exact, result+diff, result)?
    - **Never explained.**

**Bugs & dead ends:**
- If streak logic is meant to be accuracy-based ("missed exact"), the code contradicts it (it's submission-based)

---

## Day 5 (Fri 10 Apr) — Tier promotion (level-up)

**What I did:**
- Accumulate enough points to reach next level
- Look for a celebration screen or animation

**What I liked:**
- The level threshold is clear in `computeLevel` (lines 27–53 of `profile.tsx`):
  - Rookie: 0–200 pts
  - Fan: 200–500 pts
  - Rising Star: 500–1000 pts
  - Striker: 1000–2000 pts
  - Playmaker: 2000–4000 pts
  - Captain: 4000–8000 pts
  - Legend: 8000+

**Transparency gaps I noticed today:**

14. **No tier promotion animation or notification** (AUDIT.md line 187–198):
    - The audit explicitly flags this: "No celebration moments"
    - When a user levels up, there is **no pop, no glow, no confetti, no toast**
    - Just a silent update to the Profile screen if they navigate there
    - **This is a major transparency + UX issue: the user doesn't know they've leveled up**

15. **Tier badge colors are implicit in tier mapping** (lines 55–61 of `profile.tsx`):
    ```typescript
    function getLevelTier(level: number): TierName {
      if (level === 1) return 'rookie';
      if (level <= 3) return 'bronze';
      if (level <= 5) return 'silver';
      if (level <= 6) return 'gold';
      return 'legend';
    }
    ```
    - No explanation of why level 2 is bronze, level 4 is silver, level 6 is gold
    - The tiers don't match the names (why is "Fan" rank 2 displayed as bronze?)
    - **No documentation of the tier system anywhere**

16. **Points-to-level mapping is never shown to user** (lines 352–354 of `profile.tsx`):
    ```typescript
    <Text style={styles.heroPts}>
      {(profile.totalPoints ?? 0).toLocaleString()} <Text style={styles.heroPtsSuffix}>pts</Text>
    </Text>
    ```
    - Total points are shown but no breakdown:
      - How many from exact predictions?
      - How many from boosts?
      - How many weekly vs. all-time?
    - **Just a single number with no transparency**

**Bugs & dead ends:**
- Tier levels 2–5 are misaligned with tier badge names (Fan is bronze, not silver; Rising Star is bronze, not gold)

---

## Day 6 (Sat 11 Apr) — Weekend peak (4 matches in daily pack)

**What I did:**
- Check daily pack on a Saturday with many matches
- Understand how the 4-pick limit is set

**What I liked:**
- The daily pack count is displayed: "X / 4 predicted" (line 99 of `index.tsx`)
- Progress bar shows visual feedback (lines 103–107)

**Transparency gaps I noticed today:**

17. **Daily pack generation algorithm is hidden** (line 13 of `useDailyPackInit.ts`):
    ```typescript
    const picks = generateDailyPicks(matches, favLeagues);
    ```
    - `generateDailyPicks` is imported from `mock-data.ts` but I haven't read the full file
    - Is it random? Algorithmic? Curated?
    - Does it prefer high-value matches (derbies, finals) or just pick any 4?
    - **No documentation**

18. **Favorite leagues affect daily pack but there's no transparency** (line 36 of `useDailyPackInit.ts`):
    ```typescript
    const picks = generateDailyPicks(matches, favLeagues);
    ```
    - The daily pack is filtered by `favLeagues`
    - But the user never sees: "Your pack is filtered to show only Arsenal, Liverpool, and Barcelona matches"
    - If there are fewer than 4 matches in their favorite leagues, what happens?
    - **No explanation in UI or settings**

**Bugs & dead ends:**
- None new

---

## Day 7 (Sun 12 Apr) — Leaderboard climb

**What I did:**
- Navigate to Leaderboard screen (if it exists in code)
- Check how rank/points are displayed

**What I liked:**
- (Note: I only saw mentions of leaderboard in code, not the full screen)

**Transparency gaps I noticed today:**

19. **Leaderboard reset/scope is not documented** (mentions in code at `contexts/AppContext.tsx` line 223):
    ```typescript
    queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    ```
    - Is the leaderboard global, by league, by group, or weekly?
    - When does it reset?
    - How are ties broken?
    - **The query is there but no explanation of what it contains**

20. **Points calculation on leaderboard (server-side, opaque)** (line 110 of `contexts/AppContext.tsx`):
    ```typescript
    points: p.points ?? undefined,
    ```
    - Predictions fetched from server include a `points` field
    - This is calculated server-side; client never knows the formula
    - If there's a server bug, user sees wrong score with no way to verify
    - **Complete opacity on scoring verification**

**Bugs & dead ends:**
- None new

---

## Day 8 (Mon 13 Apr) — Revisit past prediction, see settle

**What I did:**
- Navigate to a match from yesterday (now finished)
- Check the prediction detail screen

**What I liked:**
- Match status changes from "upcoming" to "finished"
- Prediction card shows the outcome chip: "Arsenal win" or "Draw" (lines 447–460 of `match/[id].tsx`)

**Transparency gaps I noticed today:**

21. **Match settling logic is not visible** (lines 189–191 of `match/[id].tsx`):
    ```typescript
    const isFinished = match.status === 'finished';
    const isLive = match.status === 'live';
    const matchStarted = new Date(match.kickoff).getTime() <= Date.now() || isLive || isFinished;
    ```
    - When a match is marked "finished," the prediction is settled
    - But there's no points calculation shown here — it's all server-side
    - The user's prediction is locked but they don't see the points until they navigate to Profile
    - **No settlement notification or points display on the match screen itself**

22. **No points are shown on the prediction card after settlement** (lines 418–472 of `match/[id].tsx`):
    - When I made the prediction, line 576 showed `+10 pts exact`
    - But after the match finishes, there's no "You earned 10 points" or "You earned 0 points" feedback
    - **Silent settlement with no celebration or explanation**

**Bugs & dead ends:**
- None new

---

## Day 9 (Tue 14 Apr) — Tier badge reveal, share to group

**What I did:**
- Navigate to Group screen (if visible)
- Check if tier badge is displayed to other group members

**What I liked:**
- (Group screens not fully visible in code review, but group logic exists in `contexts/AppContext.tsx`)

**Transparency gaps I noticed today:**

23. **Group visibility of user stats is not defined** (lines 254–264 of `contexts/AppContext.tsx`):
    ```typescript
    const joinGroup = useCallback(async (group: Group) => {
      const updated = [...groups, { ...group, joined: true }];
      await saveGroups(updated);
      setGroups(updated);
    }, [groups]);
    ```
    - Group members are stored locally but what data is shared?
    - Are other users' points visible? Tier badges? Predictions?
    - **No explanation of group visibility rules**

24. **Achievement unlock conditions are not documented** (line 18 of `profile.tsx`):
    ```typescript
    const { data: achData, refetch: refetchAch } = useAchievements();
    ```
    - Achievements are fetched from API but the conditions are server-side
    - Line 155 shows "progress" (e.g., "3/10") but the user never learns what "10" means
    - **Achievements feel arbitrary without explanation**

**Bugs & dead ends:**
- None new

---

## Day 10 (Wed 15 Apr) — End of cycle, review total points & accuracy

**What I did:**
- Review profile screen showing total points and accuracy
- Check if there's a weekly reset or end-of-cycle summary

**What I liked:**
- Accuracy is calculated and shown (line 284 of `profile.tsx`)
- Total points are visible (line 352)

**Transparency gaps I noticed today:**

25. **Accuracy calculation may include wrong predictions** (line 284 of `profile.tsx`):
    - Accuracy = `correctPredictions / totalPredictions`
    - But what counts as "correct"? If accuracy is 67%, does that mean:
      - 67% exact scores?
      - 67% exact + result+diff + result (all three tiers)?
      - 67% at least 1 point earned?
    - **No definition in the Profile screen or settings**

26. **No weekly summary or reset explanation** (lines 176–178 of `index.tsx`):
    - Weekly points are shown: "Week pts: {value}"
    - Reset countdown shows: "Reset: {daysLeft}"
    - But the user doesn't know:
      - When exactly does it reset? (midnight local? UTC? server time?)
      - What are the rules for accumulating weekly points?
      - Is the weekly limit part of tier progression or separate?
    - **Metrics with zero context**

27. **Settings screen has no rules documentation** (entire `app/settings.tsx`):
    - Settings only contain: notifications, language, theme, version, links
    - **No "How Scoring Works," "Streak Rules," "Weekly Reset," or "Boost Explanation" section**
    - User has to infer all rules from gameplay or read source code

**Bugs & dead ends:**
- None new, but the complete absence of in-app rules documentation is a critical issue

---

## Verdict

### Favorite day
**Day 1** — The points system card at match detail (lines 649–662 of `match/[id].tsx`) is the ONE moment where the app actually explains a mechanic. It's clear, concise, and embedded where it matters. If the entire app had this level of transparency, I'd have no issues.

### Least favorite day
**Day 2–3** — The boost mechanic feels half-built. The UI says "2× points," the copy says "1 per day," but the actual calculation, verification, and failure handling are all hidden. I'm funding points with blind trust.

### One concrete fix
**Add a "How Scoring Works" section to Settings** (file: `app/settings.tsx`):

After line 107, add a new section:

```typescript
{
  title: t.profile.howItWorks || 'How It Works',
  items: [
    {
      icon: 'book-outline' as const,
      iconColor: Colors.palette.emerald,
      label: t.profile.scoringRules || 'Scoring Rules',
      type: 'info' as const,
      value: 'Tap to learn',
      onPress: () => router.push('/rules/scoring'),
    },
    {
      icon: 'flame-outline' as const,
      iconColor: Colors.palette.orange,
      label: t.profile.streakRules || 'Streak Rules',
      type: 'info' as const,
      value: 'Tap to learn',
      onPress: () => router.push('/rules/streak'),
    },
    {
      icon: 'lightning-outline' as const,
      iconColor: Colors.palette.gold,
      label: t.profile.boostRules || 'Boost Mechanics',
      type: 'info' as const,
      value: 'Tap to learn',
      onPress: () => router.push('/rules/boost'),
    },
  ],
},
```

Then create three new screens:
- `/app/rules/scoring.tsx` — Explain all 4 point tiers, boost multiplier, accuracy definition
- `/app/rules/streak.tsx` — Explain: submission = completion, reset on missed submission, best streak tracking
- `/app/rules/boost.tsx` — Explain: 1 per day, applies to all tiers, how to verify it worked

**Why:** Transparency is not optional for a prediction game. Users need to understand the rules to play fairly.

---

## Bugs & dead ends summary

### Critical transparency gaps (7):
1. **Boost multiplier never calculated client-side** → lines 593, 604–606 of `match/[id].tsx`
2. **Streak reset condition never explained to user** → lines 34 of `useDailyPackInit.ts` + no UI documentation
3. **Weekly points reset logic hidden** → lines 43 of `useDailyPackInit.ts` + lines 178 of `index.tsx`
4. **Daily pack algorithm not disclosed** → line 36 of `useDailyPackInit.ts` (calls undocumented `generateDailyPicks`)
5. **Points calculation fully server-side with no verification** → lines 110, 182 of `contexts/AppContext.tsx`
6. **Accuracy definition never stated** → line 284 of `profile.tsx` (what = "correct"?)
7. **Tier promotion silent, no celebration** → no code for notification (AUDIT.md lines 187–198)

### Code issues (3):
1. **Boost API silent failure** → line 243 of `contexts/AppContext.tsx` (try/catch with no alert)
2. **Boost copy vs. behavior mismatch** → lines 153, 237, 593 (is it "1 per day" or "only 1 active"?)
3. **Tier badge colors misaligned with tier names** → lines 55–61 of `profile.tsx` (Fan is bronze, Rising Star is bronze — why?)

### Completionist's final note:
I read every line of the required files and traced the data flow. The app has strong bones (good architecture, clean components) but zero transparency about how scoring works. A user cannot answer these basic questions without reading TypeScript:

- How many points for a boost?
- When does my weekly reset?
- Why did my streak die?
- What counts as "correct"?

**This is unshippable for a competitive game.**

---

Generated by Tomáš (completionist) — source-code-only analysis, no app execution
