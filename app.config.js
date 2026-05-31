// Dynamic config layered on top of app.json.
//
// `google-services.json` is git-ignored (this repo is public and it shouldn't
// be committed). On EAS Build it is supplied as a secret *file* environment
// variable (GOOGLE_SERVICES_JSON) — EAS materializes it to a path at build
// time. Locally (prebuild / dev), the env var is unset and we fall back to the
// checked-out file at ./google-services.json.
//
// Expo loads app.json first and passes it in as `config`, so everything else
// continues to come from app.json unchanged.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || config.android.googleServicesFile,
  },
});
