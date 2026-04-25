# Scorepion — App Review Notes

For Apple (App Store Connect) and Google (Google Play Console) reviewers.

## Demo Account

**Username:** reviewer
**Password:** ReviewMe2026

Please create this account manually in the admin panel before submission, or note that it will be seeded into production at launch.

**Note:** If your team prefers, create a dedicated reviewer account per platform and provide credentials in a separate secure document. The above is a standard demo account.

## Test Flow (5 minutes)

1. **Login:** Use demo credentials above
2. **Onboarding:** Accept terms, pick one league (e.g., Premier League)
3. **Lock a Prediction:** Navigate to Predict tab, select a match, pick an outcome (Home/Draw/Away), confirm
4. **View Live Scores:** Navigate to Matches tab, see live score updates
5. **Check Leaderboard:** Navigate to Leaderboard tab, confirm user appears with prediction points
6. **Verify Profile:** Navigate to Profile, confirm account name and settings visible

## Key Compliance Notes

### In-App Purchases & Payments

**Status:** Scorepion v1.0 does NOT include in-app purchases or paid tiers.

- No payment processing is active
- No premium features gated by payment
- All core features (predictions, leaderboards, groups) are free
- Infrastructure for future premium tiers has been scaffolded but is INACTIVE (no Stripe activation)

This version is fully free-to-play. Monetization strategy is to be decided post-launch.

### Data & Privacy

**Account Deletion:**

- Users can delete their account from Profile → Delete Account
- All personal data (predictions, group memberships, leaderboard entries) is purged from the database
- Deletion is immediate and non-reversible
- No data is retained after deletion

**Data Usage:**

- App uses only essential device permissions: internet, location (optional, for timezone).
- No camera, microphone, or photo library access.
- No third-party data sharing (e.g., analytics for advertising).

**Privacy Policy:**

- Published at [https://scorepion.example.com/privacy](https://scorepion.example.com/privacy) (replace with actual URL)
- GDPR-compliant for EU users
- CCPA-compliant for California users

### Age Gate & Child Safety

**Age Verification:**

- Users under 13 are blocked at signup with a clear age-gate message
- Users 13–17 see age-appropriate wording (no gambling language)
- Users 18+ see full feature set

**No Gambling, No Money:**

- Predictions are for points and ranking only
- No real money involved
- No odds manipulation or betting mechanics
- Streaks and leaderboards are purely for engagement, not financial incentive

### Permissions Rationale

**Internet:** Required for live match data, leaderboard sync, predictions storage
**Location (optional):** To infer timezone for match scheduling; users can disable in OS settings

No other permissions requested.

## Testing Notes

### Edge Cases Verified

1. **Locked & Expired Matches:** Predictions cannot be entered after kickoff; UI shows "Locked" state
2. **Time Zone:** Match times display correctly in user's local timezone
3. **Offline:** App is read-only offline; predictions sync on reconnect
4. **Concurrent Predictions:** Multiple users can predict same match simultaneously without conflict

### Performance Baseline

- App launches in < 3 seconds
- Leaderboard loads in < 2 seconds
- Live score updates within 10 seconds of API data
- No crashes in 1-hour baseline test session

## Backend Health

- Database: PostgreSQL, 3 tables (users, predictions, groups)
- API: Express.js, health check at `/api/health`
- Stripe: Scaffolded (not activated; returns 404 on billing endpoints)
- Push Notifications: APNs (iOS) + FCM (Android) configured but optional feature

## Contact for Questions

- **Support Email:** support@scorepion.example.com (replace with actual)
- **Developer:** Scorepion team
- **Privacy Contact:** privacy@scorepion.example.com

---

## Submission Checklist for Reviewers

- [ ] Demo account working (login succeeds)
- [ ] Onboarding flow completes without errors
- [ ] Prediction locking works (cannot predict after kickoff)
- [ ] Leaderboard displays current user's rank and predictions
- [ ] Account deletion clears all data
- [ ] No in-app purchases or payment prompts
- [ ] Age gate blocks under-13 users
- [ ] App does not crash during 10-minute test session
- [ ] Privacy policy accessible from app
- [ ] No suspicious network calls to ad networks or analytics

---

## Additional Notes for Apple Review

- **Binary Size:** ~45 MB (within limit)
- **Frameworks Used:** React Native (Expo), Express.js backend
- **Third-Party Services:** API-Football (public sports data), optional APNs (push notifications)
- **New Features Since v1.0:** None; initial release

---

## Additional Notes for Google Review

- **SDK Version:** Minimum Android 8.0 (API 26)
- **Gradle:** Standard Expo build configuration
- **Third-Party Services:** API-Football (public sports data), optional FCM (push notifications)
- **Content Ratings:** Sports, mild social features
