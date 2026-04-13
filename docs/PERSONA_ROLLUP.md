# Scorepion — 20-Persona Long-Term Usage Simulation

**Date:** April 11, 2026
**Method:** 20 agents, each simulating a unique persona over 20 days of use, reading the real codebase and forming concrete judgments.

---

## Personas (All 20)

| # | Persona | Lens |
|---|---|---|
| 1 | Maya (design-conscious PM, SF) | Craft & consistency |
| 2 | Dmitri (quant, Moscow) | Scoring math / statistical defensibility |
| 3 | Olamide (data reporter, Lagos) | Stats pages, delta framing, loading |
| 4 | Hannah (casual, Melbourne) | Gaming terms, onboarding comprehension |
| 5 | Yuki (social sharer, Tokyo) | Share cards, social flows |
| 6 | Carlos (retired teacher, Madrid) | Older users, Spanish, typography |
| 7 | Priya (accessibility advocate, Bangalore) | WCAG, screen readers |
| 8 | Emil (performance, Helsinki) | FlatList perf, dark mode gaps |
| 9 | Giulia (Serie A fan, Milan) | Team data accuracy, Italian locale |
| 10 | Kofi (Afrobarometer, Accra) | African leagues, GDPR, data provenance |
| 11 | Soo-Jin (productivity PM, Seoul) | Tap counts, context persistence |
| 12 | Lars (engineer, Munich) | Precision, Bundesliga accuracy, German locale |
| 13 | Rania (recovery, Cairo) | Gambling-adjacent language, dark patterns |
| 14 | Tariq (night-shift nurse, Birmingham) | One-handed, 2-min sessions, haptics |
| 15 | Beatriz (linguist, São Paulo) | pt-BR diacritics, Brasileirão |
| 16 | James (retired accountant, Dublin) | 60+ users, font size, confirmations |
| 17 | Noor (UX researcher, Dubai) | Nielsen, WCAG, professional audit |
| 18 | Alejandro (gamer, CDMX) | Game feel, juice, Liga MX |
| 19 | Freya (senior designer, Stockholm) | Token hygiene, design system craft |
| 20 | Ben (staff engineer, Austin) | Resilience, error handling, observability |

---

## 1. Recurring Bugs (Real Defects Found in Code)

### Critical (multiple personas independently flagged)

1. **Weekly points hardcoded to 0** — `app/(tabs)/profile.tsx:462` has an inline `/* TODO: wire once weekly stats ship */` comment and renders a literal `0`. Flagged by **Olamide, Soo-Jin, Maya**. This is the single most visible "unfinished" signal in the app.

2. **Dark mode gaps — static imports bypass ThemeContext**:
   - `app/league/[id].tsx:23` — `import { surface, border, text, accent, radii } from '@/constants/colors'`
   - `app/match/[id].tsx`, `app/group/[id].tsx` — similar pattern
   - `components/ui/Button.tsx`, `FilterSegmented.tsx`, `WelcomeBackBanner.tsx` — secondary button uses static `surface[0]`
   - Flagged by **Emil, Tariq, Freya, Maya**. Users in dark mode see unreadable black-on-dark on the league standings screen.

3. **Team naming inconsistencies** — `lib/mock-data.ts:134` — `'Inter Milan'` (should be **Internazionale**), `'Bayern Munich'` (Anglo shorthand), `'BAY'` shortnames. Flagged by **Giulia, Lars**. Credibility-killing for serious football fans.

4. **Notification toggles are cosmetic** — `app/settings.tsx:28–53` — toggles persist to AsyncStorage but never wire to backend mute lists or native push APIs. A user who mutes 2am pings still gets them. Flagged by **Tariq**. Major trust violation.

5. **`react-native-view-shot` not installed** — share flow can only export text, not images. PredictionReceiptCard exists but share button is never fully wired. Flagged by **Yuki, Soo-Jin, Maya**. Breaks a core social value prop.

6. **Swallowed promise errors throughout `contexts/AppContext.tsx`** — lines 137, 214–221 use bare `catch { }`. A failing `POST /api/retention/daily-pack/complete` or `POST /boost` is invisible to the user. Local state updates, server never confirms. Flagged by **Ben, Priya**.

7. **Race condition: rapid "Lock In" taps** — `app/match/[id].tsx` handleSubmit has no debounce, no submission lock, no disabled-state guard. Tapping 5× fires 5 parallel `submitPrediction` calls. Flagged by **Ben, Soo-Jin**.

8. **Stale closure bug in `toggleBoostPick`** — `contexts/AppContext.tsx:230–255` captures `dailyPack` in closure at callback creation; rollback after failure restores stale state. Flagged by **Ben**.

9. **`queryClient` global `staleTime: Infinity`** — `lib/query-client.ts:76`. Live match data never refreshes. Users see yesterday's scores as "current." Flagged by **Ben, Maya**.

10. **No request timeout / AbortController** — `lib/query-client.ts:30–46`. `fetch()` hangs forever on slow 3G. Flagged by **Ben, Tariq**.

11. **Timezone bucketing uses UTC, not local** — `lib/datetime.ts` + `app/(tabs)/matches.tsx:29–32`. A user in Dubai (+4) sees a 20:00 UTC match under "Tomorrow" when it's "Tonight" locally. Flagged by **Noor**. Core reliability bug.

12. **Missing `useEffect` cleanup in `AppContext.loadData`** — lines 142–144. State updates fire on unmounted component. Flagged by **Ben**.

### Major

13. **Translation defects still present in pt** — `lib/i18n/translations.ts:2286` still shows `'Codigo do Grupo'` (missing cedilla → should be `Código`), `tier: 'Nivel'` → `Nível`, `away: 'Longe'` (should be `Visitante`), `h2h: 'Frente a frente'` (should be `Confronto Direto`). Flagged by **Beatriz** — so the prior pt fix pass missed several strings.

14. **Gambling-adjacent language in onboarding** — `lib/i18n/translations.ts:273` — `competeBody: 'Squads with friends, side bets'`. No "side bets" feature actually exists; this is marketing copy that is a direct trigger word. Flagged by **Rania**.

15. **FOMO / loss-aversion language in streaks** — `'protect your flame'`, `'keep the fire alive'`, `'streak gone'`. Flagged by **Rania** as a dark pattern for users in gambling recovery.

16. **No inline form validation** — `app/auth.tsx:165–170`, onboarding, group creation — errors appear in a red box *after* submit, not as the user types. Flagged by **Noor, Soo-Jin, Priya**.

17. **Only ~15 `accessibilityLabel` instances** across 40+ interactive elements. Tab bar, league collapse chevrons, icon-only buttons all missing labels. Flagged by **Noor, Priya**. WCAG 2.1.1 / 4.1.2 violation.

18. **No visible focus indicators** for keyboard navigation — WCAG 2.4.7 violation. Flagged by **Noor**.

19. **TextInput placeholder contrast** — `textRole.tertiary` ≈ `#94A3B8` on `#FFFFFF` = ~4.0:1, below WCAG AA 4.5:1. Flagged by **Noor, James, Emil**.

20. **Tab bar labels at 10pt** — `app/(tabs)/_layout.tsx:91` `fontSize: 10`. Unreadable for 60+ users with bifocals. Flagged by **James, Carlos**.

21. **Micro-text (11pt) used for readable labels** — "PREDICTED", "STREAK", achievement badges. Flagged by **James, Carlos, Priya**.

22. **`tertiary` text used for captions** — `#64748B` on white = 4.78:1, bare-minimum AA. Flagged by **James, Emil**.

23. **Radii hardcoded outside scale** — `FilterSegmented borderRadius: 14`, `CelebrationToast/EmptyState borderRadius: 18`, `StreakFlame borderRadius: 30`, `FilterSegmented` active pill `radii.sm - 2 = 10` (clever but unmaintainable). Flagged by **Freya**.

24. **Hardcoded shadows bypassing `elevation` tokens** — `StatCard` uses raw `shadowColor: '#000'`, `ErrorFallback` and `ConnectionBanner` inline their own shadow maps. Flagged by **Freya**.

25. **Typography fragmentation** — `Button` hardcodes `fontFamily: 'Inter_600SemiBold'`, `Badge`/`LiveBadge` hardcode `fontSize: 10`, `StatCard` uses `fontSize: 22` instead of `type.h2`. Flagged by **Freya**.

26. **`wobble` spring defined but unused** — `lib/motion.ts:34`. Dead code. Flagged by **Alejandro**.

27. **TierUpFullscreen auto-dismisses in 4s** — too fast for the one celebration moment in the app. Flagged by **Alejandro**.

### Minor but recurring

- Nav state not persisted (always returns to Today). **Soo-Jin**.
- Group invite system is a placeholder. **Maya, Hannah, Soo-Jin, Lars, Tariq**.
- No sticky header on match-detail filter tabs. **Soo-Jin**.
- No countdown / sticky prediction drawer before lockout. **Tariq, Soo-Jin, James**.
- No undo on prediction lock. **James, Noor**.
- Error fallback is generic "Something went wrong." **Noor, Ben**.
- 404 page uses default Expo template. **Noor**.
- Inconsistent time format: "Starts in 2h 15m" vs "Next at 19:30". **Soo-Jin**.
- `AsyncStorage` errors silently swallowed. **Ben**.

---

## 2. Recurring UX Pain Points

### Theme: "The app is a well-designed MVP with unfinished edges"

- **Weekly stats at 0**, **placeholder share flow**, **placeholder group invite system**, **placeholder achievements**, **premium page with no real value prop** — every persona that explored beyond the happy path noticed at least one unfinished feature. The aggregate effect is "this is beta quality."

### Theme: "Silent failures break trust"

- Predictions that appear to save locally but never sync server-side.
- Notification toggles that don't actually mute.
- Boost button that does nothing when `dailyPack` is empty.
- Network errors that produce no toast, no retry, no feedback.
- Users stop trusting the app once they realize actions might fail invisibly.

### Theme: "Power-user friction"

- Always returns to "Today" tab (Soo-Jin, Tariq).
- No quick-predict from match card (Alejandro, Tariq, Soo-Jin).
- No sticky prediction section on match detail (Tariq, Soo-Jin).
- No keyboard dismissal on search TextInput (Noor).
- No "expand all / reset view" on collapsed leagues (Noor).
- No favorite-leagues quick filter (Noor, Hannah).

### Theme: "Accessibility debt"

- Tab bar labels unreadable at 10pt.
- `textRole.tertiary` at 4.78:1 is legal but uncomfortable.
- Missing `accessibilityLabel` on most icon-only buttons.
- No focus indicators for keyboard navigation.
- Placeholder text below WCAG AA contrast.
- No in-app text-size slider.
- No confirmation dialogs before destructive/critical actions.

### Theme: "Localization tax"

- Missing locales: **German** (Lars), **Italian** (Giulia), **Arabic** (Noor).
- Portuguese still has leftover diacritical / terminology defects.
- Spanish feels Castilian, not Mexican (Alejandro) or Latin American (Carlos).
- English loanwords bleed into non-English UIs (Carlos).
- No Brazilian, Liga MX, or African leagues in mock data.
- Legal pages (privacy/terms) only in English — GDPR concern for German users.
- Timezone handling uses UTC, not device-local.

### Theme: "Juice gap for gamers"

- No wobble springs applied anywhere (dead code).
- No confetti / particle effects on tier-ups or exact scores.
- Tier-up celebration is a 4s polite fade; expected shake+rumble.
- Prediction lock feedback is quiet state change, not a pop.
- No sound design at all.
- No seasonal arcs, daily quests, or battle-pass metaphor.

### Theme: "Dark patterns adjacent to gambling"

- "Side bets" language in onboarding.
- "Protect your flame" / "keep alive" loss-aversion framing.
- "Reward" language around points.
- Streak reset on single missed day with no warning 12h before.

---

## 3. Patterns That Hurt Premium Feeling

1. **Visible TODOs in shipped code** — `// TODO: wire once weekly stats ship`. Nothing says "beta" like a TODO rendering `0` on a Profile screen.
2. **Hardcoded values that break the design scale** — radii `14/18/30`, shadows `#000`, fontSize `22`.
3. **Silent catches** — `catch { }` blocks at `AppContext.tsx:137,214,219`.
4. **Generic "Oops!" microcopy** — `app/+not-found.tsx`.
5. **Placeholder features presented as real** — notification toggles that don't work, Group Invite button that opens a stub, Achievements showing "Mystery Achievement."
6. **Incomplete dark mode** — half the screens flip correctly, half stay light.
7. **Low-contrast tertiary text** used for readable captions (elegant at the cost of comfort).
8. **Translation typos** — `Codigo`, `Nivel`, `Longe`. In a polished app these should not exist.
9. **No loading/error state on Stats tab** — screen just stays blank when the query returns null.
10. **Leaderboard pagination missing** — scrolling past 50 does nothing.

---

## 4. Patterns That Strengthen Premium Feeling

These are the real, working strengths noted by almost every persona:

1. **Emerald Minimalism design system** — one accent, earned gradient moments, disciplined color story. Cited by **Maya, Freya, Carlos, Soo-Jin, Tariq, Lars, Noor, Rania**.
2. **Typography scale (7-tier Inter)** — mature, opinionated, consistent at the token level even if component adoption is uneven. Cited by **Freya, James, Noor**.
3. **Motion library (`lib/motion.ts`)** — spring presets, haptic escalation, stagger helpers, `useReducedMotion` respect. Cited by **Emil, Alejandro, Freya, Tariq**.
4. **Celebration toast queue (`CelebrationToast.tsx`)** — queued variants, 3.5s dwell, proper accessibility. Cited by **Soo-Jin, Alejandro, Rania**.
5. **Podium animation on leaderboard** — "chef's kiss" per Alejandro. Cited by **Alejandro, Noor**.
6. **Primary button (54px emerald)** — a gold standard for a senior user's confidence. Cited by **James, Tariq, Noor**.
7. **Haptic escalation** (light→medium→success→warning) — subtle but premium. Cited by **Tariq, Soo-Jin**.
8. **5-locale i18n foundation** — when it works, it's comprehensive. Cited by **Soo-Jin, Beatriz**.
9. **Design documentation (`DESIGN_GUIDE.md`)** — opinionated, references Linear/Arc/Stripe. Cited by **Freya**.
10. **Legal pages exist and are explicit** — "Predictions are for entertainment purposes only and are not gambling." Cited by **Rania** as the single most important safety signal.
11. **Skeleton loaders respecting `prefers-reduced-motion`** — thoughtful. Cited by **Noor, Emil**.
12. **Daily Pack concept** — reduces decision fatigue, motivates return. Cited by **Lars, Noor, Tariq**.
13. **No crashes observed** in any of the 20 simulations over 20 simulated days each.

---

## 5. Highest-Priority Improvements

### P0 — Ship-Blocking (do these first)

1. **Fix the five silent failure patterns in `contexts/AppContext.tsx`**
   - Remove bare `catch { }` on lines 137, 214, 219.
   - Add error toasts with retry CTAs.
   - Add rollback on optimistic update failure.
   - Fix the stale closure in `toggleBoostPick` (use functional setState or re-read fresh `dailyPack`).
   - Add `useEffect` cleanup (cancellation flag) in `loadData`.

2. **Fix prediction submit race condition** — add `submittingRef` guard or disabled-state flag in `app/match/[id].tsx` handleSubmit.

3. **Add request timeout + AbortController** in `lib/query-client.ts` fetch wrapper (30s default, abort on unmount).

4. **Remove global `staleTime: Infinity`** — default to 5 min; per-endpoint overrides for genuinely static data.

5. **Finish or remove the three visibly-unfinished features**:
   - Wire weekly points in `app/(tabs)/profile.tsx:462`.
   - Install `react-native-view-shot` and wire PredictionReceiptCard share flow, OR remove the share button entirely.
   - Ship group invite (QR / deep-link / copy-code) OR remove the CTA.

6. **Fix remaining dark-mode static imports** — `app/league/[id].tsx`, `app/group/[id].tsx`, `Button.tsx`, `FilterSegmented.tsx`, `WelcomeBackBanner.tsx`. Then add a lint rule forbidding direct imports of `surface`, `border`, `text`, `accent` when `useTheme()` is available.

7. **Fix timezone bucketing** — use device-local timezone for date keys in `app/(tabs)/matches.tsx`. This is a core reliability bug for anyone not in UTC.

8. **Wire notification toggles to backend mute lists** — or label them explicitly as "cosmetic only" until they work.

9. **Fix the remaining Portuguese defects**: `Codigo` → `Código`, `Nivel` → `Nível`, `Longe` → `Visitante`, `Frente a frente` → `Confronto Direto`.

10. **Remove "side bets" from onboarding** (`lib/i18n/translations.ts:273`) — no such feature exists and it's a trigger word.

### P1 — High (before general availability)

11. **Accessibility audit pass**:
    - Add `accessibilityLabel` to every icon-only button, tab, and chevron. Lint rule.
    - Add focus indicators on all `TextInput` focused states (2px emerald border).
    - Raise `textRole.tertiary` contrast or stop using it for readable captions.
    - Raise tab bar label from 10pt → 13pt.
    - Stop using `micro` (11pt) for readable labels; reserve for decorative-only.

12. **Inline form validation** — `auth.tsx`, `onboarding.tsx`, group creation. Show green check / red border as user types, not only on submit.

13. **Error mapping with plain-language i18n** — add `errors: { usernameTaken, passwordTooShort, networkError, ... }` to all five locales, map API responses to user-facing strings.

14. **Persist last-used tab** — AsyncStorage `lastRoute`; restore on cold start. Cited by **Soo-Jin, Tariq**.

15. **Neutralize streak loss-aversion language** — `'protect your flame'` → `'maintain your streak'`, `'keep alive'` → `'keep going'`. Remove the 🔥 emoji from streak notifications.

16. **Soften `reward` language** — `'highest reward'` → `'most points'`, `'half the reward'` → `'half the points'`.

17. **Scoring rule clarity** — `wrongDesc` currently says "miss the outcome entirely"; rewrite to be unambiguous: "Wrong result: the winner you picked didn't win. No points; streak survives if you predicted today."

18. **Add loading timeout UI** — if any request is pending >3s, show "Still loading…" toast.

19. **Add undo / edit window on prediction lock** — while the match is not yet live.

20. **Add confirmation modal for predictions within T-60 min** of kickoff (senior-user safety).

21. **Sticky headers on match-detail filter tabs** (Soo-Jin, Tariq).

### P2 — Medium (post-MVP polish)

22. **Add German, Italian, Arabic locales** — these are the missing big ones (Lars, Giulia, Noor).

23. **Add Liga MX, Brasileirão, and at least one African league** to mock data and add flags in the picker.

24. **Fix team naming**: `Inter Milan` → `Internazionale`, `Bayern Munich` → `FC Bayern München` (or locale-aware formal names).

25. **Design system lint rules**:
    - No hardcoded `borderRadius` numbers outside `radii.*`.
    - No hardcoded colors outside semantic tokens.
    - No direct shadow objects outside `elevation.*`.

26. **Add semantic type tokens**: `type.statValue`, `type.cardTitle`, `type.chipLabel` to remove hardcoded `fontSize: 22/26/10` from components.

27. **Juice pass on TierUpFullscreen**: apply the defined-but-unused `wobble` spring, fire `haptics.heavy()`, extend display from 4s → 7s, add Lottie confetti.

28. **Prediction lock pop** — `haptics.medium()` + 0.95→1.1 scale spring on the pill itself when locked, so feedback is local to the action.

29. **Quick-predict pills** on match cards ("1 / X / 2" tap-to-fill common scores).

30. **Favorite-leagues quick filter** in Matches tab.

31. **Rewrite legal pages in pt-BR / pt-PT with idiomatic register**; reference LGPD in pt-BR, GDPR in de/fr/es; add local contact pathways.

32. **Recovery-support disclosure** in Terms or Settings — a single paragraph acknowledging problem gambling and pointing to resources (Rania's recommendation).

### P3 — Nice-to-have

33. Notification Center tab / panel.
34. Proper Stripe paywall and per-feature gating.
35. Seasonal arcs / daily quests.
36. Sticky "you" row on leaderboard.
37. Leaderboard pagination / infinite scroll.
38. League-specific leaderboard filters.
39. Sound design (subtle tap click, tier-up chime).

---

## 6. Features / Behaviors to Remove, Refine, or Elevate

### Remove

- **"Side bets"** in the onboarding "Compete" copy — no feature backs it, and it's a gambling trigger word.
- **Notification toggles that don't mute** — ship them as working, or remove them. A cosmetic toggle that loses user trust is worse than no toggle.
- **"Mystery Achievement" placeholders** — either wire real achievements or delete the section.
- **Dead `wobble` spring in `lib/motion.ts`** — dead code, or actually use it on TierUpFullscreen/PredictionPill.
- **Dark-mode token scaffolding that's half-wired** — either commit to dark mode with enforcement, or delete the dark tokens entirely (design guide says "light only" but the context and token flipping exist).
- **Generic "Oops!" 404 page** — replace with emerald-consistent ScreenHeader + CTA.
- **Legacy `hue.violet/teal/coral/cyan` exports remapped to emerald** — just delete them and force a migration.

### Refine

- **Celebration toast → add impact**: currently polite, needs a 0.95→1.1 pop + medium haptic for lock-ins and exact scores.
- **TierUpFullscreen**: extend dwell time, add wobble, add haptics.heavy, add confetti, add optional "Share Tier" CTA.
- **PredictionPill lock state**: pop + glow on settle for exact/result hits.
- **Streak language**: neutralize the fire metaphor and the loss-aversion framing.
- **Tab bar**: labels 10pt → 13pt; add `accessibilityLabel` for screen readers.
- **tertiary text usage**: reserve for dividers/placeholders only; use `secondary` (9.8:1) for captions.
- **Legal pages**: idiomatic translations (not English-syntax), add LGPD references in pt-BR.
- **Group invite flow**: build a real QR / deep-link / copy-code path.
- **Share flow**: install `view-shot`, wire the receipt card to actually export an image.
- **Error states**: every fetch failure must produce a toast with a retry CTA.
- **Empty states**: make them context-aware instead of generic ("No Bundesliga matches this week" not "No matches found").
- **Spanish locale**: soften Castilian idioms; add Mexican register variants.
- **Portuguese locale**: finish the diacritical pass (4 strings still wrong).

### Elevate

- **Emerald Minimalism design system** → formalize with Storybook, lint rules, and a token governance doc. The thesis is excellent; enforcement is the gap.
- **Motion library** → actually exercise the defined presets (wobble!) and document when to reach for each.
- **Celebration queue architecture** → reuse it for rank-climb and group-position-change events (cited by Soo-Jin).
- **Daily Pack concept** → make it the focal hero on the Today screen, not a secondary card below the Streak Hero.
- **Legal pages as a trust signal** → lead with the "not gambling" sentence in the first paragraph (Rania's key safety signal).
- **Scoring transparency page** → link to it from every match detail so Lars and Dmitri can verify math at-a-glance.
- **i18n completeness** → make five locales truly first-class, then add de/it/ar. A truly multilingual football app is differentiated; a half-translated one is not.

---

## 7. Final Roll-up Verdict

**Scorepion is a well-designed MVP with an unusually mature design foundation and a concerning amount of unfinished plumbing.**

The top-line pattern across all 20 personas is the same: *the bones are excellent, the finishing is inconsistent.* The color system, motion library, typography scale, celebration choreography, and copy tone on the happy path are **premium**. But almost every persona found at least one silent failure, one unfinished feature, one accessibility gap, one translation defect, or one design-system violation. Individually these are forgivable; in aggregate they create a "beta" perception that stops power users, accessibility users, and international users from recommending the app.

**The 10 highest-leverage fixes (in order):**

1. Stop swallowing errors in `AppContext.tsx` (5 bare catches to fix).
2. Fix the prediction-submit race condition and add optimistic rollback.
3. Fix timezone bucketing (local-date, not UTC).
4. Finish or remove weekly points, share flow, group invite — don't ship TODOs.
5. Complete dark mode migration for the 6 remaining static-import files; add a lint rule.
6. Wire notification toggles to something real.
7. Accessibility pass: labels, focus indicators, tab-bar 13pt, tertiary text contrast.
8. Inline form validation everywhere.
9. Finish the Portuguese diacritical pass (4 strings) and remove "side bets" from onboarding.
10. Raise request resilience: timeouts, retry with backoff on mutations, remove `staleTime: Infinity`.

**Post-fix trajectory:** with ~2 focused weeks of work on the P0 items and ~2 more on P1, Scorepion moves from "promising MVP that feels unfinished" to "shipping product with real craft." The hard, rare thing — a coherent design thesis with real taste — is already done. The remaining work is enforcement, completion, and resilience, which are solvable problems with clear owners and clear wins.

**The unanimous premium-feeling highlight:** Emerald Minimalism. Do not dilute it. Enforce it. Every persona who spoke to design craft (Maya, Freya, Soo-Jin, Tariq, Lars, Rania, Noor, Carlos, James) said the visual discipline is the single best thing about the app.

**The unanimous risk:** silent failure. Users don't forgive an app that says "saved" and means "maybe." Fix the error handling before anything else.
