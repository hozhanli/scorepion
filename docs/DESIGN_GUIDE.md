# Scorepion Design Guide — Emerald Minimalism

The production design system for Scorepion. Resolves the earlier v3 ↔ v4 civil war with a single calm, confident language: **neutral canvas, hairline cards, one emerald accent, and gradients reserved for reward moments only.**

Reference quality bar: Apple Sports, Linear, Stripe, Arc, Sorare, Things 3.

---

## 1. Design Principles

1. **One accent, one story.** Emerald is the single action colour. Flame (streak), gold (reward), and red (alert) exist but are earned, not decorative.
2. **Hairlines, not shadows.** Cards are white on a light neutral canvas, separated by a 1px `border.subtle` hairline. Elevation is implied by contrast, not by drop shadows.
3. **Gradient as moment, not wallpaper.** The emerald gradient (`GradientHero`) is reserved for canonical celebration surfaces: Streak hero, Daily Pack, Your Rank, Tier/Level, LIVE match hero, Challenge completion toasts. Never a screen background, section divider, or empty-state wash.
4. **Typography does the hierarchy.** Size, weight, and tracking carry the structure. Colour is not used for rank.
5. **44pt tap targets, always.** Every tappable element — chip, step control, icon button — has a minimum 44×44pt hit area. `PressableScale` + `haptics` wraps every interaction.
6. **Motion is quiet.** Entrance stagger with `entries.fadeInDown`, 96% press scale, spring-sliding filter pill. No parallax, no hero flips, no bouncing.
7. **Light mode only, iPhone-first.** Dark mode is intentionally out of scope while we ship the refreshed light experience.

---

## 2. Color System

All colours are authored in `constants/colors.ts` and consumed via semantic roles. Raw hex should not appear inside screens.

### Surface
| Token | Hex | Use |
|---|---|---|
| `surface[0]` | `#FFFFFF` | Card fills, tab bar, modal surfaces |
| `surface[1]` | `#F7F8FA` | Screen canvas behind cards |
| `surface[2]` | `#EEF0F4` | Neutral wells (avatars, icon wells, secondary chips) |

### Text
| Token | Hex | Use |
|---|---|---|
| `text.primary` | `#0F172A` | Headings, numbers, primary body |
| `text.secondary` | `#475569` | Supporting copy, metadata |
| `text.tertiary` | `#94A3B8` | Inactive tab labels, micro meta |
| `text.inverse` | `#FFFFFF` | Text on emerald surfaces only |

### Border
| Token | Hex | Use |
|---|---|---|
| `border.subtle` | `rgba(15, 23, 42, 0.08)` | Hairline on every card, list row, chip |
| `border.strong` | `rgba(15, 23, 42, 0.14)` | Pressed / selected emphasis |

### Accent — earned, not decorative
| Token | Hex | Reserved for |
|---|---|---|
| `accent.primary` | `#00A651` (emerald) | All primary actions, active tab, progress, rank #1–3, current-user highlight |
| `accent.streak` | `#FF6B35` (flame) | `StreakFlame` only |
| `accent.reward` | `#F5A623` (gold) | Tier badge accents, reward toasts |
| `accent.alert` | `#EF4444` (red) | Destructive actions, error states, leave group |

### Gradient tokens
Only three gradient tuples exist, all defined in `Colors.gradients`:

- `gradients.emerald` — `#00C75A → #00A651 → #007A3D` — the canonical celebration gradient
- `gradients.flame` — for `StreakFlame` only
- `gradients.gold` — for `TierBadge` only

Any other `LinearGradient` import outside `GradientHero`, `ProgressBar`, `StreakFlame`, and `TierBadge` is a lint violation.

---

## 3. Typography

Font family: **Inter** (`Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`). All sizes, weights, and tracking live in `type` tokens from `constants/colors.ts`.

| Role | Token | Size | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Display | `type.display` | 40 | 700 | -0.8 | Rank hero numbers |
| H1 | `type.h1` | 28 | 700 | -0.5 | Screen titles (`ScreenHeader`) |
| H2 | `type.h2` | 20 | 700 | -0.3 | Section titles, card titles |
| H3 | `type.h3` | 16 | 600 | -0.2 | List item titles |
| Body | `type.body` | 15 | 500 | 0 | Primary copy |
| Caption | `type.caption` | 13 | 500 | 0.1 | Metadata, subtitles |
| Micro | `type.micro` | 11 | 500 | 0.3 | Tab labels, eyebrows, chips — UPPERCASE |

Never use colour to imply hierarchy — use size and weight.

---

## 4. Spacing & Radii

Spacing scale (multiples of 4): `4, 8, 12, 16, 20, 24, 32, 40, 48`.

- Outer screen gutter: `20`
- Card inner padding: `20`
- Section vertical rhythm: `24`
- Between related list rows: `10`
- Between grouped chips: `8`

Radii scale:

| Token | Value | Use |
|---|---|---|
| `radii.xs` | 8 | Micro pills |
| `radii.sm` | 12 | Chips, small buttons |
| `radii.md` | 16 | List rows, inner cards |
| `radii.lg` | 20 | Primary buttons, standard cards |
| `radii.xl` / `radii.hero` | 24 | Hero cards, `GradientHero` |
| `radii.pill` | 999 | Fully rounded (avatars, FilterSegmented) |

---

## 5. Elevation

**There are no drop shadows on cards.** Elevation is built from contrast:

1. Canvas (`surface[1]`) behind
2. Card (`surface[0]`) on top
3. 1px `border.subtle` hairline around the card

The only permitted shadows are the emerald "glow" halos inside `GradientHero` (reserved moments only) and the platform-native tab bar divider. Do not add `shadowOffset`, `shadowOpacity`, or `elevation` anywhere else.

---

## 6. Core Primitives

Every screen composes from these primitives in `components/ui/`. Ad-hoc `Pressable`, `TouchableOpacity`, or `LinearGradient` usage inside screens is discouraged — reach for a primitive first.

### `ScreenHeader`
H1 title + optional caption subtitle + 44×44 right-slot action. Replaces every screen's hand-rolled top bar.

### `PressableScale`
Wraps every interactive element. Defaults: `pressedScale: 0.96`, `haptic: "light"`. Accepts `hitSlop` to guarantee the 44pt target even when the visual is smaller.

### `Button`
Variants: `primary` (emerald fill), `secondary` (white + hairline), `tertiary` (text-only), `danger` (red tint tertiary).
Sizes: `sm` / `md` / `lg`.
Props: `title`, `icon`, `iconPosition`, `fullWidth`, `loading`, `haptic`.
Never hand-roll a button — if you need a new shape, add it to `Button`.

### `FilterSegmented`
The canonical segmented filter. A horizontally scrollable pill row where the active segment is an emerald-filled pill that spring-slides between positions. Use everywhere you need a toggle between 2–6 modes (Matches tab, Leaderboard scope, Groups sort, Match-detail sections).

### `GradientHero`
The only place `LinearGradient` is allowed at the screen layer. Accepts `colors`, `glow`, `radius`, `padding`. Use only for the five canonical moments (§1.3).

### `ProgressBar`
Track + animated emerald (or white-on-emerald) fill. Used for Daily Pack, XP, Challenge progress, Promo distance.

### `StreakFlame`
Self-contained flame hero with week-dot strip. Only component allowed to use `gradients.flame`.

### `TierBadge`
The only component allowed to use `gradients.gold` and tier-specific colours. Sizes `sm` / `md` / `lg`, optional `solid` fill, optional `level` stripe.

### `EmptyState`
Icon-in-well + title + subtitle + optional action Button. Replaces every hand-rolled empty state. No gradient washes, ever.

### `MatchCard`
List row primitive used on Home, Matches, and Group detail.

---

## 7. Screen Patterns

### Top bar / header
All screens use `ScreenHeader` with a consistent H1 + caption + 44×44 right action. No back-button drift, no per-screen header styles.

### Section header
Section titles use H2 + optional "See all →" in emerald. Nothing else.

### Card
White (`surface[0]`) fill, 1px `border.subtle` hairline, `radii.lg` / `radii.hero`, 20px padding. No shadow.

### List row
White card, 16×16 padding, optional leading 40×40 neutral well icon, trailing chevron in `text.tertiary`. Rows separated by 8–10pt gap, not by dividers.

### Chip
Height 28–32, horizontal padding 12, 1px `border.subtle`, `text.secondary`. Active state is emerald-filled with white text.

### Tab bar
On iOS 18+: native Liquid Glass tab bar via `expo-router/unstable-native-tabs`. Fallback: white surface, 1px top hairline, emerald active tint, tertiary inactive tint, 4pt emerald active-dot. No blur, no shadow, no background image.

### Empty state
`EmptyState` primitive only: neutral icon well (`surface[2]`) + H3 title + caption subtitle + optional primary button. No flame or emerald wash backgrounds.

### Skeleton
Skeleton variants match card sizes and use `surface[2]` shimmer. No gradient skeletons.

---

## 8. Motion

Motion lives in `lib/motion.ts` as the `entries` and `haptics` presets.

- `entries.fadeInDown(index)` — staggered screen mount (50ms per step)
- `entries.fadeIn(index)` — modal / detail mount
- `PressableScale` press: 96% scale, 120ms spring
- `FilterSegmented` active pill: 240ms spring, damping 22
- `ProgressBar` fill: 560ms `Easing.out(cubic)` on mount and data change
- Haptics: `haptics.light()` for taps, `haptics.medium()` for step changes, `haptics.success()` for lock-in / win

Never use complex transforms, parallax, or rotation. The feel is calm and deliberate.

---

## 9. Iconography

Ionicons line style, 18–22pt, always rendered in `text.primary` or `accent.primary` — never in arbitrary hues. Use outline variants for resting state and filled variants only for active tab icons. Emoji are not used as UI affordances (events in Match Detail use Ionicons, not `⚽🟨🟥`).

---

## 10. Do's and Don'ts

**Do**
- Compose from primitives. If a new shape is needed, add it to the primitive.
- Use the semantic roles (`surface`, `text`, `border`, `accent`). Raw hex is a lint error.
- Reserve gradient for the five canonical moments.
- Hit the 44pt tap target on every interactive element.
- Keep copy short. Labels, not sentences.

**Don't**
- Import `LinearGradient` outside the quarantined primitives.
- Add `shadowOffset` / `elevation` to a card.
- Introduce a new accent colour for a single screen.
- Use colour (blue, teal, violet, coral) to distinguish actions — they are all emerald.
- Render a gradient as a section background, empty state wash, or header chrome.
- Mix ad-hoc `TouchableOpacity` with `PressableScale` — standardise on the primitive.

---

## 11. File Map

- `constants/colors.ts` — tokens (surface, text, border, accent, gradients, radii, spacing, type)
- `components/ui/` — primitives (`ScreenHeader`, `PressableScale`, `Button`, `FilterSegmented`, `GradientHero`, `ProgressBar`, `StreakFlame`, `TierBadge`, `EmptyState`)
- `lib/motion.ts` — `entries` + `haptics`
- `_design_audit/AUDIT.md` — the source-of-truth audit that drove this refresh (§6.1–§6.11)

This guide is the contract. If something in a screen contradicts it, the screen is wrong.
