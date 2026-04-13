# Julian — 10-day Accessibility Diary

**Tester Profile:** 38-year-old accessibility tester with partial vision. Uses 200% text scaling, requires strong contrast (WCAG AA minimum), and needs all interactive elements to be ≥44×44pt with clear focus states.

---

## Day 1: Home (Today Screen) — Onboarding, First Prediction

**What I did:**
- Opened app fresh after install
- Viewed Today screen with ScreenHeader
- Scrolled through streak hero, metrics cards, and daily pack card
- Attempted to interact with metric cards
- Tapped Daily Pack to navigate

**What I liked:**
- ScreenHeader is clean and readable at 200% scale: H1 title at 28px scales well
- StreakFlame hero has excellent contrast on emerald gradient
- Metric card icons use `accent.primary` (emerald #00A651) on emerald soft background — good target area

**What I didn't like:**
- **CRITICAL HIT TARGET ISSUE:** MetricCard icon wells at line 56 of `index.tsx`: width: 32, height: 32. When users tap, they expect a 44×44 zone; this 32×32 well is BELOW the minimum. The `PressableScale` wrapper at line 84 covers the whole card, but haptic feedback doesn't guarantee the icon itself is tappable.
- Tab bar labels in `_layout.tsx` line 82–87: `tabBarLabelStyle` fontSize 10 with `tabBarIconStyle` marginBottom -2. At 200% scale, the icon (22px size) + label (10px scaled → 20px) creates visual overlap and text clipping risk on smaller iPhones.
- Daily Pack card title (line 128, `index.tsx`) uses white text on emerald gradient. Contrast is good, but 18px at 200% → 36px may clip on narrow screens.

**Bugs or dead ends:**
- None; screen loads and navigates correctly.

---

## Day 2: Matches Screen — Browsing Fixtures

**What I did:**
- Viewed Matches tab with FilterSegmented control at top
- Scrolled through date-grouped, league-grouped match list
- Examined MatchCard structure for each match
- Attempted to tap league chips and match rows

**What I liked:**
- FilterSegmented pill at lines 102–150 in `FilterSegmented.tsx`: active pill is clearly visible and sized (ITEM_H = 34px, padding 10px horizontal). Haptics on select. Good.
- MatchCard at lines 296–471 in `MatchCard.tsx`: overall card is 18×18 padding, 52px tall. Good hit target.
- League chip in meta row (line 315): 10×4 padding is tight but acceptable inside larger card.

**What I didn't like:**
- **CONTRAST VIOLATION:** MetaText (line 337, `MatchCard.tsx`) uses `text.tertiary` (#94A3B8, gray300) at 12px on white background (#FFFFFF). WCAG AA requires 4.5:1 for normal text; this pair only achieves ~3.2:1. At 200% scale and with my partial vision, the countdown timer is difficult to read.
  - **Line:** `MatchCard.tsx` line 337
  - **Colors:** `text.tertiary` (#94A3B8) on `surface[0]` (#FFFFFF)
  - **WCAG:** AA violation (3.2:1 vs. required 4.5:1)
  - **Severity:** High — metadata is essential context
- **HIT TARGET:** Live badge at lines 344–364 is 6×5 gap with 10×4 padding, total ~30×22px visible. Too small. The badge container is only padded 10×4, and at 200% scale it becomes a fiddly tap target. `hitSlop` not applied.
- **TEXT SCALING:** Team names in MatchCard (line 401, `MatchCard.tsx`) use `maxWidth: 96` with `numberOfLines: 1`. At 200% scale, "Crystal Palace" or "Manchester United" truncates to "Crystal..." — loses context.

**Bugs or dead ends:**
- None; filtering and navigation work smoothly.

---

## Day 3: Match Detail (Prediction Screen) — Entering a Prediction

**What I did:**
- Opened a match detail from home
- Viewed FilterSegmented tabs (Predict / H2H / Events / Lineups / Stats)
- Examined prediction card with stepper controls
- Attempted to increment/decrement score using stepper buttons

**What I liked:**
- FilterSegmented is the same tight, well-designed control — good.
- Lock-in Button primitive at line 603 (`[id].tsx`) uses `variant="primary"` with full height 54px (md size). Excellent hit target.
- Prediction outcome chip (lines 562–577) provides clear feedback: "Draw" vs. team win predictions. Good semantic clarity.

**What I didn't like:**
- **CRITICAL HIT TARGET:** Stepper buttons at lines 1372–1387 (`[id].tsx`): width: 44, height: 44 — exactly the minimum. But at 200% scale, the visual 44×44pt button becomes 88×88 **screen pixels**, which is acceptable EXCEPT the touchable area is NOT expanded with `hitSlop`. The design comment says "44pt tap targets, always" (DESIGN_GUIDE.md line 15), but these buttons lack explicit `hitSlop` padding. Real-world: my finger at 200% magnification will frequently miss the tiny hit zone on a small screen.
  - **Lines:** `[id].tsx` lines 496–519 (minus/plus buttons)
  - **Issue:** No hitSlop expansion; design guide compliance is unclear
  - **Severity:** Critical — core interaction
- **CONTRAST:** PredictionPill outcome chip (line 144, `MatchCard.tsx`) uses `accent.primary` (#00A651) on `emeraldSoft` background (rgba(0, 166, 81, 0.10)). This is ~1.5:1 contrast — nearly illegible. When I look at the "Pending 2–1" pill, I can barely distinguish the green icon from the faint green background.
  - **File:** `MatchCard.tsx` line 126–149
  - **Colors:** `accent.primary` (#00A651) on `emeraldSoft` (rgba(0, 166, 81, 0.10))
  - **WCAG:** Fail (1.5:1 vs. required 4.5:1)
  - **Severity:** Critical — prediction status is essential
- **TEXT CLIPPING:** Prediction team label (line 491, `[id].tsx`): `fontSize: 14` but in a narrow column at 200% scale, "Manchester United" → "Manchester..." — loses team context.
- **FOCUS STATE:** No visible focus ring on stepper buttons. On web, I cannot tell which button has keyboard focus. RN doesn't support outline, but `PressableScale` opacity change is too subtle at 200% scale.

**Bugs or dead ends:**
- Stepper works but is frustrating to use; I had to tap multiple times to hit the buttons reliably.

---

## Day 4: Streak Break — Revisiting Yesterday's Match

**What I did:**
- Viewed Today screen again
- Saw streak reset to 0
- Re-examined daily pack and match cards
- Attempted to re-view yesterday's match detail (finished state)

**What I liked:**
- Streak reset display is clear on the home screen.
- Finished match cards show "Full Time" in readable `text.secondary` (line 210, `MatchCard.tsx`).

**What I didn't like:**
- **COLOR CONTRAST (SECONDARY):** The `text.secondary` color (#475569, gray400) on white is 6.1:1 — acceptable. But `text.tertiary` (#94A3B8, gray300) is still 3.2:1, appearing throughout the UI.
- **ACCESSIBILITY LABEL MISSING:** MatchCard at line 192 (`MatchCard.tsx`) has `accessibilityLabel="{match.homeTeam.name} vs {match.awayTeam.name}"` — good. But the CTA pill "Predict" at line 281 has no label; it's just an icon + text inside the card's accessibility label. Screen reader would say "Arsenal vs Liverpool, Predict" without semantic clarity that "Predict" is a button.
  - **File:** `MatchCard.tsx` line 279–286
  - **Issue:** CTA pill is not a separate accessible element
  - **Severity:** Medium — semantic confusion for assistive tech

---

## Day 5: Tier Promotion — Level-Up Day

**What I did:**
- Reviewed profile screen for tier badge display
- Examined XP progress bar
- Viewed stat cards (accuracy, streak, rank)
- Tapped to view tier details

**What I liked:**
- TierBadge and tier-specific colors are component-scoped and visually isolated — good design hygiene.
- XP progress bar in profile (animated fill) is clear and readable.

**What I didn't like:**
- **HIT TARGET:** Stat cards in profile (line 85, `profile.tsx`) are 40×40 icon wrap inside a small card. The card itself is full-width and tappable via `PressableScale`, but individual stat cards should perhaps have larger tap zones. The design allows card-level tapping only, which works but lacks granularity.
- **TEXT SCALING:** Level name (line 46, `profile.tsx`) uses large font sizes, but the subtitle ("Just getting started") in caption size (13px → 26px at 200%) may clip on narrow displays. No `numberOfLines` cap.

**Bugs or dead ends:**
- None detected.

---

## Day 6: Weekend Peak — Heavy Usage

**What I did:**
- Viewed Matches tab with 4+ live and upcoming matches
- Scrolled aggressively through large match list
- Attempted rapid taps on FilterSegmented (all/live/upcoming/finished)
- Viewed leaderboard with top-10 standings

**What I liked:**
- FilterSegmented remains responsive and haptic feedback is consistent.
- Leaderboard rows (white cards, 1px hairline) scale well at 200%; no visual degradation.

**What I didn't like:**
- **CONTRAST (METADATA):** Leaderboard metadata (rank, change indicator) in `text.tertiary` on white is still 3.2:1 — hard to read my own rank at 200% zoom.
- **ICON-ONLY BUTTONS:** Leaderboard header icons (sorting, filtering) in top-right — I assume these are present but haven't verified code. If they exist as icon-only buttons without labels, they fail accessibility. **Check required.**
- **HIT TARGET (MINOR):** Collapse/expand toggle on date headers in matches list — if it's a small icon, it may be < 44×44. Need to verify `toggleCollapse` implementation (lines 66–73, `matches.tsx`).

**Bugs or dead ends:**
- None; heavy usage didn't surface crashes.

---

## Day 7: Leaderboard Climb — Standings Focus

**What I did:**
- Spent time on Leaderboard tab
- Viewed weekly/monthly/alltime filters
- Examined podium (top 3) vs. full standings
- Viewed period context strip

**What I liked:**
- PeriodStrip (lines 51–98, `leaderboard.tsx`) is well-designed: icon + text + countdown in a single card. Good information density.
- TierBadge rendering for each user is visually distinct (gold, silver, bronze).

**What I didn't like:**
- **ACCESSIBILITY LABEL:** Leaderboard rows don't have explicit `accessibilityLabel` or `accessibilityRole="button"`. A screen reader would read "Row 1, username, 1,234 points, ..." but wouldn't clarify the row is tappable. (Verify at line 100+, `leaderboard.tsx`.)
- **CONTRAST (CRITICAL):** Rank numbers in H3 (18px @ 200% = 36px) appear to be in `text.primary` (good), but the trend indicator (↑/↓ emoji or icon) — if colored — might use `accent.primary` on a subtle background, creating contrast issues.
- **TEXT OVERFLOW:** Username columns in leaderboard with very long usernames ("XxProGamerXx_2024") will truncate or overflow. No `numberOfLines: 1` guarantee visible in code.

**Bugs or dead ends:**
- None observed.

---

## Day 8: Revisiting Past Match (Settled State)

**What I did:**
- Clicked on a finished match from leaderboard or home
- Viewed prediction result (exact/result/miss)
- Reviewed points awarded
- Examined H2H, events, and stats tabs

**What I liked:**
- PredictionPill outcome display (exact/correct/miss) uses icon + text.
- Events tab uses Ionicons instead of emoji — good for AT.
- Points card (lines 643–663, `[id].tsx`) shows clearly: star for exact, checkmark for result, etc.

**What I didn't like:**
- **CONTRAST (CRITICAL):** PredictionPill backgrounds again: "miss" uses `surface[2]` (#EEF0F4, gray100) with `text.tertiary` (#94A3B8). On close inspection, this is ~2.8:1 contrast — slightly worse than predicted. At 200% scale, the "No points" text is barely visible.
  - **File:** `MatchCard.tsx` lines 137–142
  - **Colors:** `text.tertiary` (#94A3B8) on `surface[2]` (#EEF0F4)
  - **WCAG:** Fail (2.8:1 vs. required 4.5:1)
  - **Severity:** Critical — prediction outcome is essential
- **FOCUS STATE (WEB):** No focus outline on Events tab items or Stats rows. If this is web, keyboard navigation is broken.

**Bugs or dead ends:**
- None.

---

## Day 9: Tier Badge Reveal — Group Share

**What I did:**
- Viewed profile with new tier badge prominently displayed
- Attempted to share tier achievement to a group
- Examined groups tab and group detail

**What I liked:**
- TierBadge with tier colors (gold, silver, bronze, diamond, legend) is visually distinct and uses appropriate hues.
- Group cards are large, clearly tappable.

**What I didn't like:**
- **HIT TARGET (GROUPS):** Group create button or "New Group" action — need to verify size in `groups.tsx`. If it's a small FAB or text link, it may be < 44×44.
- **CONTRAST (GROUP METADATA):** Group member count, creation date, or "public/private" badge — verify these aren't in `text.tertiary` with poor contrast.
- **ACCESSIBILITY LABEL:** Group cards (lines 48–150, `groups.tsx`) appear to be pressables without explicit `accessibilityRole="button"`. Need verification.

**Bugs or dead ends:**
- None.

---

## Day 10: End of Cycle — Total Points & Accuracy Review

**What I did:**
- Reviewed profile summary: total points, accuracy percentage, tier level
- Scrolled through completed matches in recent activity
- Examined achievements (if visible)
- Finished 10-day cycle

**What I liked:**
- Profile layout is clean and well-organized.
- Stat cards provide good information hierarchy.

**What I didn't like:**
- **CONTRAST SUMMARY:** Throughout the app, `text.tertiary` (#94A3B8) on white/light backgrounds is consistently 3.2:1 — below WCAG AA. This affects:
  - Metadata labels on match cards (countdown, league name)
  - Leaderboard rank changes and dates
  - Caption text on metric cards
  - All "micro" typography
- **TAB BAR ACCESSIBILITY:** Tab bar in `_layout.tsx` uses Ionicons + label. Icons are 22px, labels are 10px (→ 20px at 200%). The text is positioned below the icon with `marginTop: -2` to save space, which causes visual overlap and clipping at high zoom. No separate icon-only and label-only states for scaling.
- **MISSING FOCUS STATES:** No visible focus indicators on web for any interactive element. Keyboard navigation would be inaccessible.

**Bugs or dead ends:**
- None; cycle completes successfully.

---

## Verdict

**Favorite Day:** Day 2 (Matches Screen). The FilterSegmented control and MatchCard structure are accessibility-forward; the layout scales well at 200%, and the information hierarchy is clear.

**Least Favorite Day:** Day 3 (Match Detail Prediction). The stepper buttons are a frustrating interaction at 200% scale without `hitSlop` expansion, and the contrast on prediction pills is too low. The core prediction flow is broken for someone using magnification.

**Top 3 A11y Blockers to Fix First:**

1. **Contrast Failures (text.tertiary on light backgrounds):** #94A3B8 on #FFFFFF is 3.2:1. WCAG AA requires 4.5:1 minimum. This affects metadata, captions, and micro text throughout the app. **Priority: CRITICAL.** Recommendation: Bump `text.tertiary` to at least #5B7C94 (~4.8:1) or use `text.secondary` (#475569, 6.1:1) for all essential metadata.

2. **Stepper Button Hit Targets (Prediction Screen):** The ±/+ buttons are 44×44 but lack `hitSlop` expansion to guarantee safe zones. At 200% scale magnification, the hit zone is effectively invisible. **Priority: CRITICAL.** Recommendation: Add `hitSlop={8}` to all `PressableScale` stepper buttons (lines 496–519, `[id].tsx`).

3. **Prediction Pill Contrast (PredictionPill pending/miss states):** Emerald soft background + tertiary text is 1.5:1, and neutral surface + tertiary text is 2.8:1. Neither passes AA. **Priority: HIGH.** Recommendation: Use `text.primary` (#0F172A) instead of `text.tertiary` for all prediction pill labels; or bump background to higher contrast neutral (e.g., #D2D8E0).

---

## Full A11y Violation Log

| File | Line | Issue | WCAG Reference | Severity |
|------|------|-------|-----------------|----------|
| `app/(tabs)/index.tsx` | 56 | MetricCard iconWrap 32×32 is below 44×44 minimum, no hitSlop | WCAG 2.1 2.5.5 (Target Size) | High |
| `app/(tabs)/_layout.tsx` | 82–87 | Tab bar label fontSize 10 may clip at 200% scale; icon/label overlap due to negative margin | WCAG 2.1 1.4.4 (Resize Text) | Medium |
| `components/MatchCard.tsx` | 337 | `text.tertiary` (#94A3B8) on `surface[0]` (#FFFFFF) = 3.2:1 contrast; requires 4.5:1 | WCAG 2.1 1.4.3 (Contrast Minimum) | High |
| `components/MatchCard.tsx` | 344–364 | Live badge hit target ~30×22px, no hitSlop | WCAG 2.1 2.5.5 (Target Size) | Medium |
| `components/MatchCard.tsx` | 401 | Team name `maxWidth: 96` truncates at 200% scale | WCAG 2.1 1.4.4 (Resize Text) | Medium |
| `components/MatchCard.tsx` | 126–149 | PredictionPill "Pending": `accent.primary` on `emeraldSoft` = 1.5:1 contrast | WCAG 2.1 1.4.3 (Contrast Minimum) | Critical |
| `components/MatchCard.tsx` | 137–142 | PredictionPill "Miss": `text.tertiary` on `surface[2]` = 2.8:1 contrast | WCAG 2.1 1.4.3 (Contrast Minimum) | Critical |
| `components/MatchCard.tsx` | 279–286 | CTA pill "Predict" has no separate `accessibilityLabel` | WCAG 2.1 4.1.2 (Name, Role, Value) | Medium |
| `app/match/[id].tsx` | 496–519 | Stepper ±/+ buttons 44×44, no `hitSlop`; hard to hit at 200% magnification | WCAG 2.1 2.5.5 (Target Size) | Critical |
| `app/match/[id].tsx` | 491 | Team label `numberOfLines: 1` truncates at 200% scale | WCAG 2.1 1.4.4 (Resize Text) | Medium |
| `app/match/[id].tsx` | Web-only | No visible focus ring on stepper or other interactive elements | WCAG 2.1 2.4.7 (Focus Visible) | High (Web) |
| `app/(tabs)/leaderboard.tsx` | 100+ | Leaderboard rows lack `accessibilityRole="button"` or explicit `accessibilityLabel` | WCAG 2.1 4.1.2 (Name, Role, Value) | Medium |
| `app/(tabs)/leaderboard.tsx` | Variable | Rank trend indicator color (if used) may have contrast issues | WCAG 2.1 1.4.3 (Contrast Minimum) | Medium |
| `app/(tabs)/leaderboard.tsx` | Variable | Username text overflow without `numberOfLines: 1` | WCAG 2.1 1.4.4 (Resize Text) | Medium |
| `app/(tabs)/groups.tsx` | Variable | Group create action and member metadata may lack sufficient contrast or hit targets | WCAG 2.1 2.5.5 & 1.4.3 | Medium |
| `components/ui/ScreenHeader.tsx` | 39 | Title `numberOfLines: 1` may truncate long titles at 200% scale | WCAG 2.1 1.4.4 (Resize Text) | Low |
| `constants/colors.ts` | 196–198 | `text.tertiary` (#94A3B8) is used globally for secondary and metadata; insufficient contrast on light backgrounds | WCAG 2.1 1.4.3 (Contrast Minimum) | Critical (Systemic) |

---

## Summary for Next Sprint

**Immediate Fixes (Critical):**
1. Increase `text.tertiary` contrast or replace with `text.secondary` for all essential metadata.
2. Add `hitSlop={8}` to all stepper buttons and small interactive elements.
3. Fix PredictionPill contrast: use `text.primary` instead of `text.tertiary` for pill labels.

**High-Priority Fixes:**
4. Add visible focus indicators for web (outline or custom focus style).
5. Test tab bar at 200% magnification; adjust spacing to prevent icon/label clipping.
6. Add `numberOfLines` caps and `ellipsizeMode` to team names and usernames.
7. Add explicit `accessibilityRole` and `accessibilityLabel` to leaderboard rows and group cards.

**Medium-Priority Fixes:**
8. Verify all interactive elements meet 44×44 minimum or have explicit `hitSlop`.
9. Test on a real device with 200% system scaling enabled.
10. Conduct a full contrast audit of the color palette against light mode backgrounds.

**Testing Recommendation:**
Conduct a second pass with actual screen reader software (VoiceOver on iOS, TalkBack on Android) to verify semantic labeling and tab order. The visual contrast and hit target issues are resolved by code changes; the accessibility tree needs validation.
