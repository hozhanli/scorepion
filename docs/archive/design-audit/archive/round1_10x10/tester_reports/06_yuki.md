# Yuki — 10-day diary (minimalist audit)

I read the code. There are many violations. I'm not happy.

---

## Day 1: Auth & Onboarding screens

Traced the first-time user flow. Pressed start.

**Liked:**
- Auth screen uses proper `PressableScale` wrapping
- No stray `LinearGradient` in the layout

**Didn't like:**
- `auth.tsx` line 217: `logoMark` has shadow: `shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, elevation: 6`
- `auth.tsx` line 256: `modeTab` has shadow: `shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, elevation: 2`
- `onboarding.tsx` line 328: `logoMark` repeats shadow violation: `shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, elevation: 6`
- `onboarding.tsx` line 526: `readyIconInner` has shadow: `shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, elevation: 8`

No shadows allowed outside `GradientHero`. This is the contract.

---

## Day 2: Matches, Home (tabs)

Walked the daily pack and match list.

**Liked:**
- `MatchCard` uses `ScreenHeader` correctly
- `DailyPackCard` uses `GradientHero` (correct; canonical moment)
- `ProgressBar` properly quarantined in primitives

**Didn't like:**
- `(tabs)/index.tsx` line 105: inline hex `'#FFFFFF'` in ProgressBar `colors` prop (stray hex in screen)
- `(tabs)/index.tsx` line 131: inline hex `'#FFFFFF'` again in subtitle color
- `(tabs)/index.tsx` line 132: inline hex `'rgba(255, 255, 255, 0.9)'` in ProgressBar gradient
- Design guide §2: *"Raw hex should not appear inside screens"* — violated

---

## Day 3: Leaderboard

Saw the rankings. Checked the medal colors.

**Liked:**
- Medal colors use `Colors.palette.gold` where appropriate

**Didn't like:**
- `(tabs)/leaderboard.tsx` line 28: `const medalColors = { gold: '#D4AF37', silver: '#9CA3AF', bronze: '#B87333' }` — raw hex stash, not semantic
- `(tabs)/leaderboard.tsx`: ProgressBar uses inline hex `'#FFFFFF'` and `'rgba(255, 255, 255, 0.9)'`

---

## Day 4: Groups tab

Navigated the group list and detail.

**Liked:**
- Uses `PressableScale` consistently

**Didn't like:**
- `(tabs)/groups.tsx` line 19: `import Pressable` from react-native; multiple ad-hoc `<Pressable>` elements without `PressableScale` wrapper
- Violates §5 of Design Guide: *"Every tappable element must use `PressableScale` + `haptics`"*

---

## Day 5: Match Detail

Deep dive into match info, prediction, events.

**Liked:**
- Uses `PressableScale` on stepper controls (lines 496, 508, 533, 545)
- No stray `LinearGradient` in screen layout

**Didn't like:**
- `match/[id].tsx` line 462: `<Pressable>` for "Change" link without `PressableScale`
- Not wrapped; no haptic feedback

---

## Day 6: League view

Viewed league standings and stats tables.

**Liked:**
- Uses `Animated.View` + proper stagger on rows

**Didn't like:**
- `league/[id].tsx` line 7: `import { LinearGradient }` at screen level — violation flag
- `league/[id].tsx` line 96: `const medalColor = scorer.rank === 1 ? Colors.palette.gold : scorer.rank === 2 ? '#C0C0C0' : '#CD7F32'` — raw hex colors `'#C0C0C0'` and `'#CD7F32'` (silver, bronze) embedded in screen logic
- `league/[id].tsx` line 106–113: First `LinearGradient` usage outside primitives (medal gradient in `ScorerRowItem`)
- `league/[id].tsx` line 159–167: Second `LinearGradient` in `PlayerStatRow` (medal badge)
- `league/[id].tsx` line 316–321: Third `LinearGradient` in header hero (entire screen header)
- `league/[id].tsx` line 336–343: Fourth `LinearGradient` inside league icon
- `league/[id].tsx` line 366–375: Fifth `LinearGradient` for active tab pill (should be `FilterSegmented` primitive)
- `league/[id].tsx` line 388: `#FFD700` inline hex for yellow card icon well
- `league/[id].tsx` line 389: `'#B8860B'` inline hex for yellow card text
- `league/[id].tsx` line 427: `statColor="#B8860B"` passed as string literal (yellow card stray hex)
- `league/[id].tsx` line 563: `tabChipActive` shadow violation: `shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, elevation: 3`
- `league/[id].tsx` line 597–598: Inline hex for yellow card badge background `'#FFD700' + '15'` and border `'#FFD700' + '40'`

This file alone violates the gradient rule 6 times and embeds 5+ stray hex codes.

---

## Day 7: Settings

Navigated user preferences.

**Liked:**
- `ScreenHeader` structure is clean

**Didn't like:**
- `settings.tsx` line 160: `backgroundColor: colors.card` uses theme but then also uses semantic tokens
- `settings.tsx` line 143: raw `<Pressable>` (back button) without `PressableScale`
- Multiple raw `<Pressable>` instances throughout (lines 168, 171, 176, 190, 209, 213, 217, 223, 247)
- `settings.tsx` line 222: `shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 2` on section card
- Appears twice (lines 222 and line 232 area) — shadow rule violated

---

## Day 8: Premium (upsell)

Viewed the tier features.

**Liked:**
- Uses `PressableScale` on plan cards

**Didn't like:**
- `premium.tsx` line 8: `import { LinearGradient }` — violation flag
- `premium.tsx` line 111–115: Screen-level `LinearGradient` for hero (navy gradient background)
- `premium.tsx` line 124–128: Second `LinearGradient` for crown circle (`['#FFD700', '#FFB300', '#FF8F00']` — gold gradient OK but breaking the structure rule)
- `premium.tsx` line 223–227: Third `LinearGradient` for CTA button (gold gradient again)
- `premium.tsx` line 30: Feature color `'#3B82F6'` (blue) — stray hex, not in system
- `premium.tsx` line 32: Feature color `'#8B5CF6'` (purple) — stray hex
- `premium.tsx` line 35: Feature color `'#EC4899'` (pink) — stray hex
- Design Guide §1: *"Emerald is the single action colour"* — feature icons should not use arbitrary colors

---

## Day 9: Primitives layer

Checked `components/ui/*.tsx` for contract violations.

**Liked:**
- `TierBadge`, `StreakFlame`, `GradientHero` properly quarantine their gradients
- `ProgressBar` uses animated `LinearGradient` correctly

**Didn't like:**
- `FilterSegmented.tsx` line 119–123: Shadow violation on active pill: `shadowColor: 'rgba(0, 166, 81, 0.28)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, elevation: 2`
- Design Guide §5: *"The only permitted shadows are the emerald glow halos inside `GradientHero`"*
- `Button.tsx` line 129–134: `primaryShadow` style — shadow on primary button: `shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, elevation: 3`
- `Button.tsx` line 136–141: `dangerShadow` style — shadow on danger button
- These shadows are baked into the primitive and inherited by every button across the app
- `EmptyState.tsx` line 45–49: Shadow on empty state container: `shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, elevation: 3`

Shadows in primitives cascade the violation into *every screen using them*.

---

## Day 10: Tab bar & layout

Checked the router setup.

**Liked:**
- `(tabs)/_layout.tsx` sets `elevation: 0, shadowOpacity: 0` to remove native tab bar shadow

**Didn't like:**
- Just this one thing is proactive, but it came *after* the violations in Button, FilterSegmented, EmptyState that add shadows to every instance

---

## Verdict

**Favorite day:** Day 1. Auth screen is nearly clean.
**Least favorite day:** Day 6. `league/[id].tsx` is a **design contract violation parade**. Five `LinearGradient` imports at screen level, six stray hex codes, shadow on components, ad-hoc tab styling that should be `FilterSegmented`.

**Top 3 violations to fix first:**

1. **Remove all `shadowOffset` / `shadowOpacity` / `elevation` from Button, FilterSegmented, EmptyState primitives** (lines Button.tsx 129–141, FilterSegmented.tsx 119–123, EmptyState.tsx 45–49). These cascade shadows into every instance across the app. Replace with flat, hairline-only surfaces.

2. **Excise the five `LinearGradient` imports from `league/[id].tsx`** (lines 7, 106, 159, 316, 336, 366). Replace medal gradients with semantic tokens (e.g., emerald for rank 1, neutral for rank 2–3). Use `FilterSegmented` primitive for tab pills instead of hand-rolled gradient.

3. **Audit and remove stray hex colors from all screens** (auth.tsx, onboarding.tsx, settings.tsx, premium.tsx, league/[id].tsx). Every hex must go through `Colors.surface`, `Colors.text`, `Colors.accent`, `Colors.border` semantic roles. Stray color strings like `'#FFD700'`, `'#B8860B'`, `'#3B82F6'` break the Emerald Minimalism thesis.

---

## Full violation log

| File | Line | Violation | Severity |
|------|------|-----------|----------|
| auth.tsx | 217 | shadowOffset on logoMark | high |
| auth.tsx | 256 | shadowOffset on modeTab | high |
| onboarding.tsx | 328 | shadowOffset on logoMark | high |
| onboarding.tsx | 526 | shadowOffset on readyIconInner | high |
| (tabs)/index.tsx | 105 | inline hex `#FFFFFF` in ProgressBar colors | med |
| (tabs)/index.tsx | 131 | inline hex `#FFFFFF` in subtitle | med |
| (tabs)/index.tsx | 132 | inline hex rgba(255, 255, 255, 0.9) | med |
| (tabs)/leaderboard.tsx | 28 | medalColors object with stray hex #D4AF37, #9CA3AF, #B87333 | med |
| (tabs)/leaderboard.tsx | ~35 | ProgressBar with inline hex colors | med |
| (tabs)/groups.tsx | 19 | bare Pressable import (used ad-hoc without PressableScale) | med |
| match/[id].tsx | 462 | Pressable for "Change" link without PressableScale wrapper | med |
| league/[id].tsx | 7 | LinearGradient import at screen level | high |
| league/[id].tsx | 96 | stray hex #C0C0C0 (silver medal) | med |
| league/[id].tsx | 96 | stray hex #CD7F32 (bronze medal) | med |
| league/[id].tsx | 106–113 | LinearGradient in ScorerRowItem (medal gradient) | high |
| league/[id].tsx | 159–167 | LinearGradient in PlayerStatRow (medal) | high |
| league/[id].tsx | 316–321 | LinearGradient for screen hero | high |
| league/[id].tsx | 336–343 | LinearGradient for league icon | high |
| league/[id].tsx | 366–375 | LinearGradient for active tab (should use FilterSegmented) | high |
| league/[id].tsx | 388 | inline hex #FFD700 for yellow card icon well | med |
| league/[id].tsx | 389 | inline hex #B8860B for yellow card text | med |
| league/[id].tsx | 427 | statColor="#B8860B" hardcoded | med |
| league/[id].tsx | 563 | tabChipActive shadowOffset | high |
| league/[id].tsx | 597–598 | inline hex #FFD700 in background/border concatenation | med |
| settings.tsx | 143 | Pressable back button without PressableScale | med |
| settings.tsx | 168, 171, 176, 190, 209, 213, 217, 223, 247 | ad-hoc Pressable instances throughout | med |
| settings.tsx | 222, 232 | shadowOffset on section cards | high |
| premium.tsx | 8 | LinearGradient import | high |
| premium.tsx | 111–115 | LinearGradient for hero background | high |
| premium.tsx | 124–128 | LinearGradient for crown circle | high |
| premium.tsx | 223–227 | LinearGradient for CTA button | high |
| premium.tsx | 30 | inline hex #3B82F6 (blue feature color) | med |
| premium.tsx | 32 | inline hex #8B5CF6 (purple feature color) | med |
| premium.tsx | 35 | inline hex #EC4899 (pink feature color) | med |
| Button.tsx | 129–134 | primaryShadow style (affects all primary buttons) | high |
| Button.tsx | 136–141 | dangerShadow style (affects all danger buttons) | high |
| FilterSegmented.tsx | 119–123 | pill shadowOffset (affects all segmented filters) | high |
| EmptyState.tsx | 45–49 | container shadowOffset (affects all empty states) | high |

---

## Summary

The Emerald Minimalism contract is clear:
1. No shadows outside `GradientHero`.
2. No `LinearGradient` outside the five quarantined primitives.
3. No raw hex in screens; use semantic roles.
4. Every tap target must use `PressableScale`.

Current state: **~35 violations across 8 files**. The primitives layer (Button, FilterSegmented, EmptyState) are the worst culprits because their violations propagate into every screen.

My recommendation: Schedule a fix pass. Start with the primitives, then audit the three screens with the most violations (league/[id], premium, settings). The rest collapse quickly after that.

I'm not installing the app until this is fixed.
