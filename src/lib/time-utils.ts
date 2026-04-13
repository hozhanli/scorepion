/**
 * Shared client-side time utilities.
 *
 * Single Responsibility: all date/time formatting lives here so hooks and
 * contexts don't duplicate this logic.
 */

/** Returns today's date as YYYY-MM-DD (local time). */
export function getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns the ISO date string of the most recent Monday (local time). */
export function getWeekStart(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

/**
 * Returns a human-readable relative time string.
 * @param ts  Unix timestamp in milliseconds
 * @param now optional reference (defaults to Date.now())
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
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
