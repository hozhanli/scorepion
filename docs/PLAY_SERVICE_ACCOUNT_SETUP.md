# Google Play Service Account — Setup for `eas submit`

`eas.json` → `submit.production.android.serviceAccountKeyPath` points at
`./credentials/google-play-service-account.json`. That file does **not** exist
yet, and without it `eas submit --platform android` cannot upload the AAB to
Play. This doc creates it.

> You only do this **once**. The key is reused for every future release.
> `credentials/` is git-ignored, so the JSON never enters version control.

---

## What you're creating

A **Google Cloud service account** (a robot account) with a **JSON key**, that
Google Play Console has been granted permission to act on behalf of for the
Scorepion app. EAS authenticates as that robot to push builds.

---

## Steps

### 1. Open API access in Play Console

1. Go to <https://play.google.com/console> → select the **Scorepion** app's
   developer account.
2. Left nav → **Setup** → **API access** (or search "API access").
3. If prompted, **link a Google Cloud project** (create a new one — e.g.
   `scorepion-play` — or link an existing one). Accept the terms.

### 2. Create the service account (in Google Cloud)

1. On the API access page, under **Service accounts**, click
   **Create service account** → this opens **Google Cloud Console** in a new tab.
2. In Cloud Console: **Create service account**
   - Name: `eas-play-publisher`
   - ID: auto-fills (e.g. `eas-play-publisher@…iam.gserviceaccount.com`)
   - Description: "EAS Submit → Play Console uploads"
3. Click **Create and continue**. You do **not** need to grant any Cloud IAM
   roles here (Play permissions are granted in step 4). Click **Done**.

### 3. Download the JSON key

1. In Cloud Console → **IAM & Admin** → **Service Accounts** → click the
   `eas-play-publisher` account.
2. **Keys** tab → **Add key** → **Create new key** → **JSON** → **Create**.
3. A `.json` file downloads. **This is the secret.** Treat it like a password.

### 4. Grant Play permissions

1. Back in **Play Console** → **Setup** → **API access**. Click **Refresh
   service accounts** if the new one isn't listed.
2. Next to `eas-play-publisher`, click **Manage Play Console permissions**
   (a.k.a. "Grant access").
3. **App permissions** tab → **Add app** → select **Scorepion**.
4. **Account permissions** — enable at minimum:
   - ✅ Releases → **Release to testing tracks**
   - ✅ Releases → **Release apps to production, exclude devices, and use Play App Signing**
   - ✅ Releases → **Manage testing tracks and edit tester lists**
   - ✅ **View app information and download bulk reports**
   - (Or just grant **Admin (all permissions)** for the Scorepion app — simplest.)
5. Click **Invite user** / **Apply**.

### 5. Put the key where EAS expects it

```bash
mv ~/Downloads/<the-downloaded>.json \
   /Users/halilibrahimozhanli/scorepion/credentials/google-play-service-account.json
```

The filename **must** match `eas.json` (`google-play-service-account.json`).
`credentials/` is git-ignored — verify it stays untracked:

```bash
git status --short credentials/   # should print nothing
```

### 6. Test it

After a production build exists (`eas build -p android --profile production`):

```bash
eas submit --platform android --profile production
```

It uploads the AAB to the **internal** track (per `eas.json` →
`submit.production.android.track`). Promote to production from Play Console.

---

## Notes

- **This app already exists on Play** (live `versionCode 38`), so the package is
  established and API uploads work immediately — no "first upload must be manual"
  restriction applies.
- **Alternative (no key):** skip all of this and upload the AAB by hand in
  Play Console → _Release → Internal testing → Create new release → drop the AAB_.
  The service account only automates that drag-and-drop.
- **Key rotation:** if the JSON leaks, delete the key in Cloud Console → Keys and
  create a new one. The service account and its Play permissions stay intact.
