import * as sync from "./sync";
import { getRequestCount, getRemainingRequests } from "./football-api";

export async function executeFullSync() {
  return sync.syncAllData();
}

export async function executeStandingsSync() {
  let total = 0;
  for (const id of Object.keys(sync.LEAGUE_IDS)) {
    if (getRemainingRequests() <= 50) break;
    try { total += await sync.syncStandingsForLeague(id); } catch {}
  }
  return { standings: total, remaining: getRemainingRequests() };
}

export async function executeScorersSync() {
  let total = 0;
  for (const id of Object.keys(sync.LEAGUE_IDS)) {
    if (getRemainingRequests() <= 50) break;
    try { total += await sync.syncTopScorersForLeague(id); } catch {}
  }
  return { scorers: total, remaining: getRemainingRequests() };
}

export async function executeLiveSync() {
  const count = await sync.syncLiveScores();
  return { updated: count, remaining: getRemainingRequests() };
}

export async function getSyncStatus() {
  return sync.getSyncStatus();
}

export async function settlePredictions() {
  return sync.settlePredictions();
}
