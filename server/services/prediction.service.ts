import * as authRepo from "../repositories/user-auth.repository";
import * as predictionRepo from "../repositories/prediction.repository";
import * as footballRepo from "../repositories/football.repository";

export class PredictionError extends Error {
    public status: number;

    constructor(message: string, status: number = 400) {
        super(message);
        this.status = status;
        this.name = "PredictionError";
    }
}

export async function submitPrediction(userId: string, matchId: string, homeScore: number, awayScore: number) {
    const fixture = await footballRepo.getFixtureKickoff(matchId);
    if (fixture) {
        const kickoff = new Date(fixture.kickoff).getTime();
        const now = Date.now();
        const status = (fixture.status || '').toUpperCase();
        const startedStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'AET', 'PEN', 'FT', 'SUSP', 'INT', 'ABD', 'AWD', 'WO', 'LIVE'];

        if (kickoff <= now || startedStatuses.includes(status)) {
            throw new PredictionError("Predictions are locked once a match has started", 403);
        }
    }

    const existingPred = await predictionRepo.getUserPrediction(userId, matchId);
    const pred = await predictionRepo.upsertPrediction(userId, matchId, homeScore, awayScore);

    if (!existingPred) {
        const user = await authRepo.getUserById(userId);
        if (user) {
            await authRepo.updateUser(user.id, {
                totalPredictions: user.totalPredictions + 1,
            });
        }
    }

    return pred;
}

export async function getUserPredictions(userId: string) {
    return await predictionRepo.getUserPredictions(userId);
}
