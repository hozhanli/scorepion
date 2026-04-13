# Scorepion — Premium Design Audit

**Version:** v1.0 · Audit-first pass (light mode only)
**Date:** 2026-04-10
**Scope:** Visual, interaction and UX refinement. Zero feature additions. All current functionality preserved.
**Target quality bar:** Apple · Linear · Stripe · Arc · Sorare · Things 3 · Strava

> This document is the output of Phase 1–4 of the design refresh. It is meant to be **read, marked up, argued with, and signed off before any code changes are made**. Phase 5 implementation begins only after your review.

---

## Table of Contents

1. [Executive diagnosis](#1-executive-diagnosis)
2. [Premium design thesis — "Emerald Minimalism"](#2-premium-design-thesis--emerald-minimalism)
3. [Global system issues](#3-global-system-issues)
4. [Parallel page review — findings by track](#4-parallel-page-review--findings-by-track)
5. [Unified visual system](#5-unified-visual-system)
6. [Screen-by-screen implementation plan](#6-screen-by-screen-implementation-plan)
7. [Component & token updates](#7-component--token-updates)
8. [End-to-end consistency checklist](#8-end-to-end-consistency-checklist)

---

## 1. Executive diagnosis

Scorepion has **strong bones and a confused face**. The motion library is professional, the spacing is generally respectful, the tab architecture is sound, the gamification ideas (streaks, tiers, groups, achievements, weekly prizes) are well-conceived, and the code structure is production-quality. But the visual surface is caught in a civil war that prevents it from ever reading as premium.

The core problem: **the v3 "Clean Minimalist" design guide and the v4 "Social.Habit.Game." implementation directly contradict each other, and the app shows both at the same time.** The v3 guide at `DESIGN_GUIDE.md:191–198` explicitly forbids:

> - "Use gradients on backgrounds"
> - "Mix more than two accent colors"
> - "Use borders where a shadow works"
> - "Add decorative ornaments, glows, frames"

The v4 code at `constants/colors.ts:144–186` ships: 7 hero gradients, 3 wash gradients that **are** being used as screen backgrounds on 6+ screens, 15+ named accent colors, 8 elevation tokens including 4 colored glows, and a full tier-gradient system. The app then deploys all of this — **plus** a permanent orange offline banner — on top of what is supposed to be a clean minimalist canvas.

The result is that every screen shows both philosophies arguing with each other. It is neither confidently minimal nor confidently gamified. It is cluttered, noisy, and inconsistent at the exact moments it should feel calm, and silent at the exact moments it should celebrate.

### The seven hard truths

1. **Design system civil war (v3 ↔ v4).** Two philosophies, one codebase, shipped simultaneously. The user feels this as "vaguely cluttered" without being able to name it.
2. **Gradient pollution.** `washEmerald` / `washFlame` / `washViolet` have drifted from "celebration accents" to "default backgrounds." Hero moments should earn their gradient — right now the app gives it away on section headers and empty states.
3. **Color saturation.** Flame, violet, teal, coral, gold, cyan, red, purple, blue all appear on main tab screens. A premium app runs on 1 primary + 1 accent + 1 alert. Scorepion runs on seven.
4. **The offline banner is a permanent wound.** An orange "Can't reach server — running offline" bar sits above content on every screen (`ConnectionBanner.tsx:55–71`). This is a developer state polluting a production experience. It is the single most visible "this feels unfinished" moment in the app.
5. **Dark/light handoff is first-impression breaking.** Auth and onboarding render in dark navy (`auth.tsx:58–63`, `onboarding.tsx:95–100`); tabs render in light. A new user experiences three distinct visual contexts in their first five minutes with zero transition choreography. It reads as a bug, not as art direction.
6. **No celebration moments.** Prediction submit, streak tick, tier promotion, leaderboard climb — all silent. `haptics.success()` fires on submit but nothing visual rewards the action. In a competitive/streak product this is malpractice.
7. **Every screen invents its own header.** Home has an avatar + greeting bar, Matches has a gradient hero, Leaderboard has a bold title + period card, Groups has a purple squads hero, Profile has a minimal title + gear. There is no unified header formula. Users don't feel they are in one app.

### Why this matters commercially

Scorepion is trying to be a premium gamified football prediction product. The first-impression funnel goes: onboarding (dark) → auth (dark) → first tab screen (light, with an orange offline banner sitting above the content). A user deciding in the first 30 seconds whether to trust this product with their Friday night gets: "broken banner," "jarring theme switch," and "feature parity without polish." Churn is not a UX opinion — it is a visual trust problem.

### What this audit fixes

Everything above. Without adding features. Without touching the data layer. Without breaking a single interaction. Roughly **3 days of focused visual and motion work across ~12 files** restores this app to a confident, premium, art-directed state.

---

## 2. Premium design thesis — "Emerald Minimalism"

**Name:** Emerald Minimalism

**Inspiration stack:** Apple iOS (restraint), Linear (clarity), Stripe (precision), Arc (motion), Sorare (reward choreography), Strava (identity/competitive), Things 3 (surface discipline), Duolingo (celebration — but much more tastefully).

**Thesis in one sentence:**
> Scorepion is a football prediction product where whitespace and typography do the heavy lifting, emerald is the only primary color, and gradients and glows are earned — not given — by streaks, tier climbs, podium finishes, and match-day hero moments.

### The 5 principles

#### 1. One primary, one accent, one alert.
Emerald (#00A651) is the one and only action color: buttons, active tabs, progress, positive state, confirmations. Flame (#FF6B35) is reserved **exclusively** for streaks and match-live urgency. Gold (#F5A623) is reserved **exclusively** for podium/reward moments. Red (#EF4444) is reserved **exclusively** for alerts and losses. Everything else is neutral gray. Violet, teal, coral, cyan, purple and blue are retired from the main UI and kept only inside the tier badge gradients.

#### 2. Whitespace and typography do the heavy lifting.
Hierarchy is expressed by size, weight, color, and breathing room — not by colored backgrounds. A 28px H1 + a 13px caption + 24px of vertical space is more premium than a violet gradient card with 13 bits of micro-info crammed inside it. Every card has room to breathe.

#### 3. No background gradients. Ever.
Gradients appear in exactly 5 approved places: (a) `StreakFlame` when streak > 0, (b) tier badges, (c) hero cards at intentional moments, (d) progress bars, (e) reward celebration toasts. Screen backgrounds and wash accents (`washEmerald`, `washFlame`, `washViolet`) are deleted from the production surface. If a screen needs a warm tone, it uses a solid tint like `surface/2`, never a gradient.

#### 4. Elevation tells you what kind of surface it is, not what mood it's in.
Four elevation tiers only: `e0` (flat), `e1` (subtle — inputs, buttons), `e2` (cards, hero), `e3` (modals, overlays). Colored glows (`glowFlame`, `glowViolet`, `glowGold`, `glowEmerald`) are reserved **exclusively** for celebration moments. A regular card never glows. A tier-up badge does.

#### 5. Motion is paired with haptic, and celebration is mandatory.
Every interactive surface wraps in `PressableScale` with a haptic. Every reward moment (prediction confirmed, streak tick, tier climb, rank climb) fires a celebration animation + heavy/success haptic stack. Silence on reward is forbidden. Motion is also disciplined: entry animations cap at 400ms total cascade, rewards cap at 700ms, and nothing jitters on scroll.

### What survives from v4

The core v4 ambition — a gamified, tactile, emotionally engaging product — survives and is *strengthened*. Streaks, tiers, achievements, podiums and haptic feedback are all **kept**. `GradientHero`, `StreakFlame`, `TierBadge`, `ProgressBar`, `PressableScale` all stay. The motion library (`lib/motion.ts`) stays exactly as it is.

### What dies from v4

Background gradients. Violet/teal/coral/cyan/purple/blue as UI accents. Glows on non-celebration cards. The permanent offline banner. The idea that "more visual noise = more polish." The `night` and `sunset` multi-stop gradients. The `washEmerald` / `washFlame` / `washViolet` tokens.

### What survives from v3

The philosophical discipline. Whitespace. Type hierarchy. The idea that borders and shadows are not friends. Emerald as the single primary. The "calm" principle.

### What dies from v3

The self-denial about gamification. The fear of any celebration moment. The refusal to commit to any reward visual beyond a pill badge. Emerald Minimalism is minimalist **in surface**, not in soul.

---

## 3. Global system issues

These are the issues that appear on **every** screen and must be fixed at the system level before any screen-level work begins. Solving these removes roughly 60% of the premium gap by itself.

### 3.1 The v3 ↔ v4 contradiction itself

| Location | v3 says | v4 code does |
|---|---|---|
| `DESIGN_GUIDE.md:192` | "Don't: Use gradients on backgrounds" | `washEmerald`/`washFlame`/`washViolet` shipped as backgrounds on Matches, Leaderboard, Profile, Home, Match Detail |
| `DESIGN_GUIDE.md:194` | "Don't: Mix more than two accent colors" | 7+ accents visible per screen |
| `DESIGN_GUIDE.md:196` | "Don't: Use borders where a shadow works" | Cards use both borders and shadows inconsistently |
| `DESIGN_GUIDE.md:198` | "Don't: Add decorative ornaments, glows, frames" | 4 colored glow shadow tokens, shimmer overlays on GradientHero |

**Fix:** Rewrite `DESIGN_GUIDE.md` into a single unified "Emerald Minimalism" guide (section 5 below) and delete the contradictory directives. Keep the spirit of v3's restraint; keep v4's celebration. Remove every rule that no longer applies.

### 3.2 Color saturation

Accent colors visible across the 6 screenshots today:

| Screen | Accents visible |
|---|---|
| Matches | emerald, flame (live dot), gold (team names), violet (league chip), red (live badge), gray neutrals |
| Leaderboard | emerald, violet (hero), gold (1st), gray (2nd), bronze (3rd), red, flame soft |
| Groups | violet (hero), emerald, gray |
| Profile | emerald, violet (level badge), teal (accuracy chip), flame, gold |
| Match detail | violet (hero), emerald (tabs), flame (points), blue, teal, coral (points), gold (boost) |
| Onboarding | emerald, navy, gray |

That is **seven distinct accent hues** across five screens. Premium apps stabilize at **three**.

**Fix:** Enforce the palette described in section 5.1. Every violet/teal/coral/cyan/purple/blue usage in UI code is deleted or replaced with emerald, gold, flame, red, or a neutral. The one exception is tier badge gradients, which are component-scoped and visually quarantined.

### 3.3 Gradient pollution

`grep -r 'washEmerald\|washFlame\|washViolet' app/ components/` returns usages on Matches hero, Matches empty state, Leaderboard hero, Profile hero, Match Detail locked state, Home streak background, Group empty state. That is **~17 usages** across screens that the v3 guide explicitly prohibits.

**Fix:** Delete the three `wash*` gradient tokens from `colors.ts` entirely. Replace every usage with `surface/0` or `surface/1` solid fills + border + e2 shadow. See section 7.

### 3.4 The permanent offline banner

**File:** `components/ConnectionBanner.tsx` (rendered in `app/_layout.tsx` so it appears on every screen)
**Current behavior:** Absolute-positioned orange bar at `top: insets.top`. Dismissible per session but resets on navigation. Visible in all 8 screenshots taken.

This is the single most damaging premium-feel issue in the app. It communicates "this product is broken" to every user on every screen regardless of whether they actually are offline.

**Fix:** Replace with a **silent offline indicator** pattern.

1. Delete `ConnectionBanner.tsx` from the render tree of `_layout.tsx`.
2. Add a tiny 6px neutral dot to the top-left of every screen's header (or the tab bar), which turns **amber** when offline and is invisible when online. No text, no dismiss button, no color pollution.
3. Any data fetch that fails because of offline degrades gracefully into an inline skeleton state or a neutral "tap to retry" button in the affected content area. This is truthful — the screens users are looking at are the screens that tell them what is loading.
4. Toast-style "back online" + haptic.success when connection is restored. One frame, gone.

This is non-negotiable. Every other improvement in this audit fights for attention against that orange bar if it stays.

### 3.5 Dark ↔ light handoff at entry

**Files:** `app/auth.tsx:58–63`, `app/onboarding.tsx:95–100`, vs. tab screens (light).

Current flow: cold start → auth (dark navy) → onboarding (dark navy) → home (light) → **hard snap** — three visual contexts in 90 seconds.

**Fix (recommended):** **Unify the entry flow to light mode.** The dark-navy onboarding is not being used as intentional art direction; it's a default. Migrating auth and onboarding to light mode is cheaper, safer, more coherent, and removes the jarring theme jump.

- `auth.tsx`: `backgroundColor: surface/1` (#F5F6F8), white inputs with border/subtle, emerald CTA on white, keep the logo square but put it on a white card. Delete the three decorative orbs at `auth.tsx:66–70`.
- `onboarding.tsx`: same light background, keep the staggered entry motion exactly as-is, make the progress dots emerald-active on gray-inactive, keep the "Get Started" emerald CTA.

**Alternative (riskier):** If the brand wants a cinematic "night-sky-before-the-match" entry, commit to it — redesign onboarding as an intentional dark product tour with particle motion, real illustrations, and a choreographed 1.5s fade-to-light transition on "Start Predicting" with a success haptic. This is a bigger job, and only worth doing if we're prepared to invest in the narrative. **Default recommendation: unify to light.**

### 3.6 No header formula

Audit of current tab headers:

| Screen | Title treatment | Subtitle | Right action |
|---|---|---|---|
| Home | Avatar circle + "Good day, {name}" greeting | "{username}" 20px bold | Notification bell |
| Matches | `GradientHero` "Matches" 28px + "18 upcoming · 4 live" on wash | — | — |
| Leaderboard | "Leaderboard" 30px on plain bg + trophy icon | "Compete · {n} players" eyebrow | — |
| Groups | `GradientHero` violet "Your Squads" 22px + subtitle + CTA pill | "Compete with friends" | Create Group button |
| Profile | "Your Profile" 12px eyebrow | — | Settings gear |

No two screens share the same header formula. Type sizes, surfaces, subtitle patterns and action-icon placement all differ.

**Fix:** Adopt the unified header formula in section 5.5.

### 3.7 No celebration moments

Prediction submit (`match/[id].tsx:176`) fires `haptics.success()` and that is literally the entire reward UX. There is no:

- Checkmark scale-pop
- Glow flash
- Confetti / particle burst
- "Locked in!" confident toast
- Streak tick pulse
- Tier climb badge pop
- Rank climb row flash
- Podium arrival animation

In a product whose entire value prop is "predict, compete, climb" this is malpractice. **Fix:** Celebration motion spec in section 5.8.

### 3.8 PressableScale under-adoption

`grep -c 'Pressable'` across `app/` returns ~108 raw `<Pressable>` instances. `PressableScale` is only wrapping ~35–40 surfaces. Date headers, filter chips, stepper buttons, tab inner rows, section toggles, settings gear — all use raw Pressables with `opacity: 0.85` press states and no haptics.

**Fix:** Wrap every interactive surface in `PressableScale` (or explicit `withSpring` + `haptics.*`). Target: 0 raw Pressables with opacity presses in `app/` by end of refactor.

---

## 4. Parallel page review — findings by track

Six specialist tracks reviewed the app in parallel. The raw reviews live in `_design_audit/` (generated in Phase 2). Below is the distilled top-5 per track.

### Track A — Home, Matches, Match Detail (action flow)

1. **Match card team logos are cheap.** Solid color circles with a single letter ("A", "C") read as prototype art, not a premium football product. Use real league logos from the API where available and fall back to elegant initials on a neutral gray ring, never a saturated color circle.
2. **Match detail hero is cluttered.** `[id].tsx:236–341` packs logo + team + score + "16:00 Starting soon" + date + "Fri, Apr 10 · Derby" tags into a single violet gradient card with no breathing room. Simplify to: two team logos (56px) → kickoff time (28px display weight) → one secondary line. Move league into a micro-badge in the top-right.
3. **Points System card is rainbow soup.** `[id].tsx:631–654` shows four rows each in a different accent color (emerald, blue, teal, coral). Use one emerald accent for all four, reorder by point value, make "Exact score +10" the visually dominant row.
4. **Prediction stepper inverted color.** `[id].tsx:459–607` minus is gray, plus is emerald — this asymmetry is confusing. Both steppers should be neutral gray by default; the value in the center is what's emerald-bold.
5. **Filter pills on Matches are ambiguous.** `matches.tsx:285–328` All / Live / Upcoming / Finished are four independent pills floating with gaps. Wrap in a single gray-100 segmented container with active emerald pill inside. Same treatment on Leaderboard and Groups for consistency.

### Track B — Leaderboard, Profile (identity/competitive flow)

1. **Leaderboard prize strip (1st/2nd/3rd) is the single best gamified moment in the app and it's under-celebrated.** `leaderboard.tsx:216–265`. Rank text is 11px uppercase. On a podium card, the rank should be 20–24px bold, the reward name 16px, the tag 11px. Let these three cards **own** the upper viewport the way Sorare podium cards do.
2. **Profile hero has no identity.** `profile.tsx:325–336` shows only "Your Profile" + a gear. No avatar above the fold, no tier visible, no level, no XP. Move the `GradientHero` tier/level card into the header so the first thing a user sees on Profile is their own identity.
3. **Empty states are apologetic.** "No entries yet · Start predicting to claim the top spot" and "No predictions yet this week" scold the user for not having played yet. Rewrite as aspirational: "Be the first on the board" / "Your first pick starts the streak."
4. **Stats 2x2 grid showing 0/0/0/0 on day zero is demoralizing.** Hide the grid for new users and show a single "Your stats will appear here after your first prediction" card instead. Then unlock the grid on day one.
5. **Leaderboard has no zone dividers.** Ranks 1–3 flow into 4–5 flow into 6+ with no visual distinction. Premium leaderboards mark the "promo zone" (next tier up) with a subtle wash and a 1px divider. Make it clear what you're climbing toward.

### Track C — Groups, Group Detail, Onboarding, Auth (social/entry flow)

1. **Dark/light mode handoff is the #1 entry problem.** See 3.5 above.
2. **Groups hero gradient isn't earning its violet.** `groups.tsx:360–379` — "Your Squads" + "Compete with friends" on a violet washViolet hero. Violet has no meaning here. Replace with a clean white card, 24px bold title, 14px gray sub, right-aligned emerald "Create" button.
3. **Group member avatars are placeholder numbers.** Numbered circles (1, 2, 3, +X) instead of initials. Use first-letter initials on a color from a 6-color palette cycled deterministically by user id.
4. **Auth inputs look like a generic React Native template.** `auth.tsx:138–171` — low-contrast dark inputs with icons crammed left. After the light-mode unification, rebuild as 54px-tall white fields with emerald icons at 12px padding and 16px text at 50px offset.
5. **Onboarding feature bullets are marketing-site fluff.** `onboarding.tsx:141–154` lists 4 features in static bullets. Premium onboarding *shows* rather than *tells* — replace with a 3-card swipeable carousel (Predict / Climb / Compete) each with a real micro-illustration or an actual product-screen preview.

### Track D — Global design system (tokens)

1. **`colors.ts` has 15+ accents, the UI shows 7 at once, the guide says 1+1+1.** Tighten the palette: emerald / flame / gold / red + neutrals. Retire coral, violet (as UI accent), teal, cyan, purple, blue entirely. See section 5.1.
2. **`washEmerald` / `washFlame` / `washViolet` are the root of the pollution.** Delete from `colors.ts` and delete every usage. See section 5.2.
3. **13 font sizes.** Consolidate to 7 tiers (display 40 / h1 28 / h2 22 / h3 18 / body 15 / caption 13 / micro 11). See section 5.4.
4. **8 elevation tokens.** Consolidate to 4 (e0/e1/e2/e3) plus 3 celebration glows (emerald/flame/gold) reserved for reward moments only. See section 5.6.
5. **Pick the card treatment: solid white fill + 1px hairline border + NO shadow.** One treatment, always. This is the single biggest "premium" lever in the whole audit. See section 5.3.

### Track E — Motion & interaction

1. **Motion library is professional but under-used.** `lib/motion.ts` has excellent spring presets and stagger helpers. They're only used in ~30% of interactive surfaces. Fix: adoption campaign (see 3.8).
2. **Zero celebration moments.** See 3.7.
3. **Tab bar active dot is static.** `_layout.tsx` shows a 4×4 emerald dot that appears and disappears on focus change. Make it spring-slide between positions and add an icon scale on focus. See 5.8.
4. **Leaderboard rank changes happen silently.** Add a 300ms green flash + arrow bounce + `haptics.selection()` on any row where `entry.change > 0`. Red flash on `< 0`.
5. **Navigation transitions are hard cuts.** Home → match detail is a jump. Add `FadeInDown` entry on match detail with a 450ms spring.gentle and stagger the subsections at 80ms intervals.

### Track F — Navigation & cross-screen coherence

1. **Headers don't share a formula.** See 3.6 and 5.5.
2. **Offline banner must die.** See 3.4.
3. **Tab bar active state is visually weak.** Either upgrade the dot from 4px to 6px with spring-slide between tabs, or move to a subtle emerald pill background behind the icon (pick one — recommend the pill).
4. **Back button on detail screens is labeled.** `match/[id].tsx:209–222` uses a full "< Back" labeled button. Replace with a chevron-only icon button + enable native iOS swipe gesture.
5. **Safe area / padding is already consistent.** No change needed — the one thing already working.

---

## 5. Unified visual system

This section is the single source of truth for every token and rule. It replaces `DESIGN_GUIDE.md` and the conflicting v4 comments in `constants/colors.ts`.

### 5.1 Color palette

```
PRIMARY — Emerald
  emerald           #00A651   // main CTA, active tab, progress, link, win
  emeraldDark       #008F44   // pressed state
  emeraldLight      #2ECC71   // subtle tint, hover
  emeraldSoft       rgba(0, 166, 81, 0.10)   // soft surface, chip bg
  emeraldGlow       rgba(0, 166, 81, 0.16)   // celebration only

HERO ACCENT — Flame (streak + live only)
  flame             #FF6B35
  flameDeep         #E04A1E
  flameSoft         rgba(255, 107, 53, 0.12)

REWARD — Gold (podium + achievement only)
  gold              #F5A623
  goldDark          #D98A00
  goldSoft          rgba(245, 166, 35, 0.10)

ALERT — Red (loss, danger only)
  red               #EF4444
  redDark           #DC2626
  redSoft           rgba(239, 68, 68, 0.10)

NEUTRALS
  white             #FFFFFF
  offWhite          #F5F6F8
  gray50            #F8FAFC
  gray100           #EEF0F4
  gray200           #E2E8F0
  gray300           #94A3B8
  gray400           #64748B
  gray500           #334155
  ink               #0F172A   // primary text

RETIRED (delete from UI usage, keep only inside tier badge gradients)
  violet, violetDeep, violetSoft
  teal, tealSoft
  coral, coralSoft
  cyan, purple, blue, blueLight, blueSoft
  orange (use flame instead)
  the entire navy* block (light mode only)
```

**Semantic roles (light theme):**

```
surface/0         #FFFFFF          // card, input, hero card fill
surface/1         #F5F6F8          // screen background
surface/2         #EEF0F4          // recessed well, divider bg
border/subtle     rgba(15, 23, 42, 0.06)
border/strong     rgba(15, 23, 42, 0.12)
text/primary      #0F172A
text/secondary    #64748B
text/tertiary     #94A3B8
text/inverse      #FFFFFF
accent/primary    emerald
accent/streak     flame
accent/reward     gold
accent/alert      red
divider           #EEF0F4
```

### 5.2 Gradient policy

**Allowed in exactly 5 places.** Nowhere else.

1. `StreakFlame` when streak > 0 → `flame` gradient (`['#FFB347', '#FF6B35', '#E04A1E']`).
2. `TierBadge` → tier-specific gradients (rookie / bronze / silver / gold / diamond / legend).
3. `GradientHero` used only for: match-live status hero, tier promotion celebration hero, leaderboard current-period hero on the Leaderboard tab. **Never** on section headers, tab headers, empty states, or as a wash background.
4. `ProgressBar` fill → `emerald` gradient default, or `flame`/`gold` when contextually tied to streak/tier.
5. Celebration toasts → emerald or gold gradient, 700ms exit.

**Deleted:**
- `washEmerald` / `washFlame` / `washViolet` — removed from `colors.ts`.
- `sunset` (tri-stop) — removed.
- `night` (navy tri-stop) — removed.

### 5.3 Surface & border policy (the single biggest premium lever)

**Rule: one card treatment, applied everywhere.**

```
Card / section container
  backgroundColor:  surface/0   (#FFFFFF)
  borderWidth:      1
  borderColor:      border/subtle   (rgba(15, 23, 42, 0.06))
  borderRadius:     20
  shadow:           none
```

No box shadow. No glow. No border + shadow combo. Just a clean white fill with a 1px hairline border. This is the Linear/Stripe/Things 3 move and it will add more premium feel than any other single change in the audit.

**Hero card variant** (used sparingly — leaderboard period hero, tier promotion toast):

```
Hero card
  backgroundColor:  surface/0
  borderWidth:      1
  borderColor:      emerald   (for positive hero) or gold (for reward hero)
  borderRadius:     24
  shadow:           e2   (0 6px 16px rgba(15, 23, 42, 0.06))
```

**Input field:**

```
Input
  backgroundColor:  surface/0
  borderWidth:      1
  borderColor:      border/subtle
  borderRadius:     16
  height:           54
  textColor:        text/primary
  placeholderColor: text/tertiary
  focus:            borderColor → emerald
```

**Primary button:**

```
Button / primary
  backgroundColor:  emerald
  textColor:        white
  borderRadius:     16
  height:           54
  shadow:           e1
  press:            PressableScale 0.96 + haptics.medium
```

### 5.4 Typography scale

```
display    40 / 52   700  -0.5px     // hero numbers (streak count)
h1         28 / 39   700   0          // screen titles
h2         22 / 31   700   0          // section titles
h3         18 / 25   600   0          // card titles
body       15 / 23   400   0          // body copy, descriptions
caption    13 / 18   500   0          // metadata, timestamps
micro      11 / 14   500   +0.2       // badge labels, footnotes
```

**Rules:**
- Never mix weights within a tier. `h1` is always Bold 700. `body` is always Regular 400.
- Retire all usages of 10, 12, 14, 16, 17, 20, 24, 32 font sizes. Snap them to the nearest tier.
- Only one `display` per screen. Only one `h1` per screen.

### 5.5 Unified header formula

Every tab screen follows the same formula:

```
[safe-area top]
[16px gap]
[ H1 title — left-aligned, 20px horizontal padding ]
[ caption subtitle — immediately below, textSecondary ]
[24px gap]
[ secondary content section: filters / hero / stats / whatever ]
```

No gradient hero for the title row. No avatar bar for the title row. No settings gear sitting inside a card. The title is bold, the subtitle is gray, and that's it. If a screen needs a right-aligned action icon (notification bell, settings gear), it sits at the same vertical position as the title in a 44x44 touch target, no background.

**Per-screen subtitles:**

| Screen | H1 | Caption subtitle |
|---|---|---|
| Home | "Today, {dayName}" | "{name}, here's your pack" |
| Matches | "Matches" | "18 upcoming · 4 live" |
| Leaderboard | "Leaderboard" | "Compete · {n} players" |
| Groups | "Your Squads" | "Compete with friends" |
| Profile | "{username}" | "Member since {month}" |

### 5.6 Elevation ladder

```
e0   flat       no shadow                                               // pressed states, flat wells
e1   subtle     0 2px 8px rgba(15, 23, 42, 0.05)                        // buttons, tappable surfaces
e2   card       0 6px 16px rgba(15, 23, 42, 0.06)                       // hero cards, modals
e3   strong     0 10px 24px rgba(15, 23, 42, 0.09)                      // full-screen overlays, alerts

Celebration glows (only during reward moments, animated in/out)
  glow/emerald   0 12px 28px rgba(0, 166, 81, 0.28)   // tier up, submit confirm
  glow/flame     0 12px 28px rgba(255, 107, 53, 0.28) // streak milestone
  glow/gold      0 12px 28px rgba(245, 166, 35, 0.28) // podium unlock
```

**Remember:** the default card has **no** shadow. Only hero cards get e2. Glows are animated in and out in under 700ms — they never sit on a card statically.

### 5.7 Spacing scale

```
Base unit:    4px
Scale:        4, 8, 12, 16, 20, 24, 32, 40, 56

Screen padding horizontal:   20
Screen padding top:          safe-area + 16
Screen padding bottom:       120  (tab bar clearance)
Section gap vertical:        24
Inter-card gap in a list:    12
Card padding:                20 horizontal × 16 vertical
Dense row padding:           16 horizontal × 12 vertical
Icon + text gap:             8
```

### 5.8 Motion rules

**Library enforcement.** All entries use `entries.*` from `lib/motion.ts`. All press feedback uses `PressableScale`. Raw `<Pressable>` with opacity presses is forbidden on any hero target.

**Stagger cadence.** `stagger(i, 60)`, cap at 6 items.

**Entry cascades.** Every page uses `entries.fadeInDown` on the header, then staggered fadeInUp on sections below.

**Press feedback.** `pressedScale: 0.96`, `springs.snappy` in, `springs.pop` out, `haptics.light` on every press.

**Celebration spec (mandatory).**

| Event | Visual | Haptic |
|---|---|---|
| Prediction submit confirm | checkmark scale-pop 0.8→1.2→1.0 `springs.pop` 500ms + emerald glow flash behind + button morph "Predict" → "✓ Locked in" | `haptics.success()` + `haptics.heavy()` stacked |
| Streak increment (day tick) | StreakFlame wobble 1→1.15→1 `springs.wobble` 400ms + counter tick-up + flame tint bg flash | `haptics.success()` + `haptics.heavy()` |
| Tier promotion | TierBadge scale-pop 0.8→1.15→1 `springs.pop` 600ms + ring glow burst + 2s hold | `haptics.success()` + `haptics.heavy()` |
| Leaderboard rank climb | row green flash 300ms + rank number scale 1→1.1→1 + up-arrow bounce | `haptics.selection()` |
| Tab switch | active dot spring-slides between tab positions `springs.snappy` + icon scale 0.9→1 | `haptics.light()` |
| Match detail entry | hero `FadeInDown.duration(450).springify().damping(14)` + staggered sections at 80ms steps | — |
| Filter pill change | `withTiming(backgroundColor)` `timings.fast` | `haptics.selection()` |
| Score stepper ± | stepper scale 0.95→1 `springs.snappy` 200ms | `haptics.selection()` |

**Performance gates.** Entry cascades ≤ 400ms total. Celebration ≤ 700ms. No animating `width`/`height` on FlatList items (opacity/scale only). No sprites on web.

### 5.9 Iconography rule

Ionicons only. Within one screen, pick **either** outline or solid weight — never mix. Tab bar uses outline for inactive and solid for active. Badge icons are solid. Metadata icons are outline. Sizes snap to 11/13/16/20/24/32 — no arbitrary values.

### 5.10 Radii map

```
sm     12     chips, small buttons, small badges
md     16     buttons, inputs, section headers
lg     20     cards, major containers
xl     24     hero cards, modals, celebration toasts
pill   999    avatars, full pills, circular buttons
```

Retire `xs:8`, `hero:28`, `lg:20` as separate tokens — consolidate per above.

---

## 6. Screen-by-screen implementation plan

This section turns the system into concrete per-screen moves. Each screen lists what to change and the files/lines involved. No code yet — this is the plan you approve before implementation starts.

### 6.1 Global layer (do this first)

- [ ] **Delete `ConnectionBanner` render** from `app/_layout.tsx`. Keep the connection-state hook if it exists, wire it to a 6px dot in the tab bar / header. Replace all banner usages with graceful inline error states per affected feature.
- [ ] **Rewrite `DESIGN_GUIDE.md`** to the Emerald Minimalism version. Single source of truth. Delete contradictions.
- [ ] **Rewrite `constants/colors.ts`** per section 7.1.
- [ ] **Audit `components/ui/`** and update primitives per section 7.2.
- [ ] **Create `components/ui/Button.tsx`** as the canonical primary/secondary/tertiary button primitive.
- [ ] **Global PressableScale adoption pass** — grep for `<Pressable` in `app/` and wrap every interactive surface.

### 6.2 `app/auth.tsx` — unify to light mode

**Target file:** `app/auth.tsx` (384 lines)

- [ ] Swap `backgroundColor: navy` for `surface/1` (#F5F6F8) at line 58–63.
- [ ] Delete the decorative orbs at lines 66–70.
- [ ] Rebuild inputs at 138–171 as 54px white fields with emerald icons, 16px text, border/subtle, emerald focus border.
- [ ] Replace the "Sign In / Create Account" pill gradient (lines 103–134) with a clean 2-segment control on surface/2 background, active = emerald pill, inactive = transparent + gray text.
- [ ] Replace the CTA LinearGradient with a solid emerald button, white text, 54px height, `e1` shadow.
- [ ] Delete the "Don't have an account?" footer (226–246) — the top toggle already solves this.
- [ ] Remove the "Forgot password?" link until the feature is implemented (currently shows a broken Alert).
- [ ] Apply unified header formula — logo mark + "Scorepion" wordmark + 13px caption tagline.

### 6.3 `app/onboarding.tsx` — unify to light mode

**Target file:** `app/onboarding.tsx` (380 lines)

- [ ] Swap dark navy background for `surface/1` at 95–100.
- [ ] Progress dots: emerald active, gray200 inactive, spring-scale on transition.
- [ ] Logo lockup: 44px emerald square + "Scorepion" 32px h1 Bold + 13px caption subtitle "Predict. Compete. Climb."
- [ ] Replace the 4-bullet feature list (141–154) with a 3-card swipeable carousel or — if time-constrained — three 18px h3 rows with a leading emerald icon and no background wash.
- [ ] "Get Started →" button: solid emerald, full width, 54px, `e1`, pulse haptic.
- [ ] Ready screen (235–260): keep the checkmark ZoomIn, add a `springs.pop` scale + success + heavy haptic stack + a 0.5s delayed summary fade-in.

### 6.4 `app/(tabs)/_layout.tsx` — tab bar upgrade

**Target file:** `app/(tabs)/_layout.tsx` (210 lines)

- [ ] Active state: replace the 4×4 dot with either (a) a 6×6 dot that spring-slides between tab positions, or (b) a subtle emerald pill behind the icon (recommend the pill).
- [ ] Focused icon: solid variant, emerald tint, spring scale 0.9→1 on focus.
- [ ] Unfocused icon: outline variant, gray400 tint.
- [ ] Label: 11px micro tier, `letterSpacing: +0.2`, active emerald, inactive gray400.
- [ ] Safe area bottom: keep current BlurView intensity on iOS, add a 1px top hairline divider in border/subtle.
- [ ] Add a 6×6 offline indicator dot to the tab bar top-right corner (hidden by default, amber when offline).

### 6.5 `app/(tabs)/index.tsx` — Home

**Target file:** `app/(tabs)/index.tsx` (473 lines)

- [ ] Apply unified header: H1 "Today, {dayName}" + caption "{name}, here's your pack" — no avatar bar, no greeting card.
- [ ] Avatar moves to the top-right as a 36px circle (first letter on gray100 background, no emerald border).
- [ ] Streak card: keep `StreakFlame` exactly as-is — it's the canonical gradient use case. Reduce its glow shadow opacity from 0.35 to 0.22 so it doesn't dominate the page.
- [ ] Metrics row (3 cards): consolidate to one emerald accent. Delete the violet/teal/coral tints from individual metric cards. Use the unified card treatment.
- [ ] Daily Pack card: keep the emerald gradient (it's a canonical hero) but remove the "See all" emerald-soft chip next to it — two emeralds in a row fight for attention.
- [ ] Match card list: wrap each card in the unified card treatment (white + hairline border, no shadow). Delete the `washViolet` league chips at the top of each match card — use a 3px left border in league color instead.
- [ ] Wrap every raw Pressable in `PressableScale`.

### 6.6 `app/(tabs)/matches.tsx` — Matches

**Target file:** `app/(tabs)/matches.tsx` (494 lines)

- [ ] Kill the `GradientHero` title (269–282). Replace with unified H1 "Matches" + caption "18 upcoming · 4 live".
- [ ] Filter pills (285–328): wrap all four in a single gray100 segmented container. Active = emerald pill with white text. Inactive = transparent + gray400.
- [ ] Date headers (184–215): delete the 10×10 colored dot, replace with a bold "Today" label in emerald + date caption gray on the same row. Wrap the whole row in `PressableScale` for collapse toggle.
- [ ] Match cards: unified treatment per 6.5 bullet above.
- [ ] League chip: replaced by 3px left border on the card.
- [ ] Empty state (341–352): plain white card, neutral gray icon, dark title, caption body. No gradient.
- [ ] Countdown urgency: keep the flame color when `< 1h` to kickoff — this is a valid micro-signal.

### 6.7 `app/(tabs)/leaderboard.tsx` — Leaderboard (the single highest-leverage screen)

**Target file:** `app/(tabs)/leaderboard.tsx` (1173 lines)

- [ ] Apply unified header: H1 "Leaderboard" + caption "Compete · {n} players".
- [ ] Period hero card (126–144): **keep the GradientHero** but tighten: `periodSub` → 13px caption, `countdown` → 15px h3, bump padding to 16. Rephrase "Season ongoing · Ends in" → "Live standings · ends in {n}d".
- [ ] Filter pills (148–176): segmented control pattern per 6.6.
- [ ] **Prize strip (216–265) — the single best moment in the app, elevate it:**
  - Rank text → 20px h2 bold, gold/silver/bronze tinted.
  - Reward name → 16px h3.
  - Tag → 11px micro.
  - Icon wrap → 48×48, icon 24px.
  - Add a 3px top-accent bar in the medal color (gold/silver/bronze).
  - Card itself uses the hero card treatment (white fill + emerald border? actually use gold/silver/bronze border per card).
- [ ] **Zone dividers in leaderboard list:**
  - Rank 1–3 podium block — distinct visual block with `e2` shadow.
  - Rank 4–5 "Promo Zone" — tiny 11px micro label + subtle gray100 wash behind.
  - Rank 6+ — normal rows.
  - Your own row pinned at bottom if you're below the fold, with a soft emerald wash.
- [ ] Extend row entry stagger from `Math.min(i, 8)` to `Math.min(i, 15)`.
- [ ] **Redesign empty state** as aspirational: GradientHero (emerald) with podium icon, title "Be the first on the board", subtitle "Make your first prediction and start climbing", CTA "Make My First Pick".

### 6.8 `app/(tabs)/groups.tsx` — Groups list

**Target file:** `app/(tabs)/groups.tsx` (879 lines)

- [ ] Kill the violet `GradientHero` at 360–379. Replace with unified H1 "Your Squads" + caption "Compete with friends" + right-aligned emerald pill "Create".
- [ ] My Groups / Discover tabs: segmented control per 6.6.
- [ ] Search bar: update placeholder to "Search by name or code".
- [ ] Group card visual identity:
  - Delete the 6px gradient header strip — too subtle to see.
  - Add a 4px solid left border in the group's primary league color.
  - Replace numbered placeholder avatars (252–272) with first-letter initials on a palette-cycled background.
- [ ] StatChip (274–279): use emerald tint instead of violet, regardless of league.
- [ ] Empty state (457–477): plain card, no `washViolet`, aspirational copy "Build your first squad. Invite friends. Climb together." + full-width emerald CTA.

### 6.9 `app/(tabs)/profile.tsx` — Profile

**Target file:** `app/(tabs)/profile.tsx` (779 lines)

- [ ] **Header restructure**: promote the tier/level `GradientHero` (342–386) to the top. The first thing a user sees on Profile is their own identity. Header formula becomes: avatar 56px + username h1 + TierBadge + XP progress + member-since caption.
- [ ] Delete the separate "Your Profile" title at 325–336.
- [ ] Settings gear: 44×44 icon button in the top-right, no card background.
- [ ] "This Week" card (428–445): for day-zero users use an emerald `GradientHero` with "Start Your First Week" + solid white CTA. For active users, keep a clean stat chip row + "See this week's matches" action.
- [ ] Stats 2×2 grid (470–497): for day-zero users **hide** the grid and show a single "Your stats will appear here after your first prediction" caption card. For active users, add trend indicators (↗ +3% this week) and remove the per-card accent color variation — all four cards use emerald.
- [ ] Achievements section: locked badges get a silhouette + mysterious border (gray200 1px), not just a flat gray circle. Unlocked badges keep their emerald glow.
- [ ] Add a new "Your Rank" mini card below the level card: "Ranked #47 this season · ↗ +12 this week".

### 6.10 `app/match/[id].tsx` — Match detail (the single largest screen)

**Target file:** `app/match/[id].tsx` (1515 lines)

- [ ] Back button (209–222): chevron-only icon button, no card, no label. Enable native iOS swipe back.
- [ ] Move the league pill into the hero card as a micro top-right badge.
- [ ] **Hero card (236–341)**: keep violet only for upcoming derby/special context; otherwise use an emerald hero for positive state, flame when live. Bump padding from 16 to 20. Simplify the bottom metadata row: show date + one primary tag only.
- [ ] **Inner tab row (344–372)**: delete the white card wrapper + shadow. Tabs sit on the page background. Active = emerald pill, inactive = no background + text/secondary. Icon size 14px.
- [ ] **Prediction stepper (459–607)**: both − and + use gray100 background by default; the score numbers in the center are the emerald-bold focal point.
- [ ] **Outcome chip**: single emerald for win, single gold for draw (rare tasteful use), single red for loss. No gradient, no layered "exact vs result" badge.
- [ ] **Boost toggle (575–593)**: extract out of the submit button. Small gold-outline pill above the submit CTA with "2x Boost ready".
- [ ] **Submit button**: solid emerald, white text, 54px, morph to "✓ Locked in" on success with checkmark scale-pop celebration + glow flash + success+heavy haptic stack.
- [ ] **Points System card (631–654)**: single emerald accent for all 4 rows. Icons in emerald-soft circles. Reorder by point value, "Exact score +10" is 16px h3 bold, others are 13px caption.
- [ ] **Locked / Predictions Closed (377–386)**: delete the `washFlame` gradient. Plain white card + red-tint lock icon + dark title + caption subtitle.
- [ ] **Events tab (671–724)**: replace emojis (⚽🟨🟥🔄) with proper Ionicons — `football`, `square`, `square`, `swap-horizontal`.
- [ ] **Change button (388–448)**: replace the text link with a small emerald-outline pill "Change prediction".

### 6.11 `app/group/[id].tsx` — Group detail

**Target file:** `app/group/[id].tsx` (1124 lines)

- [ ] Back button: chevron-only per 6.10.
- [ ] Flatten the hero: group name h1 + member count caption + right-aligned "Invite" CTA. Avatars row (32px, 4 shown, +X overflow) below. No big hero card.
- [ ] Activity feed (106–147): 40px initials avatars, richer message format ("{name} predicted 2:1 vs {team}"), relative timestamp ("2m ago"), right-side icon for event type.
- [ ] Rank badges (153–158): solid gold/silver/bronze backgrounds, no gradients.
- [ ] "(You)" indicator: small emerald checkmark badge next to username, not inline text.
- [ ] Add a weekly-winner celebration banner when applicable — emerald `GradientHero` with trophy + "{name} is crushing it · 12 wins this week".
- [ ] Invite banner for day-zero (≤1 member): full-width card, emerald CTA "Copy Code", prominent placement above the leaderboard.

---

## 7. Component & token updates

### 7.1 `constants/colors.ts` diff

**Delete:**

```
palette.coral, coralSoft
palette.teal, tealSoft
palette.violet, violetDeep, violetSoft            // (keep violet only inside tiers.diamond and tiers.legend gradients)
palette.cyan, purple, blue, blueLight, blueSoft
palette.orange                                    // flame handles urgency
palette.navy*, glass*, navyBorder*                // entire navy block (dark-mode revisit later)

gradients.washEmerald
gradients.washFlame
gradients.washViolet
gradients.sunset
gradients.night

elevation.glowFlame                               // keep as `celebration.flame` only
elevation.glowViolet                              // delete entirely
elevation.glowGold                                // keep as `celebration.gold` only
elevation.glowEmerald                             // keep as `celebration.emerald`

radii.xs (8)                                      // collapse to component-level
radii.hero (28)                                   // rename to xl (24)
```

**Add / keep:**

```
semantic roles:
  surface: { 0: '#FFFFFF', 1: '#F5F6F8', 2: '#EEF0F4' }
  border:  { subtle: 'rgba(15,23,42,0.06)', strong: 'rgba(15,23,42,0.12)' }
  text:    { primary: '#0F172A', secondary: '#64748B', tertiary: '#94A3B8', inverse: '#FFFFFF' }
  accent:  { primary: emerald, streak: flame, reward: gold, alert: red }

elevation:
  e0: flat
  e1: subtle
  e2: card
  e3: strong
celebration:
  emerald, flame, gold
```

### 7.2 Component primitive deltas

| Component | Change |
|---|---|
| `GradientHero.tsx` | Restrict `glow` prop to `'emerald' \| 'flame' \| 'gold' \| 'none'`. Remove `violet` option. Add jsdoc note: "Reserved for streak, tier, match-live, leaderboard period hero, celebration toasts. Never use as screen background." |
| `PressableScale.tsx` | Change default `pressedScale` from 0.97 to 0.96 (tighter). Confirm haptic fires on every tap. Add `noScale` variant for opacity-only press. |
| `StreakFlame.tsx` | Add pulse animation on streak value change (`springs.wobble`, 400ms). Reduce flameGlow shadow opacity from 0.35 to 0.22. |
| `TierBadge.tsx` | Add `size: 'xl'` variant for profile header use (px:20, py:10, icon:18, font:14). |
| `ProgressBar.tsx` | Add `glow?: boolean` prop. When at 100%, trigger a `springs.pop` scale celebration. |
| `Badge.tsx` | Restrict approved colors to emerald / flame / gold / red. Reject violet / teal / coral / cyan / blue / purple at type level. |
| `SectionHeader.tsx` | Remove `variant='accent'` color override — accent bar can only be emerald or red. |
| `EmptyState.tsx` | Add `variant: 'default' \| 'hero'` prop. Hero variant renders inside a GradientHero for aspirational moments (leaderboard, profile day-zero). |
| `StatChip.tsx` | Keep as-is. Document that color should default to text/primary + emeraldSoft background. |
| **New: `Button.tsx`** | Canonical primary/secondary/tertiary button primitive. Handles size, haptic, loading state, icon. All existing ad-hoc buttons migrate to this. |
| **New: `FilterSegmented.tsx`** | Canonical segmented filter control (used on Matches, Leaderboard, Groups, Match Detail inner tabs). Active emerald pill on gray100 container. |
| **New: `ScreenHeader.tsx`** | Canonical H1 + caption + optional right-action header used by every tab screen. |
| **New: `ZoneDivider.tsx`** | Leaderboard-specific: 1px rule + 11px micro label + soft background wash. |
| **New: `CelebrationToast.tsx`** | One-off celebration overlay with checkmark/flame/trophy + scale-pop + glow + haptic stack + auto-dismiss. |
| **Delete: `ConnectionBanner.tsx`** | Remove entirely. Replace with the 6px offline dot in `_layout.tsx` header area. |

### 7.3 `DESIGN_GUIDE.md` rewrite

The guide is currently two documents fighting each other. Rewrite as **Emerald Minimalism**, 5 principles + "do/don't" grounded in this audit. Delete all v3/v4 schizophrenia. Roughly 60% shorter than the current file.

---

## 8. End-to-end consistency checklist

Use this as the **regression checklist** during implementation and the final QA pass. Every box must be checked before the refresh is considered done.

### System
- [ ] `DESIGN_GUIDE.md` is rewritten to Emerald Minimalism. No contradictions with code.
- [ ] `constants/colors.ts` contains only emerald / flame / gold / red + neutrals + tier gradients.
- [ ] `washEmerald`, `washFlame`, `washViolet`, `sunset`, `night` are deleted.
- [ ] Only 4 elevation tiers + 3 celebration glows.
- [ ] Only 7 font sizes in active use.
- [ ] Only 5 radius values in active use.
- [ ] `ConnectionBanner.tsx` is deleted. Offline state is a 6px dot + inline error recovery.

### Cards & surfaces
- [ ] Every card: white fill + 1px hairline border + NO shadow.
- [ ] Every hero card: white fill + colored border + e2 shadow.
- [ ] No gradient is used as a screen or card background anywhere.
- [ ] No glow on any non-celebration card.

### Color
- [ ] No violet, teal, coral, cyan, purple, blue visible in any tab screen.
- [ ] Tier badge gradients still work inside `TierBadge`.
- [ ] Match-live state uses flame. Streak uses flame. Podium uses gold. Everything else is emerald or neutral.

### Typography
- [ ] No font sizes outside the 7-tier scale.
- [ ] Each size uses its canonical weight.
- [ ] One display + one h1 per screen max.

### Header formula
- [ ] Home, Matches, Leaderboard, Groups, Profile all use the same H1 + caption header formula.
- [ ] Match detail and Group detail use the same chevron-only back button.

### Tab bar
- [ ] Active tab dot (or pill) spring-slides between tabs.
- [ ] Active icon is solid + emerald.
- [ ] Inactive icon is outline + gray400.
- [ ] Offline dot sits in the tab bar top-right (hidden when online).

### Interactions
- [ ] Zero raw `<Pressable>` with opacity press on hero targets in `app/`. Everything uses `PressableScale`.
- [ ] Every filter chip toggle fires `haptics.selection()`.
- [ ] Every stepper tap fires `haptics.selection()`.
- [ ] Every button press fires `haptics.light()` minimum.

### Celebration
- [ ] Prediction submit: checkmark pop + glow flash + success+heavy haptic + button morph.
- [ ] Streak tick: wobble + counter tick + success+heavy haptic.
- [ ] Tier promotion: badge scale-pop + ring burst + 2s hold + success+heavy haptic.
- [ ] Leaderboard rank climb: green row flash + arrow bounce + selection haptic.
- [ ] Empty states are aspirational, never apologetic.

### Entry flow
- [ ] Auth is light mode.
- [ ] Onboarding is light mode.
- [ ] No hard dark → light snap on first launch.
- [ ] Decorative orbs are removed from auth.
- [ ] Onboarding progress dots are emerald-active, gray-inactive, spring-scaled.

### Navigation
- [ ] Match detail entry uses `FadeInDown` hero + 80ms staggered sections.
- [ ] Back button on detail screens is chevron-only + iOS swipe enabled.
- [ ] Tab scroll positions persist.

### Motion performance
- [ ] Entry cascades ≤ 400ms total on all screens.
- [ ] Celebrations ≤ 700ms total.
- [ ] No width/height animations on FlatList items.
- [ ] No spring animations on scroll-linked elements on web.

### Accessibility
- [ ] All text meets WCAG AA contrast against its background.
- [ ] Every interactive surface is ≥ 44×44 touch target.
- [ ] Focus states are visible on web.
- [ ] Motion respects `prefers-reduced-motion` where available (fall back to opacity fades).

---

## Appendix A — Files touched (expected scope)

**Tokens & guides (2 files):**
- `DESIGN_GUIDE.md`
- `constants/colors.ts`

**Primitives (10 files):**
- `components/ui/GradientHero.tsx`
- `components/ui/PressableScale.tsx`
- `components/ui/StreakFlame.tsx`
- `components/ui/TierBadge.tsx`
- `components/ui/ProgressBar.tsx`
- `components/ui/Badge.tsx`
- `components/ui/SectionHeader.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/StatChip.tsx`
- `components/ui/index.ts`

**New primitives (5 files):**
- `components/ui/Button.tsx`
- `components/ui/FilterSegmented.tsx`
- `components/ui/ScreenHeader.tsx`
- `components/ui/ZoneDivider.tsx`
- `components/ui/CelebrationToast.tsx`

**Global layer (3 files):**
- `app/_layout.tsx` (remove ConnectionBanner, add offline dot)
- `app/(tabs)/_layout.tsx` (tab bar upgrade)
- `components/ConnectionBanner.tsx` (delete)

**Screens (10 files):**
- `app/auth.tsx`
- `app/onboarding.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/matches.tsx`
- `app/(tabs)/leaderboard.tsx`
- `app/(tabs)/groups.tsx`
- `app/(tabs)/profile.tsx`
- `app/match/[id].tsx`
- `app/group/[id].tsx`
- `components/MatchCard.tsx` (league chip + card treatment)

**Approx total:** ~30 files, ~2000 lines of touched code. No data layer, server, or schema changes.

## Appendix B — Effort estimate

| Phase | Scope | Estimate |
|---|---|---|
| 5.1 Tokens + guide rewrite + primitives | colors.ts, DESIGN_GUIDE.md, 10 existing primitives, 5 new primitives | 0.5 day |
| 5.2 Global layer | ConnectionBanner removal, tab bar upgrade, offline dot | 0.25 day |
| 5.3 Auth + onboarding light-mode unify | auth.tsx, onboarding.tsx | 0.25 day |
| 5.4 Tab screens refresh | index, matches, leaderboard, groups, profile | 1 day |
| 5.5 Detail screens refresh | match/[id], group/[id] | 0.5 day |
| 5.6 Celebration motion integration | prediction submit, streak, tier, rank | 0.25 day |
| 5.7 QA + consistency checklist pass | screenshot each screen, verify checklist | 0.25 day |
| **Total** | | **~3 days of focused work** |

## Appendix C — What I explicitly am NOT touching

- Data layer, API, server, database schema.
- Gamification mechanics (points, streaks, tiers, achievements) — logic stays identical.
- Feature additions of any kind.
- Dark mode — deferred per sign-off. Light mode only this pass.
- Copywriting beyond the empty-state rewrites called out above.
- Internationalization / i18n strings.
- Analytics events.
- Route / URL / deep link changes.

---

## Sign-off

This audit is complete. **Phase 5 (implementation) does not begin until you've reviewed this document and approved the direction.**

Please mark up anything you disagree with — tokens you want different, principles you want renamed, moves you want reversed, scope you want cut. Once signed off, implementation starts with section 6.1 (global layer) and proceeds screen-by-screen through 6.11, with a checklist pass at the end.

The screenshots referenced throughout this audit are stored in `_design_audit/screens/`. The raw per-track reviews that were synthesized into this document live in the Phase 2 agent outputs above and can be re-generated at any time.
