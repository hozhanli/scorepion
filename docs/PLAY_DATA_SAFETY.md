# Play Console — App content answers (#8)

Exact, audited answers for Play Console → **App content**. Derived from the
codebase (June 2026) and consistent with `web/legal/privacy.html`. Fill each
section in Play Console to match.

> ⚠️ The original issue draft mentioned "birth year" — the app does **not**
> collect date of birth or age. Do **not** declare it.

---

## 1. Data safety

### Top-level questions

| Question                                                              | Answer                                                                                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Does your app collect or share any of the required user data types?   | **Yes**                                                                                                                                      |
| Is all of the user data collected by your app encrypted in transit?   | **Yes** (TLS/HTTPS for all app↔server traffic)                                                                                               |
| Do you provide a way for users to request that their data is deleted? | **Yes** — in-app **Settings → Delete Account** (also via `support@scorepion.fans`). Provide URL: `https://scorepion.fans/legal/support.html` |

### "Shared" — important

We use **service providers / processors** only (Firebase for auth + push, Expo
for push delivery, optional crash diagnostics). Under Google's definition,
processing by a service provider is **not "sharing."** So **every data type
below is marked Collected = Yes, Shared = No.** (API-Football receives **no**
user data — we only read match data from it.)

### Data types to DECLARE (Collected = Yes, Shared = No)

| Data type (Google category)                     | What it is in Scorepion                                                  | Purposes                              | Collected | Optional/Required |
| ----------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------- | --------- | ----------------- |
| **Email address** (Personal info)               | Account email (via Firebase Auth)                                        | App functionality, Account management | Yes       | Required          |
| **User IDs** (Personal info)                    | Username + Firebase UID                                                  | App functionality, Account management | Yes       | Required          |
| **App interactions** (App activity)             | Predictions, match selections, leaderboard/standings activity            | App functionality, Analytics          | Yes       | Required          |
| **Other user-generated content** (App activity) | The username shown to others; predictions visible in groups/leaderboards | App functionality                     | Yes       | Required          |
| **Crash logs** (App info & performance)         | Crash stack traces (only if crash reporting is enabled)                  | Analytics, App functionality          | Yes       | — (automatic)     |
| **Diagnostics** (App info & performance)        | Performance/diagnostic data (only if crash reporting is enabled)         | Analytics, App functionality          | Yes       | — (automatic)     |
| **Device or other IDs** (Device or other IDs)   | Expo push token (only if notifications enabled)                          | App functionality (notifications)     | Yes       | Optional          |

> If crash reporting (Sentry, #11) is **not** enabled at launch, you may omit
> Crash logs + Diagnostics. Declaring them is safe and future-proof.

### Data types to mark NOT collected

Name (legal), Phone number, Physical address, **Location** (precise & approximate),
Financial info / payment info, **Photos & videos**, **Audio / voice**, Files & docs,
Calendar, Contacts, **Messages** (SMS/email/in-app chat — none), Health & fitness,
Web browsing history, Installed apps, Race/ethnicity, Political/religious beliefs,
Sexual orientation, Search history.

> No payment data: Premium/subscriptions are **not active**. When you enable
> in-app purchases later, add **Purchase history** (and note Google Play handles
> the transaction).

---

## 2. Content rating (IARC questionnaire)

| Question                                                           | Answer                                                                                                |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| App category                                                       | **App/Game — Game** (or "Entertainment")                                                              |
| Violence (cartoon/realistic)                                       | None                                                                                                  |
| Sexual content / nudity                                            | None                                                                                                  |
| Profanity / crude humor                                            | None                                                                                                  |
| Controlled substances (drugs/alcohol/tobacco)                      | None                                                                                                  |
| Horror / fear themes                                               | None                                                                                                  |
| **Gambling** — does the app contain gambling or simulate gambling? | **No** — predictions earn points only; **no real-money wagering, no payouts, no simulated casino**.   |
| Does the app let users **interact / communicate**?                 | **Yes** — players share groups and leaderboards (usernames + predictions visible). No free-text chat. |
| User-generated content shared with others?                         | **Yes** — username + predictions (governed by Terms; offensive conduct → suspension).                 |
| Does the app share the user's **current location**?                | **No**                                                                                                |
| Does the app contain **digital purchases**?                        | **No** (update to Yes if you launch Premium)                                                          |

**Expected rating:** Everyone / PEGI 3 / ESRB Everyone (possibly with a "Users
Interact" interactive-elements notice).

---

## 3. Target audience and content

| Field                                            | Answer                                                         |
| ------------------------------------------------ | -------------------------------------------------------------- |
| Target age groups                                | **13–15, 16–17, 18+** (i.e., 13+). **Do NOT select under-13.** |
| Does the app appeal to children (under 13)?      | **No**                                                         |
| Store-listing imagery/content aimed at children? | **No**                                                         |

> Keeping the minimum age at 13 avoids Google's "Families" / mixed-audience
> requirements and the additional child-safety (COPPA) obligations. The in-app
> Terms already set the minimum age at 13.

---

## 4. Other "App content" declarations

| Declaration                          | Answer                                      |
| ------------------------------------ | ------------------------------------------- |
| **Ads** — does your app contain ads? | **No** (no ad SDKs in the app)              |
| News app?                            | No                                          |
| COVID-19 contact tracing/status?     | No                                          |
| Government app?                      | No                                          |
| Financial features?                  | No                                          |
| Health app?                          | No                                          |
| Data deletion URL (account deletion) | `https://scorepion.fans/legal/support.html` |
| Privacy policy URL                   | `https://scorepion.fans/legal/privacy.html` |

---

## Consistency check

These answers must match `web/legal/privacy.html`:

- §1 (Information We Collect) ↔ the Data safety "collected" list above.
- §4 (Sharing and Service Providers) ↔ Shared = No (processors only).
- §5 (Retention and Deletion) ↔ the data-deletion answer.
- §8 (Children's Privacy, 13+) ↔ Target audience.

If you change one, update the other.
