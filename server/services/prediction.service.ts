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

export async function submitPrediction(
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  // Validate scores are reasonable integers
  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0 ||
    homeScore > 15 ||
    awayScore > 15
  ) {
    throw new PredictionError("Scores must be integers between 0 and 15", 400);
  }

  const fixture = await footballRepo.getFixtureKickoff(matchId);

  // Match must exist in our database
  if (!fixture) {
    throw new PredictionError("Match not found", 404);
  }

  const status = (fixture.status_short || fixture.status || "").toUpperCase();

  // Reject predictions for cancelled / postponed / abandoned matches
  const cancelledStatuses = ["PST", "CANC", "ABD", "AWD", "WO"];
  if (cancelledStatuses.includes(status)) {
    throw new PredictionError("This match has been cancelled or postponed", 410);
  }

  // Reject predictions for matches that have already started or finished
  const kickoff = new Date(fixture.kickoff).getTime();
  const now = Date.now();
  const startedStatuses = [
    "1H",
    "2H",
    "HT",
    "ET",
    "BT",
    "P",
    "AET",
    "PEN",
    "FT",
    "SUSP",
    "INT",
    "LIVE",
  ];

  if (kickoff <= now || startedStatuses.includes(status)) {
    throw new PredictionError("Predictions are locked once a match has started", 403);
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
