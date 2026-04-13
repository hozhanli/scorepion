import * as authRepo from "../repositories/user-auth.repository";
import * as userRepo from "../repositories/user.repository";

export class UserError extends Error {
    public status: number;
    constructor(message: string, status: number = 400) {
        super(message);
        this.status = status;
        this.name = "UserError";
    }
}

export async function getUserStats(userId: string) {
    const user = await authRepo.getUserById(userId);
    if (!user) {
        throw new UserError("User not found", 404);
    }

    const daysUntilMonday = (8 - new Date().getDay()) % 7 || 7;

    return {
        streak: user.streak,
        bestStreak: user.bestStreak,
        weeklyPoints: (user as any).weeklyPoints ?? 0,
        totalPoints: user.totalPoints,
        totalPredictions: user.totalPredictions,
        correctPredictions: user.correctPredictions,
        rank: user.rank,
        resetDays: `${daysUntilMonday}d`,
    };
}

export async function getLeaderboard(period: userRepo.LeaderboardPeriod) {
    const rows = await userRepo.getLeaderboard(period);
    return userRepo.formatLeaderboardEntries(rows);
}

export async function getUserProfile(userId: string) {
    const user = await authRepo.getUserById(userId);
    if (!user) {
        throw new UserError("User not found", 404);
    }
    const { password: _, ...safeUser } = user;
    return safeUser;
}

export async function updateUserProfile(userId: string, data: any) {
    const updated = await authRepo.updateUser(userId, data);
    if (!updated) {
        throw new UserError("User not found", 404);
    }
    const { password: _, ...safeUser } = updated;
    return safeUser;
}
