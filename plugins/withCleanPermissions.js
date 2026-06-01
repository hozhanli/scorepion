/**
 * Strips Android permissions Scorepion does not use but that Expo's default
 * template / transitive deps inject. Leaving them in forces extra Data Safety
 * declarations and review scrutiny, and scares users at install for no benefit:
 *
 *   - SYSTEM_ALERT_WINDOW  — "draw over other apps"; from the Expo template, the
 *                            app has no overlay UI.
 *   - READ/WRITE_EXTERNAL_STORAGE — legacy shared-storage access from
 *                            expo-file-system; the app only uses app-scoped
 *                            storage, so these are unnecessary on every SDK level.
 *
 * Kept: INTERNET (networking) and VIBRATE (expo-haptics).
 *
 * If a feature later needs shared storage or an overlay, drop the relevant entry
 * here and rebuild.
 */
const { AndroidConfig } = require("@expo/config-plugins");

module.exports = (config) =>
  AndroidConfig.Permissions.withBlockedPermissions(config, [
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
  ]);
