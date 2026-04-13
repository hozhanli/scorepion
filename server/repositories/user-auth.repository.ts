import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "@shared/schema";
import type { User } from "@shared/schema";

export async function getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
}

export async function createUser(username: string, hashedPassword: string, avatar: string, favoriteLeagues: string[]): Promise<User> {
    const [user] = await db.insert(users).values({
        username,
        password: hashedPassword,
        avatar,
        favoriteLeagues,
    }).returning();
    return user;
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'password'>>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
}
