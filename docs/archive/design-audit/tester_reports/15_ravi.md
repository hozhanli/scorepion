# Ravi — 20-Day End-User Simulation Diary (Round 2)

**Persona:** Small-screen user, 28, iPhone SE 2020 (4.7", 375×667 logical). Tests every screen for truncation, overflow, safe-area handling, and tight viewport behavior.
**Dates:** Monday, Apr 6 → Saturday, Apr 25, 2026
**App state:** Fresh install on Day 1, post-Phase A/B/C fix deployment.

---

## Day 1 · Mon, Apr 6

**What I did:**
Installed on my iPhone SE. Went through auth and onboarding carousel. Created account, picked username "RaviWins". Landed on Home. Made first prediction on Arsenal vs Fulham (2-1 to Arsenal), locked it in.

**What I liked:**
The onboarding screens fit the viewport cleanly. No text overflow, no horizontal scroll surprises. The prediction screen's score steppers (home/away columns) fit side-by-side at 375pt with breathing room. The "Lock in" button is a full-width emerald fill at the bottom (accounting for safe-area-bottom). When I locked in, a green toast slid in from the top with a checkmark, "Locked in! 2 – 1 for Arsenal". The toast respects safe-area-top — it doesn't hide under the notch.

**What I didn't like:**
The onboarding carousel text is small (14pt) and I had to lean in slightly to read it. The title "Welcome to Scorepion" is 28pt but feels slightly cramped at 375pt with gutter padding. Workable, but on a 4.7" screen, tighter leading would help.

**Bugs or dead ends:**
The CelebrationToast is centered and has `maxWidth: 420`, but at 375pt my available width is 375 - 16*2 (outer gutter) = 343pt. The toast's maxWidth is fine (it'll be 343pt after padding). No truncation on the toast text "Locked in! 2 – 1 for Arsenal" — `numberOfLines={1}` prevents overflow.

---

## Day 2 · Tue, Apr 7

**What I did:**
Checked predictions from Day 1 (still pending). Made two more predictions on Champions League quarter-final legs (Arsenal–Real Madrid, Bayern–Inter). Boosted the Bayern match. Checked the Leaderboard for the first time.

**What I liked:**
The match cards fit the 375pt viewport well. Two-column layout (team name + result input) compresses nicely without overflow. The boost flame icon is tappable and clearly lit up when engaged. Prediction pills at the bottom of each card say "Locked 2–1" in a neutral gray — no text overflow.

**What I didn't like:**
On the Leaderboard screen, the "See all" links are right-aligned, which sometimes crowd the edge of the 375pt screen. The stat labels (e.g., "STREAK", "TIER") in a micro font (11pt) are readable but tiny on a 4.7" screen. I had to focus to read them. The leaderboard rows have a lot of packed data (rank badge, avatar, name, tier icon, points, streak) and on 375pt, I notice the rank badge and avatar are left-aligned, then there's a flex-1 name column, then points on the right. The points value is right-aligned and barely has padding from the edge.

**Bugs or dead ends:**
None critical, but the right-aligned points value on 375pt is just 6-8pt from the edge of the screen. Safe, but tight.

---

## Day 3 · Wed, Apr 8

**What I did:**
Checked settled predictions from Day 1 (exact match — 2-1). Arsenal pill flipped to emerald with a star and "Exact +10". Made three more predictions on PSG–Aston Villa and Barcelona–Dortmund. Joined a group called "Work Mates Predictions".

**What I liked:**
The exact-match pill is rendered with clear emerald background and a star icon. No truncation. The group join flow — typing the six-digit code on the input screen — works on 375pt without keyboard layout shifting. The group detail page loaded and showed me the group header (group name + member count) and then the leaderboard below.

**What I didn't like:**
The group header card is wide (full-width minus gutters), and the group name ("Work Mates Predictions") is 20pt bold. At 375pt, with 20pt padding on each side, the name has ~335pt to flex in. The name fits, but if the group name were longer (e.g., "Predictions & Betting Strategy Group"), it would wrap or truncate. I don't see a `numberOfLines` prop on the group name text. This is a potential truncation risk.

**Bugs or dead ends:**
Possible: Group name in `app/group/[id].tsx` hero section might truncate on very long names without explicit `numberOfLines`.

---

## Day 4 · Thu, Apr 9

**What I did:**
Made one Europa League prediction (missed it). Watched it settle in real-time. Streak broke (dropped from 2 to 0). Checked home screen for welcome-back messaging (didn't expect it on a miss).

**What I liked:**
The miss-state pill is visually quiet (gray with a close-circle icon) and doesn't feel punitive. The pill text "No points" is short and fits easily on 375pt.

**What I didn't like:**
Nothing specific to small-screen rendering on this day.

**Bugs or dead ends:**
None.

---

## Day 5 · Fri, Apr 10

**What I did:**
Returned after yesterday's miss. Opened Home. Saw a welcome-back banner at the top showing "+5 points while you were away · 1 day away · tap to see how it went". Made three Premier League predictions.

**What I liked:**
The WelcomeBackBanner layout is solid on 375pt. It's a flexbox row: icon well (36×36), then a flex-1 text column, then a close button. The text column has a title (13pt, numberOfLines={1}) and subtitle (11pt, numberOfLines={1}). At 375pt with 20pt outer gutter + 14pt banner padding on each side, the banner has ~306pt for content. The icon well is 36pt, gap is 12pt, close button is 28pt, so the text column gets ~306 - 36 - 12 - 28 - 12 = 218pt. That's enough for the title "+5 points while you were away" (about 40 chars at 13pt) to fit on one line if set properly. The subtitle "1 day away · tap to see how it went" is ~38 chars, which at 11pt also fits on one line. No truncation observed.

**What I didn't like:**
The close button (28×28 with hit area of 44×44) is tight against the right edge of the 375pt screen (only ~6pt padding from the screen edge after the gutter). On a 4.7" screen with imprecise fingers, tapping the close X requires precision. The hitSlop={10} helps, but the visual padding is minimal. A slightly larger right-gutter or smaller close button would feel safer.

**Bugs or dead ends:**
None critical. The banner respects safe-area and slides in smoothly.

---

## Day 6 · Sat, Apr 11

**What I did:**
Premier League Saturday explosion. Made 7 predictions across big matches. Boosted two. Two predictions were exact matches. Checked Profile page showing tier icon, XP bar, and all-time points.

**What I liked:**
The daily match pack (7 cards in a list) scrolls cleanly on 375pt. Each card is full-width minus gutters and has left-aligned team names, centered score display, right-aligned status pill. The spacing is consistent (12pt gaps between cards). The Profile page shows a hero card (tier badge + XP bar) and stat rows below. The stat rows (correct/total, accuracy %, all-time points) are left-aligned with right-aligned values. No horizontal scroll. The XP ProgressBar animates smoothly and doesn't exceed the card width.

**What I didn't like:**
The tier badge on the Profile hero card is displayed at 60×60pt, which is fine. But if the tier name is long (e.g., "Platinum Champion"), it might overflow below the badge. I see the badge is centered and the tier name is set in 14pt below it. At 375pt, that's fine for English. But in translation (e.g., German "Platin Meister"), longer strings could wrap or truncate.

**Bugs or dead ends:**
None critical for English, but internationalization (Mei — persona #20) will stress-test this.

---

## Day 7 · Sun, Apr 12

**What I did:**
LaLiga and Premier League Sunday. Made 5 more predictions. Checked Leaderboard (climbed to rank #12). Checked group standings and saw myself highlighted in emerald with a "YOU" pill next to my name.

**What I liked:**
The group standings row is the critical test for 375pt. Each MemberStandingRow is a flexbox with: youRail (4pt, absolute-positioned on the left if isCurrentUser), then rank badge (28×28), avatar (38×38), a flex-1 infoCol, and pointsCol. Let me compute: at 375pt with 14pt padding on each side of the row, the row has ~347pt. Subtract: 4pt youRail + 12pt gap + 28pt rank + 12pt gap + 38pt avatar + 12pt gap + pointsCol = ~106pt fixed. That leaves ~241pt for the infoCol. The infoCol has a nameRow (flex-row with username + "YOU" pill) and a stats line. The "YOU" pill is small (backgroundColor=emerald, paddingHorizontal=6, paddingVertical=2, fontSize=9), so it's maybe 25pt wide. The username text is 14pt bold with `numberOfLines={1}`. At 241pt, the username has ~210pt to play with after the pill and gap. That's plenty. The username "RaviWins" (9 chars at 14pt) fits easily. No truncation.

The points column on the right is right-aligned with value (18pt bold for current-user) and "pts" label below. It's compact and fits.

**What I didn't like:**
Nothing specific to small-screen rendering. The "YOU" rail and pill make the current-user row unmistakable.

**Bugs or dead ends:**
None. The MemberStandingRow handles 375pt well.

---

## Day 8 · Mon, Apr 13

**What I did:**
CL quarter-final replay day. Made predictions on Real Madrid–Arsenal and Inter–Bayern. Revisited the "How scoring works" page from Settings.

**What I liked:**
The scoring guide page (`app/scoring.tsx`) is pure EM — white cards on a light canvas, emerald accents. On 375pt, each rule card is full-width minus 20pt gutters. The cards have a title (16pt, "Exact Score"), a rule description (15pt body), and a point value in emerald. There's a worked example card at the bottom that shows "You predict Arsenal 2–1 Chelsea. If it finishes 2–1, that's +10." At 375pt, this text doesn't wrap awkwardly. No horizontal scroll. The page is responsive and calm.

**What I didn't like:**
The ScreenHeader (H1 title "How Scoring Works") is 28pt. At 375pt with 20pt gutters, the title has ~335pt to flex in. The title is two words, so no risk of truncation. But if this were a longer title (e.g., "How Scoring & Streaks Work"), it might wrap to two lines. I don't see explicit `numberOfLines` limiting, so it would wrap naturally. On 375pt, that's acceptable, but it's worth noting.

**Bugs or dead ends:**
None critical.

---

## Day 9 · Tue, Apr 14

**What I did:**
CL quarter-final leg 2 results. Of my four CL predictions, two were correct results. Streak back to 2. Made three new PL predictions.

**What I liked:**
No special small-screen issues on this day. The predictions flow smoothly.

**What I didn't like:**
None specific to viewport.

**Bugs or dead ends:**
None.

---

## Day 10 · Wed, Apr 15

**What I did:**
Europa Quarter-final and Conference League. Made 5 predictions. One was an exact match. Checked Profile stats.

**What I liked:**
The Profile stat chips (correct/total, accuracy, all-time points) are laid out as separate cards, each full-width minus gutters. No horizontal scroll. The stat values (e.g., "12 correct / 19 total") are rendered as 20pt bold, which is readable on 375pt.

**What I didn't like:**
None specific to small-screen rendering.

**Bugs or dead ends:**
None.

---

## Day 11 · Thu, Apr 16

**What I did:**
Skipped.

---

## Day 12 · Fri, Apr 17

**What I did:**
Opened after 1-day gap. Welcome-back banner appeared at the top showing "+4 points while you were away · 1 day away". Dismissed it. Made 3 Bundesliga Friday predictions.

**What I liked:**
The banner rendered exactly as on Day 5 — no truncation, no overflow. The animation (FadeInDown) slides smoothly on 375pt. The close button is tight against the right edge (minimal padding), but tappable with hitSlop={10}.

**What I didn't like:**
Same as Day 5: the close button is visually tight. On a 4.7" phone with a slightly sweaty thumb, I'd want a bit more padding to avoid mis-taps.

**Bugs or dead ends:**
None.

---

## Day 13 · Sat, Apr 18

**What I did:**
Massive Saturday. 5 Premier League matches, 6 predictions, one boosted. Climbed to rank #9. Checked group standings (still clearly marked as "YOU").

**What I liked:**
The match card density at 375pt is manageable. Cards are white with hairline borders, spaced 12pt apart vertically. Each card fits full-width without horizontal scroll. The prediction score input (home/away steppers side-by-side) compresses but doesn't overflow. The boost flame icon is tappable. The group standings row on this big day still renders perfectly — no truncation on the username ("RaviWins"), no overflow on the "YOU" pill, no crushing of the points column.

**What I didn't like:**
On a very dense day like Saturday, the match card list gets tall (6+ cards = 600+ pt of scrolling). The daily pack on 375pt doesn't have a "collapse sections by league" feature, so I'm scrolling a long list. Not a bug, but a UX note: a league-filter chip row at the top (Matches tab already has this) would help on small screens.

**Bugs or dead ends:**
None critical.

---

## Day 14 · Sun, Apr 19

**What I do:**
PL + Serie A Sunday. Made 4 predictions. Streak now 4 (predicted Days 12–14, 15 should be tomorrow... wait, Day 15 is Monday, so streak is: Day 5, Day 6, Day 7, Day 8, Day 9, Day 10, [Day 11 skipped], Day 12, Day 13, Day 14 = 9 consecutive. Recount: I opened Day 12 after skipping Day 11, so the streak broke at Day 11. New streak starts at Day 12. Days 12, 13, 14 = 3-day streak). Checked Profile XP bar (visibly fuller, not at 100% yet).

**What I liked:**
The XP ProgressBar on the Profile animates smoothly. The bar is full-width minus 20pt gutters (~335pt), and the animation is fluid on 375pt. The XP value above the bar (e.g., "245 / 300 XP") is centered and uses `numberOfLines={1}` to prevent wrap. No overflow.

**What I didn't like:**
None specific to small-screen rendering.

**Bugs or dead ends:**
None.

---

## Day 15 · Mon, Apr 20

**What I did:**
Profile review day. Spent time reading stats. Made 2 predictions for a Monday fixture.

**What I liked:**
The Profile page layout is solid on 375pt. The hero card (tier + XP bar) is centered and full-width. The stat rows below (correct/total, accuracy, points) are full-width cards stacked vertically. No horizontal scroll. Typography is consistent: stat values are 18–20pt bold, labels are 12pt tertiary. All readable on 375pt.

**What I didn't like:**
If the user's tier level name is very long (e.g., translated to German "Platin Champion"), the tier badge section might need to wrap the text. But for English "Tier 1", it's fine.

**Bugs or dead ends:**
None critical.

---

## Day 16 · Tue, Apr 21

**What I did:**
CL Semi-final draw — Arsenal vs PSG, Bayern vs Dortmund. Made 2 boosted predictions.

**What I liked:**
The match card for the semi-finals displays team names, match time, and the boost flame icon. No truncation on 375pt. The team names (e.g., "Arsenal", "PSG") are 16pt and fit easily in the left-aligned column.

**What I didn't like:**
None specific to small-screen rendering.

**Bugs or dead ends:**
None.

---

## Day 17 · Wed, Apr 22

**What I did:**
CL Semi-finals play out. Both predictions settled (one correct +5, one miss). Climbed to rank #2 in group. Checked group standings.

**What I liked:**
The MemberStandingRow for my current-user row is unmistakable at rank #2. The youRail (emerald left bar), the "YOU" pill, and the pointed-up pointsValue (18pt, emerald-colored) make it crystal clear. On 375pt, all these elements fit without crushing or truncation.

**What I didn't like:**
None specific to small-screen rendering.

**Bugs or dead ends:**
None.

---

## Day 18 · Thu, Apr 23

**What I did:**
Europa Semi-final matches. Made 3 predictions, one exact match. Streak at 6. Visited group detail page.

**What I liked:**
The group standings are consistent. The MemberStandingRow for my row (still rank #2) renders perfectly on 375pt. The row has a 2px emerald border (due to `borderWidth: 2` when `isCurrentUser`), paddingLeft adjusted to 18 to compensate for the youRail (4pt) + visual gap. The points value is still right-aligned and legible.

**What I didn't like:**
None specific to small-screen rendering.

**Bugs or dead ends:**
None.

---

## Day 19 · Fri, Apr 24

**What I did:**
PL Friday night. 4 predictions, one boosted, one exact match. Streak 7. Checked leaderboard rank (back to #8 all-time).

**What I liked:**
The match cards stack predictably on 375pt. The prediction pills at the bottom of each card ("Locked 2–1", "Exact +10", "No points") all fit on one line with `numberOfLines={1}` and no truncation.

**What I didn't like:**
None specific to small-screen rendering.

**Bugs or dead ends:**
None.

---

## Day 20 · Sat, Apr 25

**What I did:**
Final day. Massive PL Saturday, 5 matches, 5 predictions, 2 boosted. Checked Profile (XP bar should be full, waiting for tier-up). Checked Leaderboard final time (rank #8). Checked group standings final time (rank #2). Read the scoring guide one more time.

**What I liked:**
The entire app at 375pt is responsive and consistent. The CelebrationToast (from Day 1) respects safe-area-top and centers itself. The WelcomeBackBanner (Days 5, 12) respects safe-area and uses proper gutter padding. The match cards scale smoothly. The group standings row (current-user "YOU" row) is unmistakable and never truncates or overflows. The Profile page is clean and readable. The scoring guide is well-formatted and doesn't overflow.

**What I didn't like:**
The CelebrationToast has `maxWidth: 420` and on 375pt, it'll shrink to ~343pt (375 - 16*2 gutters). The toast text "Locked in! 2 – 1 for Arsenal" fits on one line with `numberOfLines={1}`. But if the subtitle were very long (e.g., "Bayern Munich vs Inter Milan, Champions League Quarter-final"), it might be tight. The toast's two-line layout (title + optional subtitle) is compact, but I'd have tested with longer copy.

**Bugs or dead ends:**
None critical, but the CelebrationToast should be tested with longer celebration text (e.g., "Tier promotion!" or "Week challenge complete!") to ensure it doesn't truncate on 375pt with safe-area-top adjustments.

---

## Favorite and Least Favorite

**Favorite day:** Day 7 (Sun, Apr 12).
The group standings row for my current-user row is unmistakable. The emerald left rail, the "YOU" pill, the highlighted avatar with a 2px border, and the points value in emerald make it impossible to miss myself in the group. On a 375pt screen with tight space, this is the canonical example of "weak current-user highlight" being fixed. No ambiguity, no scanning required.

**Least favorite day:** Day 5 (Fri, Apr 10).
The WelcomeBackBanner's close button is visually tight against the right edge of the 375pt screen. The button is 28×28 with a 44×44 hit area (via hitSlop={10}), but visually it's only ~6pt from the screen edge after the gutter. On a 4.7" phone with imprecise fingers or in landscape mode, tapping the close X is a bit risky. A slightly larger right-gutter (e.g., 24pt instead of 20pt, or a smaller close icon) would feel safer.

**One concrete fix to ship tomorrow:**
Increase the right-gutter padding on the WelcomeBackBanner (or reduce the close button size) to give more visual padding between the close button and the screen edge on 375pt viewports. Change `paddingHorizontal: 20` on the `wrap` style to `paddingHorizontal: 24`, or reduce the close button size from 28×28 to 24×24. This prevents mis-taps on small screens without sacrificing the banner's visual balance.

---

## Round 1 Regression Check

### 1. Silent celebration moments
**Status: Partially closed.**
The `CelebrationToast` component exists and fires on Day 1's first lock-in with a perfect spring-fade, icon well, and glow. The toast respects safe-area-top and centers itself at 375pt without truncation. However, it does not fire on subsequent predictions, settles, tier-ups, or milestones. The implementation is solid (safe-area handling, numberOfLines truncation guards, responsive width clamping), but the wiring is incomplete. **Reason:** On 375pt, the toast renders perfectly; the issue is behavioral (dormant beyond Day 1), not layout.

### 2. No welcome-back summary
**Status: Closed.**
`WelcomeBackBanner.tsx` works perfectly on 375pt. The layout (icon well, flex-1 text column, close button) compresses cleanly. The title and subtitle use `numberOfLines={1}` to prevent wrap. The close button's hit area is 44×44 (hitSlop={10}) but the visual padding from the screen edge is tight (~6pt). This is safe but could be improved with slightly larger gutters on small screens.

### 3. No scoring transparency
**Status: Closed.**
`app/scoring.tsx` is discoverable from Settings and renders cleanly on 375pt. No horizontal scroll, no text overflow. The rule cards stack vertically, each full-width minus gutters. The typography is consistent and readable. The worked example is clear.

### 4. Weak current-user highlight in group standings
**Status: Closed.**
`MemberStandingRow` applies `isCurrentUser && styles.rowHighlight` with a youRail (4pt emerald bar on the left), a "YOU" pill next to the username, a 2px emerald border, and highlighted points value (18pt). On 375pt, none of these overflow or truncate. The row layout is flex-based and compresses cleanly. The current-user row is unmistakable.

### 5. Pending vs correct visual confusion
**Status: Closed.**
`PredictionPill` renders four outcomes with distinct colors and icons:
- **pending:** gray + lock icon
- **exact:** emerald + star icon
- **correct:** emerald + checkmark icon
- **miss:** gray + close icon

All pill text ("Locked 2–1", "Exact +10", "Correct +5", "No points") is set with `numberOfLines={1}` and fits on one line on 375pt. No truncation, no confusion.

---

## New Findings

- **CelebrationToast safe-area handling is correct, but width-clamping should be tested with longer copy:** The toast has `minWidth: 240` and `maxWidth: 420`. At 375pt with 16pt side padding, the available width is 343pt. The toast will be 343pt wide, which is fine. But if the celebration title or subtitle is very long (e.g., "Tier promotion to Platinum Champion!"), the text might truncate or wrap despite `numberOfLines={1}`. This should be tested with longer i18n strings (see persona #20, Mei).

- **WelcomeBackBanner close button is visually tight on 375pt:** The button is 28×28 with a 44×44 hit area, positioned at the right edge with 20pt gutter. The visual padding between the button and the screen edge is minimal (~6pt). On a 4.7" phone, this is acceptable but could be improved. Recommendation: increase right-gutter to 24pt or reduce close button to 24×24.

- **MemberStandingRow with "YOU" pill and youRail is robustly responsive on 375pt:** The row layout (youRail + rank + avatar + flex-1 infoCol + pointsCol) compresses cleanly. The "YOU" pill (6pt paddingHorizontal, 9pt fontSize) is small enough to fit next to any reasonable username. The pointsCol (right-aligned, 18pt for current-user) fits without squeezing. No regressions observed.

- **ScreenHeader H1 titles should use numberOfLines={1} to prevent wrap on 375pt:** Titles like "How Scoring Works" (two words) fit, but longer titles could wrap awkwardly. The ScreenHeader component doesn't enforce numberOfLines, so multi-line titles wrap naturally. On 375pt, this is acceptable (title can be 2 lines), but for consistency, consider adding a numberOfLines limit or a max-font-size clamp.

- **Leaderboard right-aligned values are tight against the edge on 375pt:** The points value on leaderboard rows is right-aligned with ~6–8pt padding from the edge. Safe but tight. Consider adding a bit more right-padding (e.g., 16pt instead of 12pt) for visual breathing room on small screens.

- **Match card density on high-volume days (Saturdays, Sundays) is manageable but benefit from league-filters:** On Day 13 (5 matches) and Day 20 (5 matches), the match card list is tall and requires scrolling. The Matches tab has a league-filter chip row, but the Home daily pack doesn't. On 375pt with a long scroll, league filters would be helpful. (Not a bug, just a UX note.)

- **Boost flame icon is consistently tappable across all card types:** The boost icon (18–22pt) is part of the card and has a PressableScale wrapper with a hit area of ≥44pt. No issues observed on 375pt.

- **Safe-area handling is consistent across all components:** The CelebrationToast uses `useSafeAreaInsets()` and respects top insets. The WelcomeBackBanner doesn't explicitly use safe-area (but sits below the CelebrationToast, so no conflict). The match card list and group standings use standard padding, no safe-area conflicts. No regressions observed.
