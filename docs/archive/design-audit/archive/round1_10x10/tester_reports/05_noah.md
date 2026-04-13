# Noah — 10-day diary (group organizer)

27 years old, runs a 20-member prediction group. Cares about: group hero readability, invite/share flow, standings at scale, and whether friends stick around.

---

## Day 1 — Mon, Apr 6 | "Let me set this up"

**What I did:**
- Install Scorepion, run onboarding (pick favorite leagues)
- Navigate to Groups tab (groups.tsx, line 248–250)
- Tap the + button to create a group (groups.tsx, line 252–262)
- Modal opens with group name input, league picker, visibility toggles
- Enter "Champions League 2024" + select UCL + set Public (groups.tsx, line 345–450)
- Tap "Create a group" button — confirm (groups.tsx, line 437–446)
- Group created with auto-generated invite code (AppContext.tsx, line 266–280)
- Router navigates to group detail (group/[id].tsx)

**What I liked:**
- Create modal is clean: single name input (54px height standard, groups.tsx line 632), scrollable league chips (groups.tsx line 364–391), visibility toggle pair (groups.tsx line 394–423)
- Button states clear: "Create" button disabled until name + leagues selected (groups.tsx line 440)
- Hero card shows group name, tier badge (rookie, since memberCount=1), invite code chip (group/[id].tsx, line 356–404)
- Day-zero banner is inviting: "Your group needs more players" with progress bar (3/1 members, group/[id].tsx line 408–452)

**Didn't like:**
- Invite code display is truncated at 12 chars (group/[id].tsx, line 400: `code.substring(0, 12)`). Full code would be better in Share payload
- No toast confirmation after group creation — just silent nav to detail
- Quick action strip (4 pills: Invite, Chat, Share, More) feels redundant with the Day-zero banner buttons below it (group/[id].tsx line 456–494)

**Group social signals:**
- Day-zero state is lonely but clear: "You're the only player" empty state (group/[id].tsx, line 505–510)
- No activity feed yet, challenges locked (group/[id].tsx, line 609–622)
- Tier badge shows "ROOKIE" (tier = 'rookie' for memberCount < 3, group/[id].tsx line 75–80)

**Bugs:**
- None identified in creation flow

---

## Day 2 — Tue, Apr 7 | "Sent a link, now watch"

**What I did:**
- Go back to Groups tab, tap group card (groups.tsx, line 150–163)
- Tap "Invite" button in quick action strip (group/[id].tsx, line 458–465)
- Share sheet opens with message: `Join my Scorepion group "Champions League 2024"! Use invite code: ABCD1234` (group/[id].tsx, line 275–279)
- Text copy includes code — send to 3 friends via WhatsApp

**What I liked:**
- Share button copy is natural: "Join my Scorepion group" + code is clear
- Three share paths: (1) native Share, (2) Copy Code button (also in hero), (3) Menu → Copy Invite Code (group/[id].tsx, line 290–295)
- Code chip in hero is tappable (group/[id].tsx, line 393–403)

**Didn't like:**
- Share message doesn't include a deeplink or app store URL — friends need to have Scorepion installed first
- No visual confirmation after sharing (no toast, no counter update)
- If first friend opens the link without the app, they'll be confused

**Group social signals:**
- Still showing memberCount = 1 locally (AppContext.tsx doesn't sync joins in real-time)
- Standings list shows "You're the only player" (group/[id].tsx, line 505–510)

**Bugs:**
- None identified in share flow

---

## Day 3 — Wed, Apr 8 | "First friends join!"

**What I did:**
- Jump to Groups → My Groups, expecting to see updated member count
- Tap into group detail again

**What I liked:**
- Group card shows updated memberCount (3 by now, if friends joined)
- Standings now shows 3 members (group/[id].tsx, line 513–521)
- Day-zero banner is gone (isSmallGroup = false when memberCount >= 3, group/[id].tsx line 408)
- Challenges section unlocks with 3 cards: "Predict all matches this weekend" (50 xp), "Beat the group leader" (100 xp), "7-day streak" (80 xp) (group/[id].tsx, line 624–628)
- Current user row in standings is highlighted with emerald tint (group/[id].tsx, line 143, standingStyles.rowHighlight)

**Didn't like:**
- Standings row height: at 20 members, scrolling through a list of uniform 60px rows gets slow (group/[id].tsx, line 132–167)
- Username column has no truncation hint — long names will break the layout (group/[id].tsx, line 153: `numberOfLines={1}` is set, but no text-overflow ellipsis in style)
- Current user row text says "(You)" appended — easy to spot but not bold (group/[id].tsx, line 154)
- No rank/tier badges on member rows, only rank number (group/[id].tsx, line 144–147)

**Group social signals:**
- Tier badge upgraded to "BRONZE" (memberCount 3, group/[id].tsx line 75–80)
- Weekly highlight section shows "This week's top performer" with group leader (group/[id].tsx, line 526–564)
- Activity feed is empty or just shows "joined" events (group/[id].tsx, line 572–601)

**Bugs:**
- standingStyles.rowHighlight is applied but may not have enough contrast with surface[1] background to stand out (need to check color values in constants/colors.ts, but visually the highlight should be tested)

---

## Day 4 — Thu, Apr 9 | "First round of predictions"

**What I did:**
- Friends start making predictions on Day 1 & 2 matches
- Jump to group detail, watch standings change
- Tap into a standing row (but there's no action for it)

**What I liked:**
- Activity feed now shows "prediction" and "streak" events (group/[id].tsx, line 88–128)
- Weekly highlight updates: "This week's top performer" card shows the leader and pts gap (group/[id].tsx, line 536–553)
- Relative time ("2h ago", "just now") on feed items (group/[id].tsx, line 124)

**Didn't like:**
- Activity feed is capped at 5 items (group/[id].tsx, line 248: `.slice(0, 5)`) — no "Load more" or pagination
- No way to see detailed stats for a specific member without tapping back to public Leaderboard
- Member standing rows are not tappable (group/[id].tsx, line 132–167) — missed opportunity to see their recent predictions
- "Streak" icon is a flame (group/[id].tsx, line 102) but no visual indicator of streak count in the row itself

**Group social signals:**
- Activity feed is the "proof of life" for the group — 5 items is bare minimum
- Feed shows names + avatars, making it feel social, but no @mentions or group chat

**Bugs:**
- None identified

---

## Day 5 — Fri, Apr 10 | "Weekend hype"

**What I did:**
- Check group standings before weekend (Friday evening)
- Friend who was 5th is now 3rd (boosted a big match)
- See the "Predict all matches this weekend" challenge at 0% progress

**What I liked:**
- Challenge cards show progress bar with xp reward (group/[id].tsx, line 171–199)
- Challenges lock dynamically based on group size (group/[id].tsx, line 609–622)
- Progress bar uses emerald color consistently (group/[id].tsx, line 187–191)

**Didn't like:**
- Challenges are read-only display cards — no tap-through to see completion criteria or claim rewards
- No in-group messaging or "Group of the week" highlights
- Weekend matches aren't surfaced on the group screen — have to navigate back to Matches tab

**Group social signals:**
- Standings churn is visible and exciting
- Tier badge still "BRONZE" (staying at 3 members)

**Bugs:**
- None identified

---

## Day 6 — Sat, Apr 11 | "Peak Saturday"

**What I did:**
- Saturday morning, jump to group to see who's predicted for Chelsea–Ipswich
- Scroll through standings (now at 20 members total — end-state test)
- Tap "Weekly highlight" card to see the leader

**What I liked:**
- Standings list smoothly shows all 20 members with rank, name, correct/total, points
- Leader is easy to spot (rank 1 at top, heroic mention in weekly highlight)
- Color consistency: emerald tier badges, neutral avatars (surface[2] bg), white cards with hairline borders

**Didn't like:**
- 20-row standing list on mobile is tedious: each row is ~60px, so 1200px of scroll for just standings
- No "sort by streak" or "sort by accuracy" toggles — always sorted by points (group/[id].tsx, line 513)
- Current user row highlight isn't bold/strong enough to distinguish at row 15 of 20 (standingStyles.rowHighlight needs stronger contrast)
- Tap on a standing row does nothing — no way to see that user's recent group predictions without exiting

**Group social signals:**
- Standings are the main social proof — 20 names, 20 point gaps, very competitive
- But the row design is exhausting at this scale

**Bugs:**
- Current user highlight (standingStyles.rowHighlight) may be too subtle; compare surface colors in constants/colors.ts

---

## Day 7 — Sun, Apr 12 | "Weekend finale"

**What I did:**
- Sunday evening, check final standings before weekly reset
- Friend jumped to 1st, now I'm 5th (boosted 2 weekend matches)
- Scroll down to see the "Resets in" timer on weekly highlight

**What I liked:**
- "This week's top performer" card shows countdown to reset (group/[id].tsx, line 556–561)
- Timer updates every minute (group/[id].tsx, line 261–270)
- Visual: "Resets in 1 day 4h 32m" is clear

**Didn't like:**
- No "Weekly winner" badge or historic record of past weekly winners (group/[id].tsx, line 48 defines type 'weekly_winner' but no persistent hall of fame)
- No notification when standings change or someone overtakes me
- Challenges section is still static — no way to know if anyone's close to completing them

**Group social signals:**
- Activity feed is the only sign that friends are still active
- High churn in standings is the main engagement signal

**Bugs:**
- None identified

---

## Day 8 — Mon, Apr 13 | "Revisit & settle"

**What I did:**
- Check group standings after weekly reset
- Scroll up to hero card to see tier badge (should still be BRONZE at 20 members)
- Notice that weekend challenges have been replaced with new Monday challenges

**What I liked:**
- Tier badge updates dynamically based on memberCount (group/[id].tsx, line 75–80)
- Challenge set refreshes (group/[id].tsx, line 624–628 — implied daily/weekly rotation)
- Points reset, challenge progress resets (clean weekly slate)

**Didn't like:**
- No "Weekly recap" screen showing final standings, top achievers, or highlights
- No email/notification that weekly ended (just silent reset)
- Challenges with high xp (100 for "Beat the leader") are never claimed or visible in any inventory

**Group social signals:**
- Activity feed starts fresh, clean slate
- Standings are level again (everyone at 0 for the week)

**Bugs:**
- None identified

---

## Day 9 — Tue, Apr 14 | "The achievement moment"

**What I did:**
- Mid-week, a friend hits 7-day prediction streak (challenge: "7-day streak" @ 80 xp)
- Check activity feed — should show "achievement" event
- Scroll to the achievement card, see their name highlighted

**What I liked:**
- Activity feed shows achievement as a type (group/[id].tsx, line 48: `'achievement'`)
- Icon is a ribbon (group/[id].tsx, line 99: `item.type === 'achievement' ? 'ribbon'`)
- Feed row is visually distinct: username + "earned achievement" + detail with xp
- Time is relative ("3h ago")

**Didn't like:**
- Achievement is only shown in the feed — no separate "Achievements unlocked" badge or celebration animation
- No "Share achievement" button (missed viral moment: friend wants to screenshot and post to their story)
- Challenges are not cumulative across weeks — if you miss Week 1, Week 2 challenges are independent (no "legendary streaks" that carry over)

**Group social signals:**
- Achievement in feed is the main social signal
- Celebrating individual milestones is good, but no group-level celebration (e.g., "Group reached 500 points this week!")

**Bugs:**
- None identified

---

## Day 10 — Wed, Apr 15 | "End of cycle"

**What I did:**
- Final day of mock scenario
- Tap into group, review final standings (20 members, various points)
- Scroll to footer to check "Leave group" behavior

**What I liked:**
- Footer has invite code display + Leave button (group/[id].tsx, line 645–657)
- Leave button is visually distinct (tertiary, destructive red text)
- Confirmation alert before leaving: "Are you sure you want to leave?" (group/[id].tsx, line 647)
- Haptic feedback on leave tap

**Didn't like:**
- No "Group summary" export or screenshot before leaving
- No option to archive or "pause" a group (only leave or stay)
- Menu at top (More button, group/[id].tsx line 288–296) has a "Leave group" option that shows a different alert: `Alert.alert('Leave group', 'Are you sure?')` vs. footer's `'Are you sure you want to leave?'` — text inconsistency (group/[id].tsx, line 293 vs. line 647)
- If I accidentally leave, no "Rejoin" option without the code

**Group social signals:**
- Standings are final: 20 members, all visible, leaderboard set
- No "Archive group" or "Season recap" screen
- Group is fully functional but no retention moment at the end (e.g., "Play again next week!", "Save group summary")

**Bugs:**
- Line 293: `Alert.alert('Leave group', 'Are you sure?')` is incomplete — should call the same confirm flow as footer (line 647–650)

---

## Favorite day: **Day 6 (Saturday)**

The group is at full scale (20 members), standings are chaotic and exciting, and the sense of competition is peak. The weekend challenge is visible, the weekly highlight is live, and everyone's grinding. The UI handles the scale well — no crashes, list is performant, and the emerald design language feels cohesive.

---

## Least favorite day: **Day 3 (Wednesday)**

The transition from "just me" to "day zero with 3 friends" feels abrupt. The day-zero banner locks challenges and reminds me the group is small, but then the UI also highlights that the challenges are now *available* — cognitive dissonance. Also, the Quick Action strip (4 pills) overlaps with the banner buttons, so there are 4 ways to share in a 200px section.

---

## One concrete fix to ship tomorrow

**Differentiate the current-user standing row more strongly.**

Reading code at `group/[id].tsx` lines 143–144 and `standingStyles.rowHighlight`, the current-user row gets an emerald-tint background, but when Noah has 20 friends in the group and is scrolled to the middle (row 10–15), the highlight fades into the visual noise.

**Ship:** Add a bold left border (4px emerald) + slightly increase the background opacity (from current subtle tint to 15% opacity) on `standingStyles.rowHighlight`. Also, pin the current-user row to the top of the list or add a "Jump to me" button at the bottom of the standings.

---

## Bugs & dead ends summary

| Issue | File:Line | Severity | Notes |
|-------|-----------|----------|-------|
| Leave group alert text mismatch | group/[id].tsx:293 vs. 647 | Low | Menu shows "Are you sure?" but footer shows "Are you sure you want to leave?" |
| Incomplete menu leave handler | group/[id].tsx:293 | Medium | Menu "Leave group" option fires an incomplete alert (just confirms text, doesn't actually call leave) |
| Current-user row highlight too subtle at scale 20 | group/[id].tsx:143 + standingStyles.rowHighlight | Medium | Highlight color doesn't stand out when standing row is in middle of scrolled list |
| Activity feed capped at 5 items | group/[id].tsx:248 | Low | No pagination or "Load more" for historical activity |
| Invite code truncated in display | group/[id].tsx:400 | Low | Shows first 12 chars only; full code is better for copy/share |
| Standing row not tappable | group/[id].tsx:132–167 | Medium | No way to see a member's recent predictions without leaving the group view |
| No share/screenshot moment on achievement | group/[id].tsx:88–128 + context | Low | Achievement unlocked in feed but no "Share" CTA — missed viral moment |
| Challenges are read-only display | group/[id].tsx:171–199 | Low | No tap-through to details, progress, or claim xp rewards |
