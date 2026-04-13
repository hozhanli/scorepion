# Carlos — 10-day diary (stats nerd)

## Persona recap
**Carlos**, 40, data analyst, obsessed with xG, form guides, H2H records, and clean leaderboard clarity. Spends 70% of time on Match Detail (stats tab) and Leaderboard (accuracy % column). Wants numbers, not noise.

---

## Day 1 — Mon, Apr 6: Onboarding + First Prediction
**Fixtures**: Burnley–Brighton, Monaco–Lille

**What I did**
Launched app, completed onboarding, picked up first match: **Burnley–Brighton**. Went to Match Detail, tapped "Predict" tab (default), saw prediction card, then slid to **H2H** section.

**What I liked**
- H2H gauge is _immediately_ useful. Three-segment bar (Home% / Draw% / Away%) with large, readable percentages above. **Likes**: No fluff, direct numbers, 0–100 scale makes instant sense.
- H2H summary card shows both teams' logos + win counts. I know at a glance Burnley has 2 wins vs Brighton's 1 in head-to-head — that's exactly what I need to adjust my prediction.
- Recent meetings listed below. Clean rows, date + competition + score pills. The winner's score is highlighted in emerald. Elegant.

**What I didn't like**
- H2H data loaded, but on first run there's a 1–2s delay. No skeleton state while fetching (checking source: `useFixtureH2H` hook stale time is 4h, so no aggressive caching for new loads).
- The gauge segments use `flex` with hardcoded fallback of `0.1` if a team has 0 wins (lines 884, 894, 901 in `[id].tsx`). So a 0-0-5 scenario shows as 0.1-0.1-5, visually misleading. Should be 0-0-100% or omit the segment entirely.

**Bugs/Dead ends**
- Line 830: H2H empty state appears only if `h2hMatches.length === 0 && total === 0`. But if API returns data and `total > 0`, the gauge renders even if no matches are shown (because the summary card still calculates `homePercent`, `drawPercent`, `awayPercent` from `h2hSummary`). This is fine, but the empty state UX is unclear for a first-time user.

---

## Day 2 — Tue, Apr 7: Arsenal–Real Madrid (CL, big match)
**Fixtures**: CL QF L1: Arsenal–Real Madrid, Bayern–Inter (2 big ones)

**What I did**
Arsenal–Real Madrid on my daily pack. Hit Match Detail, stayed in **Stats** tab this time (was curious about possession).

**What I liked**
- Stats bar chart is clean. Possession shown as `%`, shots as raw numbers. Home vs Away team names at header (lines 1001–1026). The bars flip correctly: emerald for the winner of that stat, grey for the loser (lines 1055, 1064).
- 12 stats tracked: Possession, Shots on goal, Total shots, Shots inside box, Corners, Offsides, Fouls, Yellow cards, Red cards, GK saves, Total passes, Accurate passes.
- Numbers are not abbreviated; I can see "23" for shots, not "23k". Good for precision.

**What I didn't like**
- **xG is completely absent.** This is the core stat for a stats nerd. I want to see "Home xG: 1.82, Away xG: 0.95" — that's predictive power. Mock data has no xG at all (checked `football-api.ts` lines 984–997: possession, shots, fouls, cards, passes — but NO xG).
- Stats only appear if match is live or finished. For upcoming matches, we get "No match stats yet" empty state. Understandable, but pre-match xG predictions from external providers (e.g., StatsBomb) would be gold for my prediction.
- Accurate passes shown as raw numbers, not %. Hard to judge 18/27 vs 35/42 without mental math. Line 996 doesn't calculate a percentage.

**Bugs/Dead ends**
- Line 997: `.filter(r => r.homeVal != null || r.awayVal != null)` means any stat with at least one non-null value will render, even if the other is null. For example, if only home team has "Total passes" data, the bar will show only home's value and away as 0. The API should ensure both teams have matching stats.

---

## Day 3 — Wed, Apr 8: PSG–Aston Villa (CL, form matters)
**Fixtures**: CL QF L1: PSG–Aston Villa, Barcelona–Dortmund

**What I did**
Checked leaderboard after predicting. Tapped **Leaderboard** tab, saw the filter: "Weekly", "Monthly", "All time".

**What I liked**
- **Leaderboard filters are crisp.** FilterSegmented component (line 573) with three time periods. Clean toggle, no lag. Data switches instantly.
- **Accuracy % column is displayed.** Line 429 in leaderboard.tsx: `Math.round((entry.correct / entry.total) * 100)` — every user's accuracy to the nearest integer. **This is what I came for.** I can rank by who's most precise, not just points.
- Your Rank emerald hero (lines 236–374) shows _my_ accuracy, streak, best streak in the emerald card. The accuracy calculation (line 532) is clean: `(profile.correctPredictions / profile.totalPredictions) * 100`.
- Change column shows rank movement (+1, -2, etc.) with up/down carets in emerald/red. Trend-aware.

**What I didn't like**
- **Decimal precision is missing.** All percentages rounded to integers (line 429, 532). If I'm 67/100 correct, I see "67%", not "67.0%". For a stats nerd, I want to see 67.5% (where applicable) or at least know the rounding rule is consistent. Currently, it's aggressive rounding.
- **No filters for "Friends", "Global", "My Group".** The brief mentions "filters", but the code only has time-based filters. The leaderboard is a global, unified list. I want to see where I rank among friends or just my prediction group.
- Podium (top 3) shows accuracy and streak, but the columns in rest-of-list rows also show accuracy + streak (line 429). Redundant, but not wrong. Just takes visual density.

**Bugs/Dead ends**
- Line 524: `const found = (leaderboard as LBEntry[]).find(e => e.username === profile.username)`. If the user is not in the top 3, we look for them in the full list. But if profile.username is ever undefined or doesn't match exactly (case-sensitivity?), userRank will be calculated as `above + 1` (line 527), which might be wrong. No null check on `profile`.

---

## Day 4 — Thu, Apr 9: Europa QF L1 (streak breaks)
**Fixtures**: Europa QF L1: Lyon–Man Utd, Athletic–Rangers

**What I did**
Missed exact prediction on Lyon–Man Utd. Streak reset to 0. Checked Leaderboard again to see rank drop, then went back to Match Detail to understand what went wrong.

**What I liked**
- H2H section loading faster now (cached). Summary card still shows stats from yesterday. The percentages are still based on aggregated wins/draws/losses.
- When I switch leaderboard filters (Daily → Weekly → All time), the podium, Your Rank hero, and leaderboard rows all update. No flicker, smooth animation (line 268: `entering={entries.fadeInDown(2)}`). Responsive.

**What I didn't like**
- **H2H gauge doesn't update with latest match results in real-time.** The gauge is static until a fresh fetch. If a match finishes and I check H2H again, I might still see stale data. `useFixtureH2H` stale time is 4h (line 269 in `football-api.ts`), so even if the API has new data, the hook won't refresh.
- **No historical accuracy trend.** I want to see my accuracy over time: "Week 1: 68%, Week 2: 71%". The Leaderboard only shows my current global accuracy. The brief says "form guides" are important to a stats nerd, but the leaderboard doesn't expose personal form.

**Bugs/Dead ends**
- Line 521–528: `userRank` is recalculated on every render if `profile`, `leaderboard`, or `chaseData` changes. If the leaderboard is empty but `profile` exists, the fallback calculation (line 527) will return 1 (no one above me). That's wrong; it should be `null` or a special state.

---

## Day 5 — Fri, Apr 10: Tier promotion (Fulham–Liverpool)
**Fixtures**: Premier League: Fulham–Liverpool

**What I did**
Ranked up after hitting X points. Checked leaderboard to confirm tier badge. Went to Match Detail for Fulham–Liverpool, stayed in **H2H** tab (big match, want historical edge).

**What I liked**
- H2H Recent Meetings section is densely packed. Five past matches, each row shows home/away team names (short), score pills with emerald highlight for the winner, date, and competition. No wasted space.
- The "Recent meetings" title (line 925) is clear. I know I'm looking at historical data, not projected stats.
- TierBadge appears in podium (line 159) and in Your Rank hero — shows tier visually (gold/silver/bronze medals in the podium, but tier name in hero?). Consistent branding.

**What I didn't like**
- **H2H doesn't distinguish between home and away advantage.** The gauge shows aggregate wins, but Arsenal's 3 home wins vs 1 away win look the same. I want to see "Home record: 3–1–1" and "Away record: 1–2–2" separately. That's football statistics 101.
- **No win % vs loss % weighted by recency.** If Arsenal beat Real Madrid 5 years ago and last month, both count equally. Recent form matters more. I'd want a "Form (last 3)" row.

**Bugs/Dead ends**
- Line 136: `const isHomeTeamHome = m.homeTeam.id === match.homeTeam.id`. This assumes team IDs are always set and consistent. If a team ID changes (e.g., API typo), the calculation breaks silently.

---

## Day 6 — Sat, Apr 11: PL derby day (Chelsea–Ipswich, Newcastle–Man Utd)
**Fixtures**: PL derby: Chelsea–Ipswich, Newcastle–Man Utd (4 matches in daily pack)

**What I did**
Opened Match Detail for Chelsea–Ipswich. Saw "Daily pick" tag + importance "Derby" tag in hero metadata (lines 313–315). Checked H2H, then switched to **Prediction** tab to lock in.

**What I liked**
- H2H data flows into prediction-making. The gauge is prominent, and I can immediately see Chelsea's 2-1 historical advantage. That informs my 1–0 prediction.
- Match tags are shown in hero (line 334: "Derby", "Big Match", etc.) with icons (line 322–328). Adds context without cluttering.
- Points system card (lines 643–663) is crystal clear: exact 10pts, result+GD 8pts, result only 5pts, GD only 3pts. Emerald accent on the icons (line 657), no rainbow. Respects my dislike of noise.

**What I didn't like**
- **Stats tab on upcoming matches shows "No match stats yet" (line 972).** But I want pre-match expected stats: team form (last 5 games), possession averages, shot frequency. The app doesn't expose that. I have to trust H2H alone.
- **No xG projection or Poisson model.** A true stats app would show "Predicted scoreline (Poisson): 1.2–0.8" based on team strength. This app is prediction-focused, not stats-focused.

**Bugs/Dead ends**
- Line 308: `isDailyPick` is calculated using `dailyPack?.picks.some(...)`. If `dailyPack` is loading, `isDailyPick` is false, and the tag won't show. After `dailyPack` loads, the tag appears. No loader state, so users might miss the "Daily pick" tag briefly.

---

## Day 7 — Sun, Apr 12: PL weekend finale (Arsenal–Brentford, Aston Villa–Nott'm Forest)
**Fixtures**: PL: Arsenal–Brentford, Aston Villa–Nott'm Forest; LaLiga: Real Madrid–Alavés

**What I did**
Leaderboard surge after weekend predictions. Checked "Weekly" filter to see leader movement.

**What I liked**
- **FilterSegmented is responsive and persistent.** When I tap "Weekly", the leaderboard instantly shows weekly-only ranks. The emerald accent on the active tab (implicitly styled by the component) is subtle but clear.
- Your Rank card updates with weekly context. If I'm #1 in weekly but #12 all-time, the card shows #1 and progress towards top 5 of the week (lines 300–313). Context-aware.
- Accuracy % persists across all filters. Regardless of period, my accuracy is recalculated for that period (e.g., "Weekly accuracy: 73%"). This is correct.

**What I didn't like**
- **No ability to compare my weekly vs all-time accuracy side-by-side.** I want to see "Weekly: 73%, All-time: 68%" to know if I'm hot or cold. The app shows one at a time.
- **Change column (+/-) only appears in leaderboard rows, not in Your Rank hero.** I see my rank changed from #9 to #7 (+2 in the list), but the hero doesn't show the delta. Should display "↑2 this week".

**Bugs/Dead ends**
- Line 538: `const bestStreak = profile?.bestStreak ?? streak`. If `profile?.bestStreak` is 0, this will fall back to current `streak`. This is a JavaScript falsy trap. Should use `profile?.bestStreak ?? 0` or a null check.

---

## Day 8 — Mon, Apr 13: Real Madrid–Arsenal (CL QF L2, revisit past)
**Fixtures**: CL QF L2: Real Madrid–Arsenal, Inter–Bayern

**What I did**
This is the reverse fixture of Day 2. Opened Match Detail for Real Madrid–Arsenal (they're playing at home now). Checked H2H to compare.

**What I liked**
- H2H now shows **both** direction matches: Arsenal–Real Madrid (from Day 2) and Real Madrid–Arsenal (today's reverse). The summary card's percentages are now truly bidirectional: "Real Madrid 2 wins, Arsenal 1 win, 2 draws" (updated from Day 2's "Arsenal 2, Real Madrid 1, 2 draws" view).
- The gauge correctly reweights. If Real Madrid has the 2 wins overall, the gauge now favors the right (away) segment. The percentages (lines 875–877) are recalculated: `homePercent = 2/5 = 40%`, etc.

**What I didn't like**
- **Home/away advantage is still not isolated.** I want to know "In Madrid, Real Madrid is 2–0–0. In London, Real Madrid is 0–1–2." The app shows aggregate only. And if Real Madrid is now the "home" team in the fixture, the summary card (lines 843–870) swaps their position left-to-right, which is correct, but the historical data doesn't adjust. I have to manually invert my reading.

**Bugs/Dead ends**
- Line 136: If `match.homeTeam.id` is undefined, `isHomeTeamHome` will always be false, breaking the win/loss calculation. The code assumes `match` and its team IDs are always valid.

---

## Day 9 — Tue, Apr 14: Aston Villa–PSG (CL QF L2, tier reveal)
**Fixtures**: CL QF L2: Aston Villa–PSG, Dortmund–Barcelona

**What I did**
Reached Elite tier (badge revealed in leaderboard podium). Shared prediction group score. Checked leaderboard "All time" filter to see where I landed globally (top 12 now).

**What I liked**
- **TierBadge is visually distinct** (in podium, line 159: gold/silver/bronze medal styling). Matches my Elite status with premium affordance.
- **Leaderboard rows for top 3 show medal badges** (lines 399–408 in leaderboard.tsx) instead of rank numbers. Celebratory but not garish.
- Your Rank hero reflects the tier context. The emerald gradient (line 270: `Colors.gradients.emerald`) is the singular hero moment, and the tier badge sits inside it with dignity.

**What I didn't like**
- **Tier badge appears nowhere on Match Detail.** When I'm predicting, I don't see my tier. The psychographic link between "I'm elite" and "my prediction carries weight" is missed.
- **No tier-specific leaderboard filter.** I want to see "Elite leaderboard" (top 100 by tier) vs "All players". Currently, it's one global list.

**Bugs/Dead ends**
- Line 538: `const bestStreak = profile?.bestStreak ?? streak`. If `profile.bestStreak` is unset, we'll show current streak as "best", which is false on Day 9 (streak was reset on Day 4). Should check `profile` is fully loaded before this.

---

## Day 10 — Wed, Apr 15: Europa QF L2 + Conference quarters (end of cycle)
**Fixtures**: Europa QF L2 + Conference quarters (final big matches)

**What I did**
Final prediction window. Reviewed all 10 days: checked leaderboard final rank, opened Match Detail for the day's biggest match (Dortmund–Barcelona revisit from Day 3), audited my accuracy across periods.

**What I liked**
- **Leaderboard Weekly/Monthly/All-time toggle remains rock-solid.** I can flip between perspectives instantly. The render is smooth, no lag, no layout jank.
- **H2H gauge persists as the most useful single stat.** After 10 days of 20+ matches, I've never doubted the H2H because it's transparent: 3 segments, 3 percentages, done. No hidden weighting.
- **Your Rank hero is motivational.** The progress bar (line 312), the points gap to next rank, the tier badge — all keep me engaged. This is well-designed.

**What I didn't like**
- **Over 10 days, xG was never mentioned once.** A stats nerd like me feels underserved. The app is prediction-focused (correct/exact/miss outcomes) but not stats-focused (expected value, shooting percentage, defensive efficiency). That's a positioning choice, but it limits depth.
- **Leaderboard doesn't expose "stats leaders" (accuracy leaderboard).** I want to see who the most accurate predictors are, separate from points. Points can come from a lucky streak; accuracy is skill.
- **No user comparison view.** I want to click another user and see "vs Carlos: They're 67%, I'm 72%. They have 3 winning streaks, I have 1." The leaderboard is read-only.

**Bugs/Dead ends**
- Line 521–528 in leaderboard.tsx: The `userRank` memoization depends on `[profile, leaderboard, chaseData]`. If the API returns `chaseData` before `leaderboard`, the rank might be stale. The hook should prioritize `chaseData.userRank` first (line 522 does, but if that's not set and then `leaderboard` changes later, the rank could flip.

---

## Verdict

### Favorite day
**Day 1 & Day 2 combined (Days 1–2).**
- H2H gauge debut was clean and useful. Percentage math is transparent. The visual design (three-segment bar, large percentages, legend) is exactly what a stats nerd needs: data-forward, no fluff.
- Stats tab on a live/finished match is a nice hook. Knowing Arsenal had 67% possession gives me context for the result.
- These two days set expectations high for the leaderboard and prediction flow.

### Least favorite day
**Day 5 (Tier promotion).**
- The tier reveal is anticlimactic on a stats tab. No data, no celebration. The emerald tier badge appears in the leaderboard but not integrated into the prediction flow. By Day 5, I expect the app to *feel* different at a higher tier (e.g., unlock advanced stats, faster H2H loads, accuracy leaderboard). Instead, it's cosmetic.
- Also, H2H stale time (4h) meant my historical data wasn't fresh after a full day of matches.

### One concrete fix for stats density

**Add a "Form (Last 5)" row to Match Detail → Stats tab, showing each team's recent results.**

Currently, stats are only available post-match. For upcoming matches, add:
```
Form (Last 5): [W] [W] [D] [L] [W]   vs.   [W] [L] [W] [W] [L]
Avg pts/game:   2.4 pts/game         vs.   1.6 pts/game
```

This gives a stats nerd predictive signal before the match starts. It's low-friction data (already available from league standings form column) and respects the app's focus on prediction (form informs outcome likelihood). It bridges the gap between "H2H says Arsenal dominates" and "but Real Madrid is in better current form."

---

## Bugs & dead ends summary

| Line | File | Issue |
|------|------|-------|
| 884, 894, 901 | `app/match/[id].tsx` | H2H gauge flex segments use `0.1` fallback for 0 wins, visually distorting 0-0-5 scenarios. Should use `Math.max(segment, 0)` or omit zero segments. |
| 830–838 | `app/match/[id].tsx` | H2H empty state logic: only triggers if `h2hMatches.length === 0 && total === 0`. If summary exists but no matches shown, UX is unclear. |
| 997 | `app/match/[id].tsx` | Stats filter `.filter(r => r.homeVal != null || r.awayVal != null)` allows one-sided data (home has passes, away doesn't). Should validate both teams have the stat. |
| 524–527 | `app/(tabs)/leaderboard.tsx` | `useLeaderboard` lookup doesn't null-check `profile.username` or handle case-sensitivity. Mismatch causes userRank fallback to be incorrect. |
| 521–528 | `app/(tabs)/leaderboard.tsx` | `userRank` memoization: if `chaseData` is unset and `leaderboard` updates later, rank can flip. Should wait for both to load. |
| 538 | `app/(tabs)/leaderboard.tsx` | `const bestStreak = profile?.bestStreak ?? streak` uses falsy fallback; if `bestStreak` is 0, falls back to current streak (wrong). Use explicit null check. |
| 308 | `app/match/[id].tsx` | `isDailyPick` calculated after hero render; if `dailyPack` is loading, tag won't show. Should add loading state to MatchCard or defer hero render. |
| 136 | `app/match/[id].tsx` | H2H win/loss calc: assumes `match.homeTeam.id` is always set and consistent. Silent failure if team ID is undefined or API returns typos. |

---

## Summary for product

Carlos sees the app as **prediction-focused with good H2H and leaderboard tools**, but **incomplete for deep stats analysis**. The emerald color scheme and minimal design are perfect for clarity, but the lack of:
- xG / Poisson projections
- Accuracy leaderboard (separate from points)
- Recent form (last 5 games) on upcoming matches
- Home/away H2H split

…keeps it in the "fun prediction app" lane, not "stats app" lane. For a 40-year-old data analyst, that's fine, but it's a missed opportunity to differentiate vs. general prediction apps (FiveThirtyEight, FootballCruncher, etc.). The foundation is clean; adding 2–3 stats-nerd features would make it a power-user tool.

---

**Report signed**: Carlos, Match Detail & Leaderboard resident
**Date**: Apr 15, 2026
