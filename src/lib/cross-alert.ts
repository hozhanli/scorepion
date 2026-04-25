/**
 * Cross-platform alert helper.
 *
 * React Native's Alert.alert() is a no-op on web, so this module provides
 * a `crossAlert` function that uses window.confirm/alert on web and falls
 * back to the native Alert on iOS/Android.
 */

import { Alert, Platform } from "react-native";

type AlertButton = {
  text?: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void | Promise<void>;
};

/**
 * Show a cross-platform alert dialog.
 *
 * On native: delegates to Alert.alert with the provided buttons.
 * On web:
 *   - If there's a destructive/default action + cancel → window.confirm()
 *   - If there's only an OK button → window.alert()
 */
export function crossAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons as any);
    return;
  }

  // Web fallback
  if (!buttons || buttons.length === 0) {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  const cancelBtn = buttons.find((b) => b.style === "cancel");
  const actionBtn = buttons.find((b) => b.style !== "cancel") ?? buttons[0];

  if (cancelBtn && actionBtn) {
    // Confirmation dialog with OK/Cancel
    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
    if (confirmed) {
      actionBtn.onPress?.();
    } else {
      cancelBtn.onPress?.();
    }
  } else {
    // Single action — just show alert then fire callback
    window.alert(message ? `${title}\n\n${message}` : title);
    actionBtn.onPress?.();
  }
}
