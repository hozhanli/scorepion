# Scorepion legal & support pages

Public web pages required for the Play Store listing (Google requires a **publicly
reachable URL** for the privacy policy, and a support contact). These mirror the
in-app Privacy/Terms screens but are written to be **accurate to the app's actual
data practices** (audited June 2026).

## Files

- `privacy.html` — Privacy Policy
- `terms.html` — Terms of Service
- `support.html` — Support / FAQ + contact

Each page is fully self-contained (inline CSS + inline logo), so it can be hosted
anywhere with no build step or assets.

## Hosting options (pick one)

- **Your `scorepion.fans` site** — drop the files under `/legal/` (or any path).
- **GitHub Pages** — push this folder to a `gh-pages` branch or `/docs`.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop deploy.

Target public URLs once hosted (used below):

```
https://scorepion.fans/legal/privacy.html
https://scorepion.fans/legal/terms.html
https://scorepion.fans/legal/support.html
```

## Where these go in Play Console

- **Store listing → Privacy policy URL** → the privacy URL above (issue #9 — launch blocker).
- **Store listing → Support email / Website** → `support@scorepion.fans` and the support URL (issue #7).
- **App content → Data safety** → answers must match `privacy.html` §1/§4 (issue #8).

## ⚠️ One thing you must set up

The pages use **`support@scorepion.fans`** as the contact address. Create that
mailbox (or an alias/forwarder to your inbox) so support email actually reaches
you — Play will check that the support contact is valid. This ties into the same
custom-domain email setup needed for reliable auth emails.

## Keep in sync

If you change the in-app legal text (`src/lib/i18n/translations.ts` → `privacy` /
`terms`), update these pages too, and bump the "Last updated" date.
