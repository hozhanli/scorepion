/**
 * Timezone-aware datetime utilities for Scorepion frontend.
 *
 * This module provides all date/time formatting in the user's LOCAL timezone
 * while ensuring the backend always operates in UTC.
 *
 * Key principles:
 * - All backend timestamps are ISO 8601 UTC strings (with Z suffix)
 * - Intl.DateTimeFormat is used for all user-facing formatting
 * - Device timezone is automatically detected
 * - All outputs respect the user's local timezone
 */

/**
 * Accepted input for all datetime helpers.
 * - string: ISO 8601 timestamp (preferred, with Z suffix)
 * - number: epoch milliseconds (as returned by Date.now())
 * - Date: native Date object
 * - null/undefined: handled gracefully, returns fallback
 */
export type DateInput = string | number | Date | null | undefined;

/**
 * Normalize any supported input to a Date instance.
 * Returns null for invalid/missing input.
 */
function toDate(input: DateInput): Date | null {
  if (input == null) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Get the user's timezone from the device.
 * Falls back to UTC if detection fails (shouldn't happen on modern devices).
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Format a timestamp as time in the user's local timezone.
 * Accepts ISO string, epoch millis, or Date object.
 * @returns e.g. "19:30"
 */
export function formatLocalTime(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '--:--';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: getUserTimezone(),
  }).format(d);
}

/**
 * Format a timestamp as a date in the user's local timezone.
 * Accepts ISO string, epoch millis, or Date object.
 * @returns e.g. "Fri, Apr 10"
 */
export function formatLocalDate(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '--/--';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: getUserTimezone(),
  }).format(d);
}

/**
 * Format a timestamp as date + time in the user's local timezone.
 * Accepts ISO string, epoch millis, or Date object.
 * @returns e.g. "Fri, Apr 10 · 19:30"
 */
export function formatLocalDateTime(input: DateInput): string {
  return `${formatLocalDate(input)} · ${formatLocalTime(input)}`;
}

/**
 * Format a relative time string (past or future).
 * Accepts ISO string, epoch millis, or Date object.
 * @returns e.g. "in 3h", "2d ago", or just the date if > 1 week
 */
export function formatRelative(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '--';
  const diffMs = d.getTime() - Date.now();
  const absDiff = Math.abs(diffMs);
  const mins = Math.round(absDiff / 60_000);
  const hrs = Math.round(absDiff / 3_600_000);
  const days = Math.round(absDiff / 86_400_000);
  const future = diffMs > 0;

  if (mins < 1) return 'now';
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`;
  if (hrs < 24) return future ? `in ${hrs}h` : `${hrs}h ago`;
  if (days < 7) return future ? `in ${days}d` : `${days}d ago`;
  return formatLocalDate(d);
}

/**
 * Format a countdown duration as human-readable string.
 * @param ms milliseconds remaining
 * @returns e.g. "3d 4h", "5h 30m", "45m"
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now';
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);

  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Get milliseconds from now until the target timestamp.
 * Accepts ISO string, epoch millis, or Date object.
 * @returns milliseconds (negative if in the past, 0 if invalid)
 */
export function getTimeUntil(input: DateInput): number {
  const d = toDate(input);
  if (!d) return 0;
  return d.getTime() - Date.now();
}

/**
 * Get the next weekly reset time in UTC (Sunday 23:59:59).
 * This is the definitive server-side reset time that should match the backend.
 */
export function getNextWeeklyResetUtc(): Date {
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilSunday = (7 - utcDay) % 7;

  const reset = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
    23,
    59,
    59,
    0,
  ));

  // If today is Sunday but we've already passed 23:59:59, next reset is next week
  if (reset.getTime() <= now.getTime()) {
    reset.setUTCDate(reset.getUTCDate() + 7);
  }

  return reset;
}

/**
 * Get the next daily reset time in UTC (00:00:00 next day).
 * This is for features that reset daily.
 */
export function getNextDailyResetUtc(): Date {
  const now = new Date();
  const reset = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  ));
  return reset;
}

/**
 * Compute the time remaining until the next weekly reset (Sunday 23:59 UTC),
 * formatted as a countdown string. Useful for leaderboard headers.
 */
export function getWeeklyResetCountdown(): string {
  const resetTime = getNextWeeklyResetUtc();
  const timeUntil = getTimeUntil(resetTime);
  return formatCountdown(timeUntil);
}

/**
 * Compute the time remaining until the next daily reset (00:00 UTC),
 * formatted as a countdown string. Useful for daily pick reset timers.
 */
export function getDailyResetCountdown(): string {
  const resetTime = getNextDailyResetUtc();
  const timeUntil = getTimeUntil(resetTime);
  return formatCountdown(timeUntil);
}

/**
 * Helper to compute period context for a given time filter.
 * Used by leaderboard and other views to show period info + countdown.
 * @param filter 'weekly' | 'monthly' | 'alltime'
 * @returns object with title, subtitle, countdown, and icon
 */
export function getPeriodContext(filter: 'weekly' | 'monthly' | 'alltime') {
  const now = new Date();

  if (filter === 'weekly') {
    const resetTime = getNextWeeklyResetUtc();
    const countdown = formatCountdown(getTimeUntil(resetTime));
    return {
      title: 'This week',
      subtitle: 'Weekly board resets Sunday',
      countdown,
      icon: 'calendar-outline' as const,
    };
  }

  if (filter === 'monthly') {
    // Next month's last day at 23:59:59 UTC
    const endOfMonth = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      0,
      23,
      59,
      59,
      0,
    ));
    const countdown = formatCountdown(getTimeUntil(endOfMonth));
    const monthName = new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
      timeZone: getUserTimezone(),
    }).format(now);

    return {
      title: 'This month',
      subtitle: monthName,
      countdown,
      icon: 'calendar' as const,
    };
  }

  // alltime
  return {
    title: 'All time',
    subtitle: 'Season rankings',
    countdown: 'Season ongoing',
    icon: 'infinite' as const,
  };
}

/**
 * Get the ISO 8601 string for the start of today in the user's timezone.
 * Useful for filtering matches by "today".
 */
export function getTodayIsoString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: getUserTimezone(),
  });
  const [year, month, day] = formatter.format(now).split('-');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a timestamp is today in the user's timezone.
 * Accepts ISO string, epoch millis, or Date object.
 */
export function isToday(input: DateInput): boolean {
  const d = toDate(input);
  if (!d) return false;
  return getTodayIsoString() === formatLocalDate(d).split(', ')[0];
}

/**
 * Get the date key in device-local timezone (YYYY-MM-DD format).
 * Used for bucketing matches by date in the matches screen.
 * Respects the device's local timezone, not UTC.
 * @returns e.g. "2026-04-11"
 */
export function getLocalDateKey(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '0000-00-00';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: getUserTimezone(),
  });
  return formatter.format(d);
}

/**
 * Get the date key in UTC timezone (YYYY-MM-DD format).
 * Used for server sync and backend communication.
 * @returns e.g. "2026-04-11"
 */
export function getUtcDateKey(input: DateInput): string {
  const d = toDate(input);
  if (!d) return '0000-00-00';

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
