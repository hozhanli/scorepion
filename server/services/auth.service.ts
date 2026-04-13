import bcrypt from "bcrypt";
import * as authRepo from "../repositories/user-auth.repository";

export class AuthError extends Error {
    public status: number;

    constructor(message: string, status: number = 400) {
        super(message);
        this.status = status;
        this.name = "AuthError";
    }
}

export async function registerUser(username: string, passwordRaw: string, favoriteLeagues: string[] = []) {
    const existing = await authRepo.getUserByUsername(username);
    if (existing) {
        throw new AuthError("Username already taken", 409);
    }

    const hashedPassword = await bcrypt.hash(passwordRaw, 10);
    const avatar = username.substring(0, 2).toUpperCase();

    const user = await authRepo.createUser(username, hashedPassword, avatar, favoriteLeagues);
    const { password, ...safeUser } = user;

    return { user, safeUser };
}

export async function authenticateUser(username: string, passwordRaw: string) {
    const user = await authRepo.getUserByUsername(username);
    if (!user) {
        throw new AuthError("Invalid username or password", 401);
    }

    const valid = await bcrypt.compare(passwordRaw, user.password);
    if (!valid) {
        throw new AuthError("Invalid username or password", 401);
    }

    const { password, ...safeUser } = user;
    return { user, safeUser };
}
