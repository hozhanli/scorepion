# Mei — Internationalization Tester (Turkish)
## 20-Day End-User Simulation Diary
**Dates:** Mon 6 Apr — Sat 25 Apr, 2026
**Locale:** tr-TR (Turkish)
**Device:** iPhone 12 Pro (375pt width)

---

## Days 1–5: Onboarding & First Week

### Day 1 — Mon 6 Apr: Fresh Install, Auth → Onboarding
**What I did:**
Fresh install. Logged in with test account, proceeded through onboarding flow. First action: predicted Arsenal v Liverpool (PL opener). Submitted prediction. Saw celebration toast overlay.

**What I liked:**
The app feels clean and minimal. The onboarding copy is properly localized in Turkish. Greeting "Merhaba, {{name}}" renders correctly with my test name.

**What I didn't like:**
When I submit my first prediction, the celebration toast appears with the title "Locked in!" — this is **hardcoded English**. In Turkish locale, this should be a translation key. The toast should say something like "Kilitlendi!" (Turkish: "Locked in!"). The subtitle `{{teamName}} {{homeScore}} – {{awayScore}} {{teamName}}` uses the score format correctly and is translatable by the `tt()` template helper, but the title is not.

**Bugs/dead ends:**
None detected. But **translation gap identified**: `CelebrationToast.tsx` hard-codes `title: 'Locked in!'` instead of pulling from the i18n catalog.

---

### Day 2 — Tue 7 Apr: CL QF L1, Boost, Streak
**What I did:**
Predicted Arsenal–Real Madrid, Bayern–Inter. Boosted the Bayern match. Successfully locked in. Streak incremented to 1 day.

**What I liked:**
The daily pack layout is clear. The boost button is prominent and easy to identify.

**What I didn't like:**
The translation catalog (`lib/i18n/translations.ts`) shows `tr` entries for most common UI (tabs, matches, leaderboard), but I notice the Turkish key `leaderboard.you` is set to `'Sen'` (literally "You"). However, in the standings table in `app/group/[id].tsx`, I see a hardcoded English "YOU" pill. When rendered in Turkish locale, this should say "SEN" — but it's hardcoded as the constant text `<Text style={standingStyles.youPillText}>YOU</Text>`. This is **not localized**.

Additionally, in Turkish, "YOU" typically becomes "SEN" (2 characters), but in longer forms can expand. The pill width is fixed at `paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4` which may truncate longer Turkish pronouns in some scenarios.

**Bugs/dead ends:**
**Hardcoded "YOU" pill in group standings** — should use `t.leaderboard.you` or similar key. Current state is English-only.

---

### Day 3 — Wed 8 Apr: CL QF L1 (PSG–Aston Villa, Barcelona–Dortmund), Join Group
**What I did:**
Joined a public group "Champions Collective". Predicted on both CL matches. Checked group standings. Saw my username, but also that hardcoded "YOU" pill next to my name.

**What I liked:**
The group join flow is smooth. The standings layout is intuitive — username, stats, points aligned nicely.

**What I didn't like:**
The "YOU" pill persists as hardcoded English. In Turkish, this is "SEN" or "SİZİ" depending on formal/informal context, but the brief specifies tr-TR (informal). A competent Turkish speaker would immediately notice this inconsistency. The pill should pull from i18n.

**Bugs/dead ends:**
Same as Day 2.

---

### Day 4 — Thu 9 Apr: Europa QF L1, Streak Breaks
**What I did:**
Predicted on Europa QF match. Got the result wrong (missed exact score). Streak resets to 0.

**What I liked:**
The prediction history shows all my picks clearly. The match card displays correctly in Turkish.

**What I didn't like:**
No major translation gaps, but I notice the welcome-back banner (not yet triggered) will need careful audit when it appears.

**Bugs/dead ends:**
None yet.

---

### Day 5 — Fri 10 Apr: PL Friday, Tier Promotion
**What I did:**
Predicted on Friday night fixtures. Scored enough points to hit Tier 2. Should see tier celebration toast tomorrow.

**What I liked:**
Daily pack layout is consistent and Türkçe-friendly.

**What I didn't like:**
No new translation issues, but starting to audit the scoring guide for later in the week.

**Bugs/dead ends:**
None yet.

---

## Days 6–10: Peak Activity & Scoring Transparency Audit

### Day 6 — Sat 11 Apr: PL Weekend Peak (4+ Matches)
**What I did:**
Made 6 predictions on Saturday PL matches: Man Utd, Chelsea, Liverpool, Aston Villa. Boosted Liverpool. All locked in. Derby atmosphere, high engagement.

**What I liked:**
Match cards are clear, prediction submission is snappy.

**What I didn't like:**
Still noticing the hardcoded "YOU" pill every time I check group standings. Also, I haven't yet seen the new scoring guide. Let me navigate to Settings to find it.

**Bugs/dead ends:**
None new. (Confirmed the "YOU" pill is still hardcoded.)

---

### Day 7 — Sun 12 Apr: PL + LaLiga Sunday, Leaderboard Climb
**What I did:**
Predicted on 5 more matches (PL + La Liga). Climbed the leaderboard in my group. Checked my Profile to view the week's stats.

**What I liked:**
The leaderboard sorts correctly. My row is highlighted with emerald accent, which is good visual distinction.

**What I didn't like:**
None new on the translation front.

**Bugs/dead ends:**
None new.

---

### Day 8 — Mon 13 Apr: CL QF L2, Review Predictions
**What I did:**
Predicted on Real Madrid–Arsenal, Inter–Bayern (L2 legs). Reviewed my predictions from Day 2 to see how the lock-in toast looked in retrospect.

**What I liked:**
The match detail screen is thorough.

**What I didn't like:**
Nothing new.

**Bugs/dead ends:**
None.

---

### Day 9 — Tue 14 Apr: CL QF L2 (Aston Villa–PSG, Dortmund–Barcelona), Tier Badge Reveal
**What I did:**
Predicted on the remaining QF leg matches. Saw Tier 2 badge unlock celebration (should have fired yesterday). Shared to group.

**What I liked:**
The tier celebration should fire. Looking at `CelebrationToast.tsx`, the variant `'tier'` is mapped to the `'trophy'` icon and expects a hardcoded `title` to be passed in from the caller. I need to check how the tier celebration is wired in the App Context.

**What I didn't like:**
I'm now proactively checking the `app/settings.tsx` link to "How scoring works". I see the label is: `label: 'How scoring works'`. This is **hardcoded English**. In Turkish locale, this should be pulled from i18n. The translation catalog has no entry for this label yet — it's missing from the `profile` or `common` key group. This is a **new hardcoded string introduced by the Phase A/B/C audit**.

**Bugs/dead ends:**
**Second hardcoded string found:** Settings link "How scoring works" → hardcoded, should be i18n key.

---

### Day 10 — Wed 15 Apr: Europa QF L2 + Conference Quarters, Mid-Cycle Review
**What I did:**
Predicted on Europa and Conference League. Reviewed my week-to-date stats on Profile. Overall, 15/22 predictions correct (68% accuracy).

**What I liked:**
Everything is rendering cleanly in Turkish locale for the existing, previously-localized strings.

**What I didn't like:**
The hardcoded strings are now standing out to me:
1. "YOU" pill in group standings (hardcoded, should be `t.leaderboard.you`)
2. "How scoring works" in Settings menu (hardcoded, should be a new i18n key — I recommend `profile.scoringGuideLabel` or `profile.howScoringWorks`)
3. "Locked in!" in CelebrationToast (hardcoded, should be a new key `celebrations.lockinTitle`)

**Bugs/dead ends:**
Same three issues identified above.

---

## Days 11–15: Welcome-Back & Scoring Guide Deep-Dive

### Day 11 — Thu 16 Apr: Quiet Day (Skip the App)
**Skipped.**

---

### Day 12 — Fri 17 Apr: Return After 1-Day Absence, Welcome-Back Banner
**What I did:**
Returned to the app after 24 hours. Expected to see the welcome-back banner at the top of the Home screen (if predictions settled while away).

**What I liked:**
The banner fired correctly! It shows a calm summary. The copy reads: "+5 puan kaz while you were away" or similar (I made this prediction settle positively). The banner is a white hairline row with emerald accent, minimalist and clean.

**What I didn't like:**
However, the `WelcomeBackBanner.tsx` component has hardcoded English strings in its logic:
- `title = positive ? '+${pointsEarned} points while you were away'` — **hardcoded "points"**
- `'${settledCount} prediction${settledCount === 1 ? '' : 's'} settled'` — **hardcoded "prediction/settled"**
- `'Welcome back'` — **hardcoded "Welcome back"**

In Turkish, these should be:
- `'+{{pointsEarned}} puan kazandığınız' (You earned X points)` or similar longer form
- `'{{count}} tahmin tamamlandı'` (X predictions settled)
- `'Tekrar hoş geldin'` or `'Geri dön'` (Welcome back)

Additionally, the subtitle contains hardcoded formatting: `'{{hoursAway}}h away · tap to see how it went'` — the "h" abbreviation and phrase are English-only.

**Bugs/dead ends:**
**Major i18n gap in WelcomeBackBanner.tsx:** The banner has **5+ hardcoded English strings** that are not in the i18n catalog and should not be hard-coded. They need i18n keys, and the plural handling (English "predictions", Turkish "tahmin/tahminler") requires careful translation of the template strings.

---

### Day 13 — Sat 18 Apr: Huge PL Weekend (5+ Matches)
**What I did:**
Predicted on Man Utd v City, Arsenal–Chelsea, Liverpool–Everton (3 big PL matches). Made 5 predictions total.

**What I liked:**
All is well, no new issues detected.

**What I didn't like:**
Nothing new.

**Bugs/dead ends:**
None new.

---

### Day 14 — Sun 19 Apr: PL + Serie A, Weekly Challenge Progress
**What I did:**
Predicted on Serie A matches as well. Weekly challenge progress bar visible.

**What I liked:**
Clean layout.

**What I didn't like:**
Nothing new.

**Bugs/dead ends:**
None new.

---

### Day 15 — Mon 20 Apr: Profile Stats Deep-Dive for the Week
**What I did:**
Opened Profile, reviewed weekly stats: 32 predictions, 21 correct (66% accuracy), 156 points earned. Checked the "Per Day" breakdown.

**What I liked:**
Stats render correctly.

**What I didn't like:**
Still noticing the hardcoded "YOU" pill in past group checks. Also, I haven't yet navigated to the scoring guide screen itself — let me do that now.

**Bugs/dead ends:**
None new. But I want to audit the scoring guide screen next.

---

## Days 16–20: CL Semifinals, Scoring Guide Audit, Group Finals

### Day 16 — Tue 21 Apr: CL Semi-final L1 Draw & Preview, Boost
**What I did:**
Predicted on Arsenal–PSG, Bayern–Dortmund (CL Semi L1). Boosted Arsenal match. Locked in predictions.

**What I liked:**
All smooth.

**What I didn't like:**
None new.

**Bugs/dead ends:**
None.

---

### Day 17 — Wed 22 Apr: CL Semi L1 Live, Settings → Scoring Guide
**What I did:**
Watched CL matches settle live. Then navigated to Settings > "How scoring works" to audit the scoring guide screen for translation gaps.

**What I liked:**
The scoring guide screen (`app/scoring.tsx`) is beautifully minimal, white surface, hairline dividers, emerald accents. The layout adapts well.

**What I didn't like:**
**Severe i18n gaps in scoring.tsx:**

1. **Header title:** `<Text style={styles.headerTitle}>How scoring works</Text>` — hardcoded English. Should be i18n key `profile.scoringGuideTitle` or `scoring.title`.

2. **Intro section:**
   - `<Text style={styles.introTitle}>Every rule, explained</Text>` — hardcoded English.
   - `<Text style={styles.introText}>Scorepion keeps scoring simple…</Text>` — entire intro paragraph is hardcoded English.

3. **Rule titles and descriptions** — the `RULES` array contains:
   - `{ icon: 'star', title: 'Exact score', points: '+10 pts', description: 'Nail both the home and away score exactly…' }`
   - `{ title: 'Correct result', points: '+5 pts', … }`
   - `{ title: 'Wrong result', points: '0 pts', … }`
   - `{ title: 'Boost', points: '×2 on a match', … }`
   - `{ title: 'Streak', points: 'Consecutive days', … }`
   - `{ title: 'Weekly leaderboard', points: 'Resets Sunday UTC', … }`

   **All titles and descriptions are hardcoded English.** Turkish translations are not in the i18n catalog. The scoring rules are foundational to the app's contract with the user, and having them in English when the app is running in Turkish is a serious localization failure.

   For Turkish, these should approximate:
   - "Tam Skor" (Exact Score)
   - "Doğru Sonuç" (Correct Result)
   - "Yanlış Sonuç" (Wrong Result)
   - "Güçlendirme" (Boost)
   - "Seri" (Streak)
   - "Haftalık Liderlik" (Weekly Leaderboard)

4. **Worked example section:**
   - `<Text style={styles.exampleHeader}>A worked example</Text>` — hardcoded.
   - `<Text style={styles.exampleIntro}>You predict Arsenal 2 – 1 Chelsea…</Text>` — hardcoded.
   - Example bullets with hardcoded outcomes: `<Text>→ +10 exact. Boosted? +20.</Text>` — hardcoded formatting.

5. **Points notation:** The strings `'+10 pts'`, `'+5 pts'`, `'0 pts'`, `'×2 on a match'`, `'Consecutive days'`, `'Resets Sunday UTC'` are all hardcoded. In Turkish, some of these expand:
   - `'+10 puan'` (7 chars vs 7 English)
   - `'+5 puan'` (7 chars vs 6 English)
   - But the plurals and context ("Consecutive days" → "Ardışık günler") need careful localization.

6. **Layout risk:** Turkish strings are typically 20–40% longer than English. The points column has `style={styles.rulePoints}` with fixed padding. When filled with longer Turkish text, there's a risk of truncation or overflow, especially on narrow screens like iPhone SE.

**Bugs/dead ends:**
**Critical i18n failure in scoring guide:** The entire `scoring.tsx` screen is **hardcoded English**. This is a complete localization gap introduced (or not fixed) by the Phase A/B/C audit. The scoring rules are the heart of the app's value proposition, and they must be properly translated and tested for layout robustness in all locales.

---

### Day 18 — Thu 23 Apr: Europa Semi L1, Review CL Predictions, Tier Reveal #2
**What I did:**
Predicted on Europa Semi L1. Reviewed my CL predictions from Days 16–17 (settled now). Should see another tier celebration if points were sufficient.

**What I liked:**
Match detail layout is consistent.

**What I didn't like:**
Nothing new on translation front, but the scoring guide gaps from Day 17 are very clear now.

**Bugs/dead ends:**
None new.

---

### Day 19 — Fri 24 Apr: PL Friday, End-of-Week Peak, Group Leaderboard Close Finish
**What I did:**
Predicted on 4 Friday PL matches. Checked group leaderboard — my ranking is very close to second place. Group feels competitive.

**What I liked:**
Group standings are exciting. The emerald highlight on my row is clear.

**What I didn't like:**
The "YOU" pill is still hardcoded. Also, if this is my last chance to optimize for the week, I'm very aware that the app in Turkish locale has significant i18n gaps in the celebration toasts and scoring guide.

**Bugs/dead ends:**
None new.

---

### Day 20 — Sat 25 Apr: Cycle Finale, Total-Points Review, Profile Deep-Dive, Read Scoring Guide Again
**What I did:**
Predicted on final 3 PL matches of the cycle. Reviewed total points (week: 187 pts, all-time: ~2,400 pts). Opened Profile to check tier badge progress. Re-read the scoring guide carefully to confirm the translation gaps I found on Day 17.

**What I liked:**
The Profile screen displays tier info, best streak, member-since date — all correct and readable in Turkish.

**What I didn't like:**
The scoring guide is still 100% hardcoded English. This is the most glaring issue. The "YOU" pill and "How scoring works" label remain hardcoded. The CelebrationToast "Locked in!" title is also still hardcoded.

**Bugs/dead ends:**
Same three major issues:
1. CelebrationToast "Locked in!" (hardcoded)
2. Settings "How scoring works" label (hardcoded)
3. Group standings "YOU" pill (hardcoded)
4. **CRITICAL:** Entire scoring guide screen (scoring.tsx) is hardcoded English.

---

## Favorite and Least Favorite

### Favorite Day
**Day 12 — Welcome-Back Banner Surprise**
The welcome-back banner fired correctly and showed a calm, emerald-accented summary of my activity while away. The moment felt thoughtful and non-pushy — exactly what the audit intended. However, the moment was marred by hardcoded English strings in the component itself.

### Least Favorite Day
**Day 17 — Scoring Guide Audit Failure**
Opening the scoring guide screen on Day 17 revealed a complete localization failure. The entire screen — header, intro, all six rule cards, and the worked example — is hardcoded English. For a Turkish user trying to understand the app's core scoring logic, this is a serious UX failure. The rules are not hidden behind a settings menu; they're the foundation of the game's contract with the user.

### One Concrete Fix to Ship Tomorrow
**Audit and localize the entire `scoring.tsx` screen.** Create i18n keys for every string:
- `scoring.title` = "Puanlamayı Nasıl Anlayabilirsin?" (or similar)
- `scoring.introTitle`, `scoring.introText`
- `scoring.rules[0].title` = "Tam Skor", etc.
- `scoring.rules[*].description` — full Turkish translations
- `scoring.worked.example` — template-friendly intro
- `scoring.worked.bullets[0]` = "+10 tam skor. Güçlendirildi mi? +20." (with proper punctuation for Turkish)

Test the longest Turkish strings on a 375pt-wide viewport (iPhone SE) to ensure no truncation or overflow.

---

## Round 1 Regression Check

### 1. Silent Celebration Moments
**Status:** Partially closed.
**Reason:** The CelebrationToast component (`components/ui/CelebrationToast.tsx`) now exists and fires correctly on lock-in (I observed "Locked in!" toast on Day 1, Day 2, etc.). However, the title "Locked in!" is hardcoded English, not localized. In Turkish locale, it should be "Kilitlendi!" from i18n. The toast slides in, holds 2.4s, slides out — motion is good. But the English title breaks the Turkish user's immersion.

### 2. No Welcome-Back Summary
**Status:** Closed.
**Reason:** The WelcomeBackBanner component (`components/ui/WelcomeBackBanner.tsx`) fires on Day 12 as expected: after a 24-hour absence, it shows a summary of points earned (+5) or number of predictions settled. However, the banner's copy is hardcoded English (e.g., "points while you were away", "Welcome back", "predictions settled"). The visual treatment (white surface, hairline, emerald accent) is correct per Emerald Minimalism, but i18n is incomplete.

### 3. No Scoring Transparency
**Status:** Still open.
**Reason:** The `app/scoring.tsx` screen was added to provide "How scoring works" transparency. It's reachable from Settings > "How scoring works". However, the entire screen — title, intro, all rules, worked example — is hardcoded English. A Turkish user navigates there expecting transparency, finds an English wall of text. The visual design is correct (Emerald Minimalism), but the localization is a complete failure. This should be marked "Still open" until every string is in the i18n catalog.

### 4. Weak Current-User Highlight in Group Standings
**Status:** Closed.
**Reason:** In `app/group/[id].tsx`, the current user's row is now highlighted with an emerald accent on points, and a clear "YOU" pill appears next to the username. The visual distinction is obvious. However, the "YOU" pill text is hardcoded English. In Turkish, it should be "SEN" (from i18n key `leaderboard.you`). The pill's fixed padding may also risk truncation if a longer Turkish pronoun or label is ever used.

### 5. Pending vs Correct Visual Confusion
**Status:** Closed.
**Reason:** The PredictionPill component in `components/MatchCard.tsx` now uses a neutral visual state for pending predictions (no gradient, no misleading color). Correct predictions render with a clean checkmark, wrong predictions with an X. The states are visually distinct and no longer confusing. I did not observe any visual ambiguity during my 20 days of predictions.

---

## New Findings

- **Hardcoded "Locked in!" title in CelebrationToast.tsx:** The celebration toast for lock-in predictions shows "Locked in!" as a hardcoded English string. Should be i18n key (recommend `celebrations.lockinTitle` = "Kilitlendi!").

- **Hardcoded "How scoring works" label in Settings:** The Settings menu link to the scoring guide displays `label: 'How scoring works'` as a hardcoded English constant. Should be i18n key (recommend `profile.scoringGuideLabel` or `settings.howScoringWorks`).

- **Hardcoded "YOU" pill in group standings:** The current-user indicator in `app/group/[id].tsx` renders `<Text>YOU</Text>` as hardcoded English. Should pull from `t.leaderboard.you` or similar. Turkish: "SEN".

- **Complete hardcoding of scoring guide screen (scoring.tsx):** The entire "How scoring works" screen is hardcoded English:
  - Header title "How scoring works"
  - Intro "Every rule, explained" + paragraph
  - Six rule cards (Exact score, Correct result, Wrong result, Boost, Streak, Weekly leaderboard)
  - All descriptions and points notation
  - Worked example section with template text

  **This is a critical i18n gap.** Scoring rules are not cosmetic; they define the game's core contract. No Turkish-locale user should encounter this wall of English.

- **Hardcoded strings in WelcomeBackBanner.tsx:** The banner component builds strings programmatically but hard-codes English keys:
  - `'+{{pointsEarned}} points while you were away'`
  - `'{{settledCount}} prediction{{plural}} settled'`
  - `'Welcome back'`
  - `'{{hoursAway}}h away · tap to see how it went'`

  All should be template-friendly i18n keys to support plural forms and locale-specific grammar.

- **Layout risk on narrow viewports:** Turkish strings can be 20–40% longer than English. The scoring guide's rule titles and descriptions, when translated to Turkish, may overflow or truncate on iPhone SE (375pt width) or similar small screens. The fixed `rulePoints` column width may also compress adjacent text. Recommend testing Turkish translations on narrow viewports.

- **No i18n keys exist yet for Phase A/B/C additions:** The audit added five new screens / surfaces (CelebrationToast, WelcomeBackBanner, scoring guide, premium rewrite, group standings enhancement). None of these introduced any *new* i18n keys to the `lib/i18n/translations.ts` catalog. All copy is hardcoded English. This suggests the Phase A/B/C "address all findings wisely" pass did not include a localization sweep.

---

## Summary

Mei's 20-day audit reveals a **critical localization failure** in the Emerald Minimalism refresh. The five new surfaces introduced in Phase A/B/C all ship with hardcoded English strings that are not in the i18n catalog:

1. **CelebrationToast** — "Locked in!" title
2. **WelcomeBackBanner** — 5+ hardcoded English templates
3. **Scoring Guide (scoring.tsx)** — entire screen (header, 6 rules, worked example)
4. **Settings menu** — "How scoring works" label
5. **Group Standings** — "YOU" pill

Turkish-locale users will encounter English text in critical UX surfaces. The scoring guide is especially egregious — it's the primary source of transparency into the game's rules, and it's completely in English. Additionally, Turkish's longer strings (20–40% more text) pose layout risks on narrow viewports that are not yet addressed.

**Recommendation:** Conduct a full i18n sweep of all Phase A/B/C additions. Create translation keys for every hardcoded string, provide Turkish translations, test on narrow viewports (iPhone SE, 375pt width), and verify plural handling and grammar conjugations are correct for Turkish.

---

**End of Mei's Diary**
*Turkish localization audit complete. Five major hardcoding issues identified. One critical (scoring guide). Recommend Phase C.1 localization pass before Round 2 release.*
