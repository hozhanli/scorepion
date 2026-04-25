import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "scorepion:filter:";

/**
 * useFilterPersistence — a useState replacement that persists the value to AsyncStorage.
 *
 * - Restores the saved value on mount (synchronously if possible, else shows default briefly)
 * - Persists on every change (debounced 300ms to avoid thrashing during rapid typing)
 * - Namespaces keys under `scorepion:filter:<key>` to avoid collisions
 * - Strips the persisted value if it's outside the `allowedValues` set (version drift)
 *
 * Usage:
 *   const [filter, setFilter] = useFilterPersistence<"all" | "live">("matches.status", "all", ["all", "live", "today", "upcoming"]);
 *
 * @param key - storage key (e.g., "matches.search", "leaderboard.timeFilter")
 * @param defaultValue - fallback value if not persisted
 * @param allowedValues - optional set of valid values; if persisted value is outside this set, reverts to default
 * @returns [value, setValue] tuple matching useState signature
 */
export function useFilterPersistence<T>(
  key: string,
  defaultValue: T,
  allowedValues?: readonly T[],
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Hydrate from storage on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const storageKey = STORAGE_PREFIX + key;
        const stored = await AsyncStorage.getItem(storageKey);

        if (!cancelled && stored) {
          let parsed = JSON.parse(stored) as T;

          // Version-drift protection: if allowedValues is provided and parsed value isn't in it, revert
          if (allowedValues && !allowedValues.includes(parsed)) {
            parsed = defaultValue;
          }

          setValue(parsed);
        }
      } catch (err) {
        // Swallow errors; user starts with default value
        console.error("useFilterPersistence:hydrate", { key, err });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, defaultValue, allowedValues]);

  // Debounced persist on change
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const persist = async () => {
        try {
          const storageKey = STORAGE_PREFIX + key;
          let toStore = value;

          // Search string: cap at 500 chars before persisting
          if (typeof value === "string" && storageKey === STORAGE_PREFIX + "matches.search") {
            toStore = (value as string).slice(0, 500) as T;
          }

          await AsyncStorage.setItem(storageKey, JSON.stringify(toStore));
        } catch (err) {
          // Swallow; app continues even if storage fails
          console.error("useFilterPersistence:persist", { key, err });
        }
      };

      void persist();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [key, value]);

  // Wrapper to handle updater functions (like setState)
  const setValueWrapper = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      if (typeof newValue === "function") {
        return (newValue as (prev: T) => T)(prev);
      }
      return newValue;
    });
  }, []);

  return [value, setValueWrapper];
}
