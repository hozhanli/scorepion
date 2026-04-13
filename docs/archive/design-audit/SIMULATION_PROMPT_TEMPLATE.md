# 20×20 Long-Term User Simulation — Reusable Prompt Template

A reusable brief for running N-persona × N-day simulated end-user audits against the current state of the app. This is the **template**. Each concrete round (see `USER_TEST_BRIEF.md`, `archive/round1_10x10/`) instantiates this template with a specific date window, fixture list, persona cast, and regression focus.

Use this file when you want to spin up a fresh round. Do not edit it in place for a specific round — copy it to `ROUND_NN_BRIEF.md` and fill in the Operator Configuration block.

---

## 0. Philosophy (read before every round)

The point of this exercise is **not** to produce a bug list. A bug list is a byproduct. The point is to answer one question honestly:

> Does this app feel like a premium, production-ready product that a discerning user would pay for, recommend, and keep open — or does it feel like an unfinished prototype in disguise?

Agents must behave like **thoughtful, high-standard real users**, not QA scripts. A QA script clicks every button and reports what breaks. A thoughtful user notices that the celebration after a correct prediction was silent, the tier-up didn't feel earned, the welcome-back banner said "Welcome back" in a way that felt robotic, and the leaderboard row for "you" was indistinguishable from everyone else's — and then tells you that the whole thing left them feeling like they were using a 2018 fantasy-league app with a new coat of paint.

That is the signal we are trying to extract. Treat bugs as the floor, UX friction as the body, and premium feel as the ceiling.

---

## 1. Operator Configuration (fill in per round)

Replace every `{{ ... }}` before running the round.

```yaml
round_label:        {{ e.g. "Round 3 — 20x20" }}
app_name:           {{ e.g. "Scorepion" }}
app_root:           {{ e.g. "/Users/.../Desktop/scorepion" }}
persona_count:      {{ integer, typically 20 }}
simulated_days:     {{ integer, typically 20 }}
start_date:         {{ YYYY-MM-DD in the simulated world }}
end_date:           {{ YYYY-MM-DD }}
fixture_focus:      {{ what tournaments/events anchor the window }}
source_of_truth:    {{ path to the design audit, e.g. _design_audit/AUDIT.md }}
design_contract:    {{ path to the design guide, e.g. DESIGN_GUIDE.md }}
prior_round_themes: {{ bullet list of themes the previous round surfaced, or "none" }}
regression_targets: {{ specific files/components that were changed and need re-checking }}
report_dir:         {{ e.g. _design_audit/tester_reports/roundNN/ }}
rollup_path:        {{ e.g. _design_audit/tester_reports/roundNN/ROLLUP.md }}
```

If any field is empty, stop and ask the operator. Do not guess fixture windows, regression targets, or the cast.

---

## 2. Simulation Rules

These are invariants. They apply to every round, every persona, every day.

1. **Code-trace, don't execute.** Agents read source files (`app/`, `components/`, `lib/`, `contexts/`, `constants/`) and mentally walk the user path. Nothing is run in a simulator.
2. **Ground every observation in a file path.** "The streak screen feels flat" is worthless. "`app/(tabs)/index.tsx:184–221` renders the streak with a static flame and no animated delta when the count increments — compare to the lock-in motion at `lib/motion.ts:42`" is the bar.
3. **Premium claims require evidence.** If an agent says something feels premium or cheap, they must cite the specific surface (component, token, motion, copy line) that caused the feeling.
4. **Personas are people, not test matrices.** Each persona has a name, age, device, life context, usage cadence, emotional relationship to the app, and taste references (what other apps they use and judge this one against). See §3.
5. **Days are lived, not skimmed.** A persona that "skips" a day writes `Skipped.` — and that gap itself is part of the test (welcome-back, stale data, re-engagement). A persona that uses the app writes a screen-by-screen entry, not a summary.
6. **Read the current state.** Always read the post-latest-change versions of files, never archived ones. If an archived version exists, verify you are not reading it by mistake.
7. **Previous-round fixes must be explicitly re-checked.** Every persona ends their diary with a regression section that reports `Closed`, `Partially closed`, or `Still open` against each `prior_round_themes` item, with a one-sentence reason pointing at source.
8. **Independence.** Personas do not read each other's reports mid-round. Cross-contamination produces consensus slop. The roll-up step is the *only* place where findings merge.
9. **Opinions over hedges.** "This could potentially be improved" is banned. Use "this is wrong because X" or "this is fine."

---

## 3. Persona Design Framework

Do not generate 20 interchangeable QA bots. Each persona must be distinct along at least **four** of the following axes, and no two personas may be distinct along the *same four*.

**Axes:**
- Expertise level (first-time / casual / power / competitor-reference)
- Device & viewport (flagship / mid-tier / small-screen / tablet)
- Cadence (daily / weekday-only / weekend-only / lapsed-returns-mid-window / burst-user)
- Emotional stance (excited / skeptical / anxious / indifferent / nostalgic)
- Accessibility profile (none / partial vision + large text / motor / colorblind / screen reader)
- Locale (default / longest-string locale / RTL / non-Latin script)
- Social context (solo / group organizer / group member / invitee)
- Domain depth (stats nerd / casual fan / team loyalist / league purist)
- Taste reference (Arc, Things, Linear, Sorare, Superbru, native OS apps — named explicitly)
- Goal orientation (streak chaser / completionist / leaderboard climber / score checker / social poster)

**Required coverage per round** (must be present across the cast, even if bundled into a persona):
- At least **two** accessibility personas (one vision, one motor).
- At least **one** small-screen persona (≤ 4.7" / SE).
- At least **one** locale persona running the longest-string locale.
- At least **one** lapsed-returning persona who reinstalls mid-window.
- At least **one** competitor-reference persona with explicit comparisons.
- At least **one** design-system reviewer who audits tokens, hairlines, radii, and motion primitives.
- At least **one** notification-off persona (forces in-app signal testing).
- At least **one** weekend-only and **one** weekday-only persona (tests gap handling).

**Forbidden:** "generic user #7". Every persona gets a first name, an age, a device, a one-line backstory, and a taste/reference anchor. If you cannot describe why this person would open the app tomorrow, do not ship them.

---

## 4. Daily Diary Format (per persona)

Each persona writes one markdown file at `{{report_dir}}/NN_firstname.md` where `NN` is their two-digit index. Every file follows this exact structure:

```markdown
# NN — {{Firstname}} "{{one-line archetype}}"

**Age / device / locale:** ...
**Cadence:** ...
**Taste anchor:** ...
**What they want from the app:** ...

## Day-by-day

### Day 1 — {{date}} ({{dow}})
**Did:** screen-by-screen sequence, or `Skipped.`
**Liked:** specific moment(s), each with a file-path citation
**Disliked:** specific friction(s), each with a file-path citation
**Bugs / dead ends:** broken flow, missing state, unreachable branch, with path:line

### Day 2 — ...
...

### Day {{N}} — ...

## Favorite and least favorite
- **Favorite day:** Day X — because ...
- **Least favorite day:** Day Y — because ...
- **One fix I would ship tomorrow:** concrete change, with target file

## Premium vs basic — the seven questions
1. What did I like?
2. What did I not like?
3. What can be improved?
4. What made me feel like a premium user?
5. What felt too basic, weak, or not good enough to keep?
6. Which parts felt polished and trustworthy?
7. Which parts reduced confidence in the product?

Answer each in 1–3 sentences. No hedging. No lists of generic adjectives.

## Regression check — prior round themes
For each theme in `prior_round_themes`, write `Closed` / `Partially closed` / `Still open` + one-sentence reason citing source.

## New findings
Bullets for anything this persona caught that the prior round did not. Each bullet must name a file.
```

Diaries that violate this structure are rejected and rewritten.

---

## 5. Evaluation Rubric (how agents judge what they see)

When a persona is deciding whether something is good, bad, premium, or basic, they should check against these dimensions. Each dimension has a short definition and a concrete failure example, so there is less room for vague feedback.

| Dimension | Definition | Example of failure |
|---|---|---|
| **Reliability** | Flows complete, states resolve, no dead ends. | Tapping "Join group" shows a spinner forever because `onPress` is unwired. |
| **Clarity** | The user always knows what just happened and what to do next. | A prediction locks in with no toast, pill change, or sound. |
| **Consistency** | Tokens, radii, type scale, motion timings match across screens. | Home uses 16pt radius cards, Match Detail uses 12pt. |
| **Responsiveness** | Interactions feel immediate; loading states are honest. | A 400ms fetch is wrapped in a full-screen skeleton. |
| **Cognitive load** | The user never has to re-read the screen. | Leaderboard row for "you" looks identical to everyone else's. |
| **Trust** | Scoring, stats, and outcomes are transparent and verifiable. | Points appear without explanation and no scoring guide is discoverable. |
| **Delight** | Key moments (lock-in, correct prediction, tier-up, streak milestone) feel earned. | Going from tier Bronze → Silver produces a silent badge swap. |
| **Premium feel** | Nothing on screen would embarrass a principal designer. | Drop-shadow on a card with no other elevation cue, sitting on a gradient wallpaper. |
| **Taste** | The app looks like it was made by someone with a point of view. | Generic pastel "friendly app" palette with no editorial voice. |
| **Accessibility** | Hit targets ≥ 44pt, AA contrast, motion respects reduce-motion, text scales. | Celebration toast dismiss button is 28pt and uses `#9BA1A8` on `#F3F4F6`. |

**Premium vs basic calibration — rules of thumb:**
- Premium is subtraction more often than addition. Every extra gradient, shadow, emoji, and exclamation point is a tax on trust.
- Premium apps earn their celebrations. A tier-up in a premium app feels like a reward; in a basic app it feels like a notification.
- Premium apps are honest about time. Loading states, empty states, and error states are designed, not default.
- Premium apps have a voice. Microcopy is written, not generated.
- Premium apps are the same app on day 20 as day 1 — nothing surprises the user in a bad way after the honeymoon.
- Basic tells: placeholder copy ("Lorem", "TBD"), default system alerts, inconsistent radii, one-off typography, shadows without purpose, motion that wasn't tuned, icons from three different libraries, screens that look correct on iPhone 15 Pro and break on SE.

---

## 6. Anti-patterns (what will make the round worthless)

Reject any diary that does any of the following, and regenerate:

1. **Generic feedback.** "The app feels good but could be more polished." Useless.
2. **No file citations.** Observations that cannot be tied to a file:line.
3. **Consensus persona voice.** All 20 personas sound like the same well-spoken QA lead.
4. **Bug list LARP.** A flat list of twelve bugs with no day-by-day narrative.
5. **Feature wishlist.** "It would be cool if the app had a live-stream tab." We are not scoping new features; we are auditing what exists.
6. **Hedging.** "Potentially", "might want to consider", "could perhaps". Be opinionated.
7. **Fabricated evidence.** Citing a file or line that does not exist. Every citation is verifiable and will be spot-checked.
8. **Positivity slop.** Closing a diary with "overall the app is in great shape" when the body contained 14 criticisms.
9. **Skipping the regression section.** Every persona must report on every prior-round theme.
10. **Running the app.** Diaries that reference "I clicked the button and…" without reading source are rejected. The whole round is a code-trace.

---

## 7. Roll-up (cross-persona synthesis)

After all 20 diaries exist, one dedicated agent (not one of the personas) writes `{{rollup_path}}` covering:

### 7.1 Recurring findings
- **Recurring bugs** — count of personas who hit it, file:line, severity (blocker / major / minor / polish).
- **Recurring UX pain points** — grouped by screen, with quotes from at least two personas each.
- **Recurring premium-feel detractors** — patterns that multiple personas felt were basic/cheap.
- **Recurring premium-feel reinforcers** — patterns that multiple personas flagged as strong.

### 7.2 Prioritization
A single ranked table, highest-impact first:

| Rank | Finding | Severity | Evidence (personas) | Target file(s) | Fix sketch |
|---|---|---|---|---|---|

Severity scale: **Blocker** (ships means ships broken) → **Major** (hurts premium feel or trust) → **Minor** (polish) → **Taste** (editorial call).

### 7.3 Kill / refine / elevate
Three lists:
- **Kill.** Features, surfaces, or behaviors that should be removed because they add nothing or actively detract. Each item needs a reason.
- **Refine.** Things that are load-bearing but executed poorly. Each item needs a concrete refinement direction.
- **Elevate.** Things that are already good and should be leaned into harder. Each item names what to double down on.

### 7.4 Regression verdict
For each `prior_round_themes` item, aggregate the 20 persona verdicts into a single `Closed / Partially closed / Still open` with the dissenting-persona count in parens. If any theme is not fully `Closed`, explain why in one paragraph.

### 7.5 The honest verdict
One paragraph answering: **does this app currently feel premium, production-ready, and trustworthy — yes or no — and what is the single biggest reason?** No hedging. This paragraph is the point of the whole round.

---

## 8. Operational checklist (for the operator running this prompt)

Before launching the round:
- [ ] Operator Configuration block is fully filled in.
- [ ] `report_dir` exists and is empty (or explicitly reusing).
- [ ] `source_of_truth`, `design_contract`, and any `regression_targets` files are current.
- [ ] Persona cast is drafted with names, ages, devices, cadences, and taste anchors.
- [ ] Fixture/event window for the simulated days is written out day-by-day (date, day of week, anchor activity).
- [ ] Prior-round themes are pasted in and each has a file:line pointer to where the fix lives.

Launch:
- [ ] Spawn one agent per persona. Each agent gets the filled-in brief + its own persona card + the daily calendar. Agents run in parallel; they do not see each other.
- [ ] When all 20 diaries exist in `report_dir`, spawn the roll-up agent with read access to the whole directory.
- [ ] Read the roll-up's §7.5 first. If it says "no", triage from the prioritization table before touching anything else.

After:
- [ ] Archive the round to `_design_audit/archive/roundNN_{{persona_count}}x{{simulated_days}}/`.
- [ ] Capture the themes that will drive the next round's regression section.

---

## 9. Invocation phrasing (what to actually paste to kick off a round)

Once the round-specific brief is filled in, the operator pastes this (with the round brief path substituted):

> Spawn {{persona_count}} agents, one per persona, to run the {{round_label}} simulation defined in `{{round_brief_path}}`. Each agent must read the brief in full, read its own persona card, read the source files cited in §1 (`source_of_truth`, `design_contract`, `regression_targets`), and produce a diary at `{{report_dir}}/NN_firstname.md` matching §4 exactly. Agents run in parallel, do not read each other's reports, and do not run the app — this is a code-trace. When all 20 diaries are on disk, spawn one additional roll-up agent to produce `{{rollup_path}}` per §7. Reject and regenerate any diary that hits an anti-pattern in §6.

---

*This template is the canonical reusable prompt for long-term simulated user audits on this project. When it gets edited, bump a version note at the bottom so rounds can reference which template version they were generated against.*

**Template version:** v1 — 2026-04-11
