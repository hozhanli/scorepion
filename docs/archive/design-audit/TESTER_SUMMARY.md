# Scorepion — 20-tester / 20-day playtest summary (Round 2)

Aggregate of 20 persona diaries produced by parallel tester agents walking through the Emerald Minimalism refresh from Mon Apr 6 → Sat Apr 25, 2026, evaluating the **post-Phase-A/B/C** state of the codebase. This is Round 2, doubled from Round 1 (10 testers / 10 days). Round 1 artifacts are archived at `_design_audit/archive/round1_10x10/`.

Individual diaries live in `tester_reports/01_elif.md` through `tester_reports/20_mei.md`.

## Headline

Phase A/B/C shipped the *primitives*. Round 2 testers agreed that the `CelebrationToast`, `WelcomeBackBanner`, `ScoringGuide`, strengthened `MemberStandingRow`, and neutralized pending pill are all well-built in isolation. But five of the primitives are also still *orphans* in the user flow — most obviously the celebration toast, which defines five variants and is only wired to one (`lockin`). The Round 1 headline — *"beautiful and silent when it needs to be beautiful and celebratory"* — has not fully flipped. Eleven of twenty testers independently said some version of **"the toast exists; it just never fires for me."**

The other four Round 1 themes are genuinely closed or close to it. The welcome-back banner is the clear win: every persona who hit a 6-hour gap (Aisha, Priya, Oscar, Léa, Elif, Zainab) saw it fire cleanly, with accurate settled counts and calm copy. The scoring guide, the strengthened current-user row, and the neutralized pending pill all survived contact with every persona class.

Round 2 also surfaced three **new** themes that Round 1 did not catch, all of them blocking for release: hardcoded English in the new screens, WCAG AA regressions on the emerald-on-white outcome states, and design-system leakage in `settings.tsx`.

## Round 1 regression check — tally across 20 testers

Counts are out of 20. "Closed" means all five Round 1 themes were fully addressed from that tester's lens. "Partial" means substantive progress but a remaining gap. "Open" means the fix did not land from that tester's lens.

| Theme | Closed | Partial | Open |
|---|---|---|---|
| 1. Silent celebration moments | 8 | 7 | 5 |
| 2. No welcome-back summary | 20 | 0 | 0 |
| 3. No scoring transparency | 18 | 1 | 1 |
| 4. Weak current-user highlight (group standings) | 16 | 3 | 1 |
| 5. Pending vs correct visual confusion | 17 | 3 | 0 |

Theme 1 is the only one that did not decisively close. The primitive landed; the wiring did not.

## What every tester liked

The cross-report consensus on Round 2 design wins:

The `WelcomeBackBanner` is the universally praised new surface. Aisha, Léa, Oscar and Priya all called it the single most humane moment in the app: it fires only when `hoursAway >= 6`, it summarises settled predictions and points earned with calm copy, it tints emerald only when `pointsEarned > 0`, and it does not re-trigger within a session. Aisha: *"finally, the app remembers I was gone."* Oscar: *"the banner + broken streak pairing on Day 5 is the loop I'm here for."*

The strengthened `MemberStandingRow` is the second consensus win. Noah, the dedicated group organizer, said the combined emerald rail (`youRail`), 2px border (`rowHighlight`), `YOU` pill, avatar highlight, username color, and larger points value make him **findable within one second** on a 20-member list. Yuki and Elif agreed.

The `ScoringGuideScreen` (`app/scoring.tsx`) is third. Tomáš, the completionist, cross-checked all six rules against the actual scoring logic and confirmed they match (exact +10, result +5, miss 0, boost ×2, streak rules, weekly Sunday UTC reset). He called it *"the single most transparent moment in the app."*

Carlos verified the H2H gauge fix and the `app/league/[id].tsx` rewrite. Both landed. The gauge now correctly shows 0% for empty history instead of the old `|| 0.1` phantom.

The `PredictionPill` pending state is the fourth consensus win. Every tester who saw a pending pill (most of them) reported that the new neutral grey + lock glyph treatment no longer reads as a "correct" moment. Round 1's confusion is closed.

Marco counted taps and praised the `PressableScale` + `lib/motion.ts` pairing as *"the single cleanest press-and-haptic stack I've used in an RN app."* Yuki, the strictest visual auditor, confirmed the sanctioned z-9999 shadow on `CelebrationToast` does not violate the Emerald Minimalism shadow contract.

## What every tester disliked — the six themes

Findings cluster into six themes. Count = how many testers independently raised it.

### 1. Orphaned celebration variants (12/20)
The `CelebrationToast` component defines five variants — `lockin`, `tier`, `streak`, `points`, `achievement` — with default icons and emerald surface. Only `lockin` is wired. A codebase-wide grep for `celebrate(` finds exactly **one** call site: `app/match/[id].tsx` inside `handleSubmit`. The other four variants exist as enum values and nothing else.

Specific silent moments reported:
- **Rank climbs** — Marco noted three rank climbs across the 20 days; all silent. AUDIT Track E §5.4 explicitly promised rank-climb feedback.
- **Tier promotions** — Elif, Tomáš, Carlos, Léa all saw their tier change mid-cycle with zero UI response.
- **Streak ticks and breaks** — Zainab's entire diary is essentially one long complaint about this. The `StreakFlame` component is *visually* perfect but emotionally mute. Breaking a streak on Day 4 ships as silent state change — no toast, no haptic, no scale-down animation on the flame.
- **Settlement celebrations** — Marco and Carlos: when a prediction settles correct or exact, nothing happens. The `PredictionPill` simply flips colour.
- **Group join** — Elif joined a group on Day 3 in Round 1 and complained; the same flow in Round 2 is still silent for Noah and Elif.
- **Weekly challenge complete** — Carlos flagged this as unreachable celebration.

Raised by: Elif, Marco, Tomáš, Noah, Carlos, Julian, Zainab, Sven, Léa, Ravi, Ingrid, Mei.

This is the single largest finding of Round 2. The fix is small — a handful of `celebrate()` calls in prediction settlement, streak update, tier update, and rank-climb code paths — but until it lands, the primary Round 1 complaint is not truly resolved.

### 2. Hardcoded English in new Phase A/B/C screens (6/20)
Mei's Turkish-locale audit surfaced a localization regression that Round 1 did not catch because Round 1 did not touch the surfaces that regressed.

Concrete strings that are hardcoded English with no i18n key:
- `app/scoring.tsx` — **the entire screen**: header "How scoring works", all six rule titles and descriptions, the Arsenal 2–1 Chelsea worked example, and the CTA. Mei called this *"the app's core contract, English-only to every locale."*
- `components/ui/CelebrationToast.tsx` — the default payload titles, and the hardcoded `"Locked in!"` string in the `match/[id].tsx` celebrate call.
- `components/ui/WelcomeBackBanner.tsx` — "+X points while you were away", "predictions settled", the relative time template, the dismiss label, the fallback "Welcome back".
- `app/settings.tsx` — the "How scoring works" menu label added in Phase C5.
- `app/group/[id].tsx` — the `"YOU"` pill text (should pull from `t.leaderboard.you` — which is *"SEN"* in Turkish).
- `app/premium.tsx` — the "Everything unlocked" rewrite strings (all six FEATURES).

Raised explicitly by Mei with full string lists. Partially raised by Ravi and Julian (noticed truncation risk and un-announced-label risk respectively).

### 3. Design-system leakage in settings.tsx (3/20)
Amara's token-compliance audit found that `app/settings.tsx` is the one file Phase A/B/C touched that does **not** fully obey the Emerald Minimalism contract:
- hardcoded `#FFFFFF` and `#E5E7EB` hex literals instead of `surface[0]` and `border.subtle`
- `elevation` + `shadowOpacity` styles that violate the shadow quarantine (only `CelebrationToast` at z-9999 is sanctioned)
- hardcoded `borderRadius` numbers (10, 18) outside the `radii.*` scale

This is a straightforward cleanup, but it's the one remaining contract violation in the frontend surface area that Phase A/B/C touched. Raised by Amara, Yuki (flagged the shadow), and Kenji (flagged the hardcoded hex).

### 4. Contrast regressions on emerald-on-white outcome states (3/20)
Kenji's quantitative audit and Julian's accessibility sweep both flagged WCAG AA issues:
- **`gray300` as body/secondary text** — contrast ≈ 4.1:1 on white, below the 4.5:1 AA body threshold. Systemic across multiple surfaces.
- **`PredictionPill` correct and exact states** — emerald fill + emerald-adjacent text and icons — measured at ~1.5–2.3:1, failing AA for the glyph.
- **`WelcomeBackBanner` emerald tint at ~5% opacity** — too subtle to be perceptible to Kenji; the positive variant reads identically to the neutral variant.
- **CelebrationToast white-on-emerald** — this one **passes** at 7.85:1 (AAA). The positive finding here is that Phase C1 got the toast right; the regressions are in surfaces Phase A/B/C did not revisit.

Raised by Kenji (quantitative) and Julian (accessibility-contextual).

### 5. Motor accessibility gaps on the new primitives (2/20)
Ingrid (Switch Control) and Julian (partial vision) both flagged that the `CelebrationToast`'s 2400ms default auto-dismiss is too fast for Switch Control users to engage with, and that there is no **manual dismiss** affordance — the toast auto-dismisses whether the user acknowledged it or not. Specific gaps:
- `WelcomeBackBanner` close button is 28x28 + hitSlop — below the 44x44 WCAG AAA target.
- `CelebrationToast` has no "tap to dismiss" tap target and no `accessibilityLabel` override path for payloads.
- Prediction stepper +/- buttons in `app/match/[id].tsx` still have no `hitSlop` (unchanged from Round 1).
- Reduce-motion support gap: the `FadeInUp.springify().damping(14)` entry animation does not respect `AccessibilityInfo.isReduceMotionEnabled()`.

Raised by Ingrid and Julian.

### 6. Scattered smaller findings (raised by one or two testers each)

- **Main leaderboard lacks current-user highlight** — the group standings row looks great, but the tab-level leaderboard (`app/(tabs)/leaderboard.tsx`) does not apply the same treatment. Raised by Elif, Léa, Oscar.
- **Scoring guide discoverability** — buried in Settings → About. Should also be linked from the streak hero on Home and from the first-prediction success toast. Raised by Elif, Tomáš, Léa, Takoda.
- **League filter not persisted across sessions** — `collapsedSections` state in `matches.tsx` is not saved to AsyncStorage. Every app restart resets Sven's Bundesliga-only organization. Raised by Sven.
- **Small viewport (iPhone SE 375pt) fit** — Ravi flagged that the current-user row on group standings, with its new 2px border + 18px paddingLeft + YOU pill, squeezes the points value column. Not a truncation bug but feels tight. Also flagged safe-area handling on the top toast.
- **Toast queue lacks a "(N more)" counter** — if multiple celebrations fire in rapid succession (e.g. Day 6 weekend peak), there's no transparency that a queue is draining. Raised by Marco and Bea.
- **Onboarding nudges swipe** — carousel gesture-first, tap fallback exists but is visually secondary. Raised by Ingrid.
- **Premium screen `/scoring` typed-routes cast** — the `router.push('/scoring' as any)` in `app/settings.tsx` will resolve itself on next `expo start` (types regen) but is a small debt. Raised by Amara.

## Favorite and least favorite day — aggregate

**Favorite days (cross-tester):**
- **Day 5 / Day 12** — welcome-back banner fires for the first time for most returning personas. Aisha, Priya, Oscar, Léa, and Elif all picked one of these as their favorite.
- **Day 17** — CL semi-final live pulse UI. Carlos and Marco both called this the most alive the app has felt.
- **Day 6** — weekend peak with 4+ matches in the daily pack. Tested toast queueing (Bea) and matchcard density (Marco).

**Least favorite days (cross-tester):**
- **Day 4** — streak breaks. Ships as silent state change. Zainab, Elif, Oscar, Marco all picked this as the least favorite day *because* nothing happens.
- **Day 16 / Day 9** — tier promotion moments. Elif and Tomáš: *"silent tier-up, felt anticlimactic."*
- **Day 11** — the intentional skip day. Several testers correctly wrote "Skipped." here but flagged that on return (Day 12) they felt zero absence-acknowledgement beyond the banner itself.

## One concrete fix each tester would ship tomorrow

Condensed:

The most popular "ship tomorrow" fix by far (11 of 20) is: **wire the four dormant `CelebrationToast` variants.** Add `celebrate({ variant: 'streak', … })` at the streak update site, `'tier'` at tier promotion, `'points'` at prediction settlement, `'achievement'` at weekly challenge complete, and fire `'streak'` with a distinct "broken" payload on reset.

Other top fixes:
- **Mei:** Run a localization sweep over all Phase A/B/C files. Pull every hardcoded English string into the i18n catalog.
- **Amara:** Refactor `settings.tsx` to use tokens and remove the elevation shadows.
- **Kenji:** Bump `gray300` to a WCAG-compliant body-text token (suggested: raise to ~#525B66 for ≥4.5:1 on white).
- **Ingrid:** Make `CelebrationToast` tap-to-dismiss and raise default `durationMs` to 3500ms.
- **Julian:** Add `hitSlop` to prediction stepper buttons and respect `reduceMotion` on toast entry.
- **Elif / Oscar:** Apply the same current-user row treatment from `MemberStandingRow` to the main leaderboard.
- **Tomáš:** Link the scoring guide from the streak hero on Home.
- **Sven:** Persist `collapsedSections` to AsyncStorage.

## New findings (not in Round 1)

1. **Orphaned CelebrationToast variants** — Round 1 never saw the primitive because it didn't exist; Round 2 now reveals that the primitive is under-integrated.
2. **Hardcoded English in Phase A/B/C surfaces** — Round 1 didn't have these surfaces. Round 2 Turkish audit caught them all.
3. **`settings.tsx` design-system leakage** — Phase A/B/C didn't rewrite this file, and it predates the contract. Amara's token audit is the first time it's been flagged.
4. **WCAG AA contrast regressions on emerald outcomes** — Kenji's quantitative audit was deeper than Round 1's accessibility pass.
5. **Welcome-back banner positive-tint invisibility** — the 5% emerald tint is functionally indistinguishable from the neutral state; the banner works, but the tier-of-news differentiation does not.
6. **Toast queue transparency** — no "(N more)" counter or visual indication that multiple celebrations are queued.
7. **Main leaderboard ≠ group standings** — parity gap Round 1 didn't notice because Round 1 only had one dedicated group organizer.
8. **League filter persistence** — Sven's Bundesliga-only usage surfaced a stickiness bug no other persona could have found.

## Recommended Phase D plan

Based on the Round 2 findings, a clean next phase looks like:

**D1 — Celebration wiring (closes Theme 1, unblocks 11+ tester complaints).**
Fire `celebrate()` at the four dormant sites: prediction settlement (`points` / `achievement` variant depending on exact vs correct), streak update (`streak` variant, distinct payload for tick vs break), tier promotion (`tier`), rank climb (`achievement`).

**D2 — Localization sweep (closes Theme 2).**
Pull every hardcoded string in `scoring.tsx`, `CelebrationToast.tsx`, `WelcomeBackBanner.tsx`, the new `settings.tsx` menu item, the group `YOU` pill, and the `premium.tsx` rewrite into `lib/i18n` (or wherever the catalog lives). Run the Turkish locale through every Phase A/B/C surface.

**D3 — `settings.tsx` token cleanup (closes Theme 3).**
Remove hex literals, remove elevation shadows, swap to `surface/border/radii/type` tokens.

**D4 — Contrast + motor a11y pass (closes Themes 4 and 5).**
Raise `gray300` to a compliant body-text value. Fix `PredictionPill` correct/exact glyph contrast. Add manual-dismiss + reduce-motion to `CelebrationToast`. Raise close-button hit targets to 44×44. Add `hitSlop` to stepper buttons.

**D5 — Parity and discoverability polish.**
Apply `MemberStandingRow` treatment to the main leaderboard. Persist `collapsedSections`. Link scoring guide from the Home streak hero and the onboarding "Ready to predict" step. Add "(N more)" to toast queue. Raise `WelcomeBackBanner` positive-tint opacity.

Each item is small and independent; the whole plan fits in a one-week sprint.
