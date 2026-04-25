# Scorepion Product Roadmap

This folder tracks product gaps identified during the v1 production push — features that
are survivable for launch but must not be forgotten. Each gap lives as its own file so it
can be referenced in commits, PRs, and issues.

## Structure

```
docs/ROADMAP/
├── README.md         ← you are here (index + status)
├── TEMPLATE.md       ← copy this when adding a new gap
├── v1.1.md           ← first patch release after launch (weeks 1–4 post-launch)
├── v1.2.md           ← compliance / polish release (months 2–3)
├── v2.0.md           ← major feature release (months 4–6)
└── backlog.md        ← unscored ideas, parking lot
```

## Status legend

- `proposed` — idea captured, not yet scoped
- `scoped` — acceptance criteria + effort estimate agreed
- `in-progress` — someone is actively working on it
- `blocked` — needs an external decision, vendor, or unblocker
- `done` — shipped (move entry to the version's release notes and delete from here)

## How to add a gap

1. Copy `TEMPLATE.md` into the target version file, or create a new one under `v1.X.md`.
2. Fill in every field. If you don't know effort, mark `effort: unknown` — that's data.
3. Link the commit / PR / incident that surfaced it.
4. Open a Linear/Jira ticket and paste its ID into the `tracking` field.

## Priority overview (as of v1.0 scope-freeze)

| Gap                           | Target | Status   | Effort |
| ----------------------------- | ------ | -------- | ------ |
| Dark mode                     | v1.1   | proposed | M      |
| Offline-mode for predictions  | v1.1   | proposed | L      |
| xG on match details           | v1.1   | blocked  | M      |
| Cross-device sync QA          | v1.1   | proposed | S      |
| GDPR data export              | v1.2   | proposed | M      |
| Parental consent (COPPA)      | v1.2   | blocked  | L      |
| Stripe activation             | v1.2   | scoped   | M      |
| Push notification icon polish | v1.1   | proposed | S      |
| Advanced player stats         | v2.0   | proposed | XL     |
| Heatmaps / shot maps          | v2.0   | blocked  | XL     |

Effort buckets: S ≤ 2d, M ≤ 1w, L ≤ 2w, XL > 2w.
