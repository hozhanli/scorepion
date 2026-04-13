# Priya — 10-day diary (lapsed user)

**Persona:** 25-year-old lapsed user. Installed 6 months ago, abandoned, reinstalls on Day 5 (Fri Apr 10).
**Key goal:** Feel re-oriented immediately and not lost.

---

## Days 1-4 — passive (brief notes)

Not Priya's story yet—she's been gone. But the 10-day fixture calendar runs regardless.

- **Day 1 (Mon 6 Apr):** Burnley–Brighton, Monaco–Lille early kicks. New users onboard.
- **Day 2 (Tue 7 Apr):** CL QF Arsenal–Real, Bayern–Inter. Active users boost, streak = 1.
- **Day 3 (Wed 8 Apr):** PSG–Aston Villa, Barcelona–Dortmund. Group joins activate.
- **Day 4 (Thu 9 Apr):** Europa Lyon–Man U, Athletic–Rangers. Streak breaks for some.

**Priya:** Nowhere near the app. Her local profile is stale, her daily pack dormant, her streak at 0.

---

## Day 5 (Fri 10 Apr) — **REINSTALL**

### Cold-start sequence

**1. Sign-in gateway (`app/auth.tsx`)**

Priya taps the reinstalled icon. She lands on the emerald light-mode auth screen. Two tabs: "Sign In" and "Create Account." She chooses **Sign In** and enters her old username and password.

- **Design moment:** The sign-in is clean. Emerald focus ring on the input, hairline border, quiet white surface. No dark navy spacescape. It feels premium and minimal.
- **Her feeling:** "Wait, did I already make an account? Let me log back in."

The auth flow succeeds. She's authenticated. But a critical question arises: does she get re-onboarded?

**2. Onboarding gate check (`app/onboarding.tsx`)**

Reading the code:
- `onboarding.tsx` line 62: `const { completeOnboarding, leagues: contextLeagues } = useApp();`
- The screen appears for any user, depending on router logic.
- If `onboardingDone === false` in AppContext, she re-onboards.
- If `onboardingDone === true`, she skips to Home.

**CRITICAL DISCOVERY:** AppContext line 94 in `loadData()`:
```javascript
setOnboardingDoneState(obDone);
```

This reads from local storage (`getOnboardingDone()`). If Priya **was onboarded 6 months ago**, that flag is persisted in storage and will be `true` on reinit. **She will NOT re-onboard.** She will skip the welcome flow and land on Home.

- **Design implication:** No "welcome back" moment. No re-introduction to features. The app assumes she knows everything.
- **Her feeling:** Mixed relief and disorientation. "Good, no boring steps. But... what am I doing again?"

**3. Home screen entry (`app/(tabs)/index.tsx`)**

She lands on **Today, {dayName}** (Friday).

The screen shows:
- **Streak Hero** (line 234–240): A `StreakFlame` showing her current streak (likely 0) and best streak from her 6-month-old profile.
- **3-column metrics** (line 244–248): `Best`, `Week pts`, `Reset days`—all from her stale profile.
- **Daily Pack card** (line 251–261): Calculated from `dailyPickMatches` and `predictions`.

**THE REINSTATE MOMENT:**

AppContext line 62–73:
```javascript
const dailyPickMatches = useMemo(() => {
  if (!dailyPack) return generateDailyPicks(matches, favoriteLeagues);
  const today = getTodayString();
  if (dailyPack.date !== today) {
    return generateDailyPicks(matches, favoriteLeagues);
  }
  ...
}, [dailyPack, favoriteLeagues, matches]);
```

Her old `dailyPack` (from 6 months ago) has a stale date. It fails the `dailyPack.date !== today` check. So the app regenerates a fresh daily pack via `generateDailyPicks(matches, favoriteLeagues)`.

**Her daily pack resets.** She gets a clean slate for Friday's fixtures.

- **What she sees:** A `DailyPackCard` showing "Your daily pack" with 0/4 (or however many matches are in her favorite leagues for today). A gradient emerald hero with white text.
- **Her feeling:** "Okay, there ARE matches today. I can jump right in. At least I don't have to remember what I was doing before."

**4. Profile zero-state recovery (`app/(tabs)/profile.tsx`)**

If she taps the avatar and checks **Profile**, she sees:

Line 274–379 in profile.tsx:
```javascript
const isDayZero = !profile || profile.totalPredictions === 0;
...
if (isDayZero && (
  <Text style={styles.welcomeMessage}>
    Welcome to Scorepion! Start predicting to climb the leaderboard.
  </Text>
))
```

Her old profile **does exist** (from 6 months ago), so `isDayZero` is **false**. She sees her old stats:
- **Predictions:** `profile?.totalPredictions ?? 0` (nonzero from old plays)
- **Accuracy:** `profile?.correctPredictions / profile?.totalPredictions` (stale percentage)
- **Current Streak:** `profile?.streak ?? 0` (likely 0 or low)
- **Best Streak:** `profile?.bestStreak ?? 0` (legacy value)

**CRITICAL MISSING STATE:** The "welcome back" message is only shown on `isDayZero`. Since she has old data, the message never appears. There is **no acknowledgment that she's a returning user.**

- **Her feeling:** "These numbers feel old. I don't remember my accuracy. I don't know if I should trust this profile."

**5. Matches screen browsing (`app/(tabs)/matches.tsx`)**

She navigates to **Matches** to see what's coming.

Lines 80–149 generate a list of matches grouped by date, then by league. Friday's matches are at the top (after today logic).

She can **collapse/expand dates and leagues** using the `FilterSegmented` control for `all | live | upcoming | finished`.

- **Her feeling:** "Good, the interface is minimal. I can see everything at a glance. No clutter."

**6. First prediction entry (`app/match/[id].tsx`)**

She picks a match and enters the detail screen. The prediction card is ready. She can enter a home score, away score, and optionally boost it.

Line 110 in match detail:
```javascript
const existingPrediction = predictions[id || ''];
```

She has no prediction for today's match, so `existingPrediction` is undefined. The steppers default to 0–0. She makes her first prediction of the day.

- **Design moment:** The white hero card (for upcoming matches) is clean. No gradient yet (gradient is only for LIVE matches). The input steppers are large, tappable. The "Lock In" button is emerald.
- **Her feeling:** "This still feels good. Let me make a prediction."

---

## Days 6–10 — catching up

### Day 6 (Sat 11 Apr) — weekend peak

**What happens:** Priya comes back on the weekend. Chelsea–Ipswich, Newcastle–Man Utd, and 2 more matches populate her daily pack (4 total).

**Daily Pack behavior:**
- Lines 65–73 in AppContext `loadData()` re-initialize the pack using `initDailyPack(favLeagues)`.
- If her `favoriteLeagues` are still set (persisted in storage), the regenerated pack will match her preferences.
- If her leagues were **not** saved (line 160 in `completeOnboarding`), the pack falls back to mock data.

**Design observation:** There is **no explicit "welcome back for the weekend"** messaging. She just sees more matches. The app is **silent about the gap**.

### Day 7 (Sun 12 Apr)

Arsenal–Brentford, Aston Villa–Nott'm Forest, plus LaLiga match. She's now on a potential streak (if she predicted correctly).

**Leaderboard climb:** AppContext line 222 invalidates `['/api/leaderboard']` on prediction submit, so her rank refreshes. She might see a rank change.

### Day 8 (Mon 13 Apr)

CL QF L2 kicks off (Real–Arsenal, Inter–Bayern). She can revisit her Day 2 predictions and see how they settled.

**Match detail line 124:**
```javascript
const { data: fixtureEvents } = useFixtureEvents(id);
```

Events (goals, red cards, etc.) populate the **Events** tab. She can replay her picks and see the timeline.

### Day 9 (Tue 14 Apr)

Aston Villa–PSG, Dortmund–Barcelona. She may unlock a tier badge or achievement.

**Profile achievements (line 300–446 in profile.tsx):**
```javascript
const achievements = achData?.achievements ?? [];
const unlockedCount = achievements.filter((a: any) => a.unlocked).length;
```

If her accuracy or streak crosses a threshold, achievements unlock. She sees a badge appear in her profile achievements grid.

### Day 10 (Wed 15 Apr)

Europa QF L2 + Conference quarters. Final day of the mock cycle. She reviews her total points and accuracy.

**Zero-state exit:** By Day 10, if she made 5+ predictions across the 10 days, `isDayZero` becomes false (if it wasn't already). Her profile hero shows real progress.

---

## Verdict

### Favorite day: **Day 5 (Reinstall)**

The cold-start is handled **elegantly in the Happy Path**: auth is clean, onboarding is skipped if she's a returning user, the home screen immediately shows her a fresh daily pack, and she can start predicting within seconds.

**Why this day resonates:** Priya doesn't feel lost. The emerald minimalism is quiet and confident. The gradient daily pack hero is the only "wow" moment—it tells her there's something to do right now. No tutorial. No fluff.

### Least favorite day: **Day 6–7 (Weekend)**

The app is **silent** about her return. Days 1–4 happened without her. She reinstalled on Day 5, so Days 6–10 are a blur of catching up with no explicit "you've been gone" narrative. The app treats every user the same: just show matches and streaks. For a lapsed user, **that silence is a bug disguised as minimalism.**

---

## One concrete fix for the reinstall experience

### **"Welcome Back" banner (1 day only)**

When a returning user logs in after >2 days away, show a single, dismissible banner above the Home header:

```
"Welcome back! You've been away for 6 months. Your daily pack resets every day."
```

- **Where:** `app/(tabs)/index.tsx` line 225 (below ScreenHeader, above streak hero)
- **Timing:** Show only if `profile.lastLoginAt` exists and is >2 days old. Dismiss on tap.
- **Design:** Quiet emerald border-left accent, white surface, 1px hairline, 44px tall. Matches the minimalism.
- **File:** Add a `ReturningUserBanner` component or inline a View.

This one-liner restores **context** without disrupting the elegant entry. It says, "We know you were gone. Your data is safe. Your pack is fresh. Go."

---

## Bugs & dead ends summary

### 1. **No "welcome back" for returning users**
**File:** `app/(tabs)/profile.tsx`, line 274
```javascript
const isDayZero = !profile || profile.totalPredictions === 0;
```
The "welcome message" only shows on true zero-state (`isDayZero`). A user with old data but a long absence gets no acknowledgment.

### 2. **No last-login tracking**
**File:** `contexts/AppContext.tsx`, line 145–157
```javascript
const newProfile: UserProfile = {
  ...
  joinedAt: Date.now(),
  ...
};
```
Only `joinedAt` is tracked. There's no `lastLoginAt` field to detect returning users. This makes the "welcome back" fix above harder to implement without schema changes.

### 3. **Favorite leagues may not persist on reinstall**
**File:** `contexts/AppContext.tsx`, line 97
```javascript
await initDailyPack(favLeagues);
```
The daily pack re-init depends on `favoriteLeagues` from storage. If that list is empty (or not saved during the first onboard), the pack may use mock leagues. Priya's preferences from 6 months ago might not match the regenerated pack.

### 4. **Empty state is aspirational but opaque**
**File:** `app/(tabs)/index.tsx`, line 281–288
```javascript
} : dailyPickMatches.length === 0 ? (
  <View style={styles.emptyWrap}>
    <EmptyState
      icon="football-outline"
      title="No picks today"
      subtitle="Check back later for today's matches"
    />
  </View>
```
When there are no matches for a user's leagues, the empty state says "Check back later." This is **aspirational** (implies more will come) but doesn't explain why her daily pack is empty. Is it a filter? A league mismatch? A data bug?

### 5. **No explicit "profile recovered" state**
**File:** `contexts/AppContext.tsx`, line 120–135
```javascript
try {
  const res = await apiRequest('GET', '/api/auth/me');
  const data = await res.json();
  if (data?.user && prof) {
    const serverProfile: UserProfile = {
      ...prof,
      ...
    };
```
The app silently merges server and local profile data. If the server has newer data (e.g., streak calculations), it overwrites local. But Priya has no visibility into this merge. What if her local data is ahead? What if the server is stale?

### 6. **Onboarding gate uses simple boolean, not timestamp**
**File:** `app/onboarding.tsx`, line 62
```javascript
const { completeOnboarding, leagues: contextLeagues } = useApp();
```
The router (likely in `_layout.tsx` or RootStack) uses `onboardingDone` to decide route. But this boolean doesn't distinguish between "just onboarded" and "onboarded 6 months ago." A lapsed user skips onboarding with the same flag as a fresh user.

---

## Key question: Are empty states aspirational or apologetic?

**Quote:** `app/(tabs)/index.tsx`, line 285–286:
> "No picks today"
> "Check back later for today's matches"

**Answer:** **Aspirational.** The tone assumes matches will come. There's no apology for the absence, no "your leagues have no matches today," no "update your favorites." It's a clean, forward-looking message. But for Priya, returning after 6 months, it reads as **slightly apologetic** because she doesn't know if the absence is her fault (wrong leagues) or the system's (no fixtures). **A one-word fix:**

> "No picks today"
> "Your favorites have no matches right now. Update leagues in Settings."

This shifts the empty state from **aspirational** (time will fix it) to **actionable** (you can fix it).

---

## Summary for product

Priya's reinstate flow is **silently excellent**. The app respects her time by skipping onboarding, regenerating her daily pack, and offering immediate action. But it leaves her **contextually unmoored**:

1. No "welcome back" banner.
2. No explanation of the data merge from local to server.
3. No hint that her old favorite leagues may have expired or been reset.
4. No acknowledgment that 6 months of history is still on her profile, but it's old.

**These are not design flaws—they're design omissions.** The minimalism is so clean that it erases the seams. Adding a single returning-user banner (fixture: 1 day) solves 80% of the disorientation. The rest is small labels and API transparency.

**Priya will stick around. She'll make a prediction on Day 5, climb the leaderboard on Day 6–7, and unlock achievements by Day 10. But she'll do it unsure whether the app is welcoming her back or just showing her the same face it shows everyone else.**
