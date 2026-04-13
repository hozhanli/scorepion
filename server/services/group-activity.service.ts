/**
 * Group Activity Logger
 * Logs social feed events to all groups a user belongs to.
 */

export type ActivityType =
  | "prediction"
  | "exact_score"
  | "points_earned"
  | "streak"
  | "boost_pick"
  | "achievement"
  | "rank_change"
  | "weekly_winner"
  | "joined";

export async function logGroupActivity(
  pool: any,
  userId: string,
  type: ActivityType,
  metadata: Record<string, any> = {},
  matchId?: string,
  points?: number
): Promise<void> {
  try {
    // Get all groups this user belongs to
    const groups = await pool.query(
      `SELECT group_id FROM group_members WHERE user_id = $1`,
      [userId]
    );
    if (groups.rows.length === 0) return;

    const groupIds: string[] = groups.rows.map((r: any) => r.group_id);

    for (const groupId of groupIds) {
      await pool.query(
        `INSERT INTO group_activity (group_id, user_id, type, match_id, points, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          groupId,
          userId,
          type,
          matchId || null,
          points || 0,
          JSON.stringify(metadata),
          Date.now(),
        ]
      );
    }
  } catch (err) {
    console.error("[GroupActivity] Failed to log activity:", err);
  }
}

export async function getGroupActivityFeed(
  pool: any,
  groupId: string,
  limit = 50
): Promise<any[]> {
  const result = await pool.query(
    `SELECT
       ga.id,
       ga.type,
       ga.match_id,
       ga.points,
       ga.metadata,
       ga.created_at,
       u.username,
       u.avatar,
       u.streak
     FROM group_activity ga
     JOIN users u ON u.id = ga.user_id
     WHERE ga.group_id = $1
     ORDER BY ga.created_at DESC
     LIMIT $2`,
    [groupId, limit]
  );
  return result.rows;
}

export function buildActivityMessage(
  type: ActivityType,
  metadata: Record<string, any>
): { message: string; detail: string; icon: string; iconColor: string } {
  switch (type) {
    case "exact_score":
      return {
        message: `nailed the exact score!`,
        detail: `${metadata.predicted} ✓ +${metadata.points} pts`,
        icon: "locate",
        iconColor: "#FFD700",
      };
    case "points_earned":
      return {
        message: `earned points from ${metadata.match || "a match"}`,
        detail: `+${metadata.points} pts`,
        icon: "star",
        iconColor: "#00C853",
      };
    case "streak":
      return {
        message: `is on a ${metadata.streak}-day streak!`,
        detail: `🔥 ${metadata.streak} days`,
        icon: "flame",
        iconColor: "#FF8C00",
      };
    case "boost_pick":
      return {
        message: `used a 2x boost pick`,
        detail: `${metadata.match || ""}`,
        icon: "flash",
        iconColor: "#FFD700",
      };
    case "achievement":
      return {
        message: `unlocked an achievement!`,
        detail: metadata.title || "",
        icon: "ribbon",
        iconColor: "#E040FB",
      };
    case "rank_change":
      return {
        message: `moved up to rank #${metadata.newRank}`,
        detail: `↑ from #${metadata.oldRank}`,
        icon: "trending-up",
        iconColor: "#00C853",
      };
    case "weekly_winner":
      return {
        message: `won the weekly leaderboard!`,
        detail: `#${metadata.rank} with ${metadata.points} pts`,
        icon: "trophy",
        iconColor: "#FFD700",
      };
    case "joined":
      return {
        message: `joined the group`,
        detail: "",
        icon: "person-add",
        iconColor: "#3B82F6",
      };
    default:
      return {
        message: `made a prediction`,
        detail: "",
        icon: "football",
        iconColor: "#3B82F6",
      };
  }
}
