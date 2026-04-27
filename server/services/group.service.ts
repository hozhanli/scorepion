import { randomBytes } from "crypto";
import * as groupRepo from "../repositories/group.repository";

export class GroupError extends Error {
  public status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
    this.name = "GroupError";
  }
}

export async function createGroup(
  name: string,
  isPublic: boolean,
  leagueIds: string[],
  userId: string,
) {
  if (!name) throw new GroupError("Group name required", 400);

  // Domain logic: Generate an 8-character hex invite code (4 billion combos)
  const code = randomBytes(4).toString("hex").toUpperCase();

  return await groupRepo.createGroup(name, code, isPublic, leagueIds, userId);
}

export async function joinGroup(groupId: string, userId: string) {
  const joined = await groupRepo.joinGroup(groupId, userId);
  if (!joined) throw new GroupError("Already a member", 400);
  return joined;
}

export async function joinGroupByCode(code: string, userId: string) {
  if (!code) throw new GroupError("Code required", 400);

  const group = await groupRepo.getGroupByCode(code.toUpperCase());
  if (!group) throw new GroupError("Group not found", 404);

  const joined = await groupRepo.joinGroup(group.id, userId);
  if (!joined) throw new GroupError("Already a member", 400);

  return group;
}

export async function leaveGroup(groupId: string, userId: string) {
  const left = await groupRepo.leaveGroup(groupId, userId);
  if (!left) throw new GroupError("Not a member", 400);
  return left;
}

export async function getUserGroups(userId: string) {
  return await groupRepo.getUserGroups(userId);
}

export async function getPublicGroups() {
  return await groupRepo.getPublicGroups();
}

export async function getGroupStandings(groupId: string) {
  return await groupRepo.getGroupMembersWithStats(groupId);
}

export async function getGroupPredictions(groupId: string) {
  return await groupRepo.getGroupPredictions(groupId);
}

export async function getGroupActivity(groupId: string) {
  return await groupRepo.getGroupActivity(groupId);
}
