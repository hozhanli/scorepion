/**
 * Shared server-side time utilities.
 *
 * CRITICAL: All times are in UTC.
 * - New Date objects use UTC methods (getUTC*)
 * - All ISO strings have explicit Z suffix for UTC
 * - All timestamps stored in DB should be in milliseconds since epoch (timezone-independent)
 * - Leaderboard resets happen at defined UTC times, not local times
 */

/**
 * Returns today's date as YYYY-MM-DD in UTC.
 * Use for database queries that filter by date.
 */
export function getTodayStringUtc(): string {
    const d = new Date();
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns the ISO date string of the most recent Sunday (UTC).
 * Used for leaderboard weekly reset calculations.
 */
export function getWeekStartUtc(): string {
    const d = new Date();
    const utcDay = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysUntilLastSunday = utcDay === 0 ? 0 : utcDay;
    const lastSunday = new Date(d);
    lastSunday.setUTCDate(d.getUTCDate() - daysUntilLastSunday);
    const year = lastSunday.getUTCFullYear();
    const month = String(lastSunday.getUTCMonth() + 1).padStart(2, '0');
    const day = String(lastSunday.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns the next Sunday at 23:59:59 UTC.
 * This is the leaderboard weekly reset time.
 */
export function getNextWeeklyResetUtc(): Date {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = Sunday
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

    // If today is Sunday but we've passed 23:59:59, next reset is next week
    if (reset.getTime() <= now.getTime()) {
        reset.setUTCDate(reset.getUTCDate() + 7);
    }

    return reset;
}

/**
 * Returns the next day at 00:00:00 UTC.
 * Used for daily pick reset times.
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
 * Returns a human-readable relative time string.
 * @param ts - Unix timestamp in milliseconds (timezone-independent)
 * @param now - optional reference time (defaults to Date.now())
 */
export function getRelativeTime(ts: number, now: number = Date.now()): string {
    const diff = now - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toISOString().split('T')[0];
}
