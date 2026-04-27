import { eq, and, inArray, sql } from "drizzle-orm";
import { db, pool } from "../db";
import { users, predictions, groups, groupMembers } from "@shared/schema";
import type { Group } from "@shared/schema";
import { getRelativeTime } from "../utils/time";

export async function getUserGroups(userId: string): Promise<(Group & { joined: true })[]> {
  const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));

  if (memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.groupId);
  const found = await db.select().from(groups).where(inArray(groups.id, groupIds));
  return found.map((g) => ({ ...g, joined: true as const }));
}

export async function createGroup(
  name: string,
  code: string,
  isPublic: boolean,
  leagueIds: string[],
  createdBy: string,
): Promise<Group> {
  const [group] = await db
    .insert(groups)
    .values({
      name,
      code,
      isPublic,
      leagueIds,
      memberCount: 1,
      createdBy,
      createdAt: Date.now(),
    })
    .returning();

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: createdBy,
    joinedAt: Date.now(),
  });

  return group;
}

export async function joinGroup(groupId: string, userId: string): Promise<boolean> {
  // Use INSERT ... ON CONFLICT DO NOTHING to prevent duplicate membership
  // from concurrent requests. Requires a unique constraint on (group_id, user_id).
  // NOTE: If the unique constraint does not yet exist on group_members(group_id, user_id),
  // it must be added via a migration (not handled here).
  const result = await db
    .insert(groupMembers)
    .values({ groupId, userId, joinedAt: Date.now() })
    .onConflictDoNothing()
    .returning();

  if (result.length === 0) return false;

  await db
    .update(groups)
    .set({ memberCount: sql`member_count + 1` })
    .where(eq(groups.id, groupId));

  return true;
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

  if (existing.length === 0) return false;

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

  await db
    .update(groups)
    .set({ memberCount: sql`GREATEST(member_count - 1, 0)` })
    .where(eq(groups.id, groupId));

  return true;
}

export async function getPublicGroups(): Promise<Group[]> {
  return db.select().from(groups).where(eq(groups.isPublic, true));
}

export async function getGroupByCode(code: string): Promise<Group | undefined> {
  const [group] = await db.select().from(groups).where(eq(groups.code, code));
  return group;
}

export interface GroupMemberStanding {
  id: string;
  username: string;
  avatar: string;
  points: number;
  correct: number;
  total: number;
  streak: number;
  color: string;
  joinedAt: number;
}

const MEMBER_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
  "#D97706",
  "#059669",
  "#DC2626",
  "#7C3AED",
  "#2563EB",
  "#DB2777",
  "#0891B2",
  "#CA8A04",
];

export async function getGroupMembersWithStats(groupId: string): Promise<GroupMemberStanding[]> {
  const memberships = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));

  if (memberships.length === 0) return [];

  const userIds = memberships.map((m) => m.userId);
  const memberUsers = await db.select().from(users).where(inArray(users.id, userIds));

  const joinedAtMap = new Map(memberships.map((m) => [m.userId, m.joinedAt]));

  const standings: GroupMemberStanding[] = memberUsers.map((user, idx) => ({
    id: user.id,
    username: user.username,
    avatar: user.avatar || user.username.substring(0, 2).toUpperCase(),
    points: user.totalPoints,
    correct: user.correctPredictions,
    total: user.totalPredictions,
    streak: user.streak,
    color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
    joinedAt: joinedAtMap.get(user.id) || Date.now(),
  }));

  standings.sort((a, b) => b.points - a.points);
  return standings;
}

export interface GroupMemberPrediction {
  memberId: string;
  username: string;
  avatar: string;
  color: string;
  homeScore: number;
  awayScore: number;
  points: number | null;
  settled: boolean;
}

export interface GroupMatchPredictions {
  matchId: string;
  homeTeam: { name: string; shortName: string; logo: string | null };
  awayTeam: { name: string; shortName: string; logo: string | null };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  kickoff: string;
  leagueName: string;
  predictions: GroupMemberPrediction[];
}

export async function getGroupPredictions(groupId: string): Promise<GroupMatchPredictions[]> {
  const memberships = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));

  if (memberships.length === 0) return [];

  const userIds = memberships.map((m) => m.userId);
  const memberUsers = await db.select().from(users).where(inArray(users.id, userIds));
  const userMap = new Map(
    memberUsers.map((u, idx) => [
      u.id,
      {
        username: u.username,
        avatar: u.avatar || u.username.substring(0, 2).toUpperCase(),
        color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
      },
    ]),
  );

  const allPreds = await db.select().from(predictions).where(inArray(predictions.userId, userIds));

  const matchMap = new Map<string, GroupMemberPrediction[]>();

  for (const pred of allPreds) {
    const user = userMap.get(pred.userId);
    if (!user) continue;

    if (!matchMap.has(pred.matchId)) {
      matchMap.set(pred.matchId, []);
    }

    matchMap.get(pred.matchId)!.push({
      memberId: pred.userId,
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      homeScore: pred.homeScore,
      awayScore: pred.awayScore,
      points: pred.points,
      settled: pred.settled ?? false,
    });
  }

  const matchIds = Array.from(matchMap.keys());
  if (matchIds.length === 0) return [];

  const placeholders = matchIds.map((_, i) => `$${i + 1}`).join(",");
  const fixtureResults = await pool.query(
    `
    SELECT f.api_fixture_id, f.home_score, f.away_score, f.status, f.kickoff,
           ht.name as home_name, ht.short_name as home_short, ht.logo as home_logo,
           at2.name as away_name, at2.short_name as away_short, at2.logo as away_logo,
           l.name as league_name
    FROM football_fixtures f
    JOIN football_teams ht ON f.home_team_id = ht.api_football_id
    JOIN football_teams at2 ON f.away_team_id = at2.api_football_id
    JOIN football_leagues l ON f.league_id = l.id
    WHERE CAST(f.api_fixture_id AS TEXT) IN (${placeholders})
  `,
    matchIds,
  );

  const fixtureMap = new Map<string, any>();
  for (const row of fixtureResults.rows) {
    fixtureMap.set(String(row.api_fixture_id), row);
  }

  const result: GroupMatchPredictions[] = [];
  for (const [matchId, preds] of matchMap) {
    const fixture = fixtureMap.get(matchId);
    result.push({
      matchId,
      homeTeam: {
        name: fixture?.home_name || "Home",
        shortName: fixture?.home_short || "HOM",
        logo: fixture?.home_logo || null,
      },
      awayTeam: {
        name: fixture?.away_name || "Away",
        shortName: fixture?.away_short || "AWY",
        logo: fixture?.away_logo || null,
      },
      homeScore: fixture?.home_score ?? null,
      awayScore: fixture?.away_score ?? null,
      status: fixture?.status || "upcoming",
      kickoff: fixture?.kickoff || "",
      leagueName: fixture?.league_name || "",
      predictions: preds,
    });
  }

  result.sort((a, b) => {
    if (a.kickoff && b.kickoff) {
      return new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime();
    }
    return 0;
  });

  return result;
}

export interface GroupActivity {
  id: string;
  type:
    | "prediction"
    | "exact_score"
    | "points_earned"
    | "streak"
    | "joined"
    | "boost_pick"
    | "achievement"
    | "rank_change"
    | "weekly_winner";
  username: string;
  avatar: string;
  color: string;
  message: string;
  detail?: string;
  timestamp: string;
  relativeTime: string;
  icon: string;
  iconColor: string;
}

const Colors = {
  palette: {
    gold: "#FFD700",
    emerald: "#00C853",
    blue: "#3B82F6",
    orange: "#F97316",
    gray300: "#9CA3AF",
  },
};

export async function getGroupActivity(groupId: string): Promise<GroupActivity[]> {
  const memberships = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));

  if (memberships.length === 0) return [];

  const userIds = memberships.map((m) => m.userId);
  const memberUsers = await db.select().from(users).where(inArray(users.id, userIds));
  const userMap = new Map(
    memberUsers.map((u, idx) => [
      u.id,
      {
        username: u.username,
        avatar: u.avatar || u.username.substring(0, 2).toUpperCase(),
        color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
      },
    ]),
  );

  const now = Date.now();

  // Try reading from the new group_activity table first
  try {
    const activityRows = await pool.query(
      `SELECT ga.id, ga.type, ga.points, ga.metadata, ga.created_at, ga.match_id,
                    u.username, u.avatar
             FROM group_activity ga
             JOIN users u ON u.id = ga.user_id
             WHERE ga.group_id = $1
             ORDER BY ga.created_at DESC
             LIMIT 50`,
      [groupId],
    );

    if (activityRows.rows.length > 0) {
      return activityRows.rows.map((row: any, idx: number) => {
        const user = {
          username: row.username,
          avatar: row.avatar || row.username.substring(0, 2).toUpperCase(),
          color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
        };
        const ts = Number(row.created_at);
        const timeAgo = getRelativeTime(ts, now);
        const meta =
          typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata || {};

        const typeMap: Record<
          string,
          { message: string; detail?: string; icon: string; iconColor: string }
        > = {
          exact_score: {
            message: `nailed the exact score! ${meta.predicted || ""}`,
            detail: `+${row.points} pts${meta.boosted ? " 🚀" : ""}`,
            icon: "locate",
            iconColor: "#FFD700",
          },
          points_earned: {
            message: `earned points`,
            detail: `+${row.points} pts`,
            icon: "checkmark-circle",
            iconColor: "#00C853",
          },
          streak: {
            message: `is on a ${meta.streak}-day streak! 🔥`,
            detail: `${meta.streak} days`,
            icon: "flame",
            iconColor: "#FF8C00",
          },
          boost_pick: {
            message: `used a 2x boost pick`,
            detail: `+${row.points} pts`,
            icon: "flash",
            iconColor: "#FFD700",
          },
          achievement: {
            message: `unlocked: ${meta.title || "Achievement"}`,
            detail: "",
            icon: "ribbon",
            iconColor: "#E040FB",
          },
          rank_change: {
            message: `moved to rank #${meta.newRank}`,
            detail: `↑ from #${meta.oldRank}`,
            icon: "trending-up",
            iconColor: "#00C853",
          },
          weekly_winner: {
            message: `won the weekly leaderboard! 🏆`,
            detail: `#${meta.rank} — ${meta.points} pts`,
            icon: "trophy",
            iconColor: "#FFD700",
          },
          prediction: {
            message: `made a prediction`,
            detail: "",
            icon: "create",
            iconColor: "#3B82F6",
          },
          joined: {
            message: "joined the group",
            detail: "",
            icon: "person-add",
            iconColor: "#3B82F6",
          },
        };

        const display = typeMap[row.type] || typeMap.prediction;

        return {
          id: row.id,
          type: row.type as GroupActivity["type"],
          username: user.username,
          avatar: user.avatar,
          color: user.color,
          message: display.message,
          detail: display.detail,
          timestamp: isNaN(ts) ? new Date().toISOString() : new Date(ts).toISOString(),
          relativeTime: timeAgo,
          icon: display.icon,
          iconColor: display.iconColor,
        } as GroupActivity;
      });
    }
  } catch (err) {
    console.error(
      "[GroupRepo] group_activity table not yet available, falling back:",
      (err as any).message,
    );
  }

  // Fallback: derive from predictions (legacy path until DB migrated)
  const recentPreds = await pool.query(
    `
    SELECT p.id, p.user_id, p.match_id, p.home_score as pred_home, p.away_score as pred_away,
           p.points, p.settled, p.timestamp,
           ht.short_name as home_short, at2.short_name as away_short
    FROM predictions p
    LEFT JOIN football_fixtures f ON CAST(f.api_fixture_id AS TEXT) = p.match_id
    LEFT JOIN football_teams ht ON f.home_team_id = ht.api_football_id
    LEFT JOIN football_teams at2 ON f.away_team_id = at2.api_football_id
    WHERE p.user_id = ANY($1)
    ORDER BY p.timestamp DESC
    LIMIT 30
  `,
    [userIds],
  );

  const items: GroupActivity[] = [];

  for (const pred of recentPreds.rows) {
    const user = userMap.get(pred.user_id);
    if (!user) continue;

    const ts = Number(pred.timestamp);
    const timeAgo = getRelativeTime(ts, now);
    const homeShort = pred.home_short || "???";
    const awayShort = pred.away_short || "???";
    const isoTimestamp = isNaN(ts) ? new Date().toISOString() : new Date(ts).toISOString();

    if (pred.settled && pred.points !== null && pred.points >= 10) {
      items.push({
        id: `exact-${pred.id}`,
        type: "exact_score",
        username: user.username,
        avatar: user.avatar,
        color: user.color,
        message: `nailed the exact score for ${homeShort} vs ${awayShort}`,
        detail: `${pred.pred_home}-${pred.pred_away} (+${pred.points} pts)`,
        timestamp: isoTimestamp,
        relativeTime: timeAgo,
        icon: "star",
        iconColor: Colors.palette.gold,
      });
    } else if (pred.settled && pred.points !== null && pred.points > 0) {
      items.push({
        id: `pts-${pred.id}`,
        type: "points_earned",
        username: user.username,
        avatar: user.avatar,
        color: user.color,
        message: `earned ${pred.points} pts on ${homeShort} vs ${awayShort}`,
        detail: `Predicted ${pred.pred_home}-${pred.pred_away}`,
        timestamp: isoTimestamp,
        relativeTime: timeAgo,
        icon: "checkmark-circle",
        iconColor: Colors.palette.emerald,
      });
    } else if (!pred.settled) {
      items.push({
        id: `pred-${pred.id}`,
        type: "prediction",
        username: user.username,
        avatar: user.avatar,
        color: user.color,
        message: `predicted ${pred.pred_home}-${pred.pred_away} for ${homeShort} vs ${awayShort}`,
        timestamp: isoTimestamp,
        relativeTime: timeAgo,
        icon: "create",
        iconColor: Colors.palette.blue,
      });
    }
  }

  const joinedMembers = memberships.sort((a, b) => b.joinedAt - a.joinedAt).slice(0, 5);

  for (const m of joinedMembers) {
    const user = userMap.get(m.userId);
    if (!user) continue;
    const joinTs = Number(m.joinedAt);
    const timeAgo = getRelativeTime(joinTs, now);
    items.push({
      id: `join-${m.id}`,
      type: "joined",
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      message: "joined the group",
      timestamp: isNaN(joinTs) ? new Date().toISOString() : new Date(joinTs).toISOString(),
      relativeTime: timeAgo,
      icon: "person-add",
      iconColor: Colors.palette.emerald,
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, 25);
}
