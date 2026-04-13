import { getItem, setItem } from './storage';

const LAST_TAB_KEY = 'scorepion:lastTab';

const VALID_TABS = new Set(['index', 'matches', 'leaderboard', 'groups', 'profile']);

/**
 * Save the last active tab to persistent storage.
 * @param tab - The tab name to persist (must be one of the allowed tab names)
 */
export async function saveLastTab(tab: string): Promise<void> {
  // Validate tab name before persisting
  if (!VALID_TABS.has(tab)) {
    console.warn('nav-persistence:saveLastTab', { msg: 'Invalid tab name', tab });
    return;
  }
  await setItem(LAST_TAB_KEY, tab);
}

/**
 * Load the last active tab from persistent storage.
 * @returns The saved tab name, or null if not found or invalid
 */
export async function loadLastTab(): Promise<string | null> {
  const saved = await getItem<string | null>(LAST_TAB_KEY, null);

  // Return null if saved value is not in the allowed tabs set
  if (saved && !VALID_TABS.has(saved)) {
    console.warn('nav-persistence:loadLastTab', { msg: 'Saved tab name is invalid', saved });
    return null;
  }

  return saved;
}
