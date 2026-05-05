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

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

/**
 * Create a local user profile row keyed by Firebase UID.
 *
 * The UID and email come from a verified Firebase ID token; username and
 * favoriteLeagues come from the client onboarding payload. Avatar defaults
 * to the first two letters of username — matches existing UX.
 */
export async function createUser(
  id: string,
  username: string,
  email: string,
  favoriteLeagues: string[] = [],
): Promise<User> {
  const avatar = username.substring(0, 2).toUpperCase();
  await db.insert(users).values({ id, username, email, avatar, favoriteLeagues });
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, "id">>,
): Promise<User | undefined> {
  await db.update(users).set(updates).where(eq(users.id, id));
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}
